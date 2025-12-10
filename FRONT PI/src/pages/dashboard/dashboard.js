/* ==========================================================================
   dashboard-v2.0-extended.js — Mundo Fitness (Engine Corporativa, Modular, Clean)
   Fase W — Reconciliação semântica e sincronização lógica
   - Modular architecture with ARIA and semantic binding
   - All modules enhanced for accessibility and logical cohesion
   - Comentários de blocos grandes para clareza
   ========================================================================== */

/* ======================
   Utilities
   ====================== */
const $$ = selector => Array.from(document.querySelectorAll(selector));
const $ = selector => document.querySelector(selector);

// ==========================
// W-SYNC: Utilitários aprimorados com foco em segurança e semântica
// Inclui geração de UID e sanitização de HTML para prevenir XSS
// ==========================
function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ======================
   AppState (store)
   ====================== */
// ==========================
// W-SYNC: Mantém compatibilidade total com localStorage
// Acrescenta segurança no load/save/reset e tolerância a falhas JSON
// ==========================
const AppState = {
  key: "mf_state_v5",
  data: {
    habits: [],
    meals: [],
    workouts: [],
    water: 0,
    waterGoal: 2000,
    waterLog: [],
    profile: {
      name: "",
      email: "",
      phone: "",
      avatar: "",
      twofa: false,
    },
    sessions: [],
  },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = Object.assign({}, this.data, parsed);
      }
    } catch (err) {
      console.error("AppState.load error", err);
      Toast.show("Erro ao carregar estado local");
    }
  },

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (err) {
      console.error("AppState.save error", err);
      Toast.show("Falha ao salvar dados locais");
    }
  },

  reset() {
    try {
      localStorage.removeItem(this.key);
    } catch (e) {
      console.warn("AppState.reset falhou ao limpar localStorage", e);
    }
    this.data = {
      habits: [],
      meals: [],
      workouts: [],
      water: 0,
      waterGoal: 2000,
      waterLog: [],
      profile: { name: "", email: "", phone: "", avatar: "", twofa: false },
      sessions: [],
    };
  },
};

/* ======================
   Toast (sistema de notificações)
   ====================== */
// ==========================
// W-SYNC: Implementação aprimorada com ARIA e aria-live region
// A fila de mensagens é simplificada, compatível com leitores de tela
// ==========================
const Toast = (() => {
  const el = $("#toast");
  if (el) {
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
  }
  let timeout = null;
  function show(msg, ms = 2400) {
    if (!el) return console.log("Toast:", msg);
    el.textContent = msg;
    el.classList.add("show");
    el.removeAttribute("aria-hidden");
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      el.classList.remove("show");
      el.setAttribute("aria-hidden", "true");
    }, ms);
  }
  return { show };
})();

/* ======================
   Modal Engine (robusto e acessível)
   ====================== */
// ==========================
// W-SYNC: Modal com foco preso, aria-modal, bloqueio de rolagem e restore
// Gerencia inert, foco inicial e fechamento com Esc, click ou evento externo
// ==========================
const Modal = (() => {
  const backdrop = $("#modal-backdrop");
  const box = $("#modal-content");
  let isOpen = false;
  let prevActive = null;

  function ensureHiddenOnInit() {
    if (!backdrop || !box) return;
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    box.innerHTML = "";
  }

  function _trapFocus() {
    prevActive = document.activeElement;
    const main = document.querySelector("main");
    if (main) main.inert = true;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const focusables = box.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length) focusables[0].focus();

    document.addEventListener("keydown", _onKeyDown);
  }

  function _releaseFocus() {
    const main = document.querySelector("main");
    if (main) main.inert = false;
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (prevActive && prevActive.focus) prevActive.focus();
    document.removeEventListener("keydown", _onKeyDown);
  }

  function _onKeyDown(e) {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const focusables = Array.from(
        box.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => !n.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0],
        last = focusables[focusables.length - 1];
      if (!box.contains(document.activeElement)) {
        first.focus();
        e.preventDefault();
      } else {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  }

  function open(html, { onClose } = {}) {
    if (!backdrop || !box) {
      console.warn("Modal elements missing");
      return;
    }
    if (!html || String(html).trim() === "") {
      console.warn("Modal.open blocked: empty content");
      return;
    }
    box.innerHTML = html;
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    // attach close handlers
    box.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => close(), { once: true });
    });
    backdrop.onclick = (e) => {
      if (e.target === backdrop) close();
    };
    _trapFocus();
    isOpen = true;
    box._onClose = onClose;
  }

  function close() {
    if (!backdrop || !box || !isOpen) return;
    backdrop.onclick = null;
    box.querySelectorAll("[data-close]").forEach((b) => (b.onclick = null));
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    if (typeof box._onClose === "function") box._onClose();
    box._onClose = null;
    box.innerHTML = "";
    _releaseFocus();
    isOpen = false;
  }

  ensureHiddenOnInit();
  return { open, close, _internal: { backdrop, box } };
})();

/* ======================
   Router (com sincronização semântica)
   ====================== */
