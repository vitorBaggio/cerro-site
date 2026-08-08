<?php
/* ==========================================================================
   Cerrô · Arquivo de segredo, MODELO
   --------------------------------------------------------------------------
   NÃO USE ESTE ARQUIVO ONDE ELE ESTÁ. Ele é só um modelo.

   O QUE FAZER, no Gerenciador de Arquivos do cPanel da HostGator:

   1. Você vai ver duas coisas na raiz: a pasta "public_html" e outras pastas
      irmãs dela. Tudo que está DENTRO de public_html é servido na internet.
      Tudo que está FORA, não é. É por isso que o segredo vai para fora.

   2. Crie o arquivo  /home/SEU_USUARIO/cerro-secreto.php
      (mesmo nível de public_html, não dentro dela)

   3. Cole o conteúdo abaixo lá e troque os valores.

   4. Nas permissões do arquivo, deixe 600. Botão direito no arquivo,
      "Change Permissions", e deixe marcado só Read e Write do dono.

   5. Apague este modelo do servidor depois. Ele não tem segredo nenhum
      dentro, mas não precisa ficar lá.

   POR QUE TODO ESSE CUIDADO: o Access Token é a chave da conta de
   pagamento. Quem tem ele cria cobranças em nome da loja. Se ele ficar
   dentro de public_html num arquivo .txt, .js ou .json, qualquer pessoa
   abre pelo navegador e lê. Em .php o servidor executa em vez de mostrar,
   mas basta um erro de configuração para o código virar texto na tela.
   Fora da pasta pública não tem esse risco.

   E o de sempre: esse token não passa por WhatsApp, não passa por e-mail
   e não chega até mim. Você copia do painel do Mercado Pago e cola direto
   no cPanel.
   ========================================================================== */

return array(

  /* --- Credencial do Mercado Pago ---------------------------------------
     Onde achar: mercadopago.com.br → Seu negócio → Configurações →
     Gestão e administração → Credenciais.

     Tem dois pares, de teste e de produção. Comece pelo de TESTE, confirme
     que uma compra fake funciona de ponta a ponta, e só depois troque pelo
     de produção.

     O que importa aqui é o Access Token, que começa com TEST- ou APP_USR-.
     ---------------------------------------------------------------------- */
  'access_token' => 'COLE-AQUI-O-ACCESS-TOKEN',

  /* --- Segredo do webhook (opcional, mas recomendado) --------------------
     No mesmo lugar das credenciais, em "Webhooks" ou "Notificações", o
     Mercado Pago mostra uma "chave secreta" da integração. Com ela, o
     servidor confere se a notificação veio mesmo de lá.

     Deixe string vazia se ainda não configurou. O código continua seguro
     porque, notificação recebida, ele reconsulta o pagamento na API do
     Mercado Pago antes de acreditar em qualquer coisa. A assinatura é uma
     segunda tranca, não a única.
     ---------------------------------------------------------------------- */
  'webhook_secret' => '',

  /* --- Para onde avisar quando cair um pedido ---------------------------
     Deixe string vazia para não enviar e-mail.
     ---------------------------------------------------------------------- */
  'email_pedidos' => '',

  /* --- Onde guardar os pedidos ------------------------------------------
     Caminho de uma pasta FORA de public_html. O código cria o arquivo
     pedidos.jsonl dentro dela, uma linha por pedido.
     ---------------------------------------------------------------------- */
  'pasta_pedidos' => '/home/SEU_USUARIO/cerro-pedidos',
);
