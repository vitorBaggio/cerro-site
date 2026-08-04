/* ==========================================================================
   Cerrô · Área do cliente
   --------------------------------------------------------------------------
   Cadastro, login e preferências de comunicação.

   Dois modos, definidos em config.js → contas.backend:

     'local'    → TESTE. Guarda tudo no navegador do visitante. Você NÃO recebe
                  os contatos. Serve para navegar e validar o fluxo.
     'supabase' → REAL. Cadastro em banco de dados, com os contatos disponíveis
                  para você exportar. Instruções no LEIA-ME.md.
   ========================================================================== */

(function () {
  'use strict';

  const CFG = window.CERRO_CONFIG;
  const CHAVE_SESSAO = 'cerro:sessao';
  const CHAVE_BASE   = 'cerro:clientes';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ======================================================================
     Validação
     ====================================================================== */

  const Valida = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()),

    /** Aceita (65) 90000-0000, 65900000000, +55 65 90000-0000 … */
    whatsapp(v) {
      const d = v.replace(/\D/g, '');
      return d.length >= 10 && d.length <= 13;
    },

    normalizarWhats(v) {
      let d = v.replace(/\D/g, '');
      if (d.length <= 11) d = '55' + d;      // sem código do país
      return d;
    },

    formatarWhats(v) {
      const d = v.replace(/\D/g, '').replace(/^55/, '');
      if (d.length <= 2)  return d;
      if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    },

    senha: (v) => typeof v === 'string' && v.length >= 8,
  };

  /* ======================================================================
     Backend LOCAL, apenas para teste
     ====================================================================== */

  async function digerir(texto) {
    if (!window.crypto || !window.crypto.subtle) return 'sem-hash:' + texto;
    const bytes = new TextEncoder().encode('cerro::' + texto);
    const buf = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const BackendLocal = {
    rotulo: 'local',

    lerBase() {
      try { return JSON.parse(localStorage.getItem(CHAVE_BASE) || '[]'); }
      catch (e) { return []; }
    },

    gravarBase(base) {
      localStorage.setItem(CHAVE_BASE, JSON.stringify(base));
    },

    async cadastrar(dados) {
      const base = BackendLocal.lerBase();
      const email = dados.email.trim().toLowerCase();

      if (base.some((c) => c.email === email)) {
        throw new Error('Já existe uma conta com este e-mail. Tente entrar.');
      }

      const cliente = {
        id: 'c_' + Date.now().toString(36),
        nome: dados.nome.trim(),
        email: email,
        whatsapp: dados.whatsapp,
        aniversario: dados.aniversario || null,
        aceitaNovidades: !!dados.aceitaNovidades,
        criadoEm: new Date().toISOString(),
        senhaHash: await digerir(dados.senha),
      };

      base.push(cliente);
      BackendLocal.gravarBase(base);
      return cliente;
    },

    async entrar(email, senha) {
      const base = BackendLocal.lerBase();
      const cliente = base.find((c) => c.email === email.trim().toLowerCase());
      const hash = await digerir(senha);

      if (!cliente || cliente.senhaHash !== hash) {
        throw new Error('E-mail ou senha incorretos.');
      }
      return cliente;
    },

    async atualizar(id, mudancas) {
      const base = BackendLocal.lerBase();
      const cliente = base.find((c) => c.id === id);
      if (!cliente) throw new Error('Conta não encontrada.');
      Object.assign(cliente, mudancas);
      BackendLocal.gravarBase(base);
      return cliente;
    },
  };

  /* ======================================================================
     Backend SUPABASE, cadastro real
     ====================================================================== */

  const BackendSupabase = {
    rotulo: 'supabase',

    get base() { return CFG.contas.supabase.url.replace(/\/$/, ''); },
    get chave() { return CFG.contas.supabase.chaveAnon; },

    cabecalhos(token) {
      const h = {
        'Content-Type': 'application/json',
        'apikey': BackendSupabase.chave,
      };
      if (token) h['Authorization'] = 'Bearer ' + token;
      return h;
    },

    async cadastrar(dados) {
      const resp = await fetch(`${BackendSupabase.base}/auth/v1/signup`, {
        method: 'POST',
        headers: BackendSupabase.cabecalhos(),
        body: JSON.stringify({
          email: dados.email.trim().toLowerCase(),
          password: dados.senha,
          data: {
            nome: dados.nome.trim(),
            whatsapp: dados.whatsapp,
            aniversario: dados.aniversario || null,
            aceita_novidades: !!dados.aceitaNovidades,
          },
        }),
      });

      const corpo = await resp.json();
      if (!resp.ok) {
        throw new Error(corpo.msg || corpo.error_description || 'Não foi possível criar a conta.');
      }

      const usuario = corpo.user || {};
      return {
        id: usuario.id,
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        whatsapp: dados.whatsapp,
        aniversario: dados.aniversario || null,
        aceitaNovidades: !!dados.aceitaNovidades,
        token: corpo.access_token || null,
      };
    },

    async entrar(email, senha) {
      const resp = await fetch(`${BackendSupabase.base}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: BackendSupabase.cabecalhos(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
      });

      const corpo = await resp.json();
      if (!resp.ok) throw new Error('E-mail ou senha incorretos.');

      const meta = (corpo.user && corpo.user.user_metadata) || {};
      return {
        id: corpo.user.id,
        nome: meta.nome || '',
        email: corpo.user.email,
        whatsapp: meta.whatsapp || '',
        aniversario: meta.aniversario || null,
        aceitaNovidades: !!meta.aceita_novidades,
        token: corpo.access_token,
      };
    },

    async atualizar(id, mudancas) {
      const sessao = Contas.atual();
      const resp = await fetch(`${BackendSupabase.base}/auth/v1/user`, {
        method: 'PUT',
        headers: BackendSupabase.cabecalhos(sessao && sessao.token),
        body: JSON.stringify({
          data: {
            nome: mudancas.nome,
            whatsapp: mudancas.whatsapp,
            aniversario: mudancas.aniversario,
            aceita_novidades: mudancas.aceitaNovidades,
          },
        }),
      });

      if (!resp.ok) throw new Error('Não foi possível salvar as alterações.');
      return Object.assign({}, sessao, mudancas);
    },
  };

  /* ======================================================================
     Camada pública
     ====================================================================== */

  function backend() {
    return CFG.contas.backend === 'supabase' ? BackendSupabase : BackendLocal;
  }

  const Contas = {
    modoTeste: () => CFG.contas.backend !== 'supabase',

    atual() {
      try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null'); }
      catch (e) { return null; }
    },

    guardarSessao(cliente) {
      const publico = Object.assign({}, cliente);
      delete publico.senhaHash;
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(publico));
      document.dispatchEvent(new CustomEvent('conta:mudou', { detail: publico }));
      return publico;
    },

    async cadastrar(dados) {
      return Contas.guardarSessao(await backend().cadastrar(dados));
    },

    async entrar(email, senha) {
      return Contas.guardarSessao(await backend().entrar(email, senha));
    },

    async atualizar(mudancas) {
      const atual = Contas.atual();
      if (!atual) throw new Error('Ninguém está conectado.');
      return Contas.guardarSessao(await backend().atualizar(atual.id, mudancas));
    },

    sair() {
      sessionStorage.removeItem(CHAVE_SESSAO);
      document.dispatchEvent(new CustomEvent('conta:mudou', { detail: null }));
    },
  };

  window.CerroContas = Contas;
  window.CerroValida = Valida;

  /* ======================================================================
     Interface da página conta.html
     ====================================================================== */

  function recado(alvo, texto, tipo) {
    if (!alvo) return;
    alvo.innerHTML = texto
      ? `<div class="recado recado--${tipo || 'erro'}" role="alert">${esc(texto)}</div>`
      : '';
  }

  function montarPaginaConta() {
    const painel = $('[data-cerro="painel-conta"]');
    if (!painel) return;

    const cliente = Contas.atual();
    if (cliente) return telaConectada(painel, cliente);
    return telaVisitante(painel);
  }

  /* --- Cadastro + login --------------------------------------------------- */

  function telaVisitante(painel) {
    const params = new URLSearchParams(location.search);
    const abaInicial = params.get('acao') === 'entrar' ? 'entrar' : 'cadastrar';
    const querAviso = params.get('aviso') === 'florescer';

    painel.innerHTML = `
      <div class="abas" role="tablist">
        <button class="aba" role="tab" data-aba="cadastrar" aria-selected="${abaInicial === 'cadastrar'}">Criar conta</button>
        <button class="aba" role="tab" data-aba="entrar"    aria-selected="${abaInicial === 'entrar'}">Já tenho conta</button>
      </div>

      <div data-cerro="recado"></div>

      ${Contas.modoTeste() ? `
        <div class="recado" role="note">
          <strong>Modo de teste.</strong> Os cadastros ainda ficam salvos apenas neste
          navegador e não chegam até a Cerrô. Para receber os contatos de verdade,
          configure o banco de dados conforme o LEIA-ME.md.
        </div>` : ''}

      <!-- ================= CRIAR CONTA ================= -->
      <form data-painel="cadastrar" novalidate ${abaInicial === 'cadastrar' ? '' : 'hidden'}>
        <p class="intro" style="margin-bottom:2rem">
          Criando sua conta você acompanha seus pedidos, compra mais rápido da próxima
          vez e fica sabendo antes de todo mundo dos lançamentos da casa.
        </p>

        <div class="campo">
          <label for="cad-nome">Nome completo</label>
          <input id="cad-nome" name="nome" type="text" autocomplete="name" required>
        </div>

        <div class="dupla">
          <div class="campo">
            <label for="cad-email">E-mail</label>
            <input id="cad-email" name="email" type="email" autocomplete="email" required>
          </div>
          <div class="campo">
            <label for="cad-whats">WhatsApp</label>
            <input id="cad-whats" name="whatsapp" type="tel" inputmode="numeric"
                   autocomplete="tel" placeholder="(65) 90000-0000" required>
          </div>
        </div>

        <div class="dupla">
          <div class="campo">
            <label for="cad-senha">Senha</label>
            <input id="cad-senha" name="senha" type="password" autocomplete="new-password" required>
            <span class="campo__ajuda">Mínimo de 8 caracteres.</span>
          </div>
          <div class="campo">
            <label for="cad-nascimento">Data de nascimento <span style="text-transform:none;letter-spacing:0">(opcional)</span></label>
            <input id="cad-nascimento" name="aniversario" type="date">
            <span class="campo__ajuda">Usamos para te mimar no seu mês.</span>
          </div>
        </div>

        <label class="consentimento">
          <input type="checkbox" name="aceitaNovidades" ${querAviso ? 'checked' : ''}>
          <span>Quero receber novidades, lançamentos e ofertas da Cerrô por e-mail e WhatsApp.
          Posso cancelar quando quiser.</span>
        </label>

        <label class="consentimento">
          <input type="checkbox" name="aceitaTermos" required>
          <span>Li e aceito a <a href="politicas.html#privacidade">Política de Privacidade</a>
          e autorizo o tratamento dos meus dados conforme a LGPD.</span>
        </label>

        <button class="btn btn--largo" type="submit" style="margin-top:1rem">Criar minha conta</button>
      </form>

      <!-- ================= ENTRAR ================= -->
      <form data-painel="entrar" novalidate ${abaInicial === 'entrar' ? '' : 'hidden'}>
        <p class="intro" style="margin-bottom:2rem">Que bom te ver de novo.</p>

        <div class="campo">
          <label for="ent-email">E-mail</label>
          <input id="ent-email" name="email" type="email" autocomplete="email" required>
        </div>

        <div class="campo">
          <label for="ent-senha">Senha</label>
          <input id="ent-senha" name="senha" type="password" autocomplete="current-password" required>
        </div>

        <button class="btn btn--largo" type="submit" style="margin-top:1rem">Entrar</button>
      </form>`;

    /* Abas */
    $$('.aba', painel).forEach((aba) => {
      aba.addEventListener('click', () => {
        $$('.aba', painel).forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
        $$('form[data-painel]', painel).forEach((f) => {
          f.hidden = f.dataset.painel !== aba.dataset.aba;
        });
        recado($('[data-cerro="recado"]', painel), '');
      });
    });

    /* Máscara do WhatsApp */
    const campoWhats = $('#cad-whats', painel);
    campoWhats.addEventListener('input', () => {
      const pos = campoWhats.selectionStart === campoWhats.value.length;
      campoWhats.value = Valida.formatarWhats(campoWhats.value);
      if (pos) campoWhats.setSelectionRange(campoWhats.value.length, campoWhats.value.length);
    });

    /* Cadastro */
    $('form[data-painel="cadastrar"]', painel).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.currentTarget;
      const caixa = $('[data-cerro="recado"]', painel);
      const d = Object.fromEntries(new FormData(f).entries());

      if (!d.nome || d.nome.trim().length < 3) return recado(caixa, 'Escreva seu nome completo.');
      if (!Valida.email(d.email))              return recado(caixa, 'Confira o e-mail digitado.');
      if (!Valida.whatsapp(d.whatsapp || ''))  return recado(caixa, 'Confira o número de WhatsApp, com DDD.');
      if (!Valida.senha(d.senha))              return recado(caixa, 'A senha precisa ter pelo menos 8 caracteres.');
      if (!d.aceitaTermos)                     return recado(caixa, 'É preciso aceitar a Política de Privacidade para criar a conta.');

      const botao = $('button[type="submit"]', f);
      botao.disabled = true; botao.textContent = 'Criando…';

      try {
        await Contas.cadastrar({
          nome: d.nome,
          email: d.email,
          whatsapp: Valida.normalizarWhats(d.whatsapp),
          senha: d.senha,
          aniversario: d.aniversario,
          aceitaNovidades: !!d.aceitaNovidades,
        });
        montarPaginaConta();
        window.CerroAvisar && window.CerroAvisar('Conta criada. Bem-vinda à Cerrô.');
      } catch (erro) {
        recado(caixa, erro.message);
      } finally {
        botao.disabled = false; botao.textContent = 'Criar minha conta';
      }
    });

    /* Login */
    $('form[data-painel="entrar"]', painel).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.currentTarget;
      const caixa = $('[data-cerro="recado"]', painel);
      const d = Object.fromEntries(new FormData(f).entries());

      if (!Valida.email(d.email)) return recado(caixa, 'Confira o e-mail digitado.');
      if (!d.senha)               return recado(caixa, 'Digite sua senha.');

      const botao = $('button[type="submit"]', f);
      botao.disabled = true; botao.textContent = 'Entrando…';

      try {
        await Contas.entrar(d.email, d.senha);
        montarPaginaConta();
      } catch (erro) {
        recado(caixa, erro.message);
      } finally {
        botao.disabled = false; botao.textContent = 'Entrar';
      }
    });
  }

  /* --- Cliente conectada -------------------------------------------------- */

  function telaConectada(painel, cliente) {
    const primeiro = cliente.nome ? cliente.nome.split(' ')[0] : 'você';

    painel.innerHTML = `
      <p class="olho">Minha conta</p>
      <h2 style="margin-bottom:.4rem">Olá, ${esc(primeiro)}</h2>
      <p class="intro">Aqui ficam seus dados e as suas preferências de contato.</p>

      <div data-cerro="recado"></div>

      <div class="dados-conta" style="margin:2.5rem 0">
        <div class="dado"><b>Nome</b>${esc(cliente.nome)}</div>
        <div class="dado"><b>E-mail</b>${esc(cliente.email)}</div>
        <div class="dado"><b>WhatsApp</b>${esc(Valida.formatarWhats(cliente.whatsapp || ''))}</div>
        <div class="dado"><b>Novidades da Cerrô</b>${cliente.aceitaNovidades ? 'Autorizado' : 'Não autorizado'}</div>
      </div>

      <form data-cerro="form-preferencias">
        <h3>Editar dados</h3>

        <div class="campo">
          <label for="ed-nome">Nome completo</label>
          <input id="ed-nome" name="nome" type="text" value="${esc(cliente.nome)}" required>
        </div>

        <div class="dupla">
          <div class="campo">
            <label for="ed-whats">WhatsApp</label>
            <input id="ed-whats" name="whatsapp" type="tel" value="${esc(Valida.formatarWhats(cliente.whatsapp || ''))}" required>
          </div>
          <div class="campo">
            <label for="ed-nascimento">Data de nascimento</label>
            <input id="ed-nascimento" name="aniversario" type="date" value="${esc(cliente.aniversario || '')}">
          </div>
        </div>

        <label class="consentimento">
          <input type="checkbox" name="aceitaNovidades" ${cliente.aceitaNovidades ? 'checked' : ''}>
          <span>Quero receber novidades, lançamentos e ofertas da Cerrô por e-mail e WhatsApp.</span>
        </label>

        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.5rem">
          <button class="btn" type="submit">Salvar alterações</button>
          <button class="btn btn--vazado" type="button" data-cerro="sair">Sair da conta</button>
        </div>
      </form>`;

    const campoWhats = $('#ed-whats', painel);
    campoWhats.addEventListener('input', () => {
      campoWhats.value = Valida.formatarWhats(campoWhats.value);
    });

    $('[data-cerro="form-preferencias"]', painel).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const caixa = $('[data-cerro="recado"]', painel);
      const d = Object.fromEntries(new FormData(ev.currentTarget).entries());

      if (!Valida.whatsapp(d.whatsapp || '')) return recado(caixa, 'Confira o número de WhatsApp, com DDD.');

      try {
        await Contas.atualizar({
          nome: d.nome.trim(),
          whatsapp: Valida.normalizarWhats(d.whatsapp),
          aniversario: d.aniversario || null,
          aceitaNovidades: !!d.aceitaNovidades,
        });
        montarPaginaConta();
        window.CerroAvisar && window.CerroAvisar('Dados atualizados.');
      } catch (erro) {
        recado(caixa, erro.message);
      }
    });

    $('[data-cerro="sair"]', painel).addEventListener('click', () => {
      Contas.sair();
      montarPaginaConta();
    });
  }

  /* ======================================================================
     Newsletter da home, usando o mesmo consentimento
     ====================================================================== */

  function montarNewsletter() {
    const form = $('[data-cerro="newsletter"]');
    if (!form) return;

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = $('input[type="email"]', form).value;
      if (!Valida.email(email)) {
        window.CerroAvisar && window.CerroAvisar('Confira o e-mail digitado.');
        return;
      }
      /* Leva para o cadastro completo, já com o e-mail preenchido. */
      location.href = 'conta.html?aviso=florescer&email=' + encodeURIComponent(email);
    });
  }

  /* ======================================================================
     Rótulo "Entrar" / primeiro nome no cabeçalho
     ====================================================================== */

  function atualizarRotuloConta() {
    const el = $('[data-cerro="rotulo-conta"]');
    if (!el) return;
    const c = Contas.atual();
    el.textContent = c && c.nome ? c.nome.split(' ')[0] : 'Entrar';
  }

  /* ======================================================================
     Início
     ====================================================================== */

  function iniciar() {
    montarPaginaConta();
    montarNewsletter();
    atualizarRotuloConta();
    document.addEventListener('conta:mudou', atualizarRotuloConta);

    /* E-mail vindo da newsletter */
    const emailParam = new URLSearchParams(location.search).get('email');
    const campo = $('#cad-email');
    if (emailParam && campo) campo.value = emailParam;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
