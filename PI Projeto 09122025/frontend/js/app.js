/**
 * app.js (módulo)
 * - Frontend "inteligente" que agrega Dados de Hábitos / Refeições / Treinos / Hidratação
 * - Gera gráficos interativos (Chart.js)
 * - Funciona offline com localStorage e pode ser adaptado para usar API
 *
 * Salve como: js/app.js
 */

const API_BASE = null; // se você tiver um backend, colocar '/api' ou URL. Se null, usa localStorage.
const STATE = { user: null };

/* -------------------------
   HELPERS
------------------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : ('id'+Math.random().toString(36).slice(2,9));
const todayISO = () => new Date().toISOString().slice(0,10);
const daysAgoISO = n => { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg, ms = 2400){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), ms);
}
function escapeHTML(s = ''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* -------------------------
   STORAGE LAYER (local or REST)
------------------------- */
async function apiGet(path){ 
  if(!API_BASE) return null;
  const res = await fetch(API_BASE+path, {credentials:'same-origin'});
  if(!res.ok) throw new Error('api error');
  return res.json();
}
async function apiPost(path, body){ 
  if(!API_BASE) return null;
  const res = await fetch(API_BASE+path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), credentials:'same-origin'});
  if(!res.ok) throw new Error('api error');
  return res.json();
}

function storageKey(k){ return 'mf_' + k; }
function load(k, def = null){ try { const v = localStorage.getItem(storageKey(k)); return v ? JSON.parse(v) : def; } catch(e){ return def; } }
function save(k, v){ try { localStorage.setItem(storageKey(k), JSON.stringify(v)); } catch(e){} }

/* -------------------------
   SCHEMA & SEED (localStorage fallback)
------------------------- */
function ensureSeed(){
  if(!load('user', null)){
    save('user', { id: uuid(), name: 'Convidado', email: null, createdAt: new Date().toISOString() });
  }
  if(!load('habits', [])){
    save('habits', [
      { id: uuid(), title: 'Meditar', time: '08:00', createdAt: new Date().toISOString() },
      { id: uuid(), title: 'Ler 20 min', time: '21:00', createdAt: new Date().toISOString() }
    ]);
  }
  if(!load('habit_records', [])){
    // create some sample completions last 7 days
    const recs = [];
    const habits = load('habits', []);
    for(let d=0; d<7; d++){
      const date = daysAgoISO(d);
      habits.forEach((h,i) => {
        if(Math.random() > 0.4) recs.push({ id: uuid(), habitId: h.id, date, done:true });
      });
    }
    save('habit_records', recs);
  }
  if(!load('meals', [])){
    save('meals', [
      { id: uuid(), title: 'Café - Ovo e pão', calories: 320, datetime: new Date().toISOString() },
      { id: uuid(), title: 'Almoço - Frango e salada', calories: 560, datetime: new Date().toISOString() }
    ]);
  }
  if(!load('workouts', [])){
    save('workouts', [
      { id: uuid(), type: 'Corrida', duration: 30, datetime: new Date().toISOString() }
    ]);
  }
  if(!load('water', [])){
    // array of {date, ml}
    const arr = [];
    for(let i=0;i<7;i++) arr.push({ date: daysAgoISO(i), quantidade_ml: Math.floor(500 + Math.random()*900) });
    save('water', arr);
  }
}
ensureSeed();

/* -------------------------
   RENDER: Home (summary + charts)
------------------------- */
let chartHabits = null, chartWater = null;

