const SUPABASE_URL = 'https://erwxchopsdbsxacwpvvw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3lAdjBxhuQGwEAIsti0fvQ_rFq0Nwci';

const hasSB =
  typeof supabase !== 'undefined' &&
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY.length > 20;

const sb = hasSB
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;


/* =========================
   FUNÇÕES BÁSICAS
========================= */

const $ = (s) => document.querySelector(s);

const money = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(v) || 0);

const today = () =>
  new Date().toISOString().slice(0, 10);


/* =========================
   ESTADO
========================= */

let state = {
  user: null,
  profile: null,
  transactions: [],
  goals: [],
  settings: null,
  accounts: [],
  local: JSON.parse(
    localStorage.getItem('makariaLocal') || 'null'
  )
};


/* =========================
   AUTENTICAÇÃO
========================= */

const authCard = () => $('#authCard');


function pinLock() {
  authCard().innerHTML = `
    <div style="text-align:center">

      <img
        src="logo.svg"
        style="width:76px"
        alt="Makaria"
      >

      <h1>Acesso protegido</h1>

      <p class="sub">
        Digite seu PIN para entrar na Makaria.
      </p>

      <div class="field">
        <input
          id="unlockPin"
          class="input"
          inputmode="numeric"
          maxlength="4"
          type="password"
          placeholder="PIN de 4 dígitos"
          style="text-align:center;letter-spacing:8px"
        >
      </div>

      <button
        class="btn primary full"
        onclick="unlock()"
      >
        Desbloquear
      </button>

      <div class="switch">
        <button class="link" onclick="logout()">
          Sair da conta
        </button>
      </div>

    </div>
  `;
}


async function unlock() {

  const pin = $('#unlockPin')?.value;

  if (pin !== localStorage.getItem('makariaPin')) {
    toast('PIN incorreto.');
    return;
  }

  localStorage.removeItem('makariaLocked');

  if (hasSB) {

    const { data, error } = await sb.auth.getSession();

    if (error) {
      toast('Não foi possível verificar sua sessão.');
      return;
    }

    if (data.session) {
      await start(data.session.user);
      return;
    }

  }

  if (state.local) {
    await start({
      id: 'local',
      email: state.local.email,
      user_metadata: {
        full_name: state.local.name
      }
    });
  }
}


/* =========================
   TELAS DE LOGIN
========================= */

function auth(mode = 'login') {

  if (!authCard()) return;

  if (mode === 'signup') {

    authCard().innerHTML = `

      <h1>Criar conta</h1>

      <p class="sub">
        Comece a construir uma vida financeira mais consciente.
      </p>

      <div class="field">
        <label>Nome completo</label>

        <input
          id="name"
          class="input"
          placeholder="Seu nome"
          autocomplete="name"
        >
      </div>

      <div class="field">
        <label>E-mail</label>

        <input
          id="email"
          class="input"
          type="email"
          placeholder="voce@email.com"
          autocomplete="email"
        >
      </div>

      <div class="field">
        <label>Senha</label>

        <input
          id="pass"
          class="input"
          type="password"
          placeholder="Mínimo de 6 caracteres"
          autocomplete="new-password"
        >
      </div>

      <button
        class="btn primary full"
        onclick="signup()"
      >
        Criar minha conta
      </button>

      <div class="switch">
        Já tem uma conta?
        <button class="link" onclick="auth('login')">
          Entrar
        </button>
      </div>

    `;

    return;
  }


  authCard().innerHTML = `

    <h1>Entrar</h1>

    <p class="sub">
      Acesse sua vida financeira com segurança.
    </p>

    <div class="field">
      <label>E-mail</label>

      <input
        id="email"
        class="input"
        type="email"
        placeholder="voce@email.com"
        autocomplete="email"
      >
    </div>

    <div class="field">
      <label>Senha</label>

      <input
        id="pass"
        class="input"
        type="password"
        placeholder="Sua senha"
        autocomplete="current-password"
      >
    </div>

    <button
      class="btn primary full"
      onclick="login()"
    >
      Entrar
    </button>

    <div class="switch">
      Ainda não tem conta?

      <button
        class="link"
        onclick="auth('signup')"
      >
        Criar conta
      </button>
    </div>

  `;
}


/* =========================
   CRIAR CONTA
========================= */

