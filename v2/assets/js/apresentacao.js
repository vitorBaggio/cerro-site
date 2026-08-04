/* ==========================================================================
   Cerrô v2 · Peças da apresentação
   Os painéis de escolha e o fio de progresso do topo.
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const dinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ======================================================================
     Painéis de escolha
     Mesmos dados do catálogo da versão 1: preço e nome saem de um lugar só.
     ====================================================================== */

  function montarEscolha() {
    const alvo = $('[data-cerro="escolha"]');
    if (!alvo || !window.CERRO_CATALOGO) return;

    const CAT = window.CERRO_CATALOGO;

    alvo.innerHTML = CAT.rituais.map((rit) => `
      <a class="escolha__painel" href="ritual-${rit.slug}.html" data-ritual="${rit.slug}">
        <div class="escolha__figura">
          <img src="${rit.foto}" loading="lazy"
               alt="Ritual ${esc(rit.nomeCurto)}: sabonete, sais e geleia de banho">
        </div>
        <div class="escolha__corpo">
          <h3 class="escolha__nome">${esc(rit.nomeCurto)}</h3>
          <p class="escolha__sub">${esc(rit.subtitulo)}</p>
          <p class="escolha__essencias">${esc(rit.essencias)}</p>
          <p class="escolha__preco">Ritual completo ${dinheiro(CAT.precos.kit)}</p>
        </div>
      </a>
    `).join('');
  }

  /* ======================================================================
     Fio de progresso
     Mostra onde a pessoa está na história. Numa página de rolagem longa
     como esta, sem ele fica difícil saber se falta muito.
     ====================================================================== */

  function montarProgresso() {
    const fio = $('[data-cerro="progresso"]');
    if (!fio) return;

    function atualizar() {
      const percurso = document.documentElement.scrollHeight - window.innerHeight;
      const p = percurso > 0 ? window.scrollY / percurso : 0;
      fio.style.width = (Math.min(1, Math.max(0, p)) * 100).toFixed(2) + '%';
    }

    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  function iniciar() {
    montarEscolha();
    montarProgresso();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
