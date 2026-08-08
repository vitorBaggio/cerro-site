/* ==========================================================================
   Cerrô · Configuração da loja
   --------------------------------------------------------------------------
   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA COLOCAR O SITE NO AR.
   Tudo que está com PREENCHER precisa ser trocado pelos seus dados reais.
   ========================================================================== */

window.CERRO_CONFIG = {

  /* --- Dados da loja ---------------------------------------------------- */
  loja: {
    nome: 'Cerrô',
    assinatura: 'Banho do Cerrado',
    slogan: 'Sinta a força da terra, viva o seu ritual.',

    razaoSocial: 'PREENCHER: razão social',
    cnpj:        'PREENCHER: 00.000.000/0001-00',
    cidade:      'PREENCHER: cidade / MT',

    email:     'PREENCHER@exemplo.com.br',
    whatsapp:  '5565900000000',        // só números, com 55 + DDD
    instagram: 'cerro.banhodocerrado', // sem o @
  },

  /* --- Frete ------------------------------------------------------------
     Regra simples de frete fixo. Para cálculo real por CEP é preciso
     integrar Correios/Melhor Envio (fase 2).
     ---------------------------------------------------------------------- */
  frete: {
    valorPadrao: 25.00,
    freteGratisAcimaDe: 200.00,   // use null para desativar
    prazoTexto: '3 a 8 dias úteis após a confirmação do pagamento',
    preparoTexto: 'Produção artesanal: até 3 dias úteis de preparo antes do envio.',
  },

  /* --- Pagamento, Mercado Pago -----------------------------------------
     Os arquivos da pasta api/ fazem a parte do servidor. Passo a passo
     completo em PAGAMENTO.md.

     Ordem certa para ligar, sem susto:
       1. Suba a pasta api/ e o arquivo retorno.html para o servidor.
       2. Crie o cerro-secreto.php fora de public_html, com a credencial
          de TESTE do Mercado Pago.
       3. Abra seusite.com.br/api/diagnostico.php e resolva o que aparecer.
       4. Só quando estiver tudo verde, troque o modo abaixo para
          'mercadopago' e faça uma compra de teste do começo ao fim.
       5. Deu certo? Troque a credencial pela de produção e apague o
          api/diagnostico.php do servidor.

     Enquanto o modo for 'whatsapp', o site funciona igual está hoje: o
     pedido vira mensagem pronta. Nada quebra por deixar assim.
     ---------------------------------------------------------------------- */
  pagamento: {
    // 'whatsapp'    → pedido finalizado por WhatsApp (funciona sem servidor)
    // 'mercadopago' → cria a cobrança em api/ e leva ao checkout
    modo: 'whatsapp',

    mercadoPago: {
      endpointPreferencia: 'api/criar-preferencia.php',

      /* Estes dois valores são só para mostrar na tela. Quem cobra de
         verdade é o servidor, com o que está em api/comum.php. Se você mudar
         aqui, mude lá também, senão o cliente vê um número na sacola e outro
         na hora de pagar, e desiste. */
      parcelasMaximas: 6,
    },
  },

  /* --- Cadastro de clientes ---------------------------------------------
     backend: 'local'    → guarda no navegador. SÓ PARA TESTE. Os cadastros
                           ficam no computador do cliente e você não recebe nada.
     backend: 'supabase' → cadastro real, em banco de dados, com os contatos
                           acessíveis para você (Supabase tem plano gratuito).
                           Instruções no LEIA-ME.md.
     ---------------------------------------------------------------------- */
  contas: {
    backend: 'local',
    supabase: {
      url:     'PREENCHER: https://xxxxx.supabase.co',
      chaveAnon: 'PREENCHER: chave anon public',
    },
  },
};
