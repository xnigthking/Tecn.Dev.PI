/* dashboard.js
   Versão adaptada para o HTML fornecido por você.
   - Compatível com IDs e classes presentes no HTML enviado.
   - CRUD simples, localStorage, navegação, overview update.
*/

const APP_KEY = "mf_state_v1";

/* ---------------------------
   Pequenos utilitários
   --------------------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const uid = (p = "") => p + Math.random().toString(36).slice(2, 9);
const escapeHtml = (str) => {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/* ---------------------------
   Toast (acessível, mínimo)
   --------------------------- */
;(function createToastRegion() {
  if ($("#mf-toast")) return;
  const t = document.createElement("div");
  t.id = "mf-toast";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  t.style.position = "fixed";
  t.style.right = "16px";
  t.style.bottom = "16px";
  t.style.zIndex = 9999;
  t.style.minWidth = "160px";
  t.style.maxWidth = "320px";
  t.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
  t.style.fontSize = "13px";
  t.style.boxShadow = "0 6px 18px rgba(0,0,0,.12)";
  t.style.padding = "8px 12px";
  t.style.borderRadius = "8px";
  t.style.background = "rgba(0,0,0,0.75)";
  t.style.color = "#fff";
  t.style.opacity = "0";
  t.style.transition = "opacity .2s ease";
  t.setAttribute("aria-hidden", "true");
  document.body.appendChild(t);

  window.showToast = (msg = "", ms = 1800) => {
    t.textContent = msg;
    t.style.opacity = "1";
    t.removeAttribute("aria-hidden");
    clearTimeout(t._tm);
    t._tm = setTimeout(() => {
      t.style.opacity = "0";
      t.setAttribute("aria-hidden", "true");
    }, ms);
  };
})();

/* ---------------------------
   Estado da aplicação (localStorage)
   --------------------------- */
const AppState = {
  key: APP_KEY,
  data: {
    habits: [],
    meals: [],
    workouts: [],
    water: 0,
    waterGoal: 2000,
    waterLog: [],
    agenda: [],
    profile: { nome: "", email: "", telefone: "" },
  },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = Object.assign({}, this.data, parsed);
      }
    } catch (err) {
      console.error("load error", err);
      showToast("Erro ao carregar dados locais");
    }
  },

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (err) {
      console.error("save error", err);
      showToast("Erro ao salvar dados");
    }
  },

  reset() {
    localStorage.removeItem(this.key);
    this.data = {
      habits: [],
      meals: [],
      workouts: [],
      water: 0,
      waterGoal: 2000,
      waterLog: [],
      agenda: [],
      profile: { nome: "", email: "", telefone: "" },
    };
  },
};

/* ---------------------------
   Navegação (nav-btn)
   --------------------------- */
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll("main .module, main .module--home");

  function abrir(id) {
    sections.forEach((s) => (s.hidden = s.id !== id));
    navButtons.forEach((b) => {
      const active = b.dataset.target === id;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  navButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const t = btn.dataset.target;
      if (!t) return;
      abrir(t);
      // pequeno timeout para re-render se estiver no módulo
      setTimeout(() => {
        if (t === "inicio") renderOverview();
      }, 60);
    })
  );

  // abrir início por padrão
  abrir("inicio");
}

/* ---------------------------
   Template cloning (universal)
   --------------------------- */