// ==========================
// W-SYNC: Router agora atualiza título, aria-current e aria-label
// Mantém rastreamento do contexto ativo e chama syncSemanticContext()
// ==========================
const Router = (() => {
  const navButtons = $$(".nav-item");
  const routes = {};

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function syncSemanticContext(section) {
    try {
      document.title = `Mundo Fitness — ${section.charAt(0).toUpperCase() + section.slice(1)}`;
      $$(".nav-item").forEach(btn => {
        const active = btn.dataset.section === section;
        btn.setAttribute("aria-current", active ? "page" : "false");
        btn.setAttribute("aria-label", `Ir para ${btn.textContent.trim()}`);
      });
    } catch (e) {
      console.warn("W-SYNC: falha ao sincronizar contexto semântico", e);
    }
  }

  function navigate(section) {
    $$(".view").forEach(v => {
      v.classList.remove("active");
      v.setAttribute("hidden", "true");
    });
    const view = document.getElementById(`view-${section}`);
    if (!view) {
      console.warn("Route not found:", section);
      return;
    }
    view.classList.add("active");
    view.removeAttribute("hidden");

    navButtons.forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    syncSemanticContext(section);
    if (routes[section]) {
      try { routes[section](); } catch (err) { console.error("route render error", err); }
    }
  }

  function init() {
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.dataset.section));
    });
    const defaultRoute = "home";
    navigate(defaultRoute);
  }

  return { init, register, navigate };
})();

/* ======================
   ChartModule (Single Responsibility)
   ====================== */
