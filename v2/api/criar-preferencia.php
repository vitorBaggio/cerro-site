<?php
/* ==========================================================================
   Cerrô · Cria a preferência de pagamento no Mercado Pago
   --------------------------------------------------------------------------
   O navegador manda o que a pessoa quer comprar. Este arquivo decide quanto
   isso custa, pede uma cobrança ao Mercado Pago e devolve o endereço do
   checkout. O navegador então redireciona para lá.

   A regra que sustenta tudo: NADA de dinheiro vem do navegador. Ele manda
   id e quantidade. Preço, frete e total saem de catalogo.php e de comum.php.
   ========================================================================== */

require __DIR__ . '/comum.php';

/* --- Só POST, e só JSON ---------------------------------------------- */
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
  cerro_responder(405, array('erro' => 'Use POST.'));
}

$bruto = file_get_contents('php://input');
$dados = json_decode($bruto, true);
if (!is_array($dados) || empty($dados['itens']) || !is_array($dados['itens'])) {
  cerro_responder(400, array('erro' => 'Pedido vazio ou malformado.'));
}

/* --- Credencial ------------------------------------------------------- */
$segredo = cerro_segredo();
if (!$segredo) {
  cerro_responder(500, array(
    'erro' => 'Pagamento não configurado no servidor.',
    'dica' => 'Rode api/diagnostico.php para ver o que falta.',
  ));
}

/* --- Monta o pedido com os preços do servidor ------------------------- */
$catalogo = include __DIR__ . '/catalogo.php';

if (count($dados['itens']) > $CERRO_LOJA['max_itens_distintos']) {
  cerro_responder(400, array('erro' => 'Pedido grande demais.'));
}

$itens = array();
$subtotal = 0.0;
$resumo = array();

foreach ($dados['itens'] as $pedido) {
  $id  = isset($pedido['id']) ? (string) $pedido['id'] : '';
  $qtd = isset($pedido['qtd']) ? (int) $pedido['qtd'] : 0;

  /* Item que não está no catálogo do servidor não existe. Ponto. Isso
     cobre tanto erro de digitação quanto tentativa de inventar produto. */
  if (!isset($catalogo[$id])) {
    cerro_responder(400, array('erro' => 'Produto não encontrado: ' . $id));
  }
  if ($qtd < 1 || $qtd > $CERRO_LOJA['max_qtd_por_item']) {
    cerro_responder(400, array('erro' => 'Quantidade inválida para ' . $id));
  }

  $preco = (float) $catalogo[$id]['preco'];
  $subtotal += $preco * $qtd;

  $itens[] = array(
    'id'          => $id,
    'title'       => $catalogo[$id]['nome'],
    'quantity'    => $qtd,
    'unit_price'  => round($preco, 2),
    'currency_id' => $CERRO_LOJA['moeda'],
  );
  $resumo[] = $qtd . 'x ' . $catalogo[$id]['nome'];
}

/* --- Desconto, calculado aqui e não aceito do navegador ----------------
   O navegador manda o CÓDIGO do cupom, nunca o valor. Aceitar o valor seria
   entregar o desconto para quem souber abrir o console: bastaria mandar
   "desconto: 119" num kit de 120. A função revalida o código na tabela do
   servidor, confere validade e mínimo, e devolve quanto abater. */
$codigoCupom = isset($dados['cupom']) ? substr(preg_replace('/[^A-Za-z0-9_-]/', '', (string) $dados['cupom']), 0, 24) : '';
$desconto = cerro_desconto($codigoCupom, $subtotal);

/* --- Frete, também calculado aqui ------------------------------------- */
$frete = (float) $CERRO_LOJA['frete_valor'];
$limite = $CERRO_LOJA['frete_gratis_acima'];
if ($limite !== null && $subtotal >= (float) $limite) $frete = 0.0;

$total = round($subtotal - $desconto + $frete, 2);

/* --- Dados de quem está comprando, se ele estiver logado -------------- */
$cliente = isset($dados['cliente']) && is_array($dados['cliente']) ? $dados['cliente'] : array();
$comprador = array();
if (!empty($cliente['nome']))  $comprador['name']  = cerro_corta((string) $cliente['nome'], 80);
if (!empty($cliente['email']) && filter_var($cliente['email'], FILTER_VALIDATE_EMAIL)) {
  $comprador['email'] = $cliente['email'];
}