async function signup() {

  const email = $('#email')?.value.trim();
  const pass = $('#pass')?.value;
  const name = $('#name')?.value.trim();

  if (!email || !name) {
    toast('Preencha seu nome e e-mail.');
    return;
  }

  if (!pass || pass.length < 6) {
    toast('A senha precisa ter pelo menos 6 caracteres.');
    return;
  }

  if (!hasSB) {
    demoSignup();
    return;
  }


  try {

    const { data, error } =
      await sb.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name
          }
        }
      });


    if (error) {

      console.error('Erro Supabase:', error);

      toast(
        traduzirErroAuth(error.message)
      );

      return;
    }


    if (data.session && data.user) {

      toast('Conta criada com sucesso.');

      await start(data.user);

      return;
    }


    toast(
      'Conta criada. Verifique seu e-mail para continuar.'
    );

    auth('login');

  } catch (error) {

    console.error('Erro de conexão:', error);

    toast(
      'Falha na conexão com o Supabase. Verifique a URL e as configurações de autenticação.'
    );

  }
}


/* =========================
   LOGIN
========================= */

async function login() {

  const email = $('#email')?.value.trim();
  const pass = $('#pass')?.value;

  if (!email || !pass) {
    toast('Preencha e-mail e senha.');
    return;
  }

  if (!hasSB) {
    demoLogin();
    return;
  }


  try {

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password: pass
      });


    if (error) {

      console.error('Erro de login:', error);

      toast(
        traduzirErroAuth(error.message)
      );

      return;
    }


    if (!data.user) {
      toast('Não foi possível entrar.');
      return;
    }

    await start(data.user);

  } catch (error) {

    console.error('Erro de conexão:', error);

    toast(
      'Falha na conexão com o Supabase.'
    );

  }
}


/* =========================
   TRADUÇÃO DOS ERROS
========================= */

function traduzirErroAuth(message) {

  const msg = String(message || '').toLowerCase();

  if (msg.includes('failed to fetch')) {
    return 'Falha na conexão com o Supabase.';
  }

  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (msg.includes('user already registered')) {
    return 'Este e-mail já possui uma conta.';
  }

  if (msg.includes('password')) {
    return 'A senha informada não é válida.';
  }

  if (msg.includes('email')) {
    return 'Verifique o e-mail informado.';
  }

  return message || 'Ocorreu um erro. Tente novamente.';
}


/* =========================
   MODO LOCAL
========================= */

function demoSignup() {

  const email = $('#email')?.value.trim();
  const pass = $('#pass')?.value;
  const name = $('#name')?.value.trim();

  if (!email || !name || pass.length < 6) {
    toast('Preencha os campos corretamente.');
    return;
  }

  state.local = {
    email,
    name,
    pass,
    transactions: [],
    goals: [],
    accounts: [],
    settings: defaultSettings()
  };

  localStorage.setItem(
    'makariaLocal',
    JSON.stringify(state.local)
  );

  toast('Conta local criada.');

  demoLogin();
}


function demoLogin() {

  if (!state.local) {
    toast('Crie uma conta primeiro.');
    return;
  }

  const email = $('#email')?.value.trim();
  const pass = $('#pass')?.value;

  if (
    email !== state.local.email ||
    pass !== state.local.pass
  ) {
    toast('E-mail ou senha incorretos.');
    return;
  }

  start({
    id: 'local',
    email: state.local.email,
    user_metadata: {
      full_name: state.local.name
    }
  });
}


/* =========================
   CONFIGURAÇÕES PADRÃO
========================= */

function defaultSettings() {

  return {
    salary: 2759.74,
    advance_pct: 40,
    inss_pct: 9,
    assist_pct: 2,
    life: 3.82,
    negocial: 21,
    card_limit: 0
  };
}


/* =========================
   INICIALIZAÇÃO
========================= */

async function start(user) {

  state.user = user;

  $('#auth')?.classList.add('hidden');
  $('#shell')?.classList.remove('hidden');

  await load();

  render('home');
}


/* =========================
   CARREGAMENTO DOS DADOS
========================= */