async function renderHome(){
  setActive('#nav-home');
  const user = load('user');
  $('#userLabel').textContent = user ? (user.name || 'Convidado') : 'Convidado';

  // aggregate
  const habits = load('habits', []);
  const records = load('habit_records', []);
  const meals = load('meals', []);
  const workouts = load('workouts', []);
  const water = load('water', []);

  // today
  const today = todayISO();
  const doneToday = records.filter(r => r.date === today && r.done).length;
  const totalHabits = habits.length;
  const pct = totalHabits ? Math.round(doneToday/totalHabits*100) : 0;
  const todayWater = (water.find(w=>w.date===today) || {quantidade_ml:0}).quantidade_ml;

  // build weekly arrays (7 days)
  const last7 = Array.from({length:7}).map((_,i)=> daysAgoISO(6-i));
  const weeklyHabPct = last7.map(d => {
    const dayDone = records.filter(r=> r.date === d && r.done).length;
    return totalHabits ? Math.round(dayDone/totalHabits*100) : 0;
  });
  const weeklyWater = last7.map(d => (water.find(w=>w.date===d) || {quantidade_ml:0}).quantidade_ml);

  // html
  const html = `
  <div class="grid">
    <div class="card">
      <h2>Resumo de Hoje</h2>
      <div class="row" style="align-items:center;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:var(--primary);background:linear-gradient(180deg,#f0f6ff,#e6efff)">${pct}%</div>
          <div>
            <div style="font-weight:700">${doneToday} de ${totalHabits} hábitos</div>
            <div class="small muted">${todayWater} ml de água</div>
            <div class="helper" style="margin-top:6px">Últimos registros: hábitos • refeições • treinos • água</div>
          </div>
        </div>
        <div style="margin-left:auto">
          <button id="btnAddWaterHome" class="btn-primary">+250ml</button>
        </div>
      </div>

      <div class="charts" style="margin-top:12px">
        <div class="canvas-wrap">
          <strong>Hábitos (últimos 7 dias)</strong>
          <canvas id="chartHabits" width="400" height="220" aria-label="Gráfico de hábitos"></canvas>
        </div>
        <div class="canvas-wrap">
          <strong>Hidratação (ml)</strong>
          <canvas id="chartWater" width="400" height="220" aria-label="Gráfico de hidratação"></canvas>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Atividades recentes</h2>

      <div style="margin-top:8px">
        <strong>Hábitos</strong>
        <div class="recent-list" id="recentHabits"></div>
      </div>

      <div style="margin-top:8px">
        <strong>Refeições</strong>
        <div class="recent-list" id="recentMeals"></div>
      </div>

      <div style="margin-top:8px">
        <strong>Treinos</strong>
        <div class="recent-list" id="recentWorkouts"></div>
      </div>
    </div>
  </div>

  <div style="margin-top:12px" class="card">
    <h2>Resumo rápido</h2>
    <div class="row small" style="gap:12px">
      <div>Hábitos totais: <strong>${totalHabits}</strong></div>
      <div>Refeições: <strong>${meals.length}</strong></div>
      <div>Treinos: <strong>${workouts.length}</strong></div>
      <div>Última hidratação (hoje): <strong>${todayWater} ml</strong></div>
    </div>
  </div>
  `;

  $('#app').innerHTML = html;

  // attach add water
  $('#btnAddWaterHome').addEventListener('click', async () => {
    await addWater(250);
    toast('+250ml adicionados');
    renderHome();
  });

  // populate recents
  const recentHabitsEl = $('#recentHabits');
  recentHabitsEl.innerHTML = '';
  const lastHab = records.slice(-6).reverse();
  if(lastHab.length === 0) recentHabitsEl.innerHTML = '<div class="small muted">Nenhum registro.</div>';
  else {
    lastHab.forEach(r => {
      const h = habits.find(x=>x.id===r.habitId);
      const el = document.createElement('div');
      el.className = 'recent-item';
      el.innerHTML = `<div>${escapeHTML(h ? h.title : '—')}</div><div class="small muted">${r.date}</div>`;
      recentHabitsEl.appendChild(el);
    });
  }

  const recentMealsEl = $('#recentMeals');
  recentMealsEl.innerHTML = '';
  load('meals', []).slice(-6).reverse().forEach(m => {
    const el = document.createElement('div');
    el.className = 'recent-item';
    el.innerHTML = `<div>${escapeHTML(m.title)} • ${m.calories || '—'} kcal</div><div class="small muted">${new Date(m.datetime).toLocaleTimeString()}</div>`;
    recentMealsEl.appendChild(el);
  });

  const recentWorkoutsEl = $('#recentWorkouts');
  recentWorkoutsEl.innerHTML = '';
  load('workouts', []).slice(-6).reverse().forEach(w => {
    const el = document.createElement('div');
    el.className = 'recent-item';
    el.innerHTML = `<div>${escapeHTML(w.type)}</div><div class="small muted">${w.duration || w.dur || 0} min</div>`;
    recentWorkoutsEl.appendChild(el);
  });

  // render charts (Chart.js)
  const labels = last7.map(d => new Date(d).toLocaleDateString('pt-BR',{weekday:'short', day:'numeric'}));
  // Habits chart
  const ctxH = document.getElementById('chartHabits').getContext('2d');
  if(chartHabits) chartHabits.destroy();
  chartHabits = new Chart(ctxH, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '% hábitos concluídos',
        data: weeklyHabPct,
        backgroundColor: Array(7).fill('rgba(43,110,246,0.8)'),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins:{legend:{display:false},tooltip:{mode:'index'}},
      scales: { y: { beginAtZero:true, max:100 } }
    }
  });

  // Water chart (line)
  const ctxW = document.getElementById('chartWater').getContext('2d');
  if(chartWater) chartWater.destroy();
  chartWater = new Chart(ctxW, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Água (ml)',
        data: weeklyWater,
        borderColor: 'rgba(22,163,74,0.95)',
        backgroundColor: 'rgba(22,163,74,0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 4
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:true } } }
  });
}