// ==========================
// W-SYNC: Adiciona rótulos ARIA ao canvas para leitura contextual
// e sincronização semântica com a seção ativa.
// ==========================
const ChartModule = (() => {
  let chart = null;
  function render() {
    const ctx = document.getElementById("chartResumo");
    if (!ctx) return;
    ctx.setAttribute("role", "img");
    ctx.setAttribute("aria-label", "Gráfico de progresso diário");
    if (chart) chart.destroy();
    const { habits, meals, workouts, water, waterGoal } = AppState.data;
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Água", "Hábitos", "Refeições", "Treinos"],
        datasets: [
          {
            data: [
              Math.round((water / waterGoal) * 100) || 0,
              Math.min(habits.length * 20, 100),
              Math.min(meals.length * 15, 100),
              Math.min(workouts.length * 25, 100),
            ],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }
  return { render };
})();

/* ======================
   SmartTip (IA leve local)
   ====================== */
// ==========================
// W-SYNC: Usa heurísticas simples do estado atual para gerar dicas contextuais
// Exemplo: se poucos hábitos ou baixa hidratação, orienta o usuário.
// ==========================
const SmartTip = (() => {
  function generate() {
    const { water, waterGoal, habits, workouts } = AppState.data;
    if (water < waterGoal / 2) return "💧 Beba mais água hoje para manter sua energia!";
    if (habits.length < 3) return "🧠 Experimente criar novos hábitos para equilíbrio diário!";
    if (!workouts.length) return "💪 Faça um treino leve para ativar o corpo!";
    return "🔥 Excelente progresso! Continue com essa constância!";
  }
  return { generate };
})();

/* ======================
   ListModuleFactory
   ====================== */
// ==========================
// W-SYNC: Núcleo de CRUD modular (Habits / Meals / Workouts)
// Adiciona ARIA a elementos dinâmicos e sincroniza estados visuais (checked / completed)
// ==========================
function ListModuleFactory({
  name,
  storageKey,
  templateId,
  listSelector,
  emptySelector,
  mapItemToView,
  itemDefaults,
}) {
  const moduleName = name;
  const listEl = document.getElementById(listSelector.replace("#", ""));
  const emptyEl = document.getElementById(emptySelector.replace("#", ""));
  const tpl = document.querySelector(templateId);

  if (!tpl) throw new Error("Template " + templateId + " não encontrado para " + name);

  function _getItems() {
    return AppState.data[storageKey] || [];
  }
  function _saveItems(items) {
    AppState.data[storageKey] = items;
    AppState.save();
  }

  function render() {
    const items = _getItems();
    listEl.innerHTML = "";
    if (!items.length) {
      if (emptyEl) {
        emptyEl.removeAttribute("hidden");
        emptyEl.setAttribute("aria-live", "polite");
      }
      return;
    } else {
      if (emptyEl) emptyEl.setAttribute("hidden", "true");
    }
    items.forEach((item) => {
      const clone = tpl.content.cloneNode(true);
      const li = clone.querySelector("li");
      li.dataset.id = item.id;
      li.setAttribute("role", "listitem");
      const title = clone.querySelector(".item-title");
      const sub = clone.querySelector(".item-sub");
      title.textContent = mapItemToView(item).title;
      if (mapItemToView(item).sub) sub.textContent = mapItemToView(item).sub;
      const checkbox = clone.querySelector(".item-check");
      if (checkbox) {
        checkbox.checked = !!item.completed;
        checkbox.setAttribute("aria-checked", checkbox.checked ? "true" : "false");
      }
      if (item.completed && title) title.classList.add("completed");
      listEl.appendChild(clone);
    });
  }

  // ==========================
  // CRUD base — W-SYNC adiciona persistência segura e feedback
  // ==========================
  function add(payload) {
    const items = _getItems();
    const newItem = Object.assign(
      { id: uid(moduleName + "_"), createdAt: Date.now(), completed: false },
      itemDefaults(payload)
    );
    items.unshift(newItem);
    _saveItems(items);
    render();
    Toast.show(`${name} adicionado`);
  }

  function update(id, changes) {
    const items = _getItems().map((it) =>
      it.id === id ? Object.assign({}, it, changes) : it
    );
    _saveItems(items);
    render();
    Toast.show(`${name} atualizado`);
  }

  function remove(id) {
    const items = _getItems().filter((it) => it.id !== id);
    _saveItems(items);
    render();
    Toast.show(`${name} removido`);
  }

  function removeMany(ids = []) {
    const set = new Set(ids);
    const items = _getItems().filter((it) => !set.has(it.id));
    _saveItems(items);
    render();
    Toast.show(`${ids.length} ${name}(s) removido(s)`);
  }

  function toggleComplete(id, val) {
    const items = _getItems().map((it) =>
      it.id === id ? Object.assign({}, it, { completed: !!val }) : it
    );
    _saveItems(items);
    render();
  }

  function markAllComplete() {
    const items = _getItems().map((it) =>
      Object.assign({}, it, { completed: true })
    );
    _saveItems(items);
    render();
  }

  // ==========================
  // Modais — Acessíveis com W-SYNC
  // ==========================
  function openAddModal() {
    const html = `
      <h3 id="modalTitle">Novo ${name}</h3>
      <div class="modal-form" role="form" aria-labelledby="modalTitle">
        ${getAddFormHtml()}
        <div class="modal-actions">
          <button data-close class="btn btn-secondary">Cancelar</button>
          <button id="saveAdd_${moduleName}" class="btn btn-primary">Salvar</button>
        </div>
      </div>`;
    Modal.open(html);
    setTimeout(() => {
      document
        .getElementById(`saveAdd_${moduleName}`)
        .addEventListener("click", () => {
          const payload = readAddForm();
          if (!payload) return;
          add(payload);
          Modal.close();
        });
    }, 0);
  }

  function openEditModal(id) {
    const items = _getItems();
    const target = items.find((it) => it.id === id);
    if (!target) return Toast.show("Item não encontrado");
    const html = `
      <h3 id="modalTitle">Editar ${name}</h3>
      <div class="modal-form" role="form" aria-labelledby="modalTitle">
        ${getEditFormHtml(target)}
        <div class="modal-actions">
          <button data-close class="btn btn-secondary">Cancelar</button>
          <button id="saveEdit_${moduleName}" class="btn btn-primary">Salvar</button>
        </div>
      </div>`;
    Modal.open(html);
    setTimeout(() => {
      document
        .getElementById(`saveEdit_${moduleName}`)
        .addEventListener("click", () => {
          const payload = readEditForm();
          if (!payload) return;
          update(id, payload);
          Modal.close();
        });
    }, 0);
  }

  function getAddFormHtml() {
    return "";
  }
  function readAddForm() {
    return null;
  }
  function getEditFormHtml(target) {
    return "";
  }
  function readEditForm() {
    return null;
  }

  // ==========================
  // Eventos — W-SYNC: uso de delegação e consistência de ARIA
  // ==========================
  function attachListHandlers() {
    listEl.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      const li = e.target.closest("li.list-item");
      if (!li) return;
      const id = li.dataset.id;
      if (!id) return;
      if (action === "edit") openEditModal(id);
      else if (action === "delete") {
        if (!confirm("Deseja excluir este item?")) return;
        remove(id);
      } else if (action === "toggle-complete") {
        const checked = e.target.checked;
        toggleComplete(id, checked);
      }
    });
  }

  function attachBulkHandlers({
    btnMarkAllSelector,
    btnMarkSelectedSelector,
    btnDeleteSelectedSelector,
  }) {
    if (btnMarkAllSelector) {
      const b = document.getElementById(btnMarkAllSelector.replace("#", ""));
      if (b) b.addEventListener("click", () => markAllComplete());
    }
    if (btnMarkSelectedSelector) {
      const b = document.getElementById(btnMarkSelectedSelector.replace("#", ""));
      if (b)
        b.addEventListener("click", () => {
          const ids = Array.from(
            listEl.querySelectorAll("li.list-item input.item-check")
          )
            .filter((ch) => ch.checked)
            .map((ch) => ch.closest("li.list-item").dataset.id);
          ids.forEach((id) => toggleComplete(id, true));
          Toast.show(`${ids.length} marcado(s)`);
        });
    }
    if (btnDeleteSelectedSelector) {
      const b = document.getElementById(btnDeleteSelectedSelector.replace("#", ""));
      if (b)
        b.addEventListener("click", () => {
          const ids = Array.from(
            listEl.querySelectorAll("li.list-item input.item-check")
          )
            .filter((ch) => ch.checked)
            .map((ch) => ch.closest("li.list-item").dataset.id);
          if (!ids.length) return Toast.show("Nenhum item selecionado");
          if (!confirm(`Remover ${ids.length} item(s)?`)) return;
          removeMany(ids);
        });
    }
  }

  return {
    name: moduleName,
    init: () => {
      render();
      attachListHandlers();
    },
    render,
    add,
    update,
    remove,
    removeMany,
    toggleComplete,
    markAllComplete,
    openAddModal,
    openEditModal,
    attachBulkHandlers,
    _setFormHelpers(fns) {
      if (fns.getAddFormHtml) getAddFormHtml = fns.getAddFormHtml;
      if (fns.readAddForm) readAddForm = fns.readAddForm;
      if (fns.getEditFormHtml) getEditFormHtml = fns.getEditFormHtml;
      if (fns.readEditForm) readEditForm = fns.readEditForm;
    },
  };
}