async function load() {

  if (!hasSB) {

    state.transactions =
      state.local?.transactions || [];

    state.goals =
      state.local?.goals || [];

    state.accounts =
      state.local?.accounts || [];

    state.settings =
      state.local?.settings || defaultSettings();

    return;
  }


  try {

    const [
      transactions,
      goals,
      accounts,
      settings,
      profile
    ] = await Promise.all([

      sb
        .from('transactions')
        .select('*')
        .order('tx_date', {
          ascending: false
        }),

      sb
        .from('goals')
        .select('*'),

      sb
        .from('accounts')
        .select('*'),

      sb
        .from('settings')
        .select('*')
        .maybeSingle(),

      sb
        .from('profiles')
        .select('*')
        .maybeSingle()

    ]);


    if (transactions.error) {
      console.error(
        'Erro transactions:',
        transactions.error
      );
    }

    if (goals.error) {
      console.error(
        'Erro goals:',
        goals.error
      );
    }

    if (accounts.error) {
      console.error(
        'Erro accounts:',
        accounts.error
      );
    }

    if (settings.error) {
      console.error(
        'Erro settings:',
        settings.error
      );
    }

    if (profile.error) {
      console.error(
        'Erro profile:',
        profile.error
      );
    }


    state.transactions =
      transactions.data || [];

    state.goals =
      goals.data || [];

    state.accounts =
      accounts.data || [];

    state.settings =
      settings.data || defaultSettings();

    state.profile =
      profile.data || {};

  } catch (error) {

    console.error(
      'Erro ao carregar dados:',
      error
    );

    state.transactions = [];
    state.goals = [];
    state.accounts = [];
    state.settings = defaultSettings();
    state.profile = {};
  }
}


/* =========================
   SALVAR LOCAL
========================= */

function persistLocal() {

  if (!state.local) return;

  state.local.transactions =
    state.transactions;

  state.local.goals =
    state.goals;

  state.local.accounts =
    state.accounts;

  state.local.settings =
    state.settings;

  localStorage.setItem(
    'makariaLocal',
    JSON.stringify(state.local)
  );
}


/* =========================
   SALÁRIO
========================= */

function net() {

  const s =
    state.settings || defaultSettings();

  const salary =
    Number(s.salary || 0);

  const inss =
    Number(s.inss_pct || 0);

  const assist =
    Number(s.assist_pct || 0);

  const life =
    Number(s.life || 0);

  const negocial =
    Number(s.negocial || 0);

  return (
    salary *
      (
        1 -
        inss / 100 -
        assist / 100
      )
    -
    life -
    negocial
  );
}


/* =========================
   TRANSAÇÕES DO MÊS
========================= */

function monthTx() {

  const month =
    new Date()
      .toISOString()
      .slice(0, 7);

  return state.transactions.filter(
    x =>
      String(x.tx_date)
        .slice(0, 7) === month
  );
}


/* =========================
   RENDERIZAÇÃO
========================= */

function render(viewName) {

  const view = $('#view');

  if (!view) return;

  if (viewName === 'home') {
    view.innerHTML = home();
  }

  if (viewName === 'transactions') {
    view.innerHTML = transactions();
  }

  if (viewName === 'goals') {
    view.innerHTML = goals();
  }

  if (viewName === 'profile') {
    view.innerHTML = profile();
  }
}


/* =========================
   HOME
========================= */

