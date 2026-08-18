/* ==========================================================================
   Cerrô · Motor da loja
   Cabeçalho, rodapé, sacola, seletor de compra e finalização de pedido.
   ========================================================================== */

(function () {
  'use strict';

  const CFG = window.CERRO_CONFIG;
  const CAT = window.CERRO_CATALOGO;
  const CHAVE_SACOLA = 'cerro:sacola';

  /* ======================================================================
     Utilidades
     ====================================================================== */

  const dinheiro = (v) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Caminho relativo: o site funciona tanto na raiz quanto em subpasta. */
  const raiz = () => '';

  /**
   * Enquadramento de cada produto dentro da foto do ritual.
   * As três fotos têm a mesma composição: pote à esquerda (geleia),
   * sabonete ao centro, pote à direita (sais). Ampliando a mesma imagem e
   * deslocando o enquadramento, cada produto ganha seu próprio close.
   */
  const ENQUADRAMENTO = {
    geleia:   '0% 40%',
    sabonete: '50% 74%',
    sais:     '100% 34%',
  };

  /* ======================================================================
     Sacola (carrinho), persistida no navegador
     ====================================================================== */

  const Sacola = {
    ler() {
      try {
        const bruto = localStorage.getItem(CHAVE_SACOLA);
        const itens = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(itens) ? itens : [];
      } catch (e) {
        return [];
      }
    },

    gravar(itens) {
      try {
        localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
      } catch (e) {
        /* modo privado do navegador pode bloquear; segue sem persistir */
      }
      document.dispatchEvent(new CustomEvent('sacola:mudou', { detail: itens }));
    },

    adicionar(item) {
      const itens = Sacola.ler();
      const existente = itens.find((i) => i.id === item.id);
      if (existente) {
        existente.qtd += item.qtd;
      } else {
        itens.push(Object.assign({}, item));
      }
      Sacola.gravar(itens);
    },

    definirQtd(id, qtd) {
      let itens = Sacola.ler();
      if (qtd <= 0) {
        itens = itens.filter((i) => i.id !== id);
      } else {
        const item = itens.find((i) => i.id === id);
        if (item) item.qtd = qtd;
      }
      Sacola.gravar(itens);
    },

    remover(id) {
      Sacola.gravar(Sacola.ler().filter((i) => i.id !== id));
    },

    limpar() {
      Sacola.gravar([]);
    },

    contagem() {
      return Sacola.ler().reduce((n, i) => n + i.qtd, 0);
    },

    subtotal() {
      return Sacola.ler().reduce((n, i) => n + i.preco * i.qtd, 0);
    },

    frete() {
      const sub = Sacola.subtotal();
      if (sub === 0) return 0;
      const limite = CFG.frete.freteGratisAcimaDe;
      if (limite !== null && sub >= limite) return 0;

      /* Cotou pelo CEP? usa o escolhido. Senão, o valor fixo, que é o que a
         loja cobrava antes de existir cotação e continua valendo para quem
         fechar sem informar o CEP. */
      const c = Frete.escolhido();
      return c ? c.preco : CFG.frete.valorPadrao;
    },

    total() {
      return Math.max(0, Sacola.subtotal() - Sacola.desconto()) + Sacola.frete();
    },

    /* Desconto do cupom guardado. Este número é só para a tela: quem abate
       de verdade é o servidor, em api/criar-preferencia.php. Aqui é para a
       cliente ver o efeito antes de decidir. */
    desconto() {
      const c = Cupom.atual();
      if (!c) return 0;
      const sub = Sacola.subtotal();
      if (sub < (c.minimo || 0)) return 0;
      const bruto = c.tipo === 'percentual' ? sub * (c.valor / 100) : c.valor;
      return Math.min(bruto, sub);
    },
  };

  /* ======================================================================
     Cupom e atendente

     Os dois vivem no navegador só para a tela mostrar o efeito. O que vale
     é sempre o servidor: ele revalida o cupom e regrava o código da
     atendente no pedido. Confiar no navegador aqui seria o mesmo buraco do
     preço, com outro nome.
     ====================================================================== */

  const CHAVE_CUPOM = 'cerro_cupom';
  const CHAVE_ATENDENTE = 'cerro_atendente';

  const Cupom = {
    atual() {
      let cod;
      try { cod = localStorage.getItem(CHAVE_CUPOM); } catch (e) { return null; }
      if (!cod) return null;
      return (CFG.cupons || []).find((c) => c.codigo === cod) || null;
    },
    aplicar(codigo) {
      const achado = (CFG.cupons || []).find(
        (c) => c.codigo.toLowerCase() === String(codigo).trim().toLowerCase());
      if (!achado) return false;
      try { localStorage.setItem(CHAVE_CUPOM, achado.codigo); } catch (e) {}
      return true;
    },
    limpar() { try { localStorage.removeItem(CHAVE_CUPOM); } catch (e) {} },
  };

  const Atendente = {
    /* Guarda com data de validade. Sem isso, uma cliente que entrou uma vez
       pelo link da Ana ficaria dela para sempre. */
    gravar(codigo) {
      const dias = (CFG.atendentes && CFG.atendentes.memoriaEmDias) || 60;
      const ate = Date.now() + dias * 86400000;
      try { localStorage.setItem(CHAVE_ATENDENTE, JSON.stringify({ codigo, ate })); } catch (e) {}
    },
    atual() {
      try {
        const bruto = localStorage.getItem(CHAVE_ATENDENTE);
        if (!bruto) return '';
        const d = JSON.parse(bruto);
        if (!d || !d.codigo || Date.now() > d.ate) { localStorage.removeItem(CHAVE_ATENDENTE); return ''; }
        const lista = (CFG.atendentes && CFG.atendentes.lista) || [];
        return lista.some((a) => a.codigo === d.codigo) ? d.codigo : '';
      } catch (e) { return ''; }
    },
    nomeDe(codigo) {
      const lista = (CFG.atendentes && CFG.atendentes.lista) || [];
      const a = lista.find((x) => x.codigo === codigo);
      return a ? a.nome : '';
    },
  };

  /* Chegou por link de atendente? Grava e some com o parâmetro da barra de
     endereço, para a cliente não compartilhar o link de indicação sem saber. */
  (function capturarLinkDeAtendente() {
    const v = new URLSearchParams(location.search).get('v');
    if (!v) return;
    const lista = (CFG.atendentes && CFG.atendentes.lista) || [];
    if (!lista.some((a) => a.codigo === v)) return;
    Atendente.gravar(v);
    const limpa = new URL(location.href);
    limpa.searchParams.delete('v');
    history.replaceState(null, '', limpa.toString());
  })();

  /* ======================================================================
     Frete

     O navegador guarda o PROTOCOLO da cotação e qual serviço a cliente
     escolheu, nunca o valor cobrado. Na hora de fechar manda os dois, e o
     servidor lê a cotação que ele mesmo guardou. Se o valor viajasse por
     aqui, bastaria editar para pagar um centavo de frete.

     O preço fica guardado só para desenhar a tela.
     ====================================================================== */

  const CHAVE_FRETE = 'cerro_frete';

  const Frete = {
    ler() {
      try { return JSON.parse(sessionStorage.getItem(CHAVE_FRETE) || 'null'); }
      catch (e) { return null; }
    },
    gravar(d) {
      try { sessionStorage.setItem(CHAVE_FRETE, JSON.stringify(d)); } catch (e) {}
    },
    limpar() { try { sessionStorage.removeItem(CHAVE_FRETE); } catch (e) {} },

    escolhido() {
      const d = Frete.ler();
      if (!d || !d.servico) return null;
      return (d.opcoes || []).find((o) => o.servico === d.servico) || null;
    },

    async cotar(cep) {
      const itens = Sacola.ler().map((i) => ({ id: i.id, qtd: i.qtd }));
      const resp = await fetch('api/frete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, itens }),
      });
      const d = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(d.erro || 'Não consegui cotar o frete.');

      /* Já escolhe a mais barata: é o que a maioria quer, e quem prefere
         rapidez troca em um clique. */
      const maisBarata = d.opcoes.slice().sort((a, b) => a.preco - b.preco)[0];
      Frete.gravar({ cep, protocolo: d.protocolo, opcoes: d.opcoes, servico: maisBarata.servico, origem: d.origem });
      return d;
    },
  };

  /* ======================================================================
     Endereço de entrega

     Fica no navegador da cliente e só viaja no fechamento. Guardar aqui
     poupa ela de redigitar se sair e voltar, e não cria base de dados
     nenhuma do nosso lado: LGPD é mais fácil quando o dado não existe.
     ====================================================================== */

  const CHAVE_ENTREGA = 'cerro_entrega';

  const Entrega = {
    ler() {
      try { return JSON.parse(localStorage.getItem(CHAVE_ENTREGA) || '{}') || {}; }
      catch (e) { return {}; }
    },
    gravar(d) {
      try { localStorage.setItem(CHAVE_ENTREGA, JSON.stringify(d)); } catch (e) {}
    },
    /** Devolve o primeiro campo obrigatório que está vazio, ou null. */
    faltando() {
      const d = Entrega.ler();
      const obrigatorios = [
        ['nome', 'seu nome completo'],
        ['rua', 'a rua'],
        ['numero', 'o número'],
        ['bairro', 'o bairro'],
        ['whatsapp', 'seu WhatsApp'],
      ];
      for (const [campo, rotulo] of obrigatorios) {
        if (!String(d[campo] || '').trim()) return rotulo;
      }
      if (String(d.whatsapp).replace(/\D/g, '').length < 10) return 'um WhatsApp com DDD';
      return null;
    },
  };

  window.CerroCupom = Cupom;
  window.CerroAtendente = Atendente;
  window.CerroFrete = Frete;
  window.CerroEntrega = Entrega;

  window.CerroSacola = Sacola;
  window.CerroDinheiro = dinheiro;

  /* ======================================================================
     Aviso flutuante
     ====================================================================== */

  let timerAviso;
  function avisar(texto) {
    let el = $('.aviso-flutuante');
    if (!el) {
      el = document.createElement('div');
      el.className = 'aviso-flutuante';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = texto;
    requestAnimationFrame(() => el.classList.add('visivel'));
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => el.classList.remove('visivel'), 3200);
  }
  window.CerroAvisar = avisar;

  /* ======================================================================
     Cabeçalho
     ====================================================================== */

  const ICONE_SACOLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>';
  const ICONE_CONTA  = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';
  const ICONE_MENU   = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  function montarCabecalho() {
    const alvo = $('[data-cerro="topo"]');
    if (!alvo) return;

    const atual = document.body.dataset.pagina || '';
    const r = raiz();

    const links = [
      { href: r + 'index.html',                    id: 'home',   texto: 'Início' },
      { href: r + 'index.html#rituais',            id: 'rituais',texto: 'Os Rituais' },
      { href: r + 'trio-de-sabonetes.html',        id: 'trio',   texto: 'Trio de Sabonetes' },
      { href: r + 'sobre.html',                    id: 'sobre',  texto: 'A Cerrô' },
      { href: r + 'contato.html',                  id: 'contato',texto: 'Contato' },
    ];

    alvo.className = 'topo';
    alvo.innerHTML = `
      <div class="container topo__barra">
        <a class="marca" href="${r}index.html" aria-label="Cerrô, início">
          <span class="marca__nome">CERRÔ</span>
          <span class="marca__assinatura">Banho do Cerrado</span>
        </a>

        <nav aria-label="Principal">
          <ul class="menu" id="menu-principal">
            ${links.map((l) => `
              <li><a href="${l.href}"${l.id === atual ? ' aria-current="page"' : ''}>${l.texto}</a></li>
            `).join('')}
          </ul>
        </nav>

        <div class="topo__acoes">
          <a class="icone-btn" href="${r}conta.html" aria-label="Minha conta">
            ${ICONE_CONTA}<span class="rotulo-acao" data-cerro="rotulo-conta">Entrar</span>
          </a>
          <a class="icone-btn" href="${r}carrinho.html" aria-label="Sacola de compras">
            ${ICONE_SACOLA}
            <span class="contador" data-cerro="contador" hidden>0</span>
          </a>
          <button class="icone-btn menu-toggle" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menu">
            ${ICONE_MENU}
          </button>
        </div>
      </div>`;

    /* Menu mobile */
    const menu = $('#menu-principal', alvo);
    const botao = $('.menu-toggle', alvo);
    const aplicarLargura = () => {
      if (window.innerWidth <= 900) {
        menu.hidden = botao.getAttribute('aria-expanded') !== 'true';
      } else {
        menu.hidden = false;
      }
    };
    botao.addEventListener('click', () => {
      const aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      aplicarLargura();
    });
    window.addEventListener('resize', aplicarLargura);
    aplicarLargura();
  }

  /* ======================================================================
     Rodapé
     ====================================================================== */

  function montarRodape() {
    const alvo = $('[data-cerro="rodape"]');
    if (!alvo) return;

    const r = raiz();
    const L = CFG.loja;
    const ano = new Date().getFullYear();

    alvo.className = 'rodape';
    alvo.innerHTML = `
      <div class="container">
        <div class="rodape__grade">
          <div>
            <span class="marca__nome">CERRÔ</span>
            <p style="margin-top:1rem;max-width:34ch">${esc(L.slogan)}</p>
          </div>

          <div>
            <h3 class="rodape__titulo">Os Rituais</h3>
            <ul>
              ${CAT.rituais.map((rit) => `
                <li><a href="${r}ritual-${rit.slug}.html">${esc(rit.nomeCurto)}</a></li>
              `).join('')}
              <li><a href="${r}trio-de-sabonetes.html">Trio de Sabonetes</a></li>
            </ul>
          </div>

          <div>
            <h3 class="rodape__titulo">A Casa</h3>
            <ul>
              <li><a href="${r}sobre.html">Nossa história</a></li>
              <li><a href="${r}contato.html">Contato</a></li>
              <li><a href="${r}conta.html">Minha conta</a></li>
              <li><a href="${r}politicas.html#entrega">Entrega e prazos</a></li>
              <li><a href="${r}politicas.html#trocas">Trocas e devoluções</a></li>
              <li><a href="${r}politicas.html#privacidade">Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h3 class="rodape__titulo">Fale com a gente</h3>
            <ul>
              <li><a href="https://wa.me/${esc(L.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="mailto:${esc(L.email)}">${esc(L.email)}</a></li>
              <li><a href="https://instagram.com/${esc(L.instagram)}" target="_blank" rel="noopener">@${esc(L.instagram)}</a></li>
            </ul>
          </div>
        </div>

        <div class="rodape__base">
          <span>© ${ano} ${esc(L.nome)} · ${esc(L.assinatura)}. Feito à mão no Cerrado.</span>
          <span>${esc(L.razaoSocial)} · CNPJ ${esc(L.cnpj)}</span>
        </div>
      </div>`;
  }

  /* ======================================================================
     Contador da sacola no cabeçalho
     ====================================================================== */

  function atualizarContador() {
    const el = $('[data-cerro="contador"]');
    if (!el) return;
    const n = Sacola.contagem();
    el.textContent = n;
    el.hidden = n === 0;
  }

  /* ======================================================================
     Cards de ritual (home)
     ====================================================================== */

  function montarGradeRituais() {
    const alvo = $('[data-cerro="grade-rituais"]');
    if (!alvo) return;

    /* Só os três rituais à venda. O Florescer Eterno tem faixa própria. */
    alvo.className = 'grade-rituais aparece aparece--fila';
    alvo.innerHTML = CAT.rituais.map((rit) => `
      <article class="cartao-ritual" data-ritual="${rit.slug}">
        <a href="ritual-${rit.slug}.html" class="cartao-ritual__figura">
          <img src="${rit.foto}" width="820" height="820" loading="lazy"
               alt="Ritual ${esc(rit.nomeCurto)}: sabonete, sais e geleia de banho"
               onerror="this.outerHTML='&lt;div class=&quot;sem-foto&quot; data-ritual=&quot;${rit.slug}&quot;&gt;Foto do ${esc(rit.nomeCurto)}&lt;/div&gt;'">
        </a>
        <div class="cartao-ritual__corpo">
          <h3><a href="ritual-${rit.slug}.html">${esc(rit.nomeCurto)}</a></h3>
          <p class="cartao-ritual__sub">${esc(rit.subtitulo)}</p>
          <p class="cartao-ritual__essencias">${esc(rit.essencias)}</p>
          <p class="cartao-ritual__desc">${esc(rit.chamada)}</p>
          <div class="cartao-ritual__rodape">
            <span class="cartao-ritual__preco">Kit ${dinheiro(CAT.precos.kit)}</span>
            <span class="link-sublinhado">Ver ritual</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* ======================================================================
     Edição de presente

     Antes isto era uma faixa discreta de "em breve" dentro da seção dos
     rituais. Virou seção própria, acima deles, e a faixa saiu junto: manter
     as duas era anunciar a mesma linha duas vezes na mesma rolagem.
     ====================================================================== */

  function montarPresente() {
    const alvo = $('[data-cerro="presente"]');
    if (!alvo) return;

    const p = CAT.presente;
    const temPreco = p.precoKit !== null && p.precoKit !== undefined;

    /* Enquanto o preço não existe, o botão conversa em vez de vender. Melhor
       do que mostrar "R$ 0,00" ou esconder a linha inteira até o cliente
       decidir quanto vai cobrar. */
    const acao = temPreco
      ? `<a class="btn" href="ritual-florescer-eterno.html">Ver o ritual · ${dinheiro(p.precoKit)}</a>`
      : `<a class="btn" href="ritual-florescer-eterno.html">Conhecer o ritual</a>`;

    /* As quatro peças, recortadas do fundo, subindo uma por vez.

       Duas tentativas antes desta falharam pelo mesmo motivo, e vale ficar
       registrado: as fotos vinham com fundo quase preto e a seção também
       era escura, contraste medido de 1,24 entre os dois. Primeiro tentei
       mosaico de quatro fotos, depois uma imagem única montada por código.
       Nos dois casos o retângulo escuro aparecia e a peça sumia dentro dele.

       O que resolve não é ajustar o contraste, é tirar o fundo. Com PNG
       transparente não existe retângulo para brigar com a seção, e aí o
       ato pode ser claro. Cada peça entra na sua etapa, com o nome e a
       fala embaixo, na mesma gramática do Ato 4. */
    alvo.className = 'presente__pecas';
    alvo.innerHTML = p.produtos.map((it, i) => `
      <article class="peca" style="--etapa: var(--p${i + 1})">
        <div class="peca__figura">
          <img src="${esc(it.foto.replace('.jpg', '-recorte.png'))}" loading="lazy"
               alt="${esc(it.nome)}, ${esc(it.rotulo.toLowerCase())} do Ritual Florescer Eterno">
        </div>
        <h3 class="peca__nome">${esc(it.nome)}</h3>
        <p class="peca__meta">${esc(it.rotulo)} · ${esc(it.medida)}</p>
        <p class="peca__fala">${esc(it.ativos)}</p>
      </article>`).join('');

    const base = $('[data-cerro="presente-acao"]');
    if (base) {
      base.innerHTML = `
        <p class="presente__chamada">${esc(p.chamada)}</p>
        <div class="presente__acao">${acao}</div>`;
    }
  }

  /** As quatro peças em detalhe, na página do Florescer Eterno. */
  function montarPecasPresente() {
    const alvo = $('[data-cerro="pecas-presente"]');
    if (!alvo) return;

    const p = CAT.presente;
    alvo.className = 'pecas-presente aparece--fila';
    alvo.innerHTML = p.produtos.map((it) => `
      <article class="peca-detalhe">
        <div class="peca-detalhe__figura">
          <img width="820" height="820" src="${esc(it.foto)}" loading="lazy"
               alt="${esc(it.nome)}, ${esc(it.rotulo.toLowerCase())} do Ritual Florescer Eterno">
        </div>
        <div class="peca-detalhe__texto">
          <p class="etiqueta">${esc(it.rotulo)} · ${esc(it.medida)}</p>
          <h3>${esc(it.nome)}</h3>
          <p class="peca-detalhe__ativos">${esc(it.ativos)}</p>
          <p>${esc(it.texto)}</p>
        </div>
      </article>`).join('');
  }

  /** Bloco de compra do Florescer Eterno.
   *
   *  Enquanto os preços forem null, ele não tenta vender: mostra o que vai na
   *  caixa e manda conversar no WhatsApp. Publicar com "R$ 0,00" ou com um
   *  preço chutado é pior do que assumir que ainda não tem preço. */
  function montarCompraPresente() {
    const alvo = $('[data-cerro="compra-presente"]');
    if (!alvo) return;

    const p = CAT.presente;
    const temPreco = p.precoKit !== null && p.precoKit !== undefined;

    const lista = p.produtos.map((it) =>
      `<li>${esc(it.nome)}<span>${esc(it.rotulo)} · ${esc(it.medida)}</span></li>`).join('');

    if (temPreco) {
      alvo.className = 'caixa-compra aparece';
      alvo.innerHTML = `
        <p class="caixa-compra__rotulo">Ritual completo, 4 peças</p>
        <p class="caixa-compra__preco">${dinheiro(p.precoKit)}</p>
        <ul class="caixa-compra__lista">${lista}</ul>
        <button class="btn btn--largo" type="button" data-cerro="comprar-presente">Adicionar à sacola</button>`;

      /* O id tem que ser o mesmo de api/catalogo.php, senão o servidor
         recusa o pedido com "produto não encontrado" na hora de pagar. */
      alvo.addEventListener('click', (ev) => {
        if (!ev.target.closest('[data-cerro="comprar-presente"]')) return;
        Sacola.adicionar({
          id: p.slug + '-kit',
          nome: 'Ritual completo',
          ritual: p.nomeCurto,
          ritualSlug: p.slug,
          detalhe: 'Edição de presente, 4 peças',
          preco: p.precoKit,
          foto: p.foto,
          qtd: 1,
        });
        avisar('Ritual Florescer Eterno adicionado à sacola');
      });
      return;
    }

    const texto = encodeURIComponent(
      'Olá! Quero saber sobre o Ritual Florescer Eterno, a edição de presente.');
    alvo.className = 'caixa-compra aparece';
    alvo.innerHTML = `
      <p class="caixa-compra__rotulo">Ritual completo, 4 peças</p>
      <p class="caixa-compra__preco caixa-compra__preco--consulta">Sob consulta</p>
      <ul class="caixa-compra__lista">${lista}</ul>
      <a class="btn btn--largo" href="https://wa.me/${esc(CFG.loja.whatsapp)}?text=${texto}"
         target="_blank" rel="noopener">Falar no WhatsApp</a>
      <p class="caixa-compra__nota">Edição de presente feita sob encomenda.</p>`;
  }

  /* ======================================================================
     Trio de Sabonetes: a cliente escolhe os três

     Antes era um conjunto fechado, um de cada ritual. Agora ela monta: três
     iguais, dois e um, ou um de cada. Como os três custam R$ 28, qualquer
     combinação fecha em R$ 84 e o preço não muda com a escolha.

     O que vai para a sacola são TRÊS itens de sabonete, e não um item
     "trio". Assim o servidor cobra cada um pelo preço dele sem precisar de
     regra nova, e o pedido chega dizendo exatamente quais sabonetes
     embalar, que é o que a produção precisa ler.
     ====================================================================== */

  function montarTrio() {
    const alvo = $('[data-cerro="trio-escolha"]');
    if (!alvo) return;

    /* Os sabonetes da casa, um por ritual, tirados do próprio catálogo. */
    const sabonetes = CAT.rituais.map((r) => {
      const s = r.produtos.find((p) => p.tipo === 'sabonete');
      return { id: s.id, nome: s.nome, preco: s.preco, ritual: r.nomeCurto, essencias: r.essencias, cor: r.cor };
    });

    /* Começa com um de cada, que era o trio de antes. */
    let escolha = sabonetes.map((s) => s.id);
    let qtd = 1;

    function precoTotal() {
      return escolha.reduce((soma, id) => soma + sabonetes.find((s) => s.id === id).preco, 0) * qtd;
    }

    function pintar() {
      alvo.innerHTML = `
        <div class="trio-escolha">
          ${escolha.map((id, i) => {
            const s = sabonetes.find((x) => x.id === id);
            return `
            <label class="campo trio-escolha__campo" style="--cor:${esc(s.cor)}">
              <span class="campo__rotulo">Sabonete ${i + 1}</span>
              <select data-trio="${i}">
                ${sabonetes.map((o) => `
                  <option value="${esc(o.id)}"${o.id === id ? ' selected' : ''}>${esc(o.nome)}</option>`).join('')}
              </select>
              <span class="campo__ajuda">${esc(s.essencias)}</span>
            </label>`;
          }).join('')}
        </div>

        <div class="seletor" style="max-width:420px;margin-top:1.6rem">
          <div class="linha-quantidade">
            <div class="qtd">
              <button type="button" data-trio-passo="-1" aria-label="Diminuir quantidade">−</button>
              <span aria-live="polite">${qtd}</span>
              <button type="button" data-trio-passo="1" aria-label="Aumentar quantidade">+</button>
            </div>
            <div class="total-seletor">
              <small>Total</small>
              <span>${dinheiro(precoTotal())}</span>
            </div>
          </div>
          <button class="btn btn--largo" type="button" data-cerro="add-trio">Adicionar à sacola</button>
        </div>`;
    }

    /* Atualiza no lugar em vez de repintar.
     *
     * Repintar o bloco inteiro destrói o próprio <select> que a pessoa
     * acabou de usar: ele é recriado, o foco se perde e, em celular, o
     * teclado ou a roleta de opções fecha sozinha. Como o preço dos três
     * sabonetes é o mesmo, mudar a escolha nem altera o total: só a linha
     * de essências abaixo do campo precisa acompanhar. */
    alvo.addEventListener('change', (ev) => {
      const sel = ev.target.closest('[data-trio]');
      if (!sel) return;

      const i = Number(sel.dataset.trio);
      escolha[i] = sel.value;

      const s = sabonetes.find((x) => x.id === sel.value);
      const campo = sel.closest('.trio-escolha__campo');
      campo.style.setProperty('--cor', s.cor);
      campo.querySelector('.campo__ajuda').textContent = s.essencias;

      const totalNaTela = alvo.querySelector('.total-seletor span');
      if (totalNaTela) totalNaTela.textContent = dinheiro(precoTotal());
    });

    alvo.addEventListener('click', (ev) => {
      const passo = ev.target.closest('[data-trio-passo]');
      if (passo) {
        qtd = Math.max(1, Math.min(20, qtd + Number(passo.dataset.trioPasso)));
        alvo.querySelector('.qtd span').textContent = qtd;
        alvo.querySelector('.total-seletor span').textContent = dinheiro(precoTotal());
        return;
      }

      if (!ev.target.closest('[data-cerro="add-trio"]')) return;

      /* Três iguais viram uma linha de quantidade 3, não três linhas de 1:
         a sacola fica legível e a conta dá no mesmo. */
      const contagem = {};
      escolha.forEach((id) => { contagem[id] = (contagem[id] || 0) + 1; });

      Object.entries(contagem).forEach(([id, vezes]) => {
        const s = sabonetes.find((x) => x.id === id);
        Sacola.adicionar({
          id,
          nome: s.nome,
          ritual: s.ritual,
          detalhe: 'Do Trio de Sabonetes',
          preco: s.preco,
          foto: '',
          qtd: vezes * qtd,
        });
      });

      const nomes = escolha.map((id) => sabonetes.find((s) => s.id === id).nome);
      avisar('Trio adicionado: ' + nomes.join(', '));
    });

    pintar();
  }

  /* ======================================================================
     Seletor de compra (páginas de ritual)
     ====================================================================== */

  function montarSeletor() {
    const alvo = $('[data-cerro="seletor"]');
    if (!alvo) return;

    const slug = alvo.dataset.ritual;
    const rit = CAT.rituais.find((r) => r.slug === slug);
    if (!rit) return;

    const somaAvulsos = rit.produtos.reduce((n, p) => n + p.preco, 0);
    const economia = somaAvulsos - CAT.precos.kit;

    const opcoes = rit.produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      detalhe: `${p.rotulo} · ${p.medida}`,
      preco: p.preco,
      kit: false,
    }));

    opcoes.push({
      id: `${rit.slug}-kit`,
      nome: 'Ritual Completo',
      detalhe: 'Sabonete + Sais de banho + Geleia de banho',
      preco: CAT.precos.kit,
      kit: true,
    });

    alvo.innerHTML = `
      <p class="seletor__titulo">Monte o seu ritual</p>

      <div class="opcoes" role="radiogroup" aria-label="Opções de compra">
        ${opcoes.map((o, i) => `
          <label class="opcao${o.kit ? ' opcao--kit' : ''}">
            <input type="radio" name="opcao-compra" value="${o.id}"
                   data-preco="${o.preco}" data-nome="${esc(o.nome)}"
                   ${i === opcoes.length - 1 ? 'checked' : ''}>
            <span class="opcao__caixa">
              <span class="opcao__marca" aria-hidden="true"></span>
              <span class="opcao__info">
                <span class="opcao__nome">${esc(o.nome)}${o.kit && economia > 0
                  ? `<span class="selo-economia">Economize ${dinheiro(economia)}</span>` : ''}</span>
                <span class="opcao__detalhe">${esc(o.detalhe)}</span>
              </span>
              <span class="opcao__preco">${dinheiro(o.preco)}</span>
            </span>
          </label>
        `).join('')}
      </div>

      <div class="linha-quantidade">
        <div class="qtd">
          <button type="button" data-passo="-1" aria-label="Diminuir quantidade">−</button>
          <span data-cerro="qtd" aria-live="polite">1</span>
          <button type="button" data-passo="1" aria-label="Aumentar quantidade">+</button>
        </div>
        <div class="total-seletor">
          <small>Total</small>
          <span data-cerro="total-seletor">${dinheiro(CAT.precos.kit)}</span>
        </div>
      </div>

      <button class="btn btn--largo" type="button" data-cerro="add">Adicionar à sacola</button>
      <p class="aviso-parcelas">${esc(CFG.frete.preparoTexto)}</p>`;

    let qtd = 1;
    const elQtd = $('[data-cerro="qtd"]', alvo);
    const elTotal = $('[data-cerro="total-seletor"]', alvo);

    const selecionada = () => $('input[name="opcao-compra"]:checked', alvo);

    function repintar() {
      elQtd.textContent = qtd;
      elTotal.textContent = dinheiro(Number(selecionada().dataset.preco) * qtd);
    }

    $$('button[data-passo]', alvo).forEach((b) => {
      b.addEventListener('click', () => {
        qtd = Math.max(1, Math.min(99, qtd + Number(b.dataset.passo)));
        repintar();
      });
    });

    $$('input[name="opcao-compra"]', alvo).forEach((i) =>
      i.addEventListener('change', repintar));

    $('[data-cerro="add"]', alvo).addEventListener('click', () => {
      const sel = selecionada();
      const ehKit = sel.value.endsWith('-kit');
      Sacola.adicionar({
        id: sel.value,
        nome: sel.dataset.nome,
        ritual: rit.nomeCurto,
        ritualSlug: rit.slug,
        detalhe: ehKit ? 'Ritual completo, 3 peças' : '',
        preco: Number(sel.dataset.preco),
        foto: rit.foto,
        qtd: qtd,
      });
      avisar(`${sel.dataset.nome} · ${rit.nomeCurto} · adicionado à sacola`);
      qtd = 1;
      repintar();
    });

    repintar();
  }

  /* ======================================================================
     Compra simples (produto sem variações, como o Trio de Sabonetes)
     ====================================================================== */

  function montarCompraSimples() {
    const botao = $('[data-cerro="add-simples"]');
    if (!botao) return;

    const caixa = botao.closest('.seletor') || document;
    const elQtd = $('[data-cerro="qtd-simples"]', caixa);
    const elTotal = $('[data-cerro="total-simples"]', caixa);
    const preco = Number(botao.dataset.preco);
    let qtd = 1;

    function repintar() {
      if (elQtd) elQtd.textContent = qtd;
      if (elTotal) elTotal.textContent = dinheiro(preco * qtd);
    }

    $$('button[data-passo]', caixa).forEach((b) => {
      b.addEventListener('click', () => {
        qtd = Math.max(1, Math.min(99, qtd + Number(b.dataset.passo)));
        repintar();
      });
    });

    botao.addEventListener('click', () => {
      Sacola.adicionar({
        id: botao.dataset.id,
        nome: botao.dataset.nome,
        ritual: '',
        ritualSlug: '',
        detalhe: botao.dataset.detalhe || '',
        preco: preco,
        foto: '',
        qtd: qtd,
      });
      avisar(`${botao.dataset.nome} · adicionado à sacola`);
      qtd = 1;
      repintar();
    });

    repintar();
  }

  /* ======================================================================
     Produtos em detalhe (páginas de ritual)
     ====================================================================== */

  function montarProdutosDetalhe() {
    const alvo = $('[data-cerro="produtos-detalhe"]');
    if (!alvo) return;

    const rit = CAT.rituais.find((r) => r.slug === alvo.dataset.ritual);
    if (!rit) return;

    alvo.innerHTML = rit.produtos.map((p) => `
      <article class="produto-detalhe aparece">
        <div class="figura-organica"
             style="background-image:url('${rit.foto}');background-size:200%;background-position:${ENQUADRAMENTO[p.tipo] || 'center'}"
             role="img" aria-label="${esc(p.nome)}, ${esc(p.rotulo.toLowerCase())} do ${esc(rit.nome)}"></div>
        <div>
          <p class="produto-detalhe__tipo">${esc(p.rotulo)}</p>
          <h3>${esc(p.nome)}</h3>
          <p>${esc(p.texto)}</p>
          <div class="produto-detalhe__meta">
            <span><b>Conteúdo</b>${esc(p.medida)}</span>
            <span><b>Essências</b>${esc(rit.essencias)}</span>
            <span><b>Ativos</b>${esc(p.ativos)}</span>
            <span><b>Avulso</b>${dinheiro(p.preco)}</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* ======================================================================
     Faixa de ativos e cross-sell
     ====================================================================== */

  function montarAtivos() {
    const alvo = $('[data-cerro="ativos"]');
    if (!alvo) return;
    const rit = CAT.rituais.find((r) => r.slug === alvo.dataset.ritual);
    if (!rit) return;
    alvo.className = 'botanica';
    alvo.innerHTML = rit.ativos.map((a) => `<span>${esc(a)}</span>`).join('');
  }

  function montarOutrosRituais() {
    const alvo = $('[data-cerro="outros-rituais"]');
    if (!alvo) return;
    const atual = alvo.dataset.ritual;

    alvo.className = 'grade-rituais aparece aparece--fila';
    alvo.innerHTML = CAT.rituais.filter((r) => r.slug !== atual).map((rit) => `
      <article class="cartao-ritual" data-ritual="${rit.slug}">
        <a href="ritual-${rit.slug}.html" class="cartao-ritual__figura">
          <img src="${rit.foto}" alt="Ritual ${esc(rit.nomeCurto)}" loading="lazy">
        </a>
        <div class="cartao-ritual__corpo">
          <h3><a href="ritual-${rit.slug}.html">${esc(rit.nomeCurto)}</a></h3>
          <p class="cartao-ritual__sub">${esc(rit.subtitulo)}</p>
          <p class="cartao-ritual__desc">${esc(rit.chamada)}</p>
          <div class="cartao-ritual__rodape">
            <span class="cartao-ritual__preco">Kit ${dinheiro(CAT.precos.kit)}</span>
            <span class="link-sublinhado">Ver ritual</span>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* ======================================================================
     Página do carrinho
     ====================================================================== */

  function montarCarrinho() {
    const lista = $('[data-cerro="itens-sacola"]');
    if (!lista) return;

    const resumo = $('[data-cerro="resumo"]');

    function repintar() {
      const itens = Sacola.ler();

      if (itens.length === 0) {
        lista.innerHTML = `
          <div class="vazio">
            <h2>Sua sacola está vazia</h2>
            <p class="intro" style="margin-inline:auto">Ainda não há nenhum ritual por aqui. Que tal começar pelo que combina com a sua pele?</p>
            <a class="btn" href="index.html#rituais">Ver os rituais</a>
          </div>`;
        if (resumo) resumo.innerHTML = '';
        return;
      }

      lista.innerHTML = itens.map((i) => `
        <div class="item-carrinho">
          <div class="item-carrinho__figura">
            ${i.foto
              ? `<img src="${esc(i.foto)}" width="820" height="820" alt="" loading="lazy">`
              : `<div class="sem-foto" data-ritual="${esc(i.ritualSlug || '')}"></div>`}
          </div>
          <div>
            <h3 class="item-carrinho__nome">${esc(i.nome)}</h3>
            <p class="item-carrinho__ritual">${esc(i.ritual || '')}${i.detalhe ? ' · ' + esc(i.detalhe) : ''}</p>
            <div class="qtd" style="margin-top:.7rem">
              <button type="button" data-id="${esc(i.id)}" data-passo="-1" aria-label="Diminuir">−</button>
              <span>${i.qtd}</span>
              <button type="button" data-id="${esc(i.id)}" data-passo="1" aria-label="Aumentar">+</button>
            </div>
            <button class="remover" data-remover="${esc(i.id)}">Remover</button>
          </div>
          <div class="item-carrinho__preco">${dinheiro(i.preco * i.qtd)}</div>
        </div>
      `).join('');

      const frete = Sacola.frete();
      const limite = CFG.frete.freteGratisAcimaDe;
      const falta = limite !== null ? limite - Sacola.subtotal() : 0;

      if (resumo) {
        const desconto = Sacola.desconto();
        const cupom = Cupom.atual();
        const atendentes = (CFG.atendentes && CFG.atendentes.lista) || [];
        const escolhida = Atendente.atual();
        const freteAtual = Frete.ler();
        const entrega = Entrega.ler();

        resumo.innerHTML = `
          <h3>Resumo do pedido</h3>
          <div class="resumo__linha"><span>Subtotal</span><span>${dinheiro(Sacola.subtotal())}</span></div>
          ${desconto > 0 ? `<div class="resumo__linha resumo__linha--desconto">
              <span>Desconto ${esc(cupom.codigo)}</span><span>− ${dinheiro(desconto)}</span></div>` : ''}
          <div class="resumo__linha"><span>Frete</span><span>${frete === 0 ? 'Grátis' : dinheiro(frete)}</span></div>
          ${falta > 0 ? `<p class="campo__ajuda">Faltam ${dinheiro(falta)} para o frete grátis.</p>` : ''}
          <div class="resumo__total"><span>Total</span><strong>${dinheiro(Sacola.total())}</strong></div>

          <div class="checkout-extra">
            <label class="campo">
              <span class="campo__rotulo">Calcular frete</span>
              <span class="campo__linha">
                <input type="text" data-cerro="cep" inputmode="numeric" maxlength="9"
                       value="${esc(freteAtual ? freteAtual.cep : '')}" placeholder="Seu CEP">
                <button type="button" class="btn btn--vazado btn--curto" data-cerro="cotar">Calcular</button>
              </span>
              <span class="campo__ajuda" data-cerro="aviso-frete"></span>
            </label>

            ${freteAtual && freteAtual.opcoes ? `
              <div class="opcoes-frete" role="radiogroup" aria-label="Forma de envio">
                ${freteAtual.opcoes.map((o) => `
                  <label class="opcao-frete${o.servico === freteAtual.servico ? ' opcao-frete--escolhida' : ''}">
                    <input type="radio" name="frete" value="${esc(o.servico)}"${o.servico === freteAtual.servico ? ' checked' : ''}>
                    <span class="opcao-frete__nome">${esc(o.nome)}</span>
                    <span class="opcao-frete__prazo">${esc(o.prazo)}</span>
                    <span class="opcao-frete__preco">${dinheiro(o.preco)}</span>
                  </label>`).join('')}
              </div>` : ''}

            ${freteAtual && freteAtual.opcoes ? `
              <fieldset class="entrega">
                <legend class="campo__rotulo">Para onde enviar</legend>
                <label class="campo campo--junto">
                  <span class="campo__rotulo">Nome completo</span>
                  <input type="text" data-entrega="nome" autocomplete="name" value="${esc(entrega.nome || '')}">
                </label>
                <div class="entrega__dupla">
                  <label class="campo campo--junto">
                    <span class="campo__rotulo">Rua</span>
                    <input type="text" data-entrega="rua" autocomplete="address-line1" value="${esc(entrega.rua || '')}">
                  </label>
                  <label class="campo campo--junto campo--curto">
                    <span class="campo__rotulo">Número</span>
                    <input type="text" data-entrega="numero" value="${esc(entrega.numero || '')}">
                  </label>
                </div>
                <div class="entrega__dupla">
                  <label class="campo campo--junto">
                    <span class="campo__rotulo">Bairro</span>
                    <input type="text" data-entrega="bairro" value="${esc(entrega.bairro || '')}">
                  </label>
                  <label class="campo campo--junto campo--curto">
                    <span class="campo__rotulo">Complemento</span>
                    <input type="text" data-entrega="complemento" value="${esc(entrega.complemento || '')}">
                  </label>
                </div>
                <label class="campo campo--junto">
                  <span class="campo__rotulo">WhatsApp</span>
                  <input type="tel" data-entrega="whatsapp" inputmode="numeric"
                         placeholder="(65) 90000-0000" value="${esc(entrega.whatsapp || '')}">
                  <span class="campo__ajuda">É por aqui que a gente manda o código de rastreio.</span>
                </label>
              </fieldset>` : ''}

            <label class="campo">
              <span class="campo__rotulo">Cupom de desconto</span>
              <span class="campo__linha">
                <input type="text" data-cerro="cupom" value="${esc(cupom ? cupom.codigo : '')}"
                       placeholder="Se você tiver um" autocomplete="off" spellcheck="false">
                <button type="button" class="btn btn--vazado btn--curto"
                        data-cerro="${cupom ? 'tirar-cupom' : 'usar-cupom'}">${cupom ? 'Tirar' : 'Usar'}</button>
              </span>
              <span class="campo__ajuda" data-cerro="aviso-cupom"></span>
            </label>

            ${atendentes.length ? `
            <label class="campo">
              <span class="campo__rotulo">Alguém te atendeu?</span>
              <select data-cerro="atendente">
                <option value="">Nenhuma</option>
                ${atendentes.map((a) => `
                  <option value="${esc(a.codigo)}"${a.codigo === escolhida ? ' selected' : ''}>${esc(a.nome)}</option>`).join('')}
              </select>
              <span class="campo__ajuda">Assim a gente sabe quem te ajudou na escolha.</span>
            </label>` : ''}
          </div>

          <button class="btn btn--largo" style="margin-top:1.6rem" data-cerro="finalizar">Finalizar pedido</button>
          <p class="campo__ajuda" style="text-align:center;margin-top:1rem">${esc(CFG.frete.prazoTexto)}</p>`;

        const aviso = $('[data-cerro="aviso-cupom"]');

        resumo.addEventListener('click', (ev) => {
          if (ev.target.closest('[data-cerro="usar-cupom"]')) {
            const campo = $('[data-cerro="cupom"]');
            if (!campo.value.trim()) return;
            if (Cupom.aplicar(campo.value)) { repintar(); }
            else if (aviso) { aviso.textContent = 'Esse cupom não existe ou já expirou.'; aviso.classList.add('campo__ajuda--erro'); }
          }
          if (ev.target.closest('[data-cerro="tirar-cupom"]')) { Cupom.limpar(); repintar(); }

          const botaoCotar = ev.target.closest('[data-cerro="cotar"]');
          if (botaoCotar) {
            const campo = $('[data-cerro="cep"]');
            const avisoFrete = $('[data-cerro="aviso-frete"]');
            const cep = (campo.value || '').replace(/\D/g, '');
            if (cep.length !== 8) {
              avisoFrete.textContent = 'Digite os 8 números do CEP.';
              avisoFrete.classList.add('campo__ajuda--erro');
              return;
            }
            botaoCotar.disabled = true;
            botaoCotar.textContent = 'Calculando…';
            Frete.cotar(cep)
              .then(() => repintar())
              .catch((erro) => {
                botaoCotar.disabled = false;
                botaoCotar.textContent = 'Calcular';
                avisoFrete.textContent = erro.message;
                avisoFrete.classList.add('campo__ajuda--erro');
              });
          }
        });

        /* Trocou de serviço: guarda a escolha e repinta, para o total já
           refletir. O valor mostrado é só da tela; quem cobra é o servidor,
           lendo a mesma cotação pelo protocolo. */
        resumo.addEventListener('change', (ev) => {
          const radio = ev.target.closest('input[name="frete"]');
          if (!radio) return;
          const d = Frete.ler();
          if (!d) return;
          d.servico = radio.value;
          Frete.gravar(d);
          repintar();
        });

        /* Endereço: grava a cada tecla, sem repintar. Repintar aqui apagaria
           o que ela está digitando e tiraria o foco do campo. */
        resumo.addEventListener('input', (ev) => {
          const campo = ev.target.closest('[data-entrega]');
          if (!campo) return;
          const d = Entrega.ler();
          d[campo.dataset.entrega] = campo.value;
          Entrega.gravar(d);
        });

        const sel = $('[data-cerro="atendente"]');
        if (sel) sel.addEventListener('change', () => {
          if (sel.value) Atendente.gravar(sel.value);
          else { try { localStorage.removeItem(CHAVE_ATENDENTE); } catch (e) {} }
        });
      }
    }

    lista.addEventListener('click', (ev) => {
      const passo = ev.target.closest('button[data-passo]');
      const remover = ev.target.closest('button[data-remover]');

      if (passo) {
        const item = Sacola.ler().find((i) => i.id === passo.dataset.id);
        if (item) Sacola.definirQtd(item.id, item.qtd + Number(passo.dataset.passo));
      }
      if (remover) Sacola.remover(remover.dataset.remover);
    });

    document.addEventListener('sacola:mudou', repintar);
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-cerro="finalizar"]')) finalizarPedido();
    });

    repintar();
  }

  /* ======================================================================
     Finalização do pedido
     ====================================================================== */

  function finalizarPedido() {
    const itens = Sacola.ler();
    if (itens.length === 0) return;

    /* Sem endereço não dá para emitir etiqueta, e descobrir isso depois do
       pagamento significa caçar a cliente no WhatsApp. Só cobro quando ela
       já cotou o frete: antes disso o formulário nem apareceu. */
    if (Frete.ler()) {
      const falta = Entrega.faltando();
      if (falta) {
        avisar('Antes de fechar, preencha ' + falta + '.');
        const alvo = $('[data-entrega]:placeholder-shown, [data-entrega]');
        if (alvo) { alvo.scrollIntoView({ block: 'center', behavior: 'smooth' }); alvo.focus(); }
        return;
      }
    }

    if (CFG.pagamento.modo === 'mercadopago') {
      return finalizarMercadoPago(itens);
    }
    return finalizarWhatsApp(itens);
  }

  /** Modo WhatsApp: funciona sem backend. */
  /** Modo WhatsApp: o pedido vira uma mensagem pronta.
   *
   *  A mensagem carrega TUDO que a sacola coletou: endereço, atendente,
   *  cupom e serviço de frete. Antes ela levava só os itens e o total, e o
   *  resto do checkout era coletado e descartado: a cliente preenchia o
   *  endereço, escolhia a atendente, digitava o cupom, e nada disso chegava
   *  do outro lado. A loja tinha que perguntar tudo de novo na conversa.
   */
  function finalizarWhatsApp(itens) {
    const cliente = window.CerroContas && window.CerroContas.atual();
    const entrega = Entrega.ler();
    const cupom = Cupom.atual();
    const desconto = Sacola.desconto();
    const frete = Sacola.frete();
    const opcaoFrete = Frete.escolhido();
    const codAtendente = Atendente.atual();

    const linhas = itens.map((i) =>
      `• ${i.qtd}× ${i.nome}${i.ritual ? ' (' + i.ritual + ')' : ''}: ${dinheiro(i.preco * i.qtd)}`);

    const partes = [
      'Olá! Quero fechar um pedido na Cerrô:',
      '',
      linhas.join('\n'),
      '',
      `Subtotal: ${dinheiro(Sacola.subtotal())}`,
    ];

    if (desconto > 0) partes.push(`Desconto (${cupom.codigo}): -${dinheiro(desconto)}`);

    partes.push(
      `Frete${opcaoFrete ? ' (' + opcaoFrete.nome + ', ' + opcaoFrete.prazo + ')' : ''}: ` +
        (frete === 0 ? 'Grátis' : dinheiro(frete)),
      `Total: ${dinheiro(Sacola.total())}`
    );

    /* Endereço: é o que permite despachar sem uma segunda conversa. */
    const temEndereco = entrega && (entrega.nome || entrega.rua);
    if (temEndereco) {
      const linhaRua = [entrega.rua, entrega.numero].filter(Boolean).join(', ');
      partes.push(
        '',
        'ENTREGA',
        entrega.nome || '',
        [linhaRua, entrega.complemento].filter(Boolean).join(' · '),
        [entrega.bairro, (Frete.ler() || {}).cep].filter(Boolean).join(' · '),
        entrega.whatsapp ? `WhatsApp: ${entrega.whatsapp}` : ''
      );
    }

    if (codAtendente) {
      partes.push('', `Atendida por: ${Atendente.nomeDe(codAtendente)}`);
    }

    if (cliente) {
      partes.push('', `Conta: ${cliente.nome} · ${cliente.email}`);
    }

    const texto = partes.filter((l) => l !== '' || true).join('\n').replace(/\n{3,}/g, '\n\n');
    const url = `https://wa.me/${CFG.loja.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener');
  }

  /** Modo Mercado Pago. Exige os arquivos da pasta api/ no servidor.
   *
   *  Repare no que este pedido NÃO leva: preço, frete e total.
   *
   *  A versão anterior mandava unit_price junto, e isso era um buraco de
   *  verdade, não teoria. A sacola mora no localStorage, que é do visitante:
   *  qualquer pessoa abre o console, troca o preço do kit para 0.01 e
   *  finaliza. O Mercado Pago cobraria um centavo e estaria certo, porque
   *  para ele o valor legítimo é o que o servidor da loja mandou.
   *
   *  Agora vai só id e quantidade. Quem sabe quanto custa é api/catalogo.php,
   *  e ele é o único que o cliente não alcança.
   */
  async function finalizarMercadoPago(itens) {
    const btn = $('[data-cerro="finalizar"]');
    const rotuloOriginal = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Abrindo pagamento…'; }

    const cliente = window.CerroContas && window.CerroContas.atual();

    /* Código de quem indicou a venda, quando existir. Hoje não existe: o site
       vem do seletor da finalização ou do link próprio dela. Vazio quando a
       cliente deixou em "Nenhuma", que é o padrão. */
    const vendedor = Atendente.atual();

    /* O código do cupom, não o valor. Mandar o valor seria entregar o
       desconto para quem souber editar o navegador: o servidor revalida o
       código na tabela dele e calcula o abatimento de novo. */
    const cupomAtual = Cupom.atual();
    const cupom = cupomAtual ? cupomAtual.codigo : '';

    try {
      const resposta = await fetch(CFG.pagamento.mercadoPago.endpointPreferencia, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map((i) => ({ id: i.id, qtd: i.qtd })),
          cliente: cliente
            ? { nome: cliente.nome, email: cliente.email, whatsapp: cliente.whatsapp }
            : null,
          vendedor,
          cupom,

          /* Protocolo e serviço, nunca o preço. O servidor lê a cotação que
             ele mesmo guardou e cobra aquilo. */
          freteProtocolo: (Frete.ler() || {}).protocolo || '',
          freteServico: (Frete.ler() || {}).servico || '',

          entrega: Entrega.ler(),
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || 'Falha ao criar a cobrança.');

      /* Com credencial de teste o checkout que funciona é o sandbox. Uso o
         que vier preenchido, para o mesmo código servir nas duas fases. */
      const destino = dados.init_point || dados.sandbox_init_point;
      if (!destino) throw new Error('Resposta do servidor sem endereço de pagamento.');

      window.location.href = destino;
    } catch (erro) {
      avisar('Não foi possível abrir o pagamento. Vamos finalizar pelo WhatsApp.');
      finalizarWhatsApp(itens);
      if (btn) { btn.disabled = false; btn.textContent = rotuloOriginal; }
    }
  }

  /* ======================================================================
     Barra de compra fixa (celular)
     ----------------------------------------------------------------------
     No celular o seletor fica longe depois que a pessoa desce para ler os
     produtos. A barra reaparece com a opção escolhida, para não obrigar a
     rolar de volta.
     ====================================================================== */

  function montarBarraCompra() {
    const seletor = $('[data-cerro="seletor"]');
    if (!seletor) return;

    const rit = CAT.rituais.find((r) => r.slug === seletor.dataset.ritual);
    if (!rit) return;

    const barra = document.createElement('div');
    barra.className = 'barra-compra';
    barra.innerHTML = `
      <div class="barra-compra__info">
        <span class="barra-compra__nome" data-cerro="barra-nome"></span>
        <span class="barra-compra__preco" data-cerro="barra-preco"></span>
      </div>
      <button class="btn" type="button" data-cerro="barra-add">Adicionar</button>`;
    document.body.appendChild(barra);

    const elNome  = $('[data-cerro="barra-nome"]', barra);
    const elPreco = $('[data-cerro="barra-preco"]', barra);

    const selecionada = () => $('input[name="opcao-compra"]:checked', seletor);

    function sincronizar() {
      const sel = selecionada();
      if (!sel) return;
      elNome.textContent = sel.dataset.nome;
      elPreco.textContent = `${rit.nomeCurto} · ${dinheiro(Number(sel.dataset.preco))}`;
    }

    seletor.addEventListener('change', sincronizar);

    $('[data-cerro="barra-add"]', barra).addEventListener('click', () => {
      const sel = selecionada();
      if (!sel) return;
      Sacola.adicionar({
        id: sel.value,
        nome: sel.dataset.nome,
        ritual: rit.nomeCurto,
        ritualSlug: rit.slug,
        detalhe: sel.value.endsWith('-kit') ? 'Ritual completo, 3 peças' : '',
        preco: Number(sel.dataset.preco),
        foto: rit.foto,
        qtd: 1,
      });
      avisar(`${sel.dataset.nome} · adicionado à sacola`);
    });

    /* Só aparece quando o seletor sai de vista.
       Cálculo direto no evento de rolagem em vez de IntersectionObserver:
       é uma conta trivial, funciona em qualquer navegador e não depende do
       ciclo de quadros, que alguns navegadores suspendem em aba de fundo. */
    function conferirVisibilidade() {
      const r = seletor.getBoundingClientRect();
      /* Só depois que a pessoa PASSA do seletor. Antes disso ela ainda está
         conhecendo o ritual. Subir uma barra de compra nesse momento é
         apressar quem veio justamente para desacelerar. */
      const jaPassou = r.bottom < 0;
      barra.classList.toggle('visivel', jaPassou);
    }

    /* Sem agendamento por quadro de propósito: é uma única medição por evento,
       barata. Um esquema com requestAnimationFrame trava de vez se o navegador
       suspender os quadros (aba de fundo, economia de bateria): a marca de
       "pendente" nunca seria limpa e a barra congelaria. */
    window.addEventListener('scroll', conferirVisibilidade, { passive: true });
    window.addEventListener('resize', conferirVisibilidade);

    sincronizar();
    conferirVisibilidade();
  }

  /* ======================================================================
     Perguntas frequentes, em sanfona
     ====================================================================== */

  function montarPerguntas() {
    const lista = $('[data-cerro="perguntas"]');
    if (!lista) return;

    $$('.pergunta', lista).forEach((item, i) => {
      const botao = $('.pergunta__botao', item);
      const resposta = $('.pergunta__resposta', item);
      if (!botao || !resposta) return;

      const id = `resposta-${i}`;
      resposta.id = id;
      botao.setAttribute('aria-controls', id);
      botao.setAttribute('aria-expanded', 'false');
      resposta.dataset.aberta = 'false';

      botao.addEventListener('click', () => {
        const abrindo = botao.getAttribute('aria-expanded') !== 'true';

        /* uma de cada vez, para a página não virar uma parede de texto */
        $$('.pergunta', lista).forEach((outro) => {
          $('.pergunta__botao', outro).setAttribute('aria-expanded', 'false');
          $('.pergunta__resposta', outro).dataset.aberta = 'false';
        });

        if (abrindo) {
          botao.setAttribute('aria-expanded', 'true');
          resposta.dataset.aberta = 'true';
        }
      });
    });
  }

  /* ======================================================================
     Aparição suave conforme a página rola
     ----------------------------------------------------------------------
     Nada pisca nem salta: cada bloco sobe 30px e ganha opacidade em pouco
     mais de um segundo. Quem pediu menos movimento no sistema recebe tudo
     visível de imediato.
     ====================================================================== */

  function revelarAoRolar() {
    const querParado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alvos = $$('.aparece');

    if (querParado || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.classList.add('visto'));
      return;
    }

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visto');
        observador.unobserve(entrada.target);
      });
    /* Dispara assim que o bloco encosta na tela, e ainda um pouco antes.
       Com a margem negativa anterior, blocos altos ficavam visíveis na página
       e invisíveis aos olhos, deixando faixas vazias. */
    }, { rootMargin: '80px 0px 0px 0px', threshold: 0 });

    alvos.forEach((el) => observador.observe(el));
  }

  /* ======================================================================
     Cabeçalho ganha fundo sólido depois do topo
     ====================================================================== */

  function cabecalhoAoRolar() {
    const topo = $('.topo');
    if (!topo) return;

    /* Mesma escolha da barra de compra: leitura direta, sem agendar quadro.
       Ler window.scrollY não força recálculo de layout. */
    const conferir = () => topo.classList.toggle('rolado', window.scrollY > 40);

    window.addEventListener('scroll', conferir, { passive: true });
    conferir();
  }

  /* ======================================================================
     Textos vindos da configuração
     ====================================================================== */

  function preencherConfig() {
    $$('[data-cfg]').forEach((el) => {
      const caminho = el.dataset.cfg.split('.');
      let valor = CFG;
      caminho.forEach((p) => { valor = valor ? valor[p] : undefined; });
      if (valor === undefined) return;

      if (el.tagName === 'A' && el.dataset.cfgAttr === 'href') {
        el.href = valor;
      } else {
        el.textContent = valor;
      }
    });

    $$('[data-whatsapp-link]').forEach((el) => {
      el.href = `https://wa.me/${CFG.loja.whatsapp}`;
    });
  }

  /* ======================================================================
     Início
     ====================================================================== */

  function iniciar() {
    montarCabecalho();
    montarRodape();
    preencherConfig();
    montarGradeRituais();
    montarPresente();
    montarTrio();
    montarPecasPresente();
    montarCompraPresente();
    montarSeletor();
    montarCompraSimples();
    montarProdutosDetalhe();
    montarAtivos();
    montarOutrosRituais();
    montarCarrinho();
    montarBarraCompra();
    montarPerguntas();
    atualizarContador();
    document.addEventListener('sacola:mudou', atualizarContador);

    /* Por último, já com todo o conteúdo montado pelo JS. */
    cabecalhoAoRolar();
    revelarAoRolar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