/* Código de quem atendeu a venda. Vem do seletor da finalização ou do link
   próprio da atendente. Vazio quando a cliente deixou em 'Nenhuma', que é o
   padrão: ninguém ganha comissão por descuido dela. */
$vendedor = isset($dados['vendedor']) ? substr(preg_replace('/[^A-Za-z0-9_-]/', '', (string) $dados['vendedor']), 0, 24) : '';

/* --- Nosso número do pedido ------------------------------------------- */
$referencia = 'CERRO-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 6);

$base = cerro_base_url();

$preferencia = array(
  'items' => $itens,
  'payer' => $comprador,
  'external_reference' => $referencia,
  'statement_descriptor' => 'CERRO',
  'back_urls' => array(
    'success' => $base . '/retorno.html',
    'pending' => $base . '/retorno.html',
    'failure' => $base . '/retorno.html',
  ),
  'auto_return' => 'approved',
  'notification_url' => $base . '/api/webhook.php',
  'payment_methods' => array(
    'installments' => (int) $CERRO_LOJA['parcelas_maximas'],
  ),
  'metadata' => array(
    'vendedor'  => $vendedor,
    'cupom'     => $desconto > 0 ? strtoupper($codigoCupom) : '',
    'desconto'  => round($desconto, 2),
    'whatsapp'  => isset($cliente['whatsapp']) ? preg_replace('/\D/', '', (string) $cliente['whatsapp']) : '',
    'subtotal'  => round($subtotal, 2),
    'frete'     => round($frete, 2),
  ),
);

/* O desconto entra como uma linha negativa na lista, e não abatendo o preço
   unitário de cada item. Duas razões: a cliente vê "Desconto PRIMEIRA10,
   −R$ 12,00" na tela do Mercado Pago em vez de um preço de produto que não
   bate com o do site, e o registro do pedido guarda o preço cheio, que é o
   que serve para conferir margem depois. */
if ($desconto > 0) {
  $preferencia['items'][] = array(
    'id'          => 'desconto',
    'title'       => 'Desconto ' . strtoupper($codigoCupom),
    'quantity'    => 1,
    'unit_price'  => -round($desconto, 2),
    'currency_id' => $CERRO_LOJA['moeda'],
  );
}

/* O frete entra como custo de envio, e não como mais um item da lista, para
   aparecer separado na tela do Mercado Pago igual aparece na sacola. */
if ($frete > 0) {
  $preferencia['shipments'] = array(
    'cost' => round($frete, 2),
    'mode' => 'not_specified',
  );
}

/* --- Pede a cobrança -------------------------------------------------- */
$r = cerro_http('POST', 'https://api.mercadopago.com/checkout/preferences', $segredo['access_token'], $preferencia);

if ($r['status'] < 200 || $r['status'] >= 300 || empty($r['corpo']['init_point'])) {
  /* Loga o suficiente para diagnosticar, sem devolver detalhe de servidor
     para o navegador. */
  error_log('Cerro/MP falhou: status ' . $r['status'] . ' ' . json_encode($r['corpo']));
  cerro_responder(502, array('erro' => 'O Mercado Pago não aceitou o pedido agora.'));
}

/* --- Registra o pedido como iniciado ---------------------------------- */
cerro_registrar(array(
  'quando'     => date('c'),
  'referencia' => $referencia,
  'estado'     => 'iniciado',
  'itens'      => $resumo,
  'subtotal'   => round($subtotal, 2),
  'desconto'   => round($desconto, 2),
  'cupom'      => $desconto > 0 ? strtoupper($codigoCupom) : '',
  'frete'      => round($frete, 2),
  'total'      => $total,
  'cliente'    => $comprador,
  'vendedor'   => $vendedor,
  'preference' => isset($r['corpo']['id']) ? $r['corpo']['id'] : '',
));

/* O sandbox_init_point é o checkout de teste. Com credencial TEST- é ele
   que funciona; com credencial de produção, o init_point. Devolvo os dois
   e o navegador usa o que vier preenchido. */
cerro_responder(200, array(
  'init_point'         => $r['corpo']['init_point'],
  'sandbox_init_point' => isset($r['corpo']['sandbox_init_point']) ? $r['corpo']['sandbox_init_point'] : '',
  'referencia'         => $referencia,
  'total'              => $total,
));