/* -------------------------
   HABITS PAGE
------------------------- */
function renderHabits(){
  setActive('#nav-habitos');
  const habits = load('habits', []);
  const records = load('habit_records', []);
  let html = `<div class="card"><h2>📋 Hábitos</h2><div style="display:flex;justify-content:space-between;align-items:center">
    <div class="small muted">Gerencie seus hábitos</div>
    <div><button id="btnNewHabit" class="btn-primary">+ Novo</button></div>
    </div>
    <div style="margin-top:12px">`;

  if(!habits.length) html += '<div class="small muted">Nenhum hábito cadastrado</div>';
  else{
    habits.forEach(h => {
      const doneToday = records.some(r => r.habitId === h.id && r.date === todayISO() && r.done);
      html += `<div class="habit">
        <div><strong>${escapeHTML(h.title)}</strong><div class="small muted">${h.time || ''}</div></div>
        <div class="inline-actions">
          <button class="btn-ghost" data-action="toggle" data-id="${h.id}">${doneToday ? 'Desmarcar' : 'Marcar'}</button>
          <button class="btn-ghost" data-action="edit" data-id="${h.id}">Editar</button>
          <button class="btn-ghost" data-action="del" data-id="${h.id}">Excluir</button>
        </div>
      </div>`;
    });
  }
  html += `</div></div>`;
  $('#app').innerHTML = html;

  // events
  $('#btnNewHabit').addEventListener('click', () => openHabitModal());

  $$('.btn-ghost[data-action]').forEach(b => {
    b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const act = e.currentTarget.dataset.action;
      if(act === 'toggle'){
        await toggleHabitToday(id);
        toast('Atividade atualizada');
        renderHabits();
      } else if(act === 'del'){
        if(confirm('Excluir hábito?')) { deleteHabit(id); toast('Excluído'); renderHabits(); }
      } else if(act === 'edit'){
        const h = load('habits',[]).find(x=>x.id===id);
        openHabitModal(h);
      }
    });
  });
}

function openHabitModal(habit = null){
  const title = habit ? 'Editar Hábito' : 'Novo Hábito';
  const body = document.createElement('div');
  body.innerHTML = `
    <h3>${title}</h3>
    <label>Título</label>
    <input id="mh_title" value="${habit ? escapeHTML(habit.title) : ''}">
    <label>Horário (opcional)</label>
    <input id="mh_time" type="time" value="${habit ? (habit.time||'') : ''}">
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
      <button id="mh_cancel" class="btn-secondary">Cancelar</button>
      <button id="mh_save" class="btn-primary">Salvar</button>
    </div>
  `;
  openModalElement(body);
  $('#mh_cancel').onclick = () => closeModal();
  $('#mh_save').onclick = () => {
    const title = $('#mh_title').value.trim();
    const time = $('#mh_time').value || null;
    if(!title){ toast('Título necessário'); return; }
    if(habit){
      updateHabit(habit.id, { title, time });
      toast('Hábito atualizado');
    } else {
      createHabit({ title, time });
      toast('Hábito criado');
    }
    closeModal();
    renderHabits();
  };
}

function createHabit(payload){
  const arr = load('habits', []);
  arr.push({ id: uuid(), title: payload.title, time: payload.time || null, createdAt: new Date().toISOString() });
  save('habits', arr);
}

function updateHabit(id, payload){
  let arr = load('habits', []);
  arr = arr.map(h => h.id === id ? {...h, ...payload} : h);
  save('habits', arr);
}

function deleteHabit(id){
  let arr = load('habits', []);
  arr = arr.filter(h => h.id !== id);
  save('habits', arr);
}

async function toggleHabitToday(habitId){
  // toggle or insert record for today
  const recs = load('habit_records', []);
  const today = todayISO();
  const idx = recs.findIndex(r => r.habitId === habitId && r.date === today);
  if(idx >= 0){
    // flip
    recs[idx].done = !recs[idx].done;
  } else {
    recs.push({ id: uuid(), habitId, date: today, done: true });
  }
  save('habit_records', recs);
}

