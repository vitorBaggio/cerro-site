<?php
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
  'frete_gratis_acima'   => 200.00,   // null desativa a regra
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
  // 'PRIMEIRA10'  => array('tipo' => 'percentual', 'valor' => 10, 'minimo' => 0,   'ate' => null),
  // 'FRETEGRATIS' => array('tipo' => 'fixo',       'valor' => 25, 'minimo' => 150, 'ate' => '2026-12-31'),
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
