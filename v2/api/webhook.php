<?php
/* ==========================================================================
   Cerrô · Aviso de pagamento do Mercado Pago
   --------------------------------------------------------------------------
   Quando alguém paga, o Mercado Pago chama este endereço. É assim que a
   loja fica sabendo da venda mesmo se a pessoa fechar o navegador na hora
   do "obrigado".

   Duas travas, e a ordem entre elas importa:

   1. Assinatura. O Mercado Pago manda um HMAC no cabeçalho x-signature.
      Se a chave secreta estiver configurada, confiro. Sem chave, sigo.

   2. Reconsulta. Aconteça o que acontecer, eu NÃO acredito no corpo da
      notificação. Pego só o id do pagamento e pergunto para a API do
      Mercado Pago quanto foi pago e se foi aprovado. Essa é a trava que
      vale de verdade: mesmo que alguém descubra este endereço e invente
      uma notificação de "pagamento aprovado de R$ 500", a reconsulta
      devolve a verdade e a mentira morre aqui.
   ========================================================================== */

require __DIR__ . '/comum.php';

/* O Mercado Pago espera 200 rápido. Se demorar ou der erro, ele reenvia por
   horas. Então: responde cedo, processa depois. */
function cerro_fim($mensagem = 'ok') {
  http_response_code(200);
  header('Content-Type: text/plain; charset=utf-8');
  echo $mensagem;
  exit;
}

$segredo = cerro_segredo();
if (!$segredo) { error_log('Cerro/webhook: sem arquivo de segredo'); cerro_fim('sem config'); }

$bruto = file_get_contents('php://input');
$corpo = json_decode($bruto, true);

/* --- De onde tirar o id do pagamento ---------------------------------
   O Mercado Pago manda em formatos diferentes conforme o tipo de aviso. */
$idPagamento = '';
if (isset($_GET['data_id']))                 $idPagamento = $_GET['data_id'];
if (isset($_GET['id']) && !$idPagamento)     $idPagamento = $_GET['id'];
if (isset($corpo['data']['id']))             $idPagamento = $corpo['data']['id'];
if (isset($corpo['id']) && !$idPagamento)    $idPagamento = $corpo['id'];

$tipo = isset($corpo['type']) ? $corpo['type'] : (isset($_GET['topic']) ? $_GET['topic'] : '');
if ($tipo && $tipo !== 'payment') cerro_fim('ignorado: ' . $tipo);
if (!$idPagamento) cerro_fim('sem id');

/* --- Trava 1: assinatura --------------------------------------------- */
if (!empty($segredo['webhook_secret'])) {
  $assinatura = isset($_SERVER['HTTP_X_SIGNATURE']) ? $_SERVER['HTTP_X_SIGNATURE'] : '';
  $requestId  = isset($_SERVER['HTTP_X_REQUEST_ID']) ? $_SERVER['HTTP_X_REQUEST_ID'] : '';

  $ts = ''; $v1 = '';
  foreach (explode(',', $assinatura) as $parte) {
    $par = explode('=', trim($parte), 2);
    if (count($par) === 2) {
      if ($par[0] === 'ts') $ts = $par[1];
      if ($par[0] === 'v1') $v1 = $par[1];
    }
  }

  $manifesto = 'id:' . strtolower((string) $idPagamento) . ';request-id:' . $requestId . ';ts:' . $ts . ';';
  $esperado  = hash_hmac('sha256', $manifesto, $segredo['webhook_secret']);

  if (!$v1 || !hash_equals($esperado, $v1)) {
    error_log('Cerro/webhook: assinatura invalida para ' . $idPagamento);
    http_response_code(401);
    exit('assinatura invalida');
  }
}

/* --- Trava 2: pergunta para a fonte ----------------------------------- */
$r = cerro_http('GET', 'https://api.mercadopago.com/v1/payments/' . rawurlencode($idPagamento), $segredo['access_token']);

if ($r['status'] < 200 || $r['status'] >= 300 || empty($r['corpo'])) {
  /* Aqui vale devolver erro: se foi instabilidade momentânea, o Mercado
     Pago tenta de novo mais tarde e o pedido não se perde. */
  error_log('Cerro/webhook: consulta falhou, status ' . $r['status']);
  http_response_code(500);
  exit('reconsulta falhou');
}

$p = $r['corpo'];
$estado = isset($p['status']) ? $p['status'] : 'desconhecido';

$registro = array(
  'quando'      => date('c'),
  'referencia'  => isset($p['external_reference']) ? $p['external_reference'] : '',
  'estado'      => $estado,
  'detalhe'     => isset($p['status_detail']) ? $p['status_detail'] : '',
  'pagamento'   => (string) $idPagamento,
  'total'       => isset($p['transaction_amount']) ? (float) $p['transaction_amount'] : null,
  'metodo'      => isset($p['payment_type_id']) ? $p['payment_type_id'] : '',
  'parcelas'    => isset($p['installments']) ? (int) $p['installments'] : null,
  'cliente'     => array(
    'nome'  => isset($p['payer']['first_name']) ? $p['payer']['first_name'] : '',
    'email' => isset($p['payer']['email']) ? $p['payer']['email'] : '',
  ),
  'vendedor'    => isset($p['metadata']['vendedor']) ? $p['metadata']['vendedor'] : '',
  'whatsapp'    => isset($p['metadata']['whatsapp']) ? $p['metadata']['whatsapp'] : '',
);

cerro_registrar($registro);

/* --- Avisa por e-mail quando a venda foi aprovada --------------------- */
if ($estado === 'approved' && !empty($segredo['email_pedidos'])) {
  $linhas = array(
    'Pedido aprovado na Cerrô.',
    '',
    'Referência: ' . $registro['referencia'],
    'Valor: R$ ' . number_format((float) $registro['total'], 2, ',', '.'),
    'Forma: ' . $registro['metodo'] . ($registro['parcelas'] > 1 ? ' em ' . $registro['parcelas'] . 'x' : ''),
    'Cliente: ' . $registro['cliente']['nome'] . ' ' . $registro['cliente']['email'],
  );
  if ($registro['whatsapp']) $linhas[] = 'WhatsApp: ' . $registro['whatsapp'];
  if ($registro['vendedor']) $linhas[] = 'Indicado por: ' . $registro['vendedor'];
  $linhas[] = '';
  $linhas[] = 'Id do pagamento no Mercado Pago: ' . $registro['pagamento'];

  @mail(
    $segredo['email_pedidos'],
    'Cerro: pedido aprovado ' . $registro['referencia'],
    implode("\n", $linhas),
    "Content-Type: text/plain; charset=utf-8\r\n"
  );
}

cerro_fim('ok ' . $estado);
