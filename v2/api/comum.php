<?php
/* Dinheiro em JSON precisa sair como 29.9, e nao como 29.899999999999999.
   O PHP guarda decimal em binario, e com serialize_precision alto o
   json_encode escreve todas as casas do float. round() nao resolve isso:
   ele corrige o valor, nao a forma como o valor e escrito. Com -1 o PHP
   escreve a representacao mais curta que volta exatamente ao mesmo numero.

   Nao e cosmetico: esse JSON vira valor de cobranca no Mercado Pago. */
ini_set('serialize_precision', -1);

/* ==========================================================================
   Cerrô · Base comum dos endpoints
   --------------------------------------------------------------------------
   Configuração da loja, carregamento do segredo, e as duas ou três funções
   que os dois endpoints usam. Nada aqui responde a requisição sozinho.
   ========================================================================== */

if (!defined('CERRO')) define('CERRO', true);

/* --------------------------------------------------------------------------
   Regras da loja que não são segredo e podem viver aqui.
   Estes valores precisam bater com assets/js/config.js. O que o cliente vê
   na sacola tem que ser o que ele paga; se divergir, ele desiste na hora.
   -------------------------------------------------------------------------- */
$CERRO_LOJA = array(
  'frete_valor'          => 25.00,
  'frete_gratis_acima'   => null,     // desativado a pedido do cliente
  'parcelas_maximas'     => 6,
  'moeda'                => 'BRL',
  'nome_loja'            => 'Cerrô · Banho do Cerrado',

  /* Trava de sanidade. Um pedido honesto não passa disso, e limitar evita
     que alguém mande um carrinho de dez mil itens só para derrubar o site. */
  'max_itens_distintos'  => 30,
  'max_qtd_por_item'     => 20,
);

/* --------------------------------------------------------------------------
   Cupons de desconto

   ESTA é a lista que vale. A de assets/js/config.js existe só para a loja
   mostrar o efeito na tela antes da cliente decidir; o abatimento que chega
   ao Mercado Pago sai daqui.

   As duas precisam bater. Mudou uma, mude a outra. Se mudar só o JavaScript,
   a cliente vê um desconto e paga outro; se mudar só aqui, ela paga menos
   sem entender por quê. O api/diagnostico.php compara as duas e avisa.

   'percentual' usa 'valor' como porcentagem, 'fixo' usa como reais.
   'minimo' é o subtotal a partir do qual o cupom passa a valer.
   'ate' é a validade, no formato AAAA-MM-DD. Use null para não expirar.
   -------------------------------------------------------------------------- */
$CERRO_CUPONS = array(
  'PRIMEIROCERRO' => array('tipo' => 'percentual', 'valor' => 10, 'minimo' => 0, 'ate' => null),
);

/** Quanto abater, em reais, para este código e este subtotal.
 *  Devolve 0 para cupom inexistente, vencido ou abaixo do mínimo: um código
 *  inválido nunca derruba o pedido, só não desconta. */
function cerro_desconto($codigo, $subtotal) {
  global $CERRO_CUPONS;
  if (!$codigo) return 0.0;

  $chave = strtoupper(trim((string) $codigo));
  if (!isset($CERRO_CUPONS[$chave])) return 0.0;

  $c = $CERRO_CUPONS[$chave];
  if (!empty($c['ate']) && date('Y-m-d') > $c['ate']) return 0.0;
  if ($subtotal < (float) $c['minimo']) return 0.0;

  $bruto = ($c['tipo'] === 'percentual')
    ? $subtotal * ((float) $c['valor'] / 100)
    : (float) $c['valor'];

  /* Nunca deixa o desconto passar do subtotal: com frete no pedido, um
     total negativo seria aceito pela conta e recusado pelo Mercado Pago. */
  return round(min($bruto, $subtotal), 2);
}

/* --------------------------------------------------------------------------
   Onde procurar o arquivo de segredo. Tenta os caminhos prováveis na
   HostGator e para no primeiro que existir. Se você colocou em outro lugar,
   acrescente o caminho no começo da lista.
   -------------------------------------------------------------------------- */