function home() {

  const tx = monthTx();

  const inc =
    tx
      .filter(x => x.type === 'income')
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  const exp =
    tx
      .filter(x => x.type === 'expense')
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  const inv =
    tx
      .filter(x => x.type === 'investment')
      .reduce(
        (a, x) =>
          a + Number(x.amount || 0),
        0
      );

  const available =
    net() - exp - inv;


  const alerts =
    exp >
    Number(state.settings?.salary || 0) * 0.3
      ? 'Você já consumiu uma parcela relevante da sua renda neste mês.'
      : '';


  const name =
    state.user?.user_metadata?.full_name ||
    state.profile?.full_name ||
    'bem-vinda';


  return `

    <div class="page">

      <div class="greeting">

        <div>

          <div class="eyebrow">
            Planejamento financeiro
          </div>

          <div class="welcome">
            Olá, ${esc(name)}.
          </div>

          <div class="sub">
            Tenha clareza sobre cada decisão.
          </div>

        </div>

        <span class="pill">
          ${new Date().toLocaleDateString(
            'pt-BR',
            {
              month: 'long',
              year: 'numeric'
            }
          )}
        </span>

      </div>


      <div class="balance">

        <small>
          Patrimônio disponível estimado
        </small>

        <div class="value">
          ${money(available)}
        </div>

        <small>
          salário líquido de referência:
          ${money(net())}
        </small>

      </div>


      <div class="grid">

        <div class="card">
          <div class="metric">
            Receitas
          </div>

          <strong>
            ${money(inc)}
          </strong>
        </div>


        <div class="card">
          <div class="metric">
            Despesas
          </div>

          <strong>
            ${money(exp)}
          </strong>
        </div>


        <div class="card">
          <div class="metric">
            Investimentos
          </div>

          <strong>
            ${money(inv)}
          </strong>
        </div>


        <div class="card">
          <div class="metric">
            Metas
          </div>

          <strong>
            ${state.goals.length}
          </strong>
        </div>

      </div>


      ${
        alerts
          ? `<div class="alert">${alerts}</div>`
          : ''
      }


      <section class="section">

        <div class="section-head">

          <h3>
            Visão do mês
          </h3>

          <span class="pill">
            ${tx.length} lançamentos
          </span>

        </div>


        <div class="card">

          <div class="metric">
            Receitas

            <b style="float:right">
              ${money(inc)}
            </b>
          </div>

          <div class="progress">
            <i style="width:${inc ? 100 : 0}%"></i>
          </div>


          <div
            class="metric"
            style="margin-top:14px"
          >
            Despesas

            <b style="float:right">
              ${money(exp)}
            </b>
          </div>

          <div class="progress">

            <i style="width:${
              inc
                ? Math.min(
                    100,
                    (exp / inc) * 100
                  )
                : 0
            }%"></i>

          </div>

        </div>

      </section>


      <section class="section">

        <div class="section-head">

          <h3>
            Últimos lançamentos
          </h3>

          <button
            class="link"
            onclick="render('transactions')"
          >
            Ver todos
          </button>

        </div>


        <div class="card">

          ${
            tx
              .slice(0, 4)
              .map(txRow)
              .join('')
            ||
            '<div class="empty">Ainda não há lançamentos neste mês.</div>'
          }

        </div>

      </section>

    </div>

  `;
}


/* =========================
   LINHA DE TRANSAÇÃO
========================= */

function txRow(x) {

  const icon =
    x.type === 'income'
      ? '↑'
      : x.type === 'investment'
        ? '↗'
        : '−';


  const amountClass =
    x.type === 'income'
      ? 'income'
      : x.type === 'expense'
        ? 'expense'
        : '';


  const signal =
    x.type === 'income'
      ? '+'
      : '-';


  return `

    <div class="transaction">

      <div class="tx-icon">
        ${icon}
      </div>


      <div class="tx-main">

        <strong>
          ${esc(
            x.description ||
            x.category ||
            'Lançamento'
          )}
        </strong>

        <small>
          ${esc(x.category || 'Outros')}
          ·
          ${new Date(
            x.tx_date + 'T12:00:00'
          ).toLocaleDateString('pt-BR')}
        </small>

      </div>


      <div
        class="amount ${amountClass}"
      >
        ${signal}
        ${money(x.amount)}
      </div>

    </div>

  `;
}


/* =========================
   LANÇAMENTOS
========================= */

function transactions() {

  return `

    <div class="page">

      <div class="section-head">

        <div>

          <div class="eyebrow">
            Movimentações
          </div>

          <h2>
            Lançamentos
          </h2>

        </div>

        <button
          class="btn primary"
          onclick="openTx()"
        >
          + Novo
        </button>

      </div>


      <div class="card">

        ${
          state.transactions
            .map(txRow)
            .join('')
          ||
          '<div class="empty">Nenhum lançamento cadastrado.</div>'
        }

      </div>

    </div>

  `;
}


/* =========================
   METAS
========================= */

function goals() {

  return `

    <div class="page">

      <div class="section-head">

        <div>

          <div class="eyebrow">
            Construção de patrimônio
          </div>

          <h2>
            Metas
          </h2>

        </div>


        <button
          class="btn primary"
          onclick="openGoal()"
        >
          + Nova
        </button>

      </div>


      ${
        state.goals
          .map(g => {

            const target =
              Number(g.target || 0);

            const saved =
              Number(g.saved || 0);

            const percent =
              target
                ? Math.min(
                    100,
                    (saved / target) * 100
                  )
                : 0;

            return `

              <div class="card goal">

                <div class="goal-top">

                  <strong>
                    ${esc(g.name)}
                  </strong>

                  <span>
                    ${money(saved)}
                    /
                    ${money(target)}
                  </span>

                </div>


                <div class="progress">

                  <i
                    style="width:${percent}%"
                  ></i>

                </div>


                <small>
                  ${Math.round(percent)}%
                  concluído
                </small>

              </div>

            `;
          })
          .join('')
        ||
        '<div class="card empty">Crie sua primeira meta financeira.</div>'
      }

    </div>

  `;
}


