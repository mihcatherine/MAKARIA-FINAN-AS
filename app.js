const SUPABASE_URL = 'https://erwxchopsdbsxacwpvvw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3lAdjBxhuQGwEAIsti0fvQ_rFq0Nwci';

const hasSB =
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY.length > 20;

const sb = hasSB
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = s => document.querySelector(s);

const money = v =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(v) || 0);

const today = () =>
  new Date().toISOString().slice(0, 10);

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
        <button
          class="link"
          onclick="logout()"
        >
          Sair da conta
        </button>
      </div>

    </div>
  `;
}


async function unlock() {

  const pin = $('#unlockPin')?.value;

  if (
    pin === localStorage.getItem('makariaPin')
  ) {

    localStorage.removeItem('makariaLocked');

    if (hasSB) {

      const { data, error } =
        await sb.auth.getSession();

      if (error) {
        return toast(
          'Não foi possível recuperar sua sessão.'
        );
      }

      if (data.session) {
        await start(data.session.user);
      } else {
        auth('login');
      }

    } else if (state.local) {

      await start({
        id: 'local',
        email: state.local.email,
        user_metadata: {
          full_name: state.local.name
        }
      });

    } else {

      auth('login');

    }

  } else {

    toast('PIN incorreto.');

  }
}


function auth(mode = 'login') {

  authCard().innerHTML =
    mode === 'signup'

      ? `
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
          >
        </div>

        <div class="field">
          <label>E-mail</label>

          <input
            id="email"
            class="input"
            type="email"
            placeholder="voce@email.com"
          >
        </div>

        <div class="field">
          <label>Senha</label>

          <input
            id="pass"
            class="input"
            type="password"
            placeholder="Mínimo de 6 caracteres"
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

          <button
            class="link"
            onclick="auth('login')"
          >
            Entrar
          </button>
        </div>
      `

      : `
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
          >
        </div>

        <div class="field">
          <label>Senha</label>

          <input
            id="pass"
            class="input"
            type="password"
            placeholder="Sua senha"
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
   CADASTRO
========================= */

async function signup() {

  if (!hasSB) {
    return demoSignup();
  }

  const email =
    $('#email').value.trim();

  const pass =
    $('#pass').value;

  const name =
    $('#name').value.trim();

  if (!email) {
    return toast('Informe seu e-mail.');
  }

  if (pass.length < 6) {
    return toast(
      'A senha precisa ter pelo menos 6 caracteres.'
    );
  }

  if (!name) {
    return toast('Informe seu nome.');
  }

  try {

    const { data, error } =
      await sb.auth.signUp({
        email: email,
        password: pass,
        options: {
          data: {
            full_name: name
          }
        }
      });

    if (error) {
      console.error(
        'Erro Supabase:',
        error
      );

      return toast(
        traduzErroAuth(error)
      );
    }

    if (
      data.user &&
      !data.session
    ) {

      toast(
        'Conta criada. Verifique seu e-mail para confirmar o cadastro.'
      );

      auth('login');

      return;
    }

    if (data.user) {

      toast('Conta criada com sucesso.');

      await start(data.user);

    }

  } catch (error) {

    console.error(
      'Erro de conexão:',
      error
    );

    toast(
      'Não foi possível conectar ao Supabase.'
    );

  }
}


/* =========================
   LOGIN
========================= */

async function login() {

  if (!hasSB) {
    return demoLogin();
  }

  const email =
    $('#email').value.trim();

  const pass =
    $('#pass').value;

  if (!email || !pass) {
    return toast(
      'Preencha e-mail e senha.'
    );
  }

  try {

    const { data, error } =
      await sb.auth.signInWithPassword({
        email: email,
        password: pass
      });

    if (error) {

      console.error(
        'Erro de login:',
        error
      );

      return toast(
        traduzErroAuth(error)
      );
    }

    if (!data.user) {
      return toast(
        'Não foi possível identificar sua conta.'
      );
    }

    await start(data.user);

  } catch (error) {

    console.error(
      'Erro de conexão:',
      error
    );

    toast(
      'Não foi possível conectar ao Supabase.'
    );

  }
}


/* =========================
   TRADUÇÃO DE ERROS
========================= */