function cerro_segredo() {
  static $cache = null;
  if ($cache !== null) return $cache;

  $raiz = dirname(dirname(dirname(__FILE__)));   // acima de public_html
  $candidatos = array(
    $raiz . '/cerro-secreto.php',
    dirname(dirname(__FILE__)) . '/../cerro-secreto.php',
    getenv('CERRO_SEGREDO') ? getenv('CERRO_SEGREDO') : '',
  );

  foreach ($candidatos as $caminho) {
    if ($caminho && is_readable($caminho)) {
      $dados = include $caminho;
      if (is_array($dados) && !empty($dados['access_token'])) {
        $cache = $dados;
        return $cache;
      }
    }
  }
  $cache = false;
  return false;
}

/* --------------------------------------------------------------------------
   Uma requisição HTTP, com cURL quando existe e com stream quando não existe.
   Hospedagem compartilhada varia, e vale mais funcionar nas duas do que
   descobrir isso só na hora que o cliente foi pagar.
   -------------------------------------------------------------------------- */
function cerro_http($metodo, $url, $token, $corpo = null) {
  $cabecalhos = array(
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json',
    'Accept: application/json',
  );
  $json = $corpo === null ? null : json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $cabecalhos);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    if ($json !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    $resposta = curl_exec($ch);
    $status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $erro     = curl_error($ch);
    curl_close($ch);
    if ($resposta === false) return array('status' => 0, 'corpo' => null, 'erro' => $erro);
    return array('status' => $status, 'corpo' => json_decode($resposta, true), 'erro' => '');
  }

  $contexto = stream_context_create(array('http' => array(
    'method'        => $metodo,
    'header'        => implode("\r\n", $cabecalhos),
    'content'       => $json,
    'timeout'       => 20,
    'ignore_errors' => true,
  )));
  $resposta = @file_get_contents($url, false, $contexto);
  $status = 0;
  if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0], $m)) {
    $status = (int) $m[1];
  }
  if ($resposta === false) return array('status' => 0, 'corpo' => null, 'erro' => 'falha na requisição');
  return array('status' => $status, 'corpo' => json_decode($resposta, true), 'erro' => '');
}

/* Corta texto sem depender de mbstring, que nem toda hospedagem liga. Com
   acento, cortar por byte parte o caractere no meio e o Mercado Pago recusa
   o JSON. Então usa mb_substr quando existe e, quando não existe, corta e
   descarta qualquer sobra inválida de UTF-8. */
function cerro_corta($texto, $limite) {
  if (function_exists('mb_substr')) return mb_substr($texto, 0, $limite, 'UTF-8');
  $corte = substr($texto, 0, $limite);
  return preg_replace('/((?:[\x00-\x7F]|[\xC0-\xFF][\x80-\xBF]*)*)./s', '$1', $corte . 'x');
}

/* Endereço público do site, deduzido da própria requisição. Evita ter que
   escrever o domínio à mão e errar quando ele mudar. */
function cerro_base_url() {
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
  $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
  $dir  = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
  return ($https ? 'https://' : 'http://') . $host . $dir;
}

function cerro_responder($status, $dados) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($dados, JSON_UNESCAPED_UNICODE);
  exit;
}

/* Grava o pedido num arquivo fora da pasta pública, uma linha por pedido.
   Não é banco de dados, mas é histórico que sobrevive e que dá para abrir
   no Excel se precisar. */