/* =========================
   PERFIL
========================= */

function profile() {

  const name =
    state.user?.user_metadata?.full_name ||
    state.profile?.full_name ||
    'Minha conta';


  const initial =
    name
      .charAt(0)
      .toUpperCase();


  return `

    <div class="page">

      <div class="profile-card card">

        <div class="avatar">
          ${initial}
        </div>

        <h2>
          ${esc(name)}
        </h2>

        <div class="sub">
          ${esc(state.user?.email || '')}
        </div>

      </div>


      <div
        class="card"
        style="margin-top:12px"
      >

        <div class="settings-item">

          <span>
            Salário bruto
          </span>

          <strong>
            ${money(state.settings?.salary)}
          </strong>

        </div>


        <div class="settings-item">

          <span>
            Adiantamento
          </span>

          <strong>
            ${Number(
              state.settings?.advance_pct || 0
            )}%
          </strong>

        </div>


        <div class="settings-item">

          <span>
            INSS configurado
          </span>

          <strong>
            ${Number(
              state.settings?.inss_pct || 0
            )}%
          </strong>

        </div>


        <div class="settings-item">

          <span>
            PIN local
          </span>

          <button
            class="link"
            onclick="setPin()"
          >
            Configurar
          </button>

        </div>


        <div class="settings-item">

          <span>
            Bloqueio automático
          </span>

          <button
            class="link"
            onclick="lockApp()"
          >
            Bloquear
          </button>

        </div>

      </div>


      <button
        class="btn secondary full"
        onclick="logout()"
      >
        Sair da conta
      </button>

    </div>

  `;
}


/* =========================
   NOVA TRANSAÇÃO
========================= */

function openTx() {

  modal(`

    <div class="sheet">

      <div class="sheet-head">

        <h2>
          Novo lançamento
        </h2>

        <button
          class="close"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>


      <div class="field">

        <label>
          Tipo
        </label>

        <select
          id="tt"
          class="input"
        >

          <option value="expense">
            Despesa
          </option>

          <option value="income">
            Receita
          </option>

          <option value="investment">
            Investimento
          </option>

        </select>

      </div>


      <div class="row">

        <div class="field">

          <label>
            Valor
          </label>

          <input
            id="ta"
            class="input"
            type="number"
            step="0.01"
            placeholder="0,00"
          >

        </div>


        <div class="field">

          <label>
            Data
          </label>

          <input
            id="td"
            class="input"
            type="date"
            value="${today()}"
          >

        </div>

      </div>


      <div class="field">

        <label>
          Categoria
        </label>

        <input
          id="tc"
          class="input"
          placeholder="Alimentação, transporte..."
        >

      </div>


      <div class="field">

        <label>
          Descrição
        </label>

        <input
          id="txd"
          class="input"
          placeholder="Ex.: supermercado"
        >

      </div>


      <button
        class="btn primary full"
        onclick="saveTx()"
      >
        Salvar lançamento
      </button>

    </div>

  `);
}


/* =========================
   SALVAR TRANSAÇÃO
========================= */

async function saveTx() {

  const x = {

    type: $('#tt')?.value,

    amount:
      Number($('#ta')?.value || 0),

    tx_date:
      $('#td')?.value,

    category:
      $('#tc')?.value ||
      'Outros',

    description:
      $('#txd')?.value || ''

  };


  if (!x.amount) {
    toast('Informe um valor.');
    return;
  }


  if (hasSB) {

    x.user_id =
      state.user.id;


    const { error } =
      await sb
        .from('transactions')
        .insert(x);


    if (error) {

      console.error(
        'Erro ao salvar lançamento:',
        error
      );

      toast(error.message);

      return;
    }

  } else {

    state.transactions.unshift({
      ...x,
      id: Date.now()
    });

    persistLocal();
  }


  closeModal();

  await load();

  render('transactions');

  toast('Lançamento salvo.');
}


/* =========================
   NOVA META
========================= */