/* -------------------------
   MEALS
------------------------- */
function renderMeals(){
  setActive('#nav-refeicoes');
  const meals = load('meals', []);
  let html = `<div class="card"><h2>🍎 Refeições</h2>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div class="small muted">Registre suas refeições</div>
      <div><button id="btnNewMeal" class="btn-primary">+ Registrar</button></div>
    </div>
    <div style="margin-top:12px">`;
  if(!meals.length) html += '<div class="small muted">Nenhuma refeição</div>';
  else meals.slice().reverse().forEach(m => {
    html += `<div class="recent-item"><div><strong>${escapeHTML(m.title)}</strong><div class="small muted">${m.calories || '—'} kcal</div></div>
      <div class="small muted">${new Date(m.datetime).toLocaleString()}</div></div>`;
  });
  html += `</div></div>`;
  $('#app').innerHTML = html;
  $('#btnNewMeal').onclick = () => openMealModal();
}

function openMealModal(){
  const body = document.createElement('div');
  body.innerHTML = `
    <h3>Registrar Refeição</h3>
    <label>Nome</label><input id="mm_title">
    <label>Calorias</label><input id="mm_cal" type="number" min="0">
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
      <button id="mm_cancel" class="btn-secondary">Cancelar</button>
      <button id="mm_save" class="btn-primary">Salvar</button>
    </div>
  `;
  openModalElement(body);
  $('#mm_cancel').onclick = closeModal;
  $('#mm_save').onclick = () => {
    const title = $('#mm_title').value.trim();
    const calories = parseInt($('#mm_cal').value) || 0;
    if(!title) { toast('Título necessário'); return; }
    const arr = load('meals', []);
    arr.push({ id: uuid(), title, calories, datetime: new Date().toISOString() });
    save('meals', arr);
    toast('Refeição registrada');
    closeModal();
    renderMeals();
  };
}

/* -------------------------
   WORKOUTS
------------------------- */
function renderWorkouts(){
  setActive('#nav-treinos');
  const workouts = load('workouts', []);
  let html = `<div class="card"><h2>💪 Treinos</h2><div style="display:flex;justify-content:space-between;align-items:center">
    <div class="small muted">Registre seus treinos</div>
    <div><button id="btnNewWorkout" class="btn-primary">+ Adicionar</button></div>
    </div>
    <div style="margin-top:12px">`;
  if(!workouts.length) html += '<div class="small muted">Nenhum treino</div>';
  else workouts.slice().reverse().forEach(w => {
    html += `<div class="recent-item"><div><strong>${escapeHTML(w.type)}</strong><div class="small muted">${w.duration || w.dur || 0} min</div></div>
      <div class="small muted">${new Date(w.datetime).toLocaleString()}</div></div>`;
  });
  html += `</div></div>`;
  $('#app').innerHTML = html;
  $('#btnNewWorkout').onclick = () => openWorkoutModal();
}

function openWorkoutModal(){
  const body = document.createElement('div');
  body.innerHTML = `
    <h3>Registrar Treino</h3>
    <label>Tipo</label><input id="wt_type">
    <label>Duração (min)</label><input id="wt_dur" type="number" min="0">
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
      <button id="wt_cancel" class="btn-secondary">Cancelar</button>
      <button id="wt_save" class="btn-primary">Salvar</button>
    </div>
  `;
  openModalElement(body);
  $('#wt_cancel').onclick = closeModal;
  $('#wt_save').onclick = () => {
    const type = $('#wt_type').value.trim();
    const dur = parseInt($('#wt_dur').value) || 0;
    if(!type){ toast('Tipo necessário'); return; }
    const arr = load('workouts', []);
    arr.push({ id: uuid(), type, duration: dur, datetime: new Date().toISOString() });
    save('workouts', arr);
    toast('Treino registrado');
    closeModal();
    renderWorkouts();
  };
}

/* -------------------------
   WATER PAGE
------------------------- */
async function renderWater(){
  setActive('#nav-water');
  const arr = load('water', []);
  const today = todayISO();
  let rec = arr.find(x=>x.date===today);
  if(!rec){ rec = { date: today, quantidade_ml: 0 }; arr.unshift(rec); save('water', arr); }

  let html = `<div class="card"><h2>💧 Hidratação</h2>
    <div class="row"><div>Hoje: <strong id="waterToday">${rec.quantidade_ml}</strong> ml</div>
    <div><button id="waterAdd" class="btn-primary">+250ml</button><button id="waterReset" class="btn-secondary">Reset</button></div></div>
    <div class="helper">Últimos 7 dias</div>
    <div style="margin-top:8px">`;
  arr.slice(0,7).forEach(w => {
    html += `<div class="recent-item"><div>${w.date}</div><div>${w.quantidade_ml} ml</div></div>`;
  });
  html += `</div></div>`;
  $('#app').innerHTML = html;

  $('#waterAdd').onclick = async () => { await addWater(250); toast('+250ml'); renderWater(); };
  $('#waterReset').onclick = () => { resetWater(); toast('Zerado'); renderWater(); };
}