function renderList({ module, listId, mapper }) {
  const list = document.getElementById(listId);
  const tpl = document.getElementById("template-card");
  if (!list || !tpl) return;

  // clear
  list.innerHTML = "";

  const items = AppState.data[module] || [];
  if (!items.length) {
    // leave empty
    return;
  }

  items.forEach((item) => {
    const clone = tpl.content.cloneNode(true);
    const li = clone.querySelector("li.card-item") || clone.querySelector("li");
    if (!li) return;
    li.classList.add("list-item");
    li.dataset.id = item.id;
    li.dataset.module = module;

    // checkbox
    const checkbox = li.querySelector("input.card-check");
    if (checkbox) {
      checkbox.classList.add("item-check");
      checkbox.checked = !!item.completed;
      checkbox.setAttribute("aria-checked", checkbox.checked ? "true" : "false");
      checkbox.addEventListener("change", (e) => {
        toggleComplete(module, item.id, e.target.checked);
      });
    }

    // title
    const titleEl = li.querySelector(".card-title") || li.querySelector("h3");
    const meta1 = li.querySelector(".card-meta-1");
    const meta2 = li.querySelector(".card-meta-2");

    const view = mapper(item);
    if (titleEl) titleEl.textContent = view.title;
    if (meta1) meta1.textContent = view.meta1 || "";
    if (meta2) meta2.textContent = view.meta2 || "";

    // if completed, style
    if (item.completed && titleEl) titleEl.classList.add("completed");

    // actions
    const btnOpen = li.querySelector("[data-action='open']");
    const btnEdit = li.querySelector("[data-action='edit']");
    const btnDelete = li.querySelector("[data-action='delete']");

    if (btnOpen) {
      btnOpen.addEventListener("click", () => {
        // open simply shows details in an alert — keep simple and safe
        const details = JSON.stringify(item, null, 2);
        // use a safe display
        window.alert(details);
      });
    }

    if (btnEdit) {
      btnEdit.addEventListener("click", () => openInlineEditor(list, li, module, item, mapper));
    }

    if (btnDelete) {
      btnDelete.addEventListener("click", () => {
        if (!confirm("Deseja excluir este item?")) return;
        removeItem(module, item.id);
      });
    }

    list.appendChild(clone);
  });
}

/* ---------------------------
   Inline editor (inside list) — without modal
   --------------------------- */
function openInlineEditor(listEl, liEl, module, item, mapper) {
  // prevent multiple editors
  if (liEl.querySelector(".inline-editor")) return;

  const editor = document.createElement("div");
  editor.className = "inline-editor";
  editor.style.padding = "8px";
  editor.style.marginTop = "8px";
  editor.style.borderTop = "1px solid rgba(0,0,0,0.06)";

  // Generate fields based on module
  let html = "";
  if (module === "habits") {
    html = `
      <label>Nome<input data-field="name" value="${escapeHtml(item.name || "")}" /></label>
      <label>Frequência
        <select data-field="frequencia">
          <option value="diario"${item.frequencia === "diario" ? " selected" : ""}>Diário</option>
          <option value="semanal"${item.frequencia === "semanal" ? " selected" : ""}>Semanal</option>
          <option value="ocasional"${item.frequencia === "ocasional" ? " selected" : ""}>Ocasional</option>
        </select>
      </label>
    `;
  } else if (module === "meals") {
    html = `
      <label>Nome<input data-field="name" value="${escapeHtml(item.name || "")}" /></label>
      <label>Horário<input data-field="horario" type="time" value="${escapeHtml(item.horario || "")}" /></label>
      <label>Calorias<input data-field="calorias" type="number" value="${escapeHtml(String(item.calorias || ""))}" /></label>
    `;
  } else if (module === "workouts") {
    html = `
      <label>Nome<input data-field="name" value="${escapeHtml(item.name || "")}" /></label>
      <label>Duração (min)<input data-field="duracao" type="number" value="${escapeHtml(String(item.duracao || ""))}" /></label>
      <label>Grupo<input data-field="grupo" value="${escapeHtml(item.grupo || "")}" /></label>
    `;
  } else if (module === "agenda") {
    html = `
      <label>Dia
        <select data-field="dia">
          <option value="seg"${item.dia === "seg" ? " selected" : ""}>Segunda</option>
          <option value="ter"${item.dia === "ter" ? " selected" : ""}>Terça</option>
          <option value="qua"${item.dia === "qua" ? " selected" : ""}>Quarta</option>
          <option value="qui"${item.dia === "qui" ? " selected" : ""}>Quinta</option>
          <option value="sex"${item.dia === "sex" ? " selected" : ""}>Sexta</option>
          <option value="sab"${item.dia === "sab" ? " selected" : ""}>Sábado</option>
          <option value="dom"${item.dia === "dom" ? " selected" : ""}>Domingo</option>
        </select>
      </label>
      <label>Atividade<input data-field="atividade" value="${escapeHtml(item.atividade || "")}" /></label>
    `;
  } else {
    // fallback: show raw JSON for unknown modules
    html = `<textarea data-field="raw" style="width:100%;height:80px;">${escapeHtml(JSON.stringify(item, null, 2))}</textarea>`;
  }

  // actions
  const actions = `
    <div style="margin-top:8px;">
      <button data-action="save" class="btn-inline-save">Salvar</button>
      <button data-action="cancel" class="btn-inline-cancel" style="margin-left:8px;">Cancelar</button>
    </div>
  `;

  editor.innerHTML = html + actions;
  liEl.appendChild(editor);

  // listeners
  editor.querySelector("[data-action='save']").addEventListener("click", () => {
    const inputs = editor.querySelectorAll("[data-field]");
    const changes = {};
    inputs.forEach((el) => {
      const key = el.dataset.field;
      if (el.tagName.toLowerCase() === "select" || el.type === "number" || el.type === "time" || el.tagName.toLowerCase() === "input" || el.tagName.toLowerCase() === "textarea") {
        changes[key] = el.value;
      } else {
        changes[key] = el.value;
      }
    });

    // map keys to internal structure for modules
    if (module === "habits") {
      updateItem(module, item.id, {
        name: changes.name,
        frequencia: changes.frequencia,
      });
    } else if (module === "meals") {
      updateItem(module, item.id, {
        name: changes.name,
        horario: changes.horario,
        calorias: parseInt(changes.calorias || "0", 10) || 0,
      });
    } else if (module === "workouts") {
      updateItem(module, item.id, {
        name: changes.name,
        duracao: parseInt(changes.duracao || "0", 10) || 0,
        grupo: changes.grupo,
      });
    } else if (module === "agenda") {
      updateItem(module, item.id, {
        dia: changes.dia,
        atividade: changes.atividade,
      });
    } else {
      // raw
      try {
        const raw = JSON.parse(changes.raw);
        updateItem(module, item.id, raw);
      } catch (e) {
        showToast("Falha ao interpretar dados");
      }
    }

    // remove editor
    editor.remove();
  });

  editor.querySelector("[data-action='cancel']").addEventListener("click", () => {
    editor.remove();
  });
}