/* ======================
   HABITS Module
   ====================== */
const HabitsModule = (() => {
  const mod = ListModuleFactory({
    name: "Hábito",
    storageKey: "habits",
    templateId: "#tpl-list-item",
    listSelector: "#habitList",
    emptySelector: "#habitEmpty",
    mapItemToView: (it) => ({ title: it.name, sub: it.note || "" }),
    itemDefaults: (payload) => ({ name: payload.name, note: payload.note || "" }),
  });

  mod._setFormHelpers({
    getAddFormHtml: () => `
      <label for="habit_name">Nome</label>
      <input id="habit_name" type="text" placeholder="Ex: Meditar" />
      <label for="habit_note">Observação (opcional)</label>
      <input id="habit_note" type="text" placeholder="Ex: 10 minutos" />
    `,
    readAddForm: () => {
      const name = document.getElementById("habit_name").value.trim();
      const note = document.getElementById("habit_note").value.trim();
      if (!name) {
        Toast.show("Digite o nome do hábito");
        return null;
      }
      return { name, note };
    },
    getEditFormHtml: (target) => `
      <label for="edit_habit_name">Nome</label>
      <input id="edit_habit_name" type="text" value="${escapeHtml(target.name)}" />
      <label for="edit_habit_note">Observação</label>
      <input id="edit_habit_note" type="text" value="${escapeHtml(target.note || "")}" />
    `,
    readEditForm: () => {
      const name = document.getElementById("edit_habit_name").value.trim();
      const note = document.getElementById("edit_habit_note").value.trim();
      if (!name) {
        Toast.show("Digite o nome do hábito");
        return null;
      }
      return { name, note };
    },
  });

  mod.attachBulkHandlers({
    btnMarkAllSelector: "#markAllHabits",
    btnMarkSelectedSelector: "#bulkMarkHabits",
    btnDeleteSelectedSelector: "#bulkDeleteHabits",
  });

  return { init: () => mod.init(), render: () => mod.render(), openAdd: mod.openAddModal };
})();

/* ======================
   MEALS Module
   ====================== */
const MealsModule = (() => {
  const mod = ListModuleFactory({
    name: "Refeição",
    storageKey: "meals",
    templateId: "#tpl-list-item",
    listSelector: "#mealList",
    emptySelector: "#mealEmpty",
    mapItemToView: (it) => ({ title: it.name, sub: `${it.cal || 0} kcal` }),
    itemDefaults: (payload) => ({ name: payload.name, cal: payload.cal || 0 }),
  });

  mod._setFormHelpers({
    getAddFormHtml: () => `
      <label for="meal_name">Nome</label>
      <input id="meal_name" type="text" placeholder="Ex: Almoço" />
      <label for="meal_cal">Calorias (kcal)</label>
      <input id="meal_cal" type="number" min="0" placeholder="Ex: 520" />
    `,
    readAddForm: () => {
      const name = document.getElementById("meal_name").value.trim();
      const cal = parseInt(document.getElementById("meal_cal").value || "0", 10);
      if (!name) {
        Toast.show("Informe o nome da refeição");
        return null;
      }
      return { name, cal };
    },
    getEditFormHtml: (target) => `
      <label for="edit_meal_name">Nome</label>
      <input id="edit_meal_name" type="text" value="${escapeHtml(target.name)}" />
      <label for="edit_meal_cal">Calorias</label>
      <input id="edit_meal_cal" type="number" value="${escapeHtml(
        String(target.cal || 0)
      )}" />
    `,
    readEditForm: () => {
      const name = document.getElementById("edit_meal_name").value.trim();
      const cal = parseInt(document.getElementById("edit_meal_cal").value || "0", 10);
      if (!name) {
        Toast.show("Informe o nome da refeição");
        return null;
      }
      return { name, cal };
    },
  });

  mod.attachBulkHandlers({
    btnMarkAllSelector: "#markAllMeals",
    btnMarkSelectedSelector: "#bulkMarkMeals",
    btnDeleteSelectedSelector: "#bulkDeleteMeals",
  });

  return { init: () => mod.init(), render: () => mod.render(), openAdd: mod.openAddModal };
})();

/* ======================
   WORKOUTS Module
   ====================== */
