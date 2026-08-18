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
     Hoje é valor fixo. A cotação real por CEP precisa dos dados de envio
     logo abaixo, e de uma conta no SuperFrete ou Melhor Envio: as APIs
     abertas dos Correios foram desligadas em setembro de 2023 e a nova
     exige contrato ativo.
     ---------------------------------------------------------------------- */
  frete: {
    valorPadrao: 25.00,
    freteGratisAcimaDe: 200.00,   // use null para desativar
    prazoTexto: '3 a 8 dias úteis após a confirmação do pagamento',
    preparoTexto: 'Produção artesanal: até 3 dias úteis de preparo antes do envio.',
  },

  /* --- Dados de envio ----------------------------------------------------
     Medidas e pesos reais, informados pelo cliente. É daqui que sai a
     cotação quando ela for ligada.

     Uma conta que vale entender antes de comprar caixa: os Correios cobram
     pelo MAIOR valor entre o peso real e o peso cubado, e o cubado é
     comprimento × largura × altura ÷ 6000.

     Na caixa de 28 × 22 × 10, isso dá 6160 cm³, ou seja 1,027 kg de peso
     cubado. O kit pesa 730 g de verdade, já com os 100 g da caixa. Então o
     frete é cobrado como se ele pesasse 1,03 kg: 41% a mais, e quem paga
     essa diferença é a loja em cada venda. O que encarece aqui não é o
     produto, é o ar dentro da caixa.

     Isso pesa ainda mais numa venda de peça avulsa: um sabonete de R$ 28
     dentro dessa mesma caixa é cobrado como 1,03 kg igual ao kit inteiro.
     Uma caixa menor para peça avulsa se paga rápido.
     ---------------------------------------------------------------------- */
  envio: {
    cepOrigem: '78074-170',        // Cuiabá, MT

    caixaPadrao: { comprimento: 28, largura: 22, altura: 10, pesoDaCaixa: 100 },  // cm e gramas
    caixaMenor:  null,             // PREENCHER se houver caixa para peça avulsa

    /* Peso em gramas, JÁ COM a caixa. */
    pesos: {
      kitRitual:    730,           // 630 g de produto + 100 g de caixa
      kitFlorescer: 700,           // 600 g de produto + 100 g de caixa

      sabonete:  'PREENCHER',      // peça avulsa
      sais:      'PREENCHER',
      geleia:    'PREENCHER',
      esfoliante:'PREENCHER',
      trio:      'PREENCHER',
    },
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

  /* --- Atendentes --------------------------------------------------------
     Quem indicou a venda. Aparece como seletor na finalização, com "Nenhuma"
     marcado por padrão: ninguém ganha comissão por descuido da cliente.

     Cada atendente tem um código curto, que também serve de link próprio:
     seusite.com.br/?v=ana manda a cliente já com a Ana selecionada. A
     atendente compartilha o link dela e não depende da cliente lembrar.

     O código fica guardado por 60 dias no navegador. Se a cliente chegar
     pelo link da Ana hoje e comprar na semana que vem, a venda continua
     sendo da Ana.

     REGRA DE CONFLITO: se ela chegou pelo link de uma e selecionou outra na
     tela, vale A SELEÇÃO. Foi ato consciente dela, e o link pode ter sido
     compartilhado por terceiro.
     ---------------------------------------------------------------------- */
  atendentes: {
    memoriaEmDias: 60,
    /* O código é o que vai no link e no registro do pedido. Escolhi pelo
       primeiro nome porque é o que a atendente reconhece ao compartilhar o
       link dela. Se entrar outra Isabela algum dia, o código dela precisa
       ser diferente, não o nome. */
    lista: [
      { codigo: 'duda',    nome: 'Maria Eduarda' },
      { codigo: 'isabela', nome: 'Isabela' },
      { codigo: 'nilma',   nome: 'Nilma' },
    ],
  },

  /* --- Cupons de desconto ------------------------------------------------
     O Mercado Pago não tem API que devolva "os descontos da minha loja": o
     que existe no painel dele são campanhas dele, aplicadas dentro do
     checkout dele. Então o cupom mora aqui.

     ATENÇÃO, e isto não é detalhe: esta lista é só para MOSTRAR na tela. O
     desconto que vale é o de api/comum.php, no servidor. Os dois precisam
     bater. Se você mudar só aqui, a cliente vê um desconto e paga outro; se
     mudar só lá, ela não vê mas paga menos.

     tipo 'percentual' usa `valor` como porcentagem. tipo 'fixo' usa como
     reais. `minimo` é o subtotal a partir do qual o cupom vale.
     ---------------------------------------------------------------------- */
  cupons: [
    // { codigo: 'PRIMEIRA10', tipo: 'percentual', valor: 10, minimo: 0 },
    // { codigo: 'FRETEGRATIS', tipo: 'fixo', valor: 25, minimo: 150 },
  ],

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