/* ---------------------------
   CRUD helpers
   --------------------------- */
function addItem(module, payload) {
  const arr = AppState.data[module] || [];
  const item = Object.assign(
    { id: uid(module + "_"), createdAt: Date.now(), completed: false },
    payload
  );
  arr.unshift(item);
  AppState.data[module] = arr;
  AppState.save();
  rerenderModule(module);
  showToast(`${capitalizeModule(module)} adicionado`);
  return item;
}

function updateItem(module, id, changes) {
  const arr = (AppState.data[module] || []).map((it) => (it.id === id ? Object.assign({}, it, changes) : it));
  AppState.data[module] = arr;
  AppState.save();
  rerenderModule(module);
  showToast(`${capitalizeModule(module)} atualizado`);
}

function removeItem(module, id) {
  AppState.data[module] = (AppState.data[module] || []).filter((it) => it.id !== id);
  AppState.save();
  rerenderModule(module);
  showToast(`${capitalizeModule(module)} removido`);
}

function toggleComplete(module, id, val) {
  const arr = (AppState.data[module] || []).map((it) => (it.id === id ? Object.assign({}, it, { completed: !!val }) : it));
  AppState.data[module] = arr;
  AppState.save();
  rerenderModule(module);
}

/* ---------------------------
   Renders por módulo (mappers)
   --------------------------- */