// ==========================
// W-SYNC: Implementação completa de CRUD para treinos,
// com suporte a duração e marcação de conclusão.
// ==========================
const WorkoutsModule = (() => {
  const mod = ListModuleFactory({
    name: "Treino",
    storageKey: "workouts",
    templateId: "#tpl-list-item",
    listSelector: "#workoutList",
    emptySelector: "#workoutEmpty",
    mapItemToView: (it) => ({ title: it.name, sub: `${it.time || 0} min` }),
    itemDefaults: (payload) => ({ name: payload.name, time: payload.time || 0 }),
  });

  mod._setFormHelpers({
    getAddFormHtml: () => `
      <label for="work_name">Tipo de treino</label>
      <input id="work_name" type="text" placeholder="Ex: Corrida" />
      <label for="work_time">Duração (min)</label>
      <input id="work_time" type="number" min="0" placeholder="30" />
    `,
    readAddForm: () => {
      const name = document.getElementById("work_name").value.trim();
      const time = parseInt(document.getElementById("work_time").value || "0", 10);
      if (!name) {
        Toast.show("Informe o tipo de treino");
        return null;
      }
      return { name, time };
    },
    getEditFormHtml: (target) => `
      <label for="edit_work_name">Tipo de treino</label>
      <input id="edit_work_name" type="text" value="${escapeHtml(target.name)}" />
      <label for="edit_work_time">Duração (min)</label>
      <input id="edit_work_time" type="number" value="${escapeHtml(
        String(target.time || 0)
      )}" />
    `,
    readEditForm: () => {
      const name = document.getElementById("edit_work_name").value.trim();
      const time = parseInt(document.getElementById("edit_work_time").value || "0", 10);
      if (!name) {
        Toast.show("Informe o tipo de treino");
        return null;
      }
      return { name, time };
    },
  });

  mod.attachBulkHandlers({
    btnMarkAllSelector: "#markAllWorkouts",
    btnMarkSelectedSelector: "#bulkMarkWorkouts",
    btnDeleteSelectedSelector: "#bulkDeleteWorkouts",
  });

  return { init: () => mod.init(), render: () => mod.render(), openAdd: mod.openAddModal };
})();

/* ======================
   HYDRATION Module
   ====================== */
// ==========================
// W-SYNC: Reescrita completa com SVG acessível e log persistente
// O SVG contém rótulos descritivos e feedback visual.
// ==========================
const HydrationModule = (() => {
  const display = $("#hydrationDisplay");
  const logList = $("#waterLogList");
  const logEmpty = $("#waterLogEmpty");

  function _save() {
    AppState.save();
  }

  function render() {
    const { water, waterGoal, waterLog } = AppState.data;
    const percent = Math.min(Math.round((water / (waterGoal || 1)) * 100), 100);

    if (display) {
      display.innerHTML = `
        <svg viewBox="0 0 36 36" width="120" height="120" role="img" aria-label="Progresso de hidratação">
          <title>Hidratação diária</title>
          <desc>Meta de ${waterGoal} ml, atual ${water} ml (${percent}%)</desc>
          <path stroke="#e5e7eb" stroke-width="3" fill="none" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32z"></path>
          <path stroke="#2563eb" stroke-width="3" stroke-dasharray="${percent},100" fill="none" d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32z"></path>
          <text x="18" y="21" font-size="7" fill="#2563eb" text-anchor="middle">${percent}%</text>
        </svg>
        <p aria-live="polite">${water} ml de ${waterGoal} ml</p>
      `;
    }

    logList.innerHTML = "";
    if (!waterLog || !waterLog.length) {
      logEmpty?.removeAttribute("hidden");
      logEmpty?.setAttribute("aria-live", "polite");
    } else {
      logEmpty?.setAttribute("hidden", "true");
      waterLog.forEach((r) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.dataset.id = r.id;
        li.innerHTML = `
          <div class="item-left">
            <span class="item-title">${escapeHtml(r.amount + " ml")}</span>
            <small class="item-sub">${new Date(r.ts).toLocaleString()}</small>
          </div>
          <div class="item-actions">
            <button class="btn btn-outline btn-danger" data-action="delete">Remover</button>
          </div>`;
        logList.appendChild(li);
      });
    }
  }

  function add(amount) {
    const rec = { id: uid("water_"), amount: amount || 250, ts: Date.now() };
    AppState.data.water = Math.min(
      (AppState.data.water || 0) + rec.amount,
      AppState.data.waterGoal || 999999
    );
    AppState.data.waterLog.unshift(rec);
    _save();
    render();
    Toast.show("Registro de água adicionado");
  }

  function remove(id) {
    AppState.data.waterLog = (AppState.data.waterLog || []).filter((r) => r.id !== id);
    _save();
    render();
    Toast.show("Registro removido");
  }

  function setGoal(value) {
    const v = parseInt(value, 10);
    if (!v || v < 500) return Toast.show("Meta mínima: 500ml");
    AppState.data.waterGoal = v;
    _save();
    render();
    Toast.show("Meta atualizada");
  }

  function attachHandlers() {
    const addBtn = $("#addWater");
    const subBtn = $("#subWater");
    const setBtn = $("#setGoal");
    const viewLogBtn = $("#viewWaterLog");

    addBtn?.addEventListener("click", () => add(250));
    subBtn?.addEventListener("click", () => {
      AppState.data.water = Math.max(0, (AppState.data.water || 0) - 250);
      AppState.save();
      render();
    });

    setBtn?.addEventListener("click", () => {
      Modal.open(`
        <h3>Definir Meta de Hidratação</h3>
        <label for="goalInput">Meta em ml</label>
        <input id="goalInput" type="number" value="${AppState.data.waterGoal || 2000}" />
        <div class="modal-actions">
          <button data-close class="btn btn-secondary">Cancelar</button>
          <button id="saveGoal" class="btn btn-primary">Salvar</button>
        </div>
      `);
      setTimeout(() => {
        $("#saveGoal")?.addEventListener("click", () => {
          const val = parseInt($("#goalInput").value || "0", 10);
          setGoal(val);
          Modal.close();
        });
      }, 0);
    });

    viewLogBtn?.addEventListener("click", () => {
      const html = `
        <h3>Histórico de Hidratação</h3>
        <div id="modalWaterLog">
          ${(AppState.data.waterLog || [])
            .map(
              (r) =>
                `<div class="water-row" data-id="${r.id}">
                   ${escapeHtml(r.amount + " ml")} — ${new Date(r.ts).toLocaleString()}
                   <button data-action="delete" class="btn btn-danger btn-sm">Remover</button>
                 </div>`
            )
            .join("")}
        </div>
        <div class="modal-actions"><button data-close class="btn btn-secondary">Fechar</button></div>`;
      Modal.open(html);
      setTimeout(() => {
        const modalContent = $("#modal-content");
        modalContent.addEventListener("click", function onClick(e) {
          const act = e.target.closest("[data-action]")?.dataset.action;
          const row = e.target.closest("[data-id]");
          if (act === "delete" && row) {
            const id = row.dataset.id;
            if (confirm("Remover registro?")) {
              remove(id);
              Modal.close();
            }
          }
          if (!Modal._internal || Modal._internal.backdrop.hidden) {
            modalContent.removeEventListener("click", onClick);
          }
        });
      }, 0);
    });

    logList?.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action === "delete") {
        const li = e.target.closest("li.list-item");
        if (!li) return;
        const id = li.dataset.id;
        if (confirm("Remover registro?")) remove(id);
      }
    });
  }

  function init() {
    render();
    attachHandlers();
  }

  return { init, render, add, remove, setGoal };
})();