function openGoal() {

  modal(`

    <div class="sheet">

      <div class="sheet-head">

        <h2>
          Nova meta
        </h2>

        <button
          class="close"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>


      <div class="field">

        <label>
          Nome
        </label>

        <input
          id="gn"
          class="input"
          placeholder="Ex.: viagem"
        >

      </div>


      <div class="row">

        <div class="field">

          <label>
            Objetivo
          </label>

          <input
            id="gt"
            class="input"
            type="number"
            step="0.01"
          >

        </div>


        <div class="field">

          <label>
            Já guardado
          </label>

          <input
            id="gs"
            class="input"
            type="number"
            step="0.01"
            value="0"
          >

        </div>

      </div>


      <button
        class="btn primary full"
        onclick="saveGoal()"
      >
        Criar meta
      </button>

    </div>

  `);
}


/* =========================
   SALVAR META
========================= */

async function saveGoal() {

  const g = {

    name:
      $('#gn')?.value.trim(),

    target:
      Number($('#gt')?.value || 0),

    saved:
      Number($('#gs')?.value || 0)

  };


  if (!g.name || !g.target) {
    toast('Preencha nome e objetivo.');
    return;
  }


  if (hasSB) {

    g.user_id =
      state.user.id;


    const { error } =
      await sb
        .from('goals')
        .insert(g);


    if (error) {

      console.error(
        'Erro ao salvar meta:',
        error
      );

      toast(error.message);

      return;
    }

  } else {

    state.goals.push({
      ...g,
      id: Date.now()
    });

    persistLocal();
  }


  closeModal();

  await load();

  render('goals');

  toast('Meta criada.');
}


/* =========================
   PIN
========================= */

function setPin() {

  const p =
    prompt(
      'Crie um PIN de 4 dígitos.'
    );


  if (!/^\d{4}$/.test(p || '')) {

    toast(
      'O PIN precisa ter 4 dígitos.'
    );

    return;
  }


  localStorage.setItem(
    'makariaPin',
    p
  );

  toast(
    'PIN configurado.'
  );
}


function lockApp() {

  if (!localStorage.getItem('makariaPin')) {

    toast(
      'Configure um PIN primeiro.'
    );

    return;
  }

  localStorage.setItem(
    'makariaLocked',
    '1'
  );

  location.reload();
}


/* =========================
   MODAL / TOAST
========================= */

function modal(html) {

  const el = $('#modal');

  if (!el) return;

  el.innerHTML = html;

  el.classList.remove('hidden');
}


function closeModal() {

  $('#modal')?.classList.add(
    'hidden'
  );
}


function toast(text) {

  const e =
    document.createElement('div');

  e.className = 'toast';

  e.textContent = text;

  document.body.appendChild(e);

  setTimeout(
    () => e.remove(),
    3000
  );
}


/* =========================
   ESCAPE HTML
========================= */

function esc(s) {

  return String(s || '')
    .replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  try {

    if (hasSB) {
      await sb.auth.signOut();
    }

  } catch (error) {

    console.error(
      'Erro ao sair:',
      error
    );

  }


  state.user = null;

  $('#shell')?.classList.add(
    'hidden'
  );

  $('#auth')?.classList.remove(
    'hidden'
  );

  auth('login');
}


/* =========================
   NAVEGAÇÃO
========================= */

const addBtn =
  $('#addBtn');

if (addBtn) {
  addBtn.onclick = openTx;
}


document
  .querySelectorAll(
    '.bottom button[data-view]'
  )
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(
          '.bottom button'
        )
        .forEach(x =>
          x.classList.remove(
            'active'
          )
        );

      button.classList.add(
        'active'
      );

      render(
        button.dataset.view
      );
    };

  });


const lockBtn =
  $('#lockBtn');

if (lockBtn) {
  lockBtn.onclick = lockApp;
}


/* =========================
   INICIALIZAÇÃO
========================= */

(async function init() {

  console.log(
    'Makaria iniciando...'
  );

  console.log(
    'Supabase carregado:',
    typeof supabase !== 'undefined'
  );

  console.log(
    'Conexão Supabase:',
    hasSB
  );


  if (
    localStorage.getItem(
      'makariaLocked'
    ) === '1' &&
    localStorage.getItem(
      'makariaPin'
    )
  ) {

    pinLock();

    return;
  }


  auth('login');


  if (!hasSB) {

    console.error(
      'Supabase não foi carregado corretamente.'
    );

    return;
  }


  try {

    const {
      data,
      error
    } = await sb.auth.getSession();


    if (error) {

      console.error(
        'Erro ao recuperar sessão:',
        error
      );

      return;
    }


    if (data.session) {

      await start(
        data.session.user
      );

    }

  } catch (error) {

    console.error(
      'Erro na inicialização:',
      error
    );

  }

})();