function rerenderModule(module) {
  if (module === "habits") {
    renderList({
      module: "habits",
      listId: "lista-habitos",
      mapper: (it) => ({ title: it.name, meta1: it.frequencia || "", meta2: "" }),
    });
  } else if (module === "meals") {
    renderList({
      module: "meals",
      listId: "lista-refeicoes",
      mapper: (it) => ({ title: it.name, meta1: it.horario || "", meta2: (it.calorias ? `${it.calorias} kcal` : "") }),
    });
  } else if (module === "workouts") {
    renderList({
      module: "workouts",
      listId: "lista-treinos",
      mapper: (it) => ({ title: it.name, meta1: it.grupo || "", meta2: it.duracao ? `${it.duracao} min` : "" }),
    });
  } else if (module === "hydratacao") {
    // hydration handled separately
    renderHydration();
  } else if (module === "agenda") {
    renderList({
      module: "agenda",
      listId: "lista-agenda",
      mapper: (it) => ({ title: it.atividade || "", meta1: it.dia || "", meta2: "" }),
    });
  } else {
    // fallback: try to render by list id mapping
    const map = {
      habits: "lista-habitos",
      meals: "lista-refeicoes",
      workouts: "lista-treinos",
      agenda: "lista-agenda",
    };
    if (map[module]) {
      rerenderModule(module);
    }
  }

  // update overview after every change
  renderOverview();
}

/* ---------------------------
   Hydration (meta + logs)
   --------------------------- */
function renderHydration() {
  const progEl = $("#overview-water");
  const display = $("#historico-agua");
  const water = AppState.data.water || 0;
  const goal = AppState.data.waterGoal || 2000;
  if (progEl) progEl.textContent = String(water);

  // render historico
  if (!display) return;
  display.innerHTML = "";
  const log = AppState.data.waterLog || [];
  if (!log.length) {
    // nothing
    return;
  }
  log.forEach((r) => {
    const li = document.createElement("li");
    li.className = "card-item list-item";
    li.dataset.id = r.id;
    li.innerHTML = `<div class="card-main">
        <div class="card-info">
          <h3 class="card-title">${escapeHtml(String(r.amount) + " ml")}</h3>
          <p class="card-meta-1">${new Date(r.ts).toLocaleString()}</p>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action-btn btn-ghost" data-action="delete">Excluir</button>
      </div>`;
    li.querySelector("[data-action='delete']").addEventListener("click", () => {
      if (!confirm("Remover registro?")) return;
      AppState.data.waterLog = (AppState.data.waterLog || []).filter((x) => x.id !== r.id);
      // recalc total water
      AppState.data.water = (AppState.data.waterLog || []).reduce((s, it) => s + (it.amount || 0), 0);
      AppState.save();
      renderHydration();
      renderOverview();
      showToast("Registro removido");
    });
    display.appendChild(li);
  });
}

function addWater(amount) {
  const amt = parseInt(amount || 0, 10) || 0;
  if (!amt) return;
  const rec = { id: uid("water_"), amount: amt, ts: Date.now() };
  AppState.data.waterLog.unshift(rec);
  AppState.data.water = (AppState.data.water || 0) + amt;
  // cap to goal? we keep real total
  AppState.save();
  renderHydration();
  renderOverview();
  showToast("Registro de água salvo");
}

/* ---------------------------
   Overview / Início
   --------------------------- */