/* ======================
   Account Module
   ====================== */
// ==========================
// W-SYNC: Gestão de perfil, senha e segurança local
// Acrescenta mensagens ARIA e placeholders para integração futura de backend
// ==========================
const AccountModule = (() => {
  const profileForm = $("#profileForm");
  const passwordForm = $("#passwordForm");
  const twofaBtn = $("#twofaToggle");
  const revokeBtn = $("#revokeAllSessions");
  const startDeleteBtn = $("#startDeleteAccount");
  const activeSessionsWrap = $("#activeSessions");

  function renderProfile() {
    const p = AppState.data.profile || {};
    $("#profileName").value = p.name || "";
    $("#profileEmail").value = p.email || "";
    $("#profilePhone").value = p.phone || "";
    $("#profileAvatar").value = p.avatar || "";
  }

  function attachHandlers() {
    profileForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      AppState.data.profile.name = $("#profileName").value.trim();
      AppState.data.profile.email = $("#profileEmail").value.trim();
      AppState.data.profile.phone = $("#profilePhone").value.trim();
      AppState.data.profile.avatar = $("#profileAvatar").value.trim();
      AppState.save();
      Toast.show("Perfil atualizado");
    });

    passwordForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const cur = $("#currentPassword").value;
      const nw = $("#newPassword").value;
      const cnf = $("#confirmPassword").value;
      if (!cur || !nw) return Toast.show("Preencha as senhas corretamente");
      if (nw !== cnf) return Toast.show("Confirmação não confere");
      Toast.show("Senha atualizada (simulada)");
      $("#currentPassword").value = "";
      $("#newPassword").value = "";
      $("#confirmPassword").value = "";
    });

    twofaBtn?.addEventListener("click", () => {
      AppState.data.profile.twofa = !AppState.data.profile.twofa;
      AppState.save();
      Toast.show(
        AppState.data.profile.twofa ? "2FA ativado" : "2FA desativado"
      );
    });

    revokeBtn?.addEventListener("click", () => {
      if (!confirm("Encerrar todas as sessões ativas?")) return;
      AppState.data.sessions = [];
      AppState.save();
      Toast.show("Sessões encerradas");
    });

    startDeleteBtn?.addEventListener("click", () => {
      Modal.open(`
        <h3>Excluir Conta</h3>
        <p>Tem certeza? Isso apagará TODOS os seus dados.</p>
        <label for="confirmDeletePwd">Digite sua senha para confirmar</label>
        <input id="confirmDeletePwd" type="password" />
        <div class="modal-actions">
          <button data-close class="btn btn-secondary">Cancelar</button>
          <button id="confirmDeleteBtn" class="btn btn-danger">Excluir Conta</button>
        </div>
      `);
      setTimeout(() => {
        $("#confirmDeleteBtn")?.addEventListener("click", () => {
          const pwd = $("#confirmDeletePwd").value;
          if (!pwd) return Toast.show("Informe sua senha");
          AppState.reset();
          Toast.show("Conta excluída (simulada)");
          Modal.close();
        });
      }, 0);
    });
  }

  function renderSessions() {
    const s = AppState.data.sessions || [];
    if (!activeSessionsWrap) return;
    activeSessionsWrap.textContent =
      s.length > 0 ? `${s.length} sessão(ões)` : "Nenhuma sessão ativa";
  }

  function init() {
    renderProfile();
    renderSessions();
    attachHandlers();
  }

  return { init, render: () => { renderProfile(); renderSessions(); } };
})();

/* ======================
   QuickActions
   ====================== */