function traduzErroAuth(error) {

  const msg =
    String(error?.message || '')
      .toLowerCase();

  if (
    msg.includes('user already registered')
  ) {
    return 'Este e-mail já está cadastrado.';
  }

  if (
    msg.includes('invalid login credentials')
  ) {
    return 'E-mail ou senha incorretos.';
  }

  if (
    msg.includes('email not confirmed')
  ) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (
    msg.includes('password')
  ) {
    return 'Verifique sua senha.';
  }

  if (
    msg.includes('fetch') ||
    msg.includes('network')
  ) {
    return 'Falha na conexão com o Supabase. Verifique a URL e as configurações de autenticação.';
  }

  return error?.message ||
    'Ocorreu um erro. Tente novamente.';
}


/* =========================
   MODO LOCAL
========================= */

function demoSignup() {

  const email =
    $('#email').value.trim();

  const pass =
    $('#pass').value;

  const name =
    $('#name').value.trim();

  if (
    !email ||
    pass.length < 6 ||
    !name
  ) {
    return toast(
      'Preencha os campos corretamente.'
    );
  }

  state.local = {
    email,
    name,
    pass
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
    return toast(
      'Crie uma conta primeiro.'
    );
  }

  if (
    $('#email').value.trim() !==
      state.local.email ||
    $('#pass').value !==
      state.local.pass
  ) {
    return toast(
      'E-mail ou senha incorretos.'
    );
  }

  start({
    id: 'local',
    email: state.local.email,
    user_metadata: {
      full_name:
        state.local.name
    }
  });
}


/* =========================
   INICIALIZAÇÃO
========================= */

async function start(user) {

  state.user = user;

  $('#auth')
    .classList
    .add('hidden');

  $('#shell')
    .classList
    .remove('hidden');

  await load();

  render('home');
}


/* =========================
   CARREGAR DADOS
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
      state.local?.settings || {
        salary: 2759.74,
        advance_pct: 40,
        inss_pct: 9,
        assist_pct: 2,
        life: 3.82,
        negocial: 21,
        card_limit: 0
      };

    return;
  }

  try {

    const results =
      await Promise.all([

        sb
          .from('transactions')
          .select('*')
          .order(
            'tx_date',
            {
              ascending: false
            }
          ),

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

    state.transactions =
      results[0].data || [];

    state.goals =
      results[1].data || [];

    state.accounts =
      results[2].data || [];

    state.settings =
      results[3].data || {
        salary: 2759.74,
        advance_pct: 40,
        inss_pct: 9,
        assist_pct: 2,
        life: 3.82,
        negocial: 21,
        card_limit: 0
      };

    state.profile =
      results[4].data || {};

  } catch (error) {

    console.error(
      'Erro ao carregar dados:',
      error
    );

    toast(
      'Conta conectada, mas não foi possível carregar os dados.'
    );

  }
}


/* =========================
   SALVAR LOCAL
========================= */

function persistLocal() {

  if (!state.local) {
    return;
  }

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
    JSON.stringify(
      state.local
    )
  );
}


/* =========================
   CÁLCULOS
========================= */

function net() {

  const s =
    state.settings || {};

  return (
    Number(s.salary || 0) *
      (
        1 -
        Number(s.inss_pct || 0) / 100 -
        Number(s.assist_pct || 0) / 100
      )
    -
    Number(s.life || 0)
    -
    Number(s.negocial || 0)
  );
}


function monthTx() {

  const m =
    new Date()
      .toISOString()
      .slice(0, 7);

  return state.transactions
    .filter(x =>
      String(x.tx_date)
        .slice(0, 7) === m
    );
}


/* =========================
   RENDERIZAÇÃO
========================= */

function render(v) {

  const view =
    $('#view');

  if (v === 'home') {
    view.innerHTML =
      home();
  }

  if (v === 'transactions') {
    view.innerHTML =
      transactions();
  }

  if (v === 'goals') {
    view.innerHTML =
      goals();
  }

  if (v === 'profile') {
    view.innerHTML =
      profile();
  }
}


/* =========================
   HOME
========================= */

