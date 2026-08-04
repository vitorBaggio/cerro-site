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
          texto: 'Um banho de luminosidade e suavidade. Combinando o poder antioxidante das frutas vermelhas, a regeneração celular do extrato de rosas e o toque detox da argila rosa, este sabonete limpa e nutre sem ressecar, e ainda estimula a circulação sanguínea. A pele fica macia, firme e com o brilho natural que ela merece.',
        },
        {
          id: 'despertar-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Pétalas do Deserto',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de rosa mosqueta e flores de hibisco',
          texto: 'Um dos mais poderosos regeneradores naturais para a pele. O óleo de rosa mosqueta é rico em ácidos graxos essenciais e vitaminas: atua profundamente na hidratação, suaviza manchas e cicatrizes e devolve elasticidade e viço ao corpo. As flores de hibisco, infundidas na água quente, entregam uma esfoliação delicada.',
        },
        {
          id: 'despertar-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Néctar Suave',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de hibisco',
          texto: 'Chamado de "botox vegetal", o extrato de hibisco é altamente tonificante, antioxidante e purificante. Melhora a elasticidade, controla a oleosidade, auxilia na uniformização do tom da pele e entrega um frescor revigorante que desperta os sentidos.',
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

      historia: 'Antes do sol subir, o Cerrado é branco. Uma neblina baixa cobre o campo e tudo fica em suspensão. O Ritual Pureza Nativa foi construído sobre essa hora: baunilha e sândalo em camadas profundas, óleo de algodão, argila branca e leite de cabra. É restauração para peles secas, que precisam de hidratação intensa e de uma renovação que não machuque.',

      paraQuem: 'Peles secas e sensíveis, que requerem cuidado extra e hidratação intensa.',

      promessaKit: 'O ritual completo promove a renovação celular de forma suave, combatendo o envelhecimento e as manchas. A pele fica macia por mais tempo e é acalmada.',

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
          texto: 'Um banho de suavidade e restauração profunda. O óleo de algodão é antioxidante e altamente hidratante; a argila branca é renovadora celular, não resseca e uniformiza o tom da pele, com clareamento leve de manchas. Juntos, formam um par notável contra o envelhecimento: limpa e protege sem ressecar.',
        },
        {
          id: 'pureza-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Nuvem de Areia',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de amêndoas e flores de camomila',
          texto: 'O óleo de amêndoas cria uma película protetora sobre a pele, evita a perda de hidratação e nutre com vitaminas A, B e E e ácidos graxos, ajudando a prevenir estrias e ressecamento. As flores secas de camomila somam ao sal de epsom e ao bicarbonato no relaxamento do corpo.',
        },
        {
          id: 'pureza-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Orvalho da Alvorada',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de amêndoas e extrato de leite de cabra',
          texto: 'O extrato de amêndoas e o leite de cabra formam uma sinergia máxima de nutrição e aconchego. O primeiro trabalha a elasticidade, evita ressecamentos e estimula a renovação da pele; o segundo acalma peles irritadas, hidrata e suaviza manchas. Um toque aveludado que devolve leveza ao corpo.',
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

      chamada: 'Barbatimão, copaíba e argila vermelha. O ritual mais potente do Cerrado, para quem busca regeneração de verdade.',

      historia: 'O barbatimão é chamado de "árvore que fecha feridas" há gerações. A copaíba, de bálsamo do mato. O Ritual Sol do Cerrado reúne os dois com o capim-limão e a argila vermelha na fórmula mais potente da casa: um banho de força e regeneração, que purifica em profundidade e devolve firmeza ao corpo.',

      paraQuem: 'Peles que pedem regeneração, purificação profunda e recuperação da firmeza.',

      promessaKit: 'O ritual completo foi elaborado para rejuvenescer a pele, tonificar e promover uma limpeza profunda, sem abrir mão do frescor.',

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
          texto: 'Um banho de força e regeneração intensa. O extrato de barbatimão é adstringente e purificante; a argila vermelha é estimulante e renovadora, favorecendo a firmeza da pele. Limpa e purifica profundamente sem ressecar, deixando a pele macia, firme e com o vigor natural que ela merece.',
        },
        {
          id: 'sol-sais',
          tipo: 'sais',
          rotulo: 'Sais de banho',
          nome: 'Pôr do Sol',
          medida: '200 g',
          preco: 45.00,
          ativos: 'Óleo de copaíba e sementes de erva-doce',
          texto: 'Um bálsamo do bioma. O óleo de copaíba é rico em ativos naturais que auxiliam na recuperação e no alívio de peles sensibilizadas, melhorando a resposta da pele e devolvendo energia e brilho. As sementes de erva-doce, infundidas na água quente, oferecem benefícios calmantes.',
        },
        {
          id: 'sol-geleia',
          tipo: 'geleia',
          rotulo: 'Geleia de banho',
          nome: 'Gotas de Ouro',
          medida: '350 ml',
          preco: 60.00,
          ativos: 'Extrato de barbatimão',
          texto: 'Um dos mais potentes tesouros do nosso bioma. Em formulação em gel, o extrato de barbatimão tem sua ação purificante ainda mais evidente: auxilia na regeneração e na defesa da pele, estimula a firmeza do tecido e entrega um frescor revigorante que desperta os sentidos.',
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
    foto: 'assets/img/trio-de-sabonetes.jpg',
    texto: 'Os três sabonetes da casa, um de cada ritual: Brisa Rosada, Toque de Algodão e Frescor do Amanhecer. A forma mais direta de conhecer as três essências da Cerrô e descobrir qual delas é a sua.',
    itens: ['Brisa Rosada, com romã, pitanga e hibisco', 'Toque de Algodão, com baunilha e sândalo', 'Frescor do Amanhecer, com copaíba e capim-limão'],
  },

  /* --- Linha em breve ---------------------------------------------------- */
  emBreve: {
    slug: 'florescer-eterno',
    nome: 'Ritual Florescer Eterno',
    subtitulo: 'A linha-presente',
    essencias: 'Rosas Brancas, Chá Branco e Lichia',
    texto: 'Quatro peças pensadas para datas que merecem ser lembradas. Um ritual de revitalização para peles maduras, com pó de pérola, cristais de quartzo e extrato de rosas brancas. Em breve.',
  },
};
