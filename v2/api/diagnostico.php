<?php
/* ==========================================================================
   Cerrô · Diagnóstico da integração
   --------------------------------------------------------------------------
   Abra este endereço no navegador depois de subir os arquivos. Ele responde,
   em português, se está tudo pronto para receber pagamento.

   Ele NUNCA mostra o token. Mostra só se existe, se é de teste ou de
   produção, e os quatro últimos caracteres, o suficiente para você conferir
   que colou o certo sem expor a chave para quem abrir a página.

   APAGUE ESTE ARQUIVO DO SERVIDOR quando terminar de configurar.
   ========================================================================== */

require __DIR__ . '/comum.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$itens = array();
function checar(&$itens, $titulo, $ok, $detalhe, $comoResolver = '') {
  $itens[] = array('titulo' => $titulo, 'ok' => $ok, 'detalhe' => $detalhe, 'resolver' => $comoResolver);
}

/* --- Ambiente --------------------------------------------------------- */
$php = PHP_VERSION;
checar($itens, 'Versão do PHP', version_compare($php, '7.2', '>='), $php,
  'No cPanel, "Selecionar versão do PHP", escolha 7.4 ou superior.');

checar($itens, 'Conexão com a internet (cURL)', function_exists('curl_init'),
  function_exists('curl_init') ? 'cURL disponível' : 'cURL ausente, vai usar o método alternativo',
  'Se faltar, no cPanel em "Selecionar versão do PHP" marque a extensão curl.');

$temSSL = in_array('https', stream_get_wrappers(), true) || function_exists('curl_init');
checar($itens, 'Suporte a HTTPS', $temSSL, $temSSL ? 'ok' : 'sem https',
  'Sem isso não dá para falar com o Mercado Pago.');