function renderOverview() {
  // update overview cards by data-summary-for attribute
  const summaries = document.querySelectorAll(".overview-card[data-summary-for]");
  summaries.forEach((card) => {
    const key = card.dataset.summaryFor;
    if (!key) return;
    if (key === "habitos") {
      const total = (AppState.data.habits || []).length;
      const done = (AppState.data.habits || []).filter((h) => h.completed).length;
      const next = (AppState.data.habits || [])[0]?.name || "—";
      card.querySelector(".summary-line-1") && (card.querySelector(".summary-line-1").textContent = `${done}/${total} concluídos`);
      card.querySelector(".summary-line-2") && (card.querySelector(".summary-line-2").textContent = `Próximo: ${next}`);
    } else if (key === "refeicoes") {
      const total = (AppState.data.meals || []).length;
      const next = (AppState.data.meals || []).find(m => m.horario)?.horario || "—";
      card.querySelector(".summary-line-1") && (card.querySelector(".summary-line-1").textContent = `${total} registradas`);
      card.querySelector(".summary-line-2") && (card.querySelector(".summary-line-2").textContent = `Próxima: ${next}`);
    } else if (key === "treinos") {
      const next = (AppState.data.workouts || [])[0]?.name || "—";
      const meta = (AppState.data.workouts || [])[0]?.duracao ? `${(AppState.data.workouts || [])[0].duracao} min` : "—";
      card.querySelector(".summary-line-1") && (card.querySelector(".summary-line-1").textContent = `${next}`);
      card.querySelector(".summary-line-2") && (card.querySelector(".summary-line-2").textContent = `Duração prevista: ${meta}`);
    } else if (key === "hidratacao") {
      const water = AppState.data.water || 0;
      const goal = AppState.data.waterGoal || 2000;
      card.querySelector("#overview-water")?.textContent && (card.querySelector("#overview-water").textContent = String(water));
      card.querySelector(".summary-line-1") && (card.querySelector(".summary-line-1").innerHTML = `<strong id="overview-water">${water}</strong> / ${goal} ml`);
      const last = (AppState.data.waterLog || [])[0];
      card.querySelector(".summary-line-2") && (card.querySelector(".summary-line-2").textContent = last ? `Último registro: ${new Date(last.ts).toLocaleTimeString()} — ${last.amount} ml` : `Nenhum registro`);
    }
  });

  // also update summary small metrics block if present
  const metricHyd = document.querySelector("#summaryGrid");
  if (metricHyd) renderHomeMetrics();

  // update hydration widget
  renderHydration();
}

