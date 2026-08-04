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
     O Checkout Pro do Mercado Pago exige um backend que crie a "preferência"
     de pagamento (a chave secreta NUNCA pode ficar no site, qualquer visitante
     conseguiria ler). Enquanto o backend não existir, o site usa o modo
     'whatsapp': o pedido é montado e enviado como mensagem pronta.

     Passo a passo para ativar está no arquivo LEIA-ME.md.
     ---------------------------------------------------------------------- */
  pagamento: {
    // 'whatsapp'    → pedido finalizado por WhatsApp (funciona hoje, sem backend)
    // 'mercadopago' → envia o pedido para o endpoint abaixo e redireciona ao checkout
    modo: 'whatsapp',

    mercadoPago: {
      publicKey: 'PREENCHER: APP_USR-xxxxxxxx',   // chave PÚBLICA, pode ficar aqui
      endpointPreferencia: '/api/criar-preferencia', // seu backend
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