/* --- Segredo ---------------------------------------------------------- */
$seg = cerro_segredo();
if (!$seg) {
  checar($itens, 'Arquivo de segredo', false, 'Não encontrado',
    'Crie /home/SEU_USUARIO/cerro-secreto.php seguindo o modelo em api/SEGREDO-EXEMPLO.php. Ele fica FORA de public_html.');
} else {
  $t = $seg['access_token'];
  $ehTeste = strpos($t, 'TEST-') === 0;
  $ehProd  = strpos($t, 'APP_USR-') === 0;
  checar($itens, 'Arquivo de segredo', true, 'Encontrado e legível');
  checar($itens, 'Formato do Access Token', $ehTeste || $ehProd,
    ($ehTeste ? 'Credencial de TESTE' : ($ehProd ? 'Credencial de PRODUÇÃO' : 'Formato não reconhecido'))
      . ', final ' . substr($t, -4),
    'Deve começar com TEST- ou APP_USR-. Copie de novo do painel do Mercado Pago.');

  checar($itens, 'Segredo do webhook', !empty($seg['webhook_secret']),
    !empty($seg['webhook_secret']) ? 'Configurado' : 'Vazio, opcional',
    'Sem ele o pagamento funciona igual: o servidor confirma reconsultando a API. É uma segunda tranca.');

  $pasta = !empty($seg['pasta_pedidos']) ? $seg['pasta_pedidos'] : '';
  $pastaOk = $pasta && (is_dir($pasta) ? is_writable($pasta) : @mkdir($pasta, 0700, true));
  checar($itens, 'Pasta dos pedidos', (bool) $pastaOk, $pasta ? $pasta : 'não informada',
    'Precisa existir e aceitar escrita. Deve ficar fora de public_html.');

  /* O segredo está mesmo fora da pasta pública? */
  $raizPublica = isset($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : '';
  $dentro = false;
  foreach (array(dirname(dirname(dirname(__FILE__))) . '/cerro-secreto.php') as $c) {
    $real = realpath($c);
    if ($real && $raizPublica && strpos($real, $raizPublica) === 0) $dentro = true;
  }
  checar($itens, 'Segredo fora da pasta pública', !$dentro,
    $dentro ? 'ATENÇÃO: está dentro de public_html' : 'ok',
    'Mova cerro-secreto.php para um nível acima de public_html.');

  /* --- Conversa de verdade com o Mercado Pago ------------------------- */
  $r = cerro_http('GET', 'https://api.mercadopago.com/users/me', $t);
  $vale = ($r['status'] >= 200 && $r['status'] < 300);
  checar($itens, 'Mercado Pago aceita a credencial', $vale,
    $vale ? ('Conta ' . (isset($r['corpo']['nickname']) ? $r['corpo']['nickname'] : '') . ', país ' . (isset($r['corpo']['site_id']) ? $r['corpo']['site_id'] : '?'))
          : ('Resposta ' . $r['status'] . ' ' . (isset($r['corpo']['message']) ? $r['corpo']['message'] : $r['erro'])),
    'Token errado, expirado, ou copiado com espaço no começo ou no fim.');
}

/* --- Preço do servidor bate com o do site? ---------------------------- */
$catalogo = include __DIR__ . '/catalogo.php';
$js = @file_get_contents(dirname(__DIR__) . '/assets/js/catalogo.js');
if ($js === false) {
  checar($itens, 'Preços conferem com o site', false, 'Não consegui ler assets/js/catalogo.js',
    'Confira manualmente se os preços de api/catalogo.php batem com os do site.');
} else {
  $divergencias = array();
  if (preg_match_all("/id:\s*'([a-z0-9-]+)'.*?preco:\s*([0-9.]+)/s", $js, $m, PREG_SET_ORDER)) {
    foreach ($m as $achado) {
      $id = $achado[1]; $precoJs = (float) $achado[2];
      if (!isset($catalogo[$id])) { $divergencias[] = $id . ': existe no site e falta no servidor'; continue; }
      if (abs($catalogo[$id]['preco'] - $precoJs) > 0.001) {
        $divergencias[] = $id . ': site R$ ' . $precoJs . ' x servidor R$ ' . $catalogo[$id]['preco'];
      }
    }
  }
  if (preg_match("/kit:\s*([0-9.]+)/", $js, $mk)) {
    foreach (array('despertar-da-terra-kit', 'pureza-nativa-kit', 'sol-do-cerrado-kit') as $k) {
      if (isset($catalogo[$k]) && abs($catalogo[$k]['preco'] - (float) $mk[1]) > 0.001) {
        $divergencias[] = $k . ': site R$ ' . $mk[1] . ' x servidor R$ ' . $catalogo[$k]['preco'];
      }
    }
  }
  checar($itens, 'Preços conferem com o site', empty($divergencias),
    empty($divergencias) ? 'Todos batem' : implode(' | ', $divergencias),
    'Ajuste api/catalogo.php para bater com assets/js/catalogo.js. O servidor é quem cobra.');
}

/* --- Endereços que o Mercado Pago vai usar ---------------------------- */
$base = cerro_base_url();
checar($itens, 'Endereço do site', strpos($base, 'https://') === 0, $base,
  'O Mercado Pago exige https no endereço de retorno. Ative o SSL grátis no cPanel, em "SSL/TLS Status".');

$falhas = 0;
foreach ($itens as $i) if (!$i['ok']) $falhas++;
?>
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Cerrô · Diagnóstico do pagamento</title>
<style>
  body { font: 16px/1.7 system-ui, sans-serif; max-width: 760px; margin: 3rem auto; padding: 0 1.2rem; color: #2A1E18; background: #F7F1E8; }
  h1 { font-weight: 400; letter-spacing: .02em; }
  .resumo { padding: 1rem 1.2rem; border-radius: 10px; margin: 1.5rem 0 2rem; }
  .bom  { background: #E4EFE2; border: 1px solid #A9C7A2; }
  .ruim { background: #F6E2DC; border: 1px solid #D6A192; }
  .item { border-top: 1px solid #E2D5C2; padding: .9rem 0; }
  .item b { display: block; }
  .sinal { font-weight: 700; margin-right: .4rem; }
  .ok  { color: #3F7A34; }
  .nao { color: #A8402A; }
  .det { color: #6B5949; font-size: .94rem; }
  .res { font-size: .9rem; color: #6B5949; background: #EFE6D8; padding: .5rem .7rem; border-radius: 7px; margin-top: .4rem; }
  footer { margin-top: 2.5rem; font-size: .88rem; color: #6B5949; border-top: 1px solid #E2D5C2; padding-top: 1rem; }
</style>
<h1>Diagnóstico do pagamento</h1>
<div class="resumo <?= $falhas ? 'ruim' : 'bom' ?>">
  <?= $falhas
      ? '<b>' . $falhas . ' ' . ($falhas === 1 ? 'item precisa' : 'itens precisam') . ' de ajuste.</b> Veja abaixo o que fazer em cada um.'
      : '<b>Tudo pronto.</b> Pode trocar o modo de pagamento para mercadopago em assets/js/config.js e testar uma compra.' ?>
</div>
<?php foreach ($itens as $i): ?>
  <div class="item">
    <b><span class="sinal <?= $i['ok'] ? 'ok' : 'nao' ?>"><?= $i['ok'] ? '&#10003;' : '&#10007;' ?></span><?= htmlspecialchars($i['titulo']) ?></b>
    <div class="det"><?= htmlspecialchars($i['detalhe']) ?></div>
    <?php if (!$i['ok'] && $i['resolver']): ?><div class="res"><?= htmlspecialchars($i['resolver']) ?></div><?php endif; ?>
  </div>
<?php endforeach; ?>
<footer>
  Esta página não mostra o Access Token, só os quatro últimos caracteres.
  Ainda assim, <strong>apague api/diagnostico.php do servidor</strong> depois que
  estiver tudo verde: ela conta detalhes da configuração que não precisam ficar públicos.
</footer>