/* If you created summaryGrid in future, this renders metrics */
function renderHomeMetrics() {
  const { habits, meals, workouts, water, waterGoal } = AppState.data;
  const grid = $("#summaryGrid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="metric" role="status"><strong>${water}/${waterGoal} ml</strong><span>Hidratação</span></div>
    <div class="metric" role="status"><strong>${(habits||[]).length}</strong><span>Hábitos</span></div>
    <div class="metric" role="status"><strong>${(meals||[]).length}</strong><span>Refeições</span></div>
    <div class="metric" role="status"><strong>${(workouts||[]).length}</strong><span>Treinos</span></div>
  `;
}

/* ---------------------------
   Form handlers (connect forms present in your HTML)
   --------------------------- */
function initForms() {
  // HABITOS
  const fh = $("#form-habitos");
  if (fh) {
    fh.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = $("#habito-nome")?.value?.trim();
      const frequencia = $("#habito-frequencia")?.value || "diario";
      if (!nome) return showToast("Informe o nome do hábito");
      addItem("habits", { name: nome, frequencia });
      fh.reset();
    });
  }

  // REFEICOES
  const fr = $("#form-refeicoes");
  if (fr) {
    fr.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = $("#refeicao-nome")?.value?.trim();
      const horario = $("#refeicao-horario")?.value || "";
      const calorias = parseInt($("#refeicao-calorias")?.value || "0", 10) || 0;
      if (!nome) return showToast("Informe o nome da refeição");
      addItem("meals", { name: nome, horario, calorias });
      fr.reset();
    });
  }

  // TREINOS
  const ft = $("#form-treinos");
  if (ft) {
    ft.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = $("#treino-nome")?.value?.trim();
      const duracao = parseInt($("#treino-duracao")?.value || "0", 10) || 0;
      const grupo = $("#treino-grupo")?.value?.trim() || "";
      if (!nome) return showToast("Informe o nome do treino");
      addItem("workouts", { name: nome, duracao, grupo });
      ft.reset();
    });
  }

  // HIDRATACAO (meta + registro)
  const fhyd = $("#form-hidratacao");
  if (fhyd) {
    fhyd.addEventListener("submit", (e) => {
      e.preventDefault();
      const meta = parseInt($("#meta-hidratacao")?.value || "0", 10);
      const registro = parseInt($("#registro-agua")?.value || "0", 10);
      if (meta && meta >= 100) {
        AppState.data.waterGoal = meta;
      }
      if (registro && registro > 0) {
        addWater(registro);
      } else {
        AppState.save();
      }
      fhyd.reset();
      renderHydration();
      renderOverview();
    });
  }

  // AGENDA
  const fagenda = $("#form-agenda");
  if (fagenda) {
    fagenda.addEventListener("submit", (e) => {
      e.preventDefault();
      const dia = $("#dia-semana")?.value || "seg";
      const atividade = $("#atividade")?.value?.trim();
      if (!atividade) return showToast("Informe a atividade");
      addItem("agenda", { dia, atividade });
      fagenda.reset();
    });
  }

  // CONTA
  const fconta = $("#form-conta");
  if (fconta) {
    // salvar-conta botão (type=button)
    $("#salvar-conta")?.addEventListener("click", () => {
      AppState.data.profile.nome = $("#nome")?.value?.trim() || "";
      AppState.data.profile.email = $("#email")?.value?.trim() || "";
      AppState.data.profile.telefone = $("#telefone")?.value?.trim() || "";
      AppState.save();
      // atualização do display do usuário
      updateUserDisplay();
      showToast("Dados da conta salvos");
    });

    $("#excluir-conta")?.addEventListener("click", () => {
      if (!confirm("Tem certeza que deseja excluir sua conta e todos os dados locais?")) return;
      AppState.reset();
      AppState.save();
      // re-render everything
      rerenderAll();
      showToast("Conta e dados locais excluídos");
    });
  }

  // Export button(s) — data-action="export"
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='export']");
    if (!btn) return;
    const moduleAttr = btn.dataset.module;
    if (!moduleAttr) return showToast("Módulo não especificado");
    // map from module names used in HTML to AppState keys
    const mapHtmlToKey = { habitos: "habits", refeicoes: "meals", treinos: "workouts", hidratacao: "waterLog", agenda: "agenda" };
    const key = mapHtmlToKey[moduleAttr] || moduleAttr;
    const payload = AppState.data[key] || [];
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}_export_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Export iniciado");
  });
}

/* ---------------------------
   Rerender all modules
   --------------------------- */
function rerenderAll() {
  rerenderModule("habits");
  rerenderModule("meals");
  rerenderModule("workouts");
  rerenderModule("agenda");
  renderHydration();
  renderOverview();
}

/* ---------------------------
   Small helpers
   --------------------------- */
function capitalizeModule(key) {
  const map = {
    habits: "Hábito",
    meals: "Refeição",
    workouts: "Treino",
    agenda: "Agenda",
  };
  return map[key] || key;
}

/* ---------------------------
   User display & logout helpers (ADICIONADOS)
   --------------------------- */
function updateUserDisplay() {
  const el = $("#user-display");
  if (!el) return;
  const name = AppState.data.profile.nome || "";
  el.textContent = name ? String(name) : "Usuário";
  el.setAttribute("data-user-name", name);
}

function initLogout() {
  $("#logout-btn")?.addEventListener("click", () => {
    if (!confirm("Deseja encerrar sessão e apagar dados locais?")) return;
    AppState.reset();
    AppState.save();
    location.reload();
  });
}

/* ---------------------------
   Initialization
   --------------------------- */
function init() {
  try {
    AppState.load();

    // fill profile inputs if present
    if ($("#nome")) $("#nome").value = AppState.data.profile.nome || "";
    if ($("#email")) $("#email").value = AppState.data.profile.email || "";
    if ($("#telefone")) $("#telefone").value = AppState.data.profile.telefone || "";

    initNavigation();
    initForms();
    initLogout();

    // hook refresh-overview button (presente no header)
    $("#refresh-overview")?.addEventListener("click", () => renderOverview());

    // initial render for modules that exist
    rerenderAll();

    // set copyright year if present
    const y = new Date().getFullYear();
    const el = $("#copyright-year");
    if (el) el.textContent = String(y);

    // update user display
    updateUserDisplay();

    showToast("Mundo Fitness pronto");
  } catch (err) {
    console.error("init error", err);
    showToast("Erro na inicialização");
  }
}

document.addEventListener("DOMContentLoaded", init);
