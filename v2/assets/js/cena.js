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
   *  Com 3 etapas: a etapa 0 vai de 0 a 1 enquanto p vai de 0 a 0,33.
   *
   *  O amaciamento no fim (a conta t*t*(3-2t)) é o que tira a quina. Sem ele
   *  a etapa entra na velocidade máxima do primeiro pixel e para de uma vez
   *  no último, e é isso que faz o movimento parecer de máquina. Com ele, a
   *  etapa nasce devagar, ganha corpo no meio e assenta no fim.
   *
   *  Repare que 0 continua 0 e 1 continua 1: o começo e o fim de cada etapa
   *  caem no mesmo ponto de rolagem de antes. A página não fica mais longa,
   *  só percorre o mesmo caminho com outra curva. */
  function etapa(p, indice, total) {
    const t = limitar(p * total - indice);
    return t * t * (3 - 2 * t);
  }

  /* Último valor escrito em cada cena. Escrever uma variável de CSS obriga o
     navegador a reavaliar o estilo da seção inteira, e a rolagem dispara
     eventos mesmo quando a conta dá no mesmo (parado no fim de um ato, com o
     dedo encostado, chegando ao fim da página). Guardar o último valor e não
     reescrever o que não mudou zera esse trabalho. */
  const ultimo = new Map();

  /* O percurso de um ato é a altura da seção menos a altura do palco, porque
     é exatamente esse o trecho em que o palco fica grudado na tela.

     Aqui estava `window.innerHeight`, que é parecido mas não é a mesma coisa:
     o palco tem 100dvh. No computador os dois valores batem e ninguém percebe.
     No celular, não: `innerHeight` cresce enquanto a barra do navegador se
     esconde durante a rolagem, e com ela mudando o percurso mudava junto, no
     meio do ato. O resultado era o movimento acelerar sozinho na primeira
     descida, justo onde a rolagem já parecia estranha. Medindo o palco, o
     progresso chega a 1 no instante exato em que ele desgruda, em qualquer
     aparelho. */
  const palcos = new Map();
  for (const cena of cenas) {
    const palco = cena.querySelector('.cena__palco');
    if (palco) palcos.set(cena, palco);
  }

  /* Onde está de fato a rolagem, para cada cena, e se ela está à vista.
     As duas coisas juntas porque as duas saem da mesma medição. */
  function alvoDe(cena, alturaTela) {
    const caixa = cena.getBoundingClientRect();
    if (caixa.bottom < 0)         return { p: 1, visivel: false };
    if (caixa.top > alturaTela)   return { p: 0, visivel: false };
    const palco = palcos.get(cena);
    const alturaPalco = palco ? palco.getBoundingClientRect().height : alturaTela;
    const percurso = caixa.height - alturaPalco;
    return { p: percurso > 0 ? limitar(-caixa.top / percurso) : 0, visivel: true };
  }

  /* ------------------------------------------------------------------------
     O amortecimento

     A rolagem não chega contínua no navegador. Um giro da rodinha do mouse
     é um salto de uns cem pixels de uma vez. Se a animação for lida direto
     da posição, ela salta junto, do mesmo tamanho, e é isso que se sente
     como "duro": não é lentidão nem falta de quadros, é a animação andando
     em degraus porque a entrada anda em degraus.

     Então a cena não vai mais direto para onde a rolagem está. Ela persegue.
     A cada quadro anda uma fração do que falta, e essa fração composta ao
     longo de alguns quadros transforma um degrau de cem pixels numa curva
     de uns 150 ms. O trecho de rolagem continua exatamente o mesmo; o que
     muda é que o movimento passa a ter chegada em vez de ter parada.

     No dedo, em tela de toque, a entrada já é contínua e o amortecimento
     seria só atraso, então lá ele é bem mais curto.
     ------------------------------------------------------------------------ */
  const ehToque = window.matchMedia('(hover: none)').matches;

  /* Fração do que falta percorrida a cada quadro de 60 Hz.

     O valor é um equilíbrio, e errar para qualquer lado estraga. Baixo
     demais e a cena boia atrás do dedo, dando a impressão de que o site
     está pesado, que é o oposto do que se quer. Alto demais e o degrau da
     rodinha volta a aparecer.

     Nestes números, um giro de rodinha assenta por completo em cerca de
     300 ms no computador e 180 ms no celular, e chega perto o bastante para
     o olho não distinguir em 130 ms e 85 ms. No celular o gesto já chega
     contínuo, então o amortecimento precisa fazer menos trabalho. */
  const PERSEGUICAO = ehToque ? 0.38 : 0.25;
  const QUASE_LA = 0.0006;                     // abaixo disso, encosta e para

  const estado = new Map();   // valor que está desenhado agora, por cena
  for (const cena of cenas) estado.set(cena, 0);

  function escrever(cena, p) {
    const valor = p.toFixed(4);
    if (ultimo.get(cena) === valor) return;
    ultimo.set(cena, valor);

    cena.style.setProperty('--p', valor);

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

  /** Um quadro. Devolve true se alguma cena ainda está a caminho.
   *  @param dt milissegundos desde o quadro anterior
   *  @param instantaneo pula o amortecimento e encosta no alvo */
  function passo(dt, instantaneo) {
    const alturaTela = window.innerHeight;

    /* A fração é corrigida pelo tempo do quadro. Sem isso, uma tela de
       120 Hz assentaria na metade do tempo de uma de 60 Hz, e o site teria
       ritmos diferentes em aparelhos diferentes. */
    const fracao = 1 - Math.pow(1 - PERSEGUICAO, Math.min(dt, 50) / 16.667);

    let aindaAndando = false;

    for (const cena of cenas) {
      const { p: alvo, visivel } = alvoDe(cena, alturaTela);
      let atual = estado.get(cena);

      /* Perseguir só faz sentido para o que está à vista. Fora da tela,
         encosta de uma vez: ninguém vê a diferença, e assim uma cena
         escondida não fica "chegando" por segundos segurando o laço de
         quadros aceso à toa. Quando ela reaparecer, já estará no lugar. */
      const falta = alvo - atual;

      if (instantaneo || !visivel || Math.abs(falta) < QUASE_LA) {
        atual = alvo;
      } else {
        atual += falta * fracao;
        aindaAndando = true;
      }

      estado.set(cena, atual);
      escrever(cena, atual);
    }

    return aindaAndando;
  }

  /* ------------------------------------------------------------------------
     O laço de quadros, e a trava que ele não pode ter

     A forma óbvia de escrever isto é uma bandeira: "já tem laço rodando,
     não acende outro". E ela quebra de um jeito silencioso e definitivo.

     requestAnimationFrame não é promessa. O navegador suspende os quadros
     quando a aba vai para segundo plano, quando o aparelho economiza
     bateria, quando a janela some. O quadro agendado simplesmente nunca
     chega. Com a bandeira levantada e ninguém para baixá-la, todo pedido
     seguinte é recusado e a cena congela para o resto da visita. A pessoa
     rola a página e nada se move.

     Este projeto já teve exatamente esse travamento na barra de compra.
     Então aqui a bandeira não decide sozinha: junto com ela vai a hora do
     último quadro que realmente rodou. Se ela está levantada mas faz tempo
     que nenhum quadro passou, o laço morreu e a gente acende outro.

     A geração existe para o laço velho não voltar do túmulo: se ele um dia
     acordar, vê que não é mais o da vez e se encerra em silêncio.
     ------------------------------------------------------------------------ */
  const LACO_MORTO_APOS = 250;   // ms sem um quadro = o laço não existe mais

  let rodando = false;
  let geracao = 0;
  let ultimoQuadroVisto = 0;

  function acenderLaco() {
    const minhaGeracao = ++geracao;
    let anterior = 0;
    rodando = true;
    ultimoQuadroVisto = performance.now();

    function quadro(agora) {
      if (minhaGeracao !== geracao) return;   // laço velho: encerra quieto
      ultimoQuadroVisto = agora;
      const dt = anterior ? agora - anterior : 16.667;
      anterior = agora;

      if (passo(dt, false)) {
        requestAnimationFrame(quadro);
      } else {
        rodando = false;
      }
    }

    requestAnimationFrame(quadro);
  }

  function agendar() {
    if (rodando && performance.now() - ultimoQuadroVisto < LACO_MORTO_APOS) return;
    acenderLaco();
  }

  /** Coloca tudo no lugar sem animar. Para carga, giro de tela e testes. */
  function medir() {
    passo(16.667, true);
  }

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', medir);
  window.addEventListener('orientationchange', medir);

  /* Voltando de outra aba, os quadros ficaram suspensos e a cena está
     parada num valor velho enquanto a página pode ter sido rolada. Encosta
     tudo no lugar de uma vez, sem animar: animar aqui seria mostrar um
     movimento que a pessoa não pediu e não viu começar. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { rodando = false; medir(); }
  });

  /* Primeira medição depois das imagens, senão as alturas mudam embaixo */
  medir();
  window.addEventListener('load', medir);
  setTimeout(medir, 300);

  /* Expõe para teste */
  window.CerroCena = { medir, agendar, passo };
})();
