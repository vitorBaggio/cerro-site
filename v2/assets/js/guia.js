/* ==========================================================================
   Cerrô · Encontre o seu ritual
   --------------------------------------------------------------------------
   Três perguntas que levam a uma recomendação.

   Por que isso existe: a dúvida real de quem chega no site não é "quero
   comprar?", é "qual dos três é o meu?". Cada ritual foi formulado para um
   tipo de pele diferente, e essa informação estava enterrada no texto de
   cada página. Aqui ela vira a primeira pergunta.

   O peso das respostas: pele e objetivo valem 2 pontos, aroma vale 1. Aroma
   é preferência; pele é necessidade, e necessidade decide.
   ========================================================================== */

(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const PERGUNTAS = [
    {
      titulo: 'Como está a sua pele ultimamente?',
      ajuda: 'Pense em como ela fica logo depois do banho.',
      peso: 2,
      opcoes: [
        { texto: 'Seca, repuxando',            detalhe: 'Pede hidratação intensa',        ritual: 'pureza-nativa' },
        { texto: 'Sensível, reage a tudo',     detalhe: 'Não tolera fórmula agressiva',   ritual: 'despertar-da-terra' },
        { texto: 'Com marcas, pedindo firmeza',detalhe: 'Precisa de renovação',           ritual: 'sol-do-cerrado' },
      ],
    },
    {
      titulo: 'O que você quer do seu banho?',
      ajuda: 'Só uma escolha, a que fala mais alto.',
      peso: 2,
      opcoes: [
        { texto: 'Acalmar e desacelerar',   detalhe: 'Terminar o dia em paz',        ritual: 'pureza-nativa' },
        { texto: 'Devolver viço e brilho',  detalhe: 'Pele luminosa outra vez',      ritual: 'despertar-da-terra' },
        { texto: 'Firmeza e limpeza a fundo', detalhe: 'Cuidado profundo',           ritual: 'sol-do-cerrado' },
      ],
    },
    {
      titulo: 'Qual aroma te puxa?',
      ajuda: 'Feche os olhos e escolha o primeiro.',
      peso: 1,
      opcoes: [
        { texto: 'Doce e amadeirado',   detalhe: 'Baunilha e sândalo',        ritual: 'pureza-nativa' },
        { texto: 'Frutal e floral',     detalhe: 'Romã, pitanga e hibisco',   ritual: 'despertar-da-terra' },
        { texto: 'Cítrico e resinoso',  detalhe: 'Copaíba e capim-limão',     ritual: 'sol-do-cerrado' },
      ],
    },
  ];

  /* Por que o resultado é aquele, escrito para soar como conselho e não como
     saída de algoritmo. */
  const JUSTIFICATIVA = {
    'pureza-nativa':      'É o mais silencioso da casa. Óleo de algodão, argila branca e leite de cabra devolvem a hidratação que a sua pele está pedindo, sem nenhuma aspereza.',
    'despertar-da-terra': 'Foi formulado justamente para peles que reagem a tudo. Hibisco, rosa mosqueta e argila rosa devolvem luminosidade fazendo limpeza profunda, sem agredir.',
    'sol-do-cerrado':     'É a fórmula mais potente da casa. Barbatimão, copaíba e argila vermelha limpam a fundo e deixam o toque firme, com o frescor do capim-limão.',
  };

  function montar() {
    const raiz = $('[data-cerro="guia"]');
    if (!raiz || !window.CERRO_CATALOGO) return;

    const CAT = window.CERRO_CATALOGO;
    const respostas = [];
    let etapa = 0;

    /* ---------------------------------------------------------------- */

    function pontuar() {
      const placar = {};
      CAT.rituais.forEach((r) => { placar[r.slug] = 0; });

      respostas.forEach((resposta, i) => {
        if (!resposta) return;
        placar[resposta.ritual] += PERGUNTAS[i].peso;
      });

      /* Empate é resolvido pela resposta da pele: necessidade antes de gosto. */
      const ordenado = Object.entries(placar).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return respostas[0] && respostas[0].ritual === a[0] ? -1 : 1;
      });

      return ordenado[0][0];
    }

    /* ---------------------------------------------------------------- */

    function pintarPergunta() {
      const p = PERGUNTAS[etapa];

      raiz.innerHTML = `
        <div class="guia__passo" data-etapa="${etapa}">
          <div class="guia__marcadores" role="presentation">
            ${PERGUNTAS.map((_, i) => `
              <span class="guia__marcador${i === etapa ? ' guia__marcador--atual' : ''}${i < etapa ? ' guia__marcador--feito' : ''}"></span>
            `).join('')}
          </div>

          <p class="guia__contagem">Pergunta ${etapa + 1} de ${PERGUNTAS.length}</p>
          <h3 class="guia__titulo">${esc(p.titulo)}</h3>
          <p class="guia__ajuda">${esc(p.ajuda)}</p>

          <div class="guia__opcoes">
            ${p.opcoes.map((o, i) => `
              <button type="button" class="guia__opcao" data-indice="${i}">
                <span class="guia__opcao-texto">${esc(o.texto)}</span>
                <span class="guia__opcao-detalhe">${esc(o.detalhe)}</span>
              </button>
            `).join('')}
          </div>

          ${etapa > 0 ? '<button type="button" class="guia__voltar">← Voltar</button>' : ''}
        </div>`;

      $$('.guia__opcao', raiz).forEach((botao) => {
        botao.addEventListener('click', () => {
          respostas[etapa] = PERGUNTAS[etapa].opcoes[Number(botao.dataset.indice)];
          etapa += 1;
          if (etapa < PERGUNTAS.length) pintarPergunta();
          else pintarResultado();
        });
      });

      const voltar = $('.guia__voltar', raiz);
      if (voltar) voltar.addEventListener('click', () => { etapa -= 1; pintarPergunta(); });
    }

    /* ---------------------------------------------------------------- */

    function pintarResultado() {
      const slug = pontuar();
      const rit = CAT.rituais.find((r) => r.slug === slug);
      if (!rit) return pintarPergunta();

      const preco = CAT.precos.kit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      raiz.innerHTML = `
        <div class="guia__resultado" data-ritual="${rit.slug}">
          <p class="guia__contagem">O seu ritual</p>

          <div class="guia__resultado-grade">
            <div class="guia__resultado-figura">
              <img src="${rit.foto}" alt="Ritual ${esc(rit.nomeCurto)}" loading="lazy">
            </div>

            <div>
              <h3 class="guia__resultado-nome">${esc(rit.nomeCurto)}</h3>
              <p class="guia__resultado-sub">${esc(rit.subtitulo)}</p>
              <p class="guia__resultado-essencias">${esc(rit.essencias)}</p>
              <p class="guia__resultado-texto">${esc(JUSTIFICATIVA[rit.slug] || rit.chamada)}</p>

              <div class="guia__resultado-acoes">
                <a class="btn" href="ritual-${rit.slug}.html">Conhecer o ritual · ${preco}</a>
                <button type="button" class="guia__refazer">Refazer</button>
              </div>
            </div>
          </div>

          <p class="guia__ressalva">
            Na dúvida entre dois, o <a href="trio-de-sabonetes.html">Trio de Sabonetes</a>
            deixa você experimentar as três essências antes de decidir.
          </p>
        </div>`;

      $('.guia__refazer', raiz).addEventListener('click', () => {
        respostas.length = 0;
        etapa = 0;
        pintarPergunta();
      });
    }

    pintarPergunta();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