function home() {

  const tx =
    monthTx();

  const inc =
    tx
      .filter(x =>
        x.type === 'income'
      )
      .reduce(
        (a, x) =>
          a + Number(x.amount),
        0
      );

  const exp =
    tx
      .filter(x =>
        x.type === 'expense'
      )
      .reduce(
        (a, x) =>
          a + Number(x.amount),
        0
      );

  const inv =
    tx
      .filter(x =>
        x.type === 'investment'
      )
      .reduce(
        (a, x) =>
          a + Number(x.amount),
        0
      );

  const available =
    net() - exp - inv;

  let alerts =
    exp >
    Number(
      state.settings?.salary || 0
    ) * 0.3
      ? 'Você já consumiu uma parcela relevante da sua renda neste mês.'
      : '';

  return `

    <div class="page">

      <div class="greeting">

        <div>

          <div class="eyebrow">
            Planejamento financeiro
          </div>

          <div class="welcome">
            Olá,
            ${
              esc(
                state.user?.user_metadata?.full_name ||
                state.profile?.full_name ||
                ''
              ) ||
              'bem-vinda'
            }.
          </div>

          <div class="sub">
            Tenha clareza sobre cada decisão.
          </div>

        </div>

        <span class="pill">
          ${
            new Date()
              .toLocaleDateString(
                'pt-BR',
                {
                  month: 'long',
                  year: 'numeric'
                }
              )
          }
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
          ? `
            <div class="alert">
              ${alerts}
            </div>
          `
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
            <i
              style="width:${Math.min(
                100,
                inc ? 100 : 0
              )}%"
            ></i>
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

            <i
              style="width:${Math.min(
                100,
                inc
                  ? (exp / inc) * 100
                  : 0
              )}%"
            ></i>

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
            `
              <div class="empty">
                Ainda não há lançamentos neste mês.
              </div>
            `
          }

        </div>

      </section>

    </div>

  `;
}


/* =========================
   LINHA DE LANÇAMENTO
========================= */

