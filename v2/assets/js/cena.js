/* ==========================================================================
   Cerrô v2 · Motor de cena
   --------------------------------------------------------------------------
   A ideia toda do site: a rolagem não move a página, move o produto.

   Cada <section data-cena> é alta (300vh, por exemplo) e tem dentro um palco
   grudado na tela. Enquanto a seção passa, o palco fica parado e a gente
   calcula o quanto dela já passou, de 0 a 1. Esse número vira uma variável
   de CSS, e o CSS faz o resto: gira, separa, aproxima, revela.

   Por que assim, e não com animações de rolagem nativas: `animation-timeline`
   ainda não funciona no Safari, e uma boa parte das clientes usa iPhone.
   Uma conta por quadro em poucos elementos é barata e roda em todo lugar.
   ========================================================================== */

(function () {
  'use strict';

  const querParado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sem movimento: as cenas viram blocos normais, empilhados, com tudo já
     no lugar final. O conteúdo continua inteiro; só não se move. */
  if (querParado) {
    document.documentElement.classList.add('sem-cena');
    return;
  }

  const cenas = Array.from(document.querySelectorAll('[data-cena]'));
  if (!cenas.length) return;

  const limitar = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

  /** Progresso de uma etapa dentro do progresso geral.
   *  Com 3 etapas: a etapa 0 vai de 0 a 1 enquanto p vai de 0 a 0,33. */
  function etapa(p, indice, total) {
    return limitar(p * total - indice);
  }

  function medir() {
    const alturaTela = window.innerHeight;

    for (const cena of cenas) {
      const caixa = cena.getBoundingClientRect();
      const percurso = caixa.height - alturaTela;

      /* Fora de vista: não gasta cálculo, mas fixa o valor da borda para o
         elemento não "voltar no tempo" quando reaparecer. */
      if (caixa.bottom < 0) { cena.style.setProperty('--p', 1); continue; }
      if (caixa.top > alturaTela) { cena.style.setProperty('--p', 0); continue; }

      const p = percurso > 0 ? limitar(-caixa.top / percurso) : 0;
      cena.style.setProperty('--p', p.toFixed(4));

      const total = Number(cena.dataset.etapas || 0);
      for (let i = 0; i < total; i++) {
        cena.style.setProperty('--p' + (i + 1), etapa(p, i, total).toFixed(4));
      }

      /* Cenas que trocam de peça em faixas de progresso (o sabonete girando) */
      if (cena.dataset.faces) {
        const faces = Number(cena.dataset.faces);
        const atual = Math.min(faces - 1, Math.floor(p * faces));
        if (cena.dataset.faceAtual !== String(atual)) {
          cena.dataset.faceAtual = String(atual);
        }
      }
    }
  }

  /* Uma medição por quadro, no máximo. Ler getBoundingClientRect de poucas
     seções é barato; o que custa caro é fazer isso a cada evento de rolagem. */
  let agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; medir(); });
  }

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  window.addEventListener('orientationchange', agendar);

  /* Primeira medição depois das imagens, senão as alturas mudam embaixo */
  medir();
  window.addEventListener('load', medir);
  setTimeout(medir, 300);

  /* Expõe para teste */
  window.CerroCena = { medir };
})();