// ==========================
// W-SYNC: Atalhos globais sincronizados com o Router
// Permitem adicionar rapidamente hábitos, refeições e treinos.
// Integram-se com bulk actions para consistência entre módulos.
// ==========================
const QuickActions = (() => {
  function attach() {
    $("#quickAddHabit")?.addEventListener("click", () => {
      Router.navigate("habits");
      setTimeout(() => HabitsModule.openAdd(), 80);
    });

    $("#quickAddMeal")?.addEventListener("click", () => {
      Router.navigate("meals");
      setTimeout(() => MealsModule.openAdd(), 80);
    });

    $("#quickAddWorkout")?.addEventListener("click", () => {
      Router.navigate("workouts");
      setTimeout(() => WorkoutsModule.openAdd(), 80);
    });

    // ==========================
    // W-SYNC: Ações em massa globais
    // ==========================
    $("#quickDeleteSelected")?.addEventListener("click", () => {
      const selectors = ["#habitList", "#mealList", "#workoutList", "#waterLogList"];
      const ids = [];
      selectors.forEach((sel) => {
        const list = document.querySelector(sel);
        if (!list) return;
        list
          .querySelectorAll("li.list-item input.item-check:checked")
          .forEach((ch) => {
            ids.push(ch.closest("li.list-item").dataset.id);
          });
      });
      if (!ids.length) return Toast.show("Nenhum item selecionado");
      if (!confirm(`Remover ${ids.length} item(s) selecionados?`)) return;

      AppState.data.habits = AppState.data.habits.filter((i) => !ids.includes(i.id));
      AppState.data.meals = AppState.data.meals.filter((i) => !ids.includes(i.id));
      AppState.data.workouts = AppState.data.workouts.filter((i) => !ids.includes(i.id));
      AppState.data.waterLog = AppState.data.waterLog.filter((i) => !ids.includes(i.id));
      AppState.save();

      HabitsModule.render();
      MealsModule.render();
      WorkoutsModule.render();
      HydrationModule.render();

      Toast.show(`${ids.length} item(s) removido(s)`);
    });

    $("#quickMarkSelected")?.addEventListener("click", () => {
      const selectors = ["#habitList", "#mealList", "#workoutList"];
      let count = 0;
      selectors.forEach((sel) => {
        const list = document.querySelector(sel);
        if (!list) return;
        list.querySelectorAll("li.list-item input.item-check:checked").forEach((ch) => {
          const id = ch.closest("li.list-item").dataset.id;
          const found =
            (AppState.data.habits || []).find((x) => x.id === id) ||
            (AppState.data.meals || []).find((x) => x.id === id) ||
            (AppState.data.workouts || []).find((x) => x.id === id);
          if (found) {
            found.completed = true;
            count++;
          }
        });
      });
      if (count === 0) return Toast.show("Nenhum item selecionado");
      AppState.save();
      HabitsModule.render();
      MealsModule.render();
      WorkoutsModule.render();
      Toast.show(`${count} item(s) marcado(s)`);
    });
  }
  return { attach };
})();

/* ======================
   Home render (resumo dinâmico)
   ====================== */