function cerro_registrar($linha) {
  $seg = cerro_segredo();
  $pasta = ($seg && !empty($seg['pasta_pedidos'])) ? $seg['pasta_pedidos'] : null;
  if (!$pasta) return false;
  if (!is_dir($pasta)) @mkdir($pasta, 0700, true);
  if (!is_dir($pasta) || !is_writable($pasta)) return false;
  $ok = @file_put_contents(
    rtrim($pasta, '/') . '/pedidos.jsonl',
    json_encode($linha, JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
  );
  return $ok !== false;
}

/* ==========================================================================
   Envio: caixa, regiões e cotação
   ========================================================================== */

$CERRO_ENVIO = array(
  'cep_origem'      => '78074-170',   // Cuiabá, MT
  'caixa'           => array('c' => 28, 'l' => 22, 'a' => 10),  // cm
  'peso_caixa_g'    => 730,           // kit mais pesado, já com a embalagem
  'pecas_por_caixa' => 4,
  'validade_min'    => 30,            // minutos que a cotação vale

  /* --- Entrega local ------------------------------------------------------
     Cuiabá e Várzea Grande têm frete fixo de R$ 10,00, definido pelo cliente.
     Essa regra ganha de tudo, inclusive da cotação real: nessas duas cidades
     a entrega é dele, não dos Correios, então cotar não faz sentido.

     CONFIRA AS FAIXAS COM ELE. Estas são as faixas padrão dos Correios para
     as duas cidades, mas quem mora lá sabe melhor do que uma tabela. Se a
     faixa estiver larga demais, gente de fora paga R$ 10 e a loja banca a
     diferença; estreita demais, vizinho paga frete de outro estado.
     ---------------------------------------------------------------------- */
  'local' => array(
    'preco' => 10.00,
    'prazo' => '1 a 2 dias úteis',
    'nome'  => 'Entrega local',
    'faixas' => array(
      array(78000, 78109),   // Cuiabá
      array(78110, 78169),   // Várzea Grande
    ),
  ),

  /* Tabela por região, saindo de Cuiabá. São valores POR CAIXA.
     PREENCHER com a tabela real do cliente: estes são um ponto de partida
     plausível, não uma cotação. Enquanto não houver token do intermediário,
     é esta tabela que a loja cobra. */
  'regioes' => array(
    'MT'      => array('nome' => 'Mato Grosso',  'pac' => 21.90, 'sedex' => 34.90, 'prazo_pac' => '2 a 4', 'prazo_sedex' => '1 a 2'),
    'CO'      => array('nome' => 'Centro-Oeste', 'pac' => 26.90, 'sedex' => 42.90, 'prazo_pac' => '3 a 6', 'prazo_sedex' => '2 a 3'),
    'SE'      => array('nome' => 'Sudeste',      'pac' => 29.90, 'sedex' => 49.90, 'prazo_pac' => '4 a 8', 'prazo_sedex' => '2 a 4'),
    'S'       => array('nome' => 'Sul',          'pac' => 32.90, 'sedex' => 54.90, 'prazo_pac' => '5 a 9', 'prazo_sedex' => '3 a 5'),
    'NE'      => array('nome' => 'Nordeste',     'pac' => 36.90, 'sedex' => 62.90, 'prazo_pac' => '6 a 12','prazo_sedex' => '3 a 6'),
    'N'       => array('nome' => 'Norte',        'pac' => 39.90, 'sedex' => 69.90, 'prazo_pac' => '7 a 14','prazo_sedex' => '4 a 7'),
  ),
);

/** Este CEP é de Cuiabá ou Várzea Grande? */
function cerro_e_local($cep) {
  global $CERRO_ENVIO;
  $n = (int) substr($cep, 0, 5);
  foreach ($CERRO_ENVIO['local']['faixas'] as $f) {
    if ($n >= $f[0] && $n <= $f[1]) return true;
  }
  return false;
}

/** A opção única da entrega local. Preço fixo, sem multiplicar por caixa:
 *  é entrega própria, e levar duas caixas na mesma viagem não custa o dobro. */
function cerro_opcao_local() {
  global $CERRO_ENVIO;
  $l = $CERRO_ENVIO['local'];
  return array(array(
    'servico' => 'LOCAL',
    'nome'    => $l['nome'],
    'preco'   => (float) $l['preco'],
    'prazo'   => $l['prazo'],
  ));
}

/** Região a partir do CEP, pelas faixas dos Correios por estado. */
function cerro_regiao($cep) {
  $n = (int) substr($cep, 0, 5);
  if ($n >= 78000 && $n <= 78899) return 'MT';
  if ($n >= 1000  && $n <= 39999) return 'SE';   // SP, RJ, ES, MG
  if ($n >= 40000 && $n <= 65999) return 'NE';   // BA até MA
  if ($n >= 66000 && $n <= 69999) return 'N';    // PA, AP, AM, RR, AC
  if ($n >= 70000 && $n <= 76799) return 'CO';   // DF e GO
  if ($n >= 76800 && $n <= 76999) return 'N';    // RO
  if ($n >= 77000 && $n <= 77999) return 'N';    // TO
  if ($n >= 79000 && $n <= 79999) return 'CO';   // MS
  if ($n >= 80000 && $n <= 89999) return 'S';    // PR e SC
  if ($n >= 90000 && $n <= 99999) return 'S';    // RS
  return 'SE';
}

/** Cotação pela tabela. Sempre funciona, não depende de ninguém. */
function cerro_cotar_por_regiao($cep, $caixas) {
  global $CERRO_ENVIO;
  $r = $CERRO_ENVIO['regioes'][cerro_regiao($cep)];
  return array(
    array('servico' => 'PAC',   'nome' => 'PAC',   'preco' => round($r['pac']   * $caixas, 2), 'prazo' => $r['prazo_pac']   . ' dias úteis'),
    array('servico' => 'SEDEX', 'nome' => 'SEDEX', 'preco' => round($r['sedex'] * $caixas, 2), 'prazo' => $r['prazo_sedex'] . ' dias úteis'),
  );
}

/** Cotação real, via SuperFrete. Devolve array vazio em qualquer falha, e
 *  quem chamou cai na tabela: a loja nunca para de vender porque uma API
 *  de terceiro está fora do ar. */
function cerro_cotar_intermediario($token, $cep, $caixas) {
  global $CERRO_ENVIO;
  $c = $CERRO_ENVIO['caixa'];
  $corpo = array(
    'from' => array('postal_code' => preg_replace('/\D/', '', $CERRO_ENVIO['cep_origem'])),
    'to'   => array('postal_code' => $cep),
    'package' => array(
      'height' => $c['a'], 'width' => $c['l'], 'length' => $c['c'],
      'weight' => $CERRO_ENVIO['peso_caixa_g'] / 1000.0,
    ),
  );
  $r = cerro_http('POST', 'https://api.superfrete.com/api/v0/calculator', $token, $corpo);
  if ($r['status'] < 200 || $r['status'] >= 300 || !is_array($r['corpo'])) {
    error_log('Cerro/frete: cotacao falhou, status ' . $r['status']);
    return array();
  }
  $saida = array();
  foreach ($r['corpo'] as $op) {
    if (!empty($op['error']) || empty($op['price'])) continue;
    $saida[] = array(
      'servico' => isset($op['name']) ? $op['name'] : 'Envio',
      'nome'    => isset($op['name']) ? $op['name'] : 'Envio',
      'preco'   => round((float) $op['price'] * $caixas, 2),
      'prazo'   => (isset($op['delivery_time']) ? $op['delivery_time'] : '?') . ' dias úteis',
    );
  }
  return $saida;
}

/* --------------------------------------------------------------------------
   Guarda e leitura da cotação

   Arquivo simples numa pasta fora de public_html. Não é banco de dados, e
   não precisa ser: são registros de trinta minutos, um por sacola.
   -------------------------------------------------------------------------- */
function cerro_pasta_cotacoes() {
  $seg = cerro_segredo();
  $base = ($seg && !empty($seg['pasta_pedidos'])) ? $seg['pasta_pedidos'] : sys_get_temp_dir();
  $p = rtrim($base, '/') . '/cotacoes';
  if (!is_dir($p)) @mkdir($p, 0700, true);
  return $p;
}

function cerro_guardar_cotacao($protocolo, $dados) {
  $p = cerro_pasta_cotacoes();
  if (!is_dir($p) || !is_writable($p)) return false;

  /* Limpa o que venceu, para a pasta não crescer para sempre. */
  foreach (glob($p . '/*.json') as $velho) {
    if (filemtime($velho) < time() - 3600) @unlink($velho);
  }
  return @file_put_contents($p . '/' . $protocolo . '.json', json_encode($dados)) !== false;
}

/** Devolve a opção escolhida, ou null se o protocolo não existe, venceu, ou
 *  o serviço pedido não estava entre os que foram oferecidos. */
function cerro_ler_cotacao($protocolo, $servico) {
  global $CERRO_ENVIO;
  $protocolo = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $protocolo);
  if (!$protocolo) return null;

  $arq = cerro_pasta_cotacoes() . '/' . $protocolo . '.json';
  if (!is_readable($arq)) return null;

  $d = json_decode(file_get_contents($arq), true);
  if (!is_array($d)) return null;
  if (time() - (int) $d['quando'] > $CERRO_ENVIO['validade_min'] * 60) return null;

  foreach ($d['opcoes'] as $op) {
    if ($op['servico'] === $servico) return array_merge($op, array('cep' => $d['cep'], 'caixas' => $d['caixas']));
  }
  return null;
}
