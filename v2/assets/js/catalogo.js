/* ==========================================================================
   Cerrô · Catálogo
   --------------------------------------------------------------------------
   Todo o conteúdo de produto do site vem daqui. Mudou o preço? Mude aqui e
   o site inteiro se atualiza (home, páginas de ritual e carrinho).
   ========================================================================== */

window.CERRO_CATALOGO = {

  precos: {
    sabonete: 28.00,
    sais:     45.00,
    geleia:   60.00,
    kit:     120.00,
    trio:     84.00,
  },

  rituais: [

    /* ====================================================================== */
    {
      slug: 'despertar-da-terra',
      nome: 'Ritual Despertar da Terra',
      nomeCurto: 'Despertar da Terra',
      subtitulo: 'Ritual da Vitalidade',
      essencias: 'Romã, Pitanga e Hibisco',
      cor: '#A83A50',
      foto: 'assets/img/ritual-despertar-da-terra.jpg',

      chamada: 'A luminosidade das frutas do Cerrado sobre a pele. Um ritual de vitalidade para quem precisa de cuidado sem aspereza.',

      historia: 'Existe um instante, logo depois da primeira chuva, em que o Cerrado se enche de cor. As frutas amadurecem de uma vez, o hibisco se abre e a terra devolve tudo o que guardou na seca. O Ritual Despertar da Terra nasceu desse instante: é um banho de luminosidade, construído sobre a romã, a pitanga e o hibisco, que revitaliza a textura da pele e faz uma limpeza profunda sem nunca agredir.',

      paraQuem: 'Peles sensíveis, que pedem um cuidado extra com a hidratação e não toleram fórmulas agressivas.',

      promessaKit: 'O ritual completo revitaliza a textura da pele e realiza uma limpeza profunda, sem causar agressões ou irritações.',

      ativos: ['Extrato de rosas', 'Frutas vermelhas', 'Argila rosa', 'Óleo de rosa mosqueta', 'Flores de hibisco', 'Extrato de hibisco'],

      produtos: [
        {
          id: 'despertar-sabonete',
          tipo: 'sabonete',
          rotulo: 'Sabonete em barra',
          nome: 'Brisa Rosada',
          medida: '80 g',
          preco: 28.00,
          ativos: 'Extrato de rosas, extrato de frutas vermelhas e argila rosa',
          texto: 'Um banho de luminosidade e suavidade. As frutas vermelhas, o extrato de rosas e a argila rosa se encontram num sabonete que limpa e nutre sem ressecar. A espuma é fina, o aroma fica na pele depois do banho, e o toque é macio e firme, com o brilho natural que ela merece.',
        },
        {
          id: 'despertar-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Pétalas do Deserto',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de rosa mosqueta e flores de hibisco',
          texto: 'Um dos óleos mais valorizados do cuidado natural. O óleo de rosa mosqueta é rico em ácidos graxos essenciais e vitaminas, e deixa o corpo hidratado, macio e com viço. As flores de hibisco, infundidas na água quente, entregam uma esfoliação delicada.',
        },
        {
          id: 'despertar-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Néctar Suave',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de hibisco',
          texto: 'O extrato de hibisco é conhecido no cuidado natural pelo toque tonificante que deixa na pele. Em formulação de geleia, ele desliza no banho, limpa sem pesar, deixa a pele uniforme ao toque e entrega um frescor revigorante que desperta os sentidos.',
        },
      ],
    },

    /* ====================================================================== */
    {
      slug: 'pureza-nativa',
      nome: 'Ritual Pureza Nativa',
      nomeCurto: 'Pureza Nativa',
      subtitulo: 'Ritual da Calma',
      essencias: 'Baunilha e Sândalo',
      cor: '#A08B6F',
      foto: 'assets/img/ritual-pureza-nativa.jpg',

      chamada: 'Baunilha e sândalo sobre a pele seca. O ritual mais silencioso da casa, feito para acalmar e restaurar.',

      historia: 'Quando a neblina baixa cobre o campo antes do amanhecer, o Cerrado desacelera e tudo entra em suspensão. Inspirado na serenidade desse momento, o Pureza Nativa combina a doçura acolhedora do Sândalo e da Baunilha com a restauração profunda do Leite de Cabra e da Argila Branca. Um ritual de puro aconchego para pausar o tempo e devolver à sua pele o equilíbrio mais essencial.',

      paraQuem: 'Peles secas e sensíveis, que requerem cuidado extra e hidratação intensa.',

      promessaKit: 'O ritual completo é o mais silencioso da casa: limpa, hidrata e acalma sem pressa. A pele fica macia por mais tempo, e o aroma de baunilha e sândalo fica junto.',

      ativos: ['Óleo de algodão', 'Argila branca', 'Óleo de amêndoas', 'Flores de camomila', 'Extrato de amêndoas', 'Leite de cabra'],

      produtos: [
        {
          id: 'pureza-sabonete',
          tipo: 'sabonete',
          rotulo: 'Sabonete em barra',
          nome: 'Toque de Algodão',
          medida: '80 g',
          preco: 28.00,
          ativos: 'Óleo de algodão e argila branca',
          texto: 'Um banho de suavidade profunda. O óleo de algodão é altamente hidratante; a argila branca limpa sem ressecar e deixa o toque uniforme. Juntos, formam o par mais delicado da casa: limpa e protege sem tirar a maciez.',
        },
        {
          id: 'pureza-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Nuvem de Areia',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de amêndoas e flores de camomila',
          texto: 'O óleo de amêndoas cria uma película protetora sobre a pele, ajuda a manter a hidratação e nutre com vitaminas A, B e E e ácidos graxos, deixando o corpo macio por mais tempo. As flores secas de camomila somam ao sal de epsom e ao bicarbonato no relaxamento do corpo.',
        },
        {
          id: 'pureza-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Orvalho da Alvorada',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de amêndoas e extrato de leite de cabra',
          texto: 'O extrato de amêndoas e o leite de cabra formam uma sinergia de nutrição e aconchego. O primeiro mantém a pele nutrida e macia; o segundo acalma, hidrata e deixa o toque uniforme. Um toque aveludado que devolve leveza ao corpo.',
        },
      ],
    },

    /* ====================================================================== */
    {
      slug: 'sol-do-cerrado',
      nome: 'Ritual Sol do Cerrado',
      nomeCurto: 'Sol do Cerrado',
      subtitulo: 'Ritual da Força',
      essencias: 'Copaíba e Capim-Limão',
      cor: '#C08B45',
      foto: 'assets/img/ritual-sol-do-cerrado.jpg',

      chamada: 'Barbatimão, copaíba e argila vermelha. O ritual mais potente do Cerrado, para quem busca o banho mais intenso da casa.',

      historia: 'O barbatimão é chamado de "árvore que fecha feridas" há gerações. A copaíba, de bálsamo do mato. O Ritual Sol do Cerrado reúne os dois com o capim-limão e a argila vermelha na fórmula mais potente da casa: um banho de força e caráter, que limpa em profundidade e deixa o corpo firme ao toque.',

      paraQuem: 'Peles que pedem limpeza profunda e um toque firme e revigorado.',

      promessaKit: 'O ritual completo é o mais intenso da casa: limpa a fundo, tonifica e deixa o toque firme, sem abrir mão do frescor.',

      ativos: ['Extrato de barbatimão', 'Argila vermelha', 'Óleo de copaíba', 'Sementes de erva-doce', 'Capim-limão'],

      produtos: [
        {
          id: 'sol-sabonete',
          tipo: 'sabonete',
          rotulo: 'Sabonete em barra',
          nome: 'Frescor do Amanhecer',
          medida: '80 g',
          preco: 28.00,
          ativos: 'Extrato de barbatimão e argila vermelha',
          texto: 'Um banho de força e caráter. O extrato de barbatimão é adstringente; a argila vermelha limpa a fundo e deixa o toque firme. Limpa e purifica profundamente sem ressecar, deixando a pele macia, firme e com o vigor natural que ela merece.',
        },
        {
          id: 'sol-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Pôr do Sol',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de copaíba e sementes de erva-doce',
          texto: 'Um bálsamo do bioma. O óleo de copaíba é rico em ativos naturais e tem um toque suave, que devolve energia e brilho mesmo às peles mais delicadas. As sementes de erva-doce, infundidas na água quente, oferecem benefícios calmantes.',
        },
        {
          id: 'sol-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Gotas de Ouro',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de barbatimão',
          texto: 'Um dos mais potentes tesouros do nosso bioma. Em formulação em gel, o extrato de barbatimão tem sua ação adstringente ainda mais evidente: limpa a fundo, deixa a pele com o toque firme e entrega um frescor revigorante que desperta os sentidos.',
        },
      ],
    },
  ],

  /* --- Produto avulso especial ------------------------------------------ */
  trio: {
    id: 'trio-sabonetes',
    slug: 'trio-de-sabonetes',
    nome: 'Trio de Sabonetes',
    subtitulo: 'Um de cada ritual',
    preco: 84.00,
    medida: '3 × 80 g',
    foto: 'assets/img/ritual-despertar-da-terra.jpg',
    texto: 'Os três sabonetes da casa, um de cada ritual: Brisa Rosada, Toque de Algodão e Frescor do Amanhecer. A forma mais direta de conhecer as três essências da Cerrô e descobrir qual delas é a sua.',
    itens: ['Brisa Rosada, com romã, pitanga e hibisco', 'Toque de Algodão, com baunilha e sândalo', 'Frescor do Amanhecer, com copaíba e capim-limão'],
  },

  /* --- Edição de presente -------------------------------------------------
     Esta linha fica FORA da trinca, e isso é proposital. O site inteiro se
     apoia em "são três": três rituais, três peças cada, três forças. O
     Florescer Eterno tem quatro peças, não tem sais de banho, e é vendido
     como presente. Tratá-lo como um quarto ritual quebraria a conta que a
     apresentação faz do começo ao fim.

     Sobre os textos: o material de formulação que veio do cliente trazia
     promessas de tratamento (neutralizar manchas, aliviar coceiras,
     estimular colágeno, fechar poros). Cosmético no Brasil pode limpar,
     perfumar, proteger e manter em bom estado; tratar é medicamento. Os
     textos abaixo mantêm o benefício sensorial, que é o que vende, sem a
     promessa que não pode ser feita.

     PREÇOS: ainda não definidos pelo cliente. Enquanto forem null, o site
     mostra "consultar" e manda para o WhatsApp em vez do carrinho. Preencha
     os cinco números e a linha passa a vender sozinha. Lembre de preencher
     também em api/catalogo.php, que é quem cobra de verdade.
     ---------------------------------------------------------------------- */
  presente: {
    slug: 'florescer-eterno',
    nome: 'Ritual Florescer Eterno',
    nomeCurto: 'Florescer Eterno',
    subtitulo: 'Edição de presente',
    essencias: 'Rosas Brancas, Chá Branco e Lichia',
    cor: '#C58A72',
    foto: 'assets/img/florescer-coracao.jpg',

    chamada: 'Quatro peças que chegam prontas para entregar. A única linha da casa que não segue a trinca, porque presente não se divide em três.',

    historia: 'Nem todo banho é rotina. Alguns são data marcada. O Florescer Eterno nasceu para esses: rosas brancas, chá branco e lichia numa mesma alquimia, em quatro peças pensadas para serem dadas de presente. É a linha em que a Cerrô se permite o gesto, não só o cuidado.',

    paraQuem: 'Quem vai presentear e quer entregar algo que já chega pronto, sem precisar montar nada.',

    precoKit: 220.00,        // informado pelo cliente
    medida: '4 peças',

    /* Link de pagamento do Mercado Pago, criado no painel do cliente.
     *
     * Serve como atalho enquanto a integração completa não está no ar: a
     * cliente paga na hora, sem conversa. Só é honesto porque o valor bate
     * com o que o site cobraria: R$ 220 de produto e frete grátis, porque
     * o kit passa do limite de R$ 200.
     *
     * ATENÇÃO ao mexer no preço do kit ou no limite do frete grátis: se os
     * dois deixarem de bater, o link passa a cobrar valor diferente do que
     * a cliente viu na sacola. Gere um link novo no painel e troque aqui.
     *
     * O que o link NÃO faz: não coleta endereço, não registra atendente e
     * não aceita cupom. Por isso ele é botão secundário, nunca o principal.
     */
    linkPagamento: 'https://mpago.la/2AYxByk',

    produtos: [
      {
        id: 'florescer-coracao',
        tipo: 'sabonete',
        rotulo: 'Sabonete em barra',
        nome: 'Coração Entrelaçado',
        medida: '120 g',
        preco: 45.00,         // PREENCHER
        foto: 'assets/img/florescer-coracao.jpg',
        ativos: 'Extrato de rosas brancas',
        texto: 'A maior barra da casa, 120 g, feita para durar o banho inteiro na mão. O extrato de rosas brancas limpa sem repuxar e deixa aquele toque macio que fica depois de enxaguar. O relevo quadriculado não é só enfeite: ele segura a espuma e dá pegada na barra molhada.',
      },
      {
        id: 'florescer-mil-flores',
        tipo: 'sabonete',
        rotulo: 'Sabonete em barra',
        nome: 'Mil Flores',
        medida: '80 g',
        preco: 35.00,         // PREENCHER
        foto: 'assets/img/florescer-mil-flores.jpg',
        ativos: 'Extrato de aveia',
        texto: 'A aveia é o ingrediente mais antigo que existe para banho de pele sensível, e continua sendo o melhor. Numa barra de 80 g com três flores em relevo, ela deixa a pele com um toque aveludado que já se sente antes de sair do chuveiro.',
      },
      {
        id: 'florescer-esfoliante',
        tipo: 'esfoliante',
        rotulo: 'Esfoliante corporal',
        nome: 'Cristais Mágicos',
        medida: '200 g',
        preco: 80.00,         // PREENCHER
        foto: 'assets/img/florescer-esfoliante.jpg',
        ativos: 'Óleo de amêndoas e cristais de quartzo',
        texto: 'Cristais de quartzo moído fazem a esfoliação, removendo as células mortas da superfície. O óleo de amêndoas entra junto para a pele não sair ressecada, que é o que costuma acontecer com esfoliante. Sai a aspereza e fica o brilho.',
      },
      {
        id: 'florescer-geleia',
        tipo: 'geleia',
        rotulo: 'Geleia de banho',
        nome: 'Chuva de Brilho',
        medida: '200 ml',
        preco: 80.00,         // PREENCHER
        foto: 'assets/img/florescer-geleia.jpg',
        ativos: 'Extrato de aveia e pó de pérola',
        texto: 'O pó de pérola faz o que o nome promete: deixa um brilho fino na pele, do tipo que só aparece quando a luz bate de lado. A aveia entra para o banho não ressecar. É a peça que fecha o ritual e a que mais dura.',
      },
    ],
  },
};