async function addWater(q){
  const arr = load('water', []);
  const today = todayISO();
  let rec = arr.find(x=>x.date===today);
  if(!rec){ rec = { date: today, quantidade_ml: 0 }; arr.unshift(rec); }
  rec.quantidade_ml += q;
  save('water', arr);
}

function resetWater(){
  const arr = load('water', []);
  const today = todayISO();
  let rec = arr.find(x=>x.date===today);
  if(rec) rec.quantidade_ml = 0;
  save('water', arr);
}

/* -------------------------
   ACCOUNT
------------------------- */
function renderAccount(){
  setActive('#nav-conta');
  const user = load('user', {});
  const html = `<div class="card"><h2>⚙️ Conta</h2>
    <div class="form-group">
      <label>Nome</label><input id="acc_name" value="${escapeHTML(user.name||'')}">
    </div>
    <div class="form-group">
      <label>Email</label><input id="acc_email" value="${escapeHTML(user.email||'')}">
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button id="saveAccount" class="btn-primary">Salvar</button></div>
  </div>`;
  $('#app').innerHTML = html;
  $('#saveAccount').onclick = () => {
    const name = $('#acc_name').value.trim();
    const email = $('#acc_email').value.trim();
    const u = load('user', {});
    u.name = name || u.name;
    u.email = email || u.email;
    save('user', u);
    toast('Conta salva');
    $('#userLabel').textContent = u.name;
  };
}

/* -------------------------
   MODAL helpers
------------------------- */
function openModalElement(el){
  $('#modal').innerHTML = '';
  $('#modal').appendChild(el);
  $('#modal-container').style.display = 'grid';
  $('#modal-container').setAttribute('aria-hidden','false');
}
function closeModal(){
  $('#modal-container').style.display = 'none';
  $('#modal-container').setAttribute('aria-hidden','true');
}
$('#modal-container').addEventListener('click', (e) => {
  if(e.target.id === 'modal-container') closeModal();
});

/* -------------------------
   NAV + INIT
------------------------- */
function setActive(selector){
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  const el = $(selector);
  if(el) el.classList.add('active');
}

function initNav(){
  const map = {
    '#nav-home': renderHome,
    '#nav-habitos': renderHabits,
    '#nav-refeicoes': renderMeals,
    '#nav-treinos': renderWorkouts,
    '#nav-water': renderWater,
    '#nav-conta': renderAccount
  };
  Object.keys(map).forEach(sel => {
    const btn = $(sel);
    if(!btn) return;
    btn.addEventListener('click', (e) => {
      // update UI
      $$('.nav-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      // call page
      map[sel]();
      // move focus to main for accessibility
      $('#main').focus();
    });
  });

  $('#themeToggle').addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    $('#themeToggle').setAttribute('aria-pressed', next === 'dark');
    localStorage.setItem('mf_theme', next);
  });

  // load persisted theme
  const t = localStorage.getItem('mf_theme');
  if(t) document.documentElement.dataset.theme = t;
}

window.addEventListener('DOMContentLoaded', () => {
  initNav();
  // render initial home
  renderHome();
  // keyboard shortcuts: 1..5 navigate
  window.addEventListener('keydown', e => {
    if(e.altKey || e.metaKey) return;
    if(e.key === '1') $('#nav-home').click();
    if(e.key === '2') $('#nav-habitos').click();
    if(e.key === '3') $('#nav-refeicoes').click();
    if(e.key === '4') $('#nav-treinos').click();
    if(e.key === '5') $('#nav-water').click();
  });
});

/* -------------------------
   Export / Import helpers
------------------------- */
window.exportData = function(){
  const payload = {
    exportedAt: new Date().toISOString(),
    user: load('user', {}),
    habits: load('habits', []),
    habit_records: load('habit_records', []),
    meals: load('meals', []),
    workouts: load('workouts', []),
    water: load('water', [])
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mundo-fitness-export.json'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

window.importData = function(json){
  // basic validation
  try{
    if(json.user) save('user', json.user);
    if(Array.isArray(json.habits)) save('habits', json.habits);
    if(Array.isArray(json.habit_records)) save('habit_records', json.habit_records);
    if(Array.isArray(json.meals)) save('meals', json.meals);
    if(Array.isArray(json.workouts)) save('workouts', json.workouts);
    if(Array.isArray(json.water)) save('water', json.water);
    toast('Import concluído');
    renderHome();
  }catch(e){
    toast('Import falhou');
  }
};