// ==========================
// W-SYNC: Gera métricas e dica inteligente (SmartTip)
// Integra com ChartModule e estado persistente.
// ==========================
function renderHome() {
  const { habits, meals, workouts, water, waterGoal } = AppState.data;
  const grid = $("#summaryGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="metric" role="status" aria-label="Hidratação diária">
        <strong>${water}/${waterGoal} ml</strong><span>Hidratação</span>
      </div>
      <div class="metric" role="status" aria-label="Total de hábitos ativos">
        <strong>${(habits || []).length}</strong><span>Hábitos</span>
      </div>
      <div class="metric" role="status" aria-label="Total de refeições registradas">
        <strong>${(meals || []).length}</strong><span>Refeições</span>
      </div>
      <div class="metric" role="status" aria-label="Total de treinos realizados">
        <strong>${(workouts || []).length}</strong><span>Treinos</span>
      </div>`;
  }

  $("#aiTip").textContent = SmartTip.generate();
  ChartModule.render();
}

/* ======================
   Initialization
   ====================== */
// ==========================
// W-SYNC: Ciclo de inicialização global
// - Carrega estado e tema
// - Registra rotas
// - Inicializa módulos
// - Sincroniza interface
// ==========================
(function init() {
  try {
    // 1. Carrega estado salvo
    AppState.load();

    // 2. Inicializa módulos e Router
    Router.register("home", () => renderHome());
    Router.register("habits", () => {
      HabitsModule.init();
      HabitsModule.render();
    });
    Router.register("meals", () => {
      MealsModule.init();
      MealsModule.render();
    });
    Router.register("workouts", () => {
      WorkoutsModule.init();
      WorkoutsModule.render();
    });
    Router.register("hydration", () => {
      HydrationModule.init();
      HydrationModule.render();
    });
    Router.register("account", () => {
      AccountModule.init();
      AccountModule.render();
    });

    // 3. Ativa atalhos rápidos
    QuickActions.attach();

    // 4. Inicializa Router
    Router.init();

    // 5. Controle de tema
    $("#themeToggle")?.addEventListener("click", () => {
      const root = document.documentElement;
      const curr = root.getAttribute("data-theme") || "light";
      const next = curr === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      Toast.show(next === "light" ? "Tema claro ativado" : "Tema escuro ativado");
    });

    // 6. Logout e reset seguro
    $("#btnLogout")?.addEventListener("click", () => {
      if (!confirm("Deseja sair e limpar dados locais?")) return;
      AppState.reset();
      Toast.show("Sessão encerrada (local)");
      setTimeout(() => window.location.reload(), 600);
    });

    // 7. Garante que o modal esteja oculto
    if ($("#modal-backdrop")) {
      $("#modal-backdrop").hidden = true;
      $("#modal-content").innerHTML = "";
    }

    // 8. Render inicial
    renderHome();

    // 9. Toast de boas-vindas
    setTimeout(() => Toast.show("💪 Mundo Fitness iniciado com sucesso"), 400);

    // 10. Expor globals (debug seguro)
    window.MF = {
      AppState,
      Modal,
      Toast,
      Router,
      HabitsModule,
      MealsModule,
      WorkoutsModule,
      HydrationModule,
      AccountModule,
    };
  } catch (err) {
    console.error("Erro crítico na inicialização", err);
    Toast.show("Falha na inicialização do sistema");
  }
})();

/* ==========================================================
   ENGINE STATUS & DEBUG — W-SYNC Diagnostics Layer
   ========================================================== */
// ==========================================================
// Este bloco garante rastreabilidade e depuração estruturada.
// Gera relatórios no console e valida sincronização entre módulos.
// ==========================================================
(function EngineStatus() {
  const ENGINE_VERSION = "v2.0-W-SYNC";
  const modules = {
    AppState,
    Router,
    Modal,
    Toast,
    HabitsModule,
    MealsModule,
    WorkoutsModule,
    HydrationModule,
    AccountModule,
  };

  // ==========================
  // Verificação estrutural
  // ==========================
  function validateStructure() {
    const results = [];
    for (const [key, mod] of Object.entries(modules)) {
      const valid = typeof mod === "object" || typeof mod === "function";
      results.push({ module: key, status: valid ? "OK" : "MISSING" });
    }
    console.table(results);
    return results;
  }

  // ==========================
  // Health Check Básico
  // ==========================
  function checkHealth() {
    const report = {
      timestamp: new Date().toISOString(),
      modules: Object.keys(modules),
      localStorageSize: (localStorage.getItem(AppState.key) || "").length,
      theme: document.documentElement.getAttribute("data-theme") || "light",
      memoryEstimate: performance?.memory?.usedJSHeapSize || "N/A",
    };
    console.groupCollapsed("🧩 Mundo Fitness — Relatório Técnico");
    console.table(report);
    console.groupEnd();
    return report;
  }

  // ==========================
  // Monitor de eventos globais
  // ==========================
  function attachEventAudit() {
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action], button, a");
      if (target) {
        console.debug("W-SYNC Event:", {
          action: target.dataset.action || target.id || target.textContent?.trim(),
          time: new Date().toLocaleTimeString(),
        });
      }
    });
  }

  // ==========================
  // Mecanismo de hooks
  // ==========================
  const Hooks = {
    beforeSave: [],
    afterSave: [],
    onModalOpen: [],
    onModalClose: [],
    add(hookName, fn) {
      if (Hooks[hookName]) Hooks[hookName].push(fn);
    },
    trigger(hookName, payload) {
      if (Hooks[hookName]) Hooks[hookName].forEach((fn) => fn(payload));
    },
  };

  // Integra Hooks com módulos existentes
  const originalSave = AppState.save.bind(AppState);
  AppState.save = function () {
    Hooks.trigger("beforeSave", AppState.data);
    originalSave();
    Hooks.trigger("afterSave", AppState.data);
  };
  const originalModalOpen = Modal.open.bind(Modal);
  const originalModalClose = Modal.close.bind(Modal);
  Modal.open = function (html, opts) {
    Hooks.trigger("onModalOpen", html);
    originalModalOpen(html, opts);
  };
  Modal.close = function () {
    Hooks.trigger("onModalClose");
    originalModalClose();
  };

  // ==========================
  // Registro de métricas futuras (W-SYNC Analytics)
  // ==========================
  const Analytics = {
    logs: [],
    track(event, data = {}) {
      const log = {
        id: uid("event_"),
        event,
        data,
        ts: Date.now(),
      };
      this.logs.push(log);
      if (this.logs.length > 100) this.logs.shift();
      console.info("📊 [Analytics]", event, data);
    },
    export() {
      return JSON.stringify(this.logs, null, 2);
    },
  };

  // ==========================
  // Interface Debug (devtools)
  // ==========================
  window.MF_DEBUG = {
    version: ENGINE_VERSION,
    validateStructure,
    checkHealth,
    Hooks,
    Analytics,
    reload: () => window.location.reload(),
    resetState: () => {
      AppState.reset();
      Toast.show("Estado reiniciado (debug)");
    },
    simulate: {
      addFakeData() {
        AppState.data.habits.push({ id: uid("h_"), name: "Meditar", note: "5 min", completed: false });
        AppState.data.meals.push({ id: uid("m_"), name: "Café da manhã", cal: 320 });
        AppState.data.workouts.push({ id: uid("w_"), name: "Corrida leve", time: 30 });
        AppState.data.waterLog.push({ id: uid("water_"), amount: 250, ts: Date.now() });
        AppState.save();
        Toast.show("Dados de demonstração adicionados");
      },
    },
  };

  // ==========================
  // Inicialização
  // ==========================
  console.info(`🚀 Mundo Fitness Engine (${ENGINE_VERSION}) inicializado`);
  validateStructure();
  checkHealth();
  attachEventAudit();

  // Hook padrão de log
  Hooks.add("afterSave", () => Analytics.track("state_saved"));
  Hooks.add("onModalOpen", (html) =>
    Analytics.track("modal_opened", { preview: html.slice(0, 40) })
  );
})();
