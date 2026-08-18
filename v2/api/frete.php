<?php
/* ==========================================================================
   Cerrô · Cotação de frete
   --------------------------------------------------------------------------
   Recebe o CEP de destino e a sacola, devolve as opções de envio e guarda a
   cotação escolhida no servidor.

   Duas decisões que explicam o desenho:

   1. COTA POR CAIXA, NÃO POR PEÇA. Os Correios cobram pelo maior valor entre
      peso real e peso cubado. A caixa de 28x22x10 dá 1027 g de cubado, e o
      kit mais pesado tem 730 g. Ou seja: qualquer pedido que caiba numa
      caixa é cobrado como 1027 g, independente do que vá dentro. Cotar tudo
      como kit não é arredondamento, é o valor certo para uma caixa. Peso por
      peça só passa a importar quando o pedido precisar de mais de uma.

   2. O NAVEGADOR NUNCA VÊ O VALOR QUE VAI SER COBRADO. Ele recebe as opções
      para mostrar e um protocolo. Na hora de fechar, manda o protocolo, e o
      servidor lê a cotação que ele mesmo guardou. Se o valor viajasse pelo
      navegador, bastaria editar para pagar um centavo de frete, exatamente
      como seria com o preço do produto.

   Por que a cotação fica guardada em vez de ser refeita no fechamento: se a
   transportadora mudar o preço no meio do caminho, a cliente veria um total
   na sacola e outro na tela de pagamento, e desistiria ali. Ela paga o que
   viu, e a validade de 30 minutos limita o risco da loja.
   ========================================================================== */

require __DIR__ . '/comum.php';

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
  cerro_responder(405, array('erro' => 'Use POST.'));
}

$dados = json_decode(file_get_contents('php://input'), true);
if (!is_array($dados)) cerro_responder(400, array('erro' => 'Pedido malformado.'));

/* --- CEP de destino --------------------------------------------------- */
$cep = isset($dados['cep']) ? preg_replace('/\D/', '', (string) $dados['cep']) : '';
if (strlen($cep) !== 8) {
  cerro_responder(400, array('erro' => 'CEP precisa ter 8 dígitos.'));
}

/* --- Quantas caixas ----------------------------------------------------
   Sem peso por peça, uso a conta que o próprio kit dá: um kit são três ou
   quatro peças e cabe numa caixa. Então quatro unidades por caixa, sempre
   arredondando para cima. Conservador de propósito: errar para mais custa
   frete a mais; errar para menos custa a encomenda voltar. */
$unidades = 0;
if (!empty($dados['itens']) && is_array($dados['itens'])) {
  foreach ($dados['itens'] as $it) {
    $q = isset($it['qtd']) ? (int) $it['qtd'] : 0;
    if ($q > 0 && $q <= $CERRO_LOJA['max_qtd_por_item']) $unidades += $q;
  }
}
if ($unidades < 1) cerro_responder(400, array('erro' => 'Sacola vazia.'));

$caixas = (int) ceil($unidades / $CERRO_ENVIO['pecas_por_caixa']);
if ($caixas > 10) cerro_responder(400, array('erro' => 'Pedido grande demais para cotar aqui.'));


/* --- Cota ---------------------------------------------------------------
   Com token do intermediário, cotação real. Sem token, tabela por região.
   A tabela não é só plano B de configuração: ela é a rede de segurança para
   quando a API do intermediário cair, e API cai. */
$segredo = cerro_segredo();
$token = ($segredo && !empty($segredo['frete_token'])) ? $segredo['frete_token'] : '';

$opcoes = $token
  ? cerro_cotar_intermediario($token, $cep, $caixas)
  : array();

$origem = 'transportadora';
if (!$opcoes) {
  $opcoes = cerro_cotar_por_regiao($cep, $caixas);
  $origem = 'tabela';
}

if (!$opcoes) cerro_responder(502, array('erro' => 'Não consegui cotar o frete agora.'));

/* --- Guarda a cotação e devolve um protocolo --------------------------- */
$protocolo = 'F-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
cerro_guardar_cotacao($protocolo, array(
  'quando'   => time(),
  'cep'      => $cep,
  'caixas'   => $caixas,
  'unidades' => $unidades,
  'origem'   => $origem,
  'opcoes'   => $opcoes,
));

cerro_responder(200, array(
  'protocolo' => $protocolo,
  'caixas'    => $caixas,
  'origem'    => $origem,
  'opcoes'    => $opcoes,
));