function txRow(x) {

  return `

    <div class="transaction">

      <div class="tx-icon">
        ${
          x.type === 'income'
            ? '↑'
            : x.type === 'investment'
              ? '↗'
              : '−'
        }
      </div>


      <div class="tx-main">

        <strong>
          ${esc(
            x.description ||
            x.category
          )}
        </strong>

        <small>
          ${esc(x.category)}
          ·
          ${
            new Date(
              x.tx_date +
              'T12:00:00'
            )
              .toLocaleDateString(
                'pt-BR'
              )
          }
        </small>

      </div>


      <div
        class="amount ${
          x.type === 'income'
            ? 'income'
            : x.type === 'expense'
              ? 'expense'
              : ''
        }"
      >

        ${
          x.type === 'income'
            ? '+'
            : '-'
        }

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
          `
            <div class="empty">
              Nenhum lançamento cadastrado.
            </div>
          `
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

            const percent =
              Number(g.target)
                ? (
                    Number(g.saved) /
                    Number(g.target)
                  ) * 100
                : 0;

            return `

              <div class="card goal">

                <div class="goal-top">

                  <strong>
                    ${esc(g.name)}
                  </strong>

                  <span>
                    ${money(g.saved)}
                    /
                    ${money(g.target)}
                  </span>

                </div>


                <div class="progress">

                  <i
                    style="width:${Math.min(
                      100,
                      percent
                    )}%"
                  ></i>

                </div>


                <small>
                  ${Math.min(
                    100,
                    Math.round(percent)
                  )}% concluído
                </small>

              </div>

            `;

          })
          .join('')

        ||

        `
          <div class="card empty">
            Crie sua primeira meta financeira.
          </div>
        `
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

  return `

    <div class="page">

      <div class="profile-card card">

        <div class="avatar">
          ${name[0].toUpperCase()}
        </div>

        <h2>
          ${esc(name)}
        </h2>

        <div class="sub">
          ${esc(
            state.user?.email ||
            ''
          )}
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
            ${money(
              state.settings?.salary
            )}
          </strong>

        </div>


        <div class="settings-item">

          <span>
            Adiantamento
          </span>

          <strong>
            ${Number(
              state.settings?.advance_pct ||
              0
            )}%
          </strong>

        </div>


        <div class="settings-item">

          <span>
            INSS configurado
          </span>

          <strong>
            ${Number(
              state.settings?.inss_pct ||
              0
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
   NOVO LANÇAMENTO
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
   SALVAR LANÇAMENTO
========================= */

async function saveTx() {

  const x = {

    type:
      $('#tt').value,

    amount:
      Number(
        $('#ta').value
      ),

    tx_date:
      $('#td').value,

    category:
      $('#tc').value ||
      'Outros',

    description:
      $('#txd').value

  };


  if (!x.amount) {
    return toast(
      'Informe um valor.'
    );
  }


  if (!x.tx_date) {
    return toast(
      'Informe a data.'
    );
  }


  if (hasSB) {

    x.user_id =
      state.user.id;

    const {
      error
    } =
      await sb
        .from('transactions')
        .insert(x);

    if (error) {

      console.error(
        error
      );

      return toast(
        'Erro ao salvar lançamento: ' +
        error.message
      );

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

  toast(
    'Lançamento salvo.'
  );
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
      $('#gn')
        .value
        .trim(),

    target:
      Number(
        $('#gt').value
      ),

    saved:
      Number(
        $('#gs').value ||
        0
      )

  };


  if (!g.name) {
    return toast(
      'Informe o nome da meta.'
    );
  }


  if (!g.target) {
    return toast(
      'Informe o valor do objetivo.'
    );
  }


  if (hasSB) {

    g.user_id =
      state.user.id;

    const {
      error
    } =
      await sb
        .from('goals')
        .insert(g);

    if (error) {

      console.error(
        error
      );

      return toast(
        'Erro ao criar meta: ' +
        error.message
      );

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

  toast(
    'Meta criada.'
  );
}


/* =========================
   PIN
========================= */

function setPin() {

  const p =
    prompt(
      'Crie um PIN de 4 dígitos.'
    );

  if (
    !/^\d{4}$/.test(
      p || ''
    )
  ) {
    return toast(
      'O PIN precisa ter 4 dígitos.'
    );
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

  if (
    !localStorage.getItem(
      'makariaPin'
    )
  ) {
    return toast(
      'Configure um PIN primeiro.'
    );
  }

  localStorage.setItem(
    'makariaLocked',
    '1'
  );

  location.reload();
}


/* =========================
   MODAL
========================= */

function modal(html) {

  $('#modal').innerHTML =
    html;

  $('#modal')
    .classList
    .remove('hidden');
}


function closeModal() {

  $('#modal')
    .classList
    .add('hidden');
}


/* =========================
   TOAST
========================= */

function toast(t) {

  const e =
    document.createElement(
      'div'
    );

  e.className =
    'toast';

  e.textContent =
    t;

  document.body.appendChild(
    e
  );

  setTimeout(
    () => e.remove(),
    3000
  );
}


/* =========================
   ESCAPE HTML
========================= */

function esc(s) {

  return String(
    s || ''
  ).replace(
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

  if (hasSB) {

    try {
      await sb.auth.signOut();
    } catch (error) {
      console.error(
        'Erro ao sair:',
        error
      );
    }

  }

  state.user =
    null;

  $('#shell')
    .classList
    .add('hidden');

  $('#auth')
    .classList
    .remove('hidden');

  auth('login');
}


/* =========================
   NAVEGAÇÃO
========================= */

if ($('#addBtn')) {

  $('#addBtn')
    .onclick =
    openTx;

}


document
  .querySelectorAll(
    '.bottom button[data-view]'
  )
  .forEach(b => {

    b.onclick = () => {

      document
        .querySelectorAll(
          '.bottom button'
        )
        .forEach(x =>
          x.classList
            .remove('active')
        );

      b.classList
        .add('active');

      render(
        b.dataset.view
      );

    };

  });


if ($('#lockBtn')) {

  $('#lockBtn')
    .onclick =
    lockApp;

}


/* =========================
   INÍCIO DA APLICAÇÃO
========================= */

(async () => {

  try {

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


    if (hasSB) {

      const {
        data,
        error
      } =
        await sb.auth.getSession();

      if (error) {

        console.error(
          'Erro ao recuperar sessão:',
          error
        );

        return;
      }


      if (
        data.session
      ) {

        await start(
          data.session.user
        );

      }

    }

  } catch (error) {

    console.error(
      'Erro ao iniciar Makaria:',
      error
    );

    toast(
      'Erro ao iniciar a aplicação.'
    );

  }

})();
