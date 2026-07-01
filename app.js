// ── SYNC (gamificação — carregado de /data/sync.json) ─────────────
let SYNC = null;

async function loadSync() {
  try {
    const r = await fetch('/data/sync.json?v=' + Date.now());
    if (!r.ok) return;
    SYNC = await r.json();
    renderGamification();
    if (curView === 'growth') renderGrowth();
    // Propaga streaks de sync.json para localStorage se ainda não inicializados
    if (!localStorage.getItem('agh_streaks') && SYNC?.player?.streaks) {
      localStorage.setItem('agh_streaks', JSON.stringify(SYNC.player.streaks));
    }
  } catch(e) { console.warn('[sync] falha ao carregar sync.json:', e); }
}

function renderGamification() {
  if (!SYNC) return;
  renderPlayerCard();
  renderQuests();
  renderAchievements();
  renderXpLog();
}

// ── ATTRIBUTES ───────────────────────────────────────────────────

// Carrega atributos do localStorage (sobrepõe values do sync.json para persistir ganhos locais)
function loadAttrState() {
  const saved = JSON.parse(localStorage.getItem('agh_attrs') ?? 'null');
  if (!SYNC?.player?.attributes) return null;
  if (!saved) return JSON.parse(JSON.stringify(SYNC.player.attributes));
  // Mescla: usa structure do sync.json mas valores do localStorage quando existirem
  const base = JSON.parse(JSON.stringify(SYNC.player.attributes));
  Object.keys(base).forEach(k => {
    if (saved[k] !== undefined) base[k].value = saved[k];
  });
  return base;
}

function saveAttrState(attrs) {
  const vals = {};
  Object.keys(attrs).forEach(k => { vals[k] = attrs[k].value; });
  localStorage.setItem('agh_attrs', JSON.stringify(vals));
}

// Retorna o build ativo (localStorage sobrepõe sync.json para permitir troca sem editar o arquivo)
function getActiveBuild() {
  const saved = localStorage.getItem('agh_build');
  const builds = SYNC?.player?.availableBuilds ?? [];
  const id = saved ?? SYNC?.player?.build?.id ?? 'backend-mage';
  return builds.find(b => b.id === id) ?? builds[0] ?? { id, label: id, bonus: {}, icon: '⚡' };
}

function addAttribute(attr, rawVal, source) {
  if (!SYNC?.player?.attributes) return;
  const attrs = loadAttrState();
  if (!attrs[attr]) return;

  const build = getActiveBuild();
  const mult = build?.bonus?.[attr] ?? 1;
  const finalVal = Math.round(rawVal * mult);
  attrs[attr].value = (attrs[attr].value ?? 0) + finalVal;
  saveAttrState(attrs);

  // Log dos últimos 50 eventos
  const log = JSON.parse(localStorage.getItem('attributeLog') ?? '[]');
  log.unshift({ attr, val: finalVal, source, date: today() });
  localStorage.setItem('attributeLog', JSON.stringify(log.slice(0, 50)));

  const bonusStr = mult > 1 ? ` (×${mult.toFixed(2)} build)` : '';
  toast(`${attrs[attr].icon} +${finalVal} ${attr.toUpperCase()}${bonusStr} — ${source}`);
}

function applyAttributeRules(type) {
  if (!SYNC?.attributeRules) return;
  const rules = SYNC.attributeRules[type] ?? {};
  Object.entries(rules).forEach(([attr, val]) => addAttribute(attr, val, type));
}

// ── PLAYER CARD (RPG) ─────────────────────────────────────────────

function renderPlayerCard() {
  if (!SYNC?.player) return;
  const p      = SYNC.player;
  const levels = SYNC.levels ?? [];
  const nextLv = levels.find(l => l.xpMin > p.xp);
  const xpToNext = nextLv ? nextLv.xpMin : p.xp + 1000;
  const curLvXp  = levels.find(l => l.level === p.level)?.xpMin ?? 0;
  const xpPct    = Math.min(100, Math.round(((p.xp - curLvXp) / (xpToNext - curLvXp)) * 100));

  const attrs = loadAttrState();
  const build = getActiveBuild();

  if (!attrs) {
    // Fallback: render simples sem atributos (sync.json antigo)
    document.getElementById('player-card-wrap').innerHTML = renderPlayerCardLegacy(p, xpPct, xpToNext);
    return;
  }

  document.getElementById('player-card-wrap').innerHTML =
    renderPlayerCardRpg(p, attrs, build, xpPct, xpToNext);
}

function renderPlayerCardLegacy(p, xpPct, xpToNext) {
  return `<div class="player-card">
    <div class="player-card-top">
      <div class="player-avatar">⚡</div>
      <div class="player-info">
        <div class="player-name">${esc(p.name)}</div>
        <div class="player-title">${esc(p.title)}</div>
        <div class="xp-bar-wrap">
          <div class="xp-bar"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
          <div class="xp-label">${p.xp} / ${xpToNext} XP</div>
        </div>
      </div>
      <div class="player-stats-right">
        <div class="player-level">Lv${p.level}</div>
        <div class="player-level-lbl">nível</div>
        <div class="streak-badge" style="margin-top:6px">🔥 ${p.streak}d</div>
      </div>
    </div>
  </div>`;
}

function renderPlayerCardRpg(p, attrs, build, xpPct, xpToNext) {
  const vals = Object.values(attrs).map(a => a.value ?? 0);
  const maxVal = Math.max(...vals, 1);
  const minVal = Math.min(...vals);
  const maxAttr = Object.keys(attrs).find(k => (attrs[k].value ?? 0) === maxVal);
  const minAttr = Object.keys(attrs).find(k => (attrs[k].value ?? 0) === minVal);

  const attrRows = Object.entries(attrs).map(([key, a]) => {
    const val = a.value ?? 0;
    const pct = Math.min(100, Math.round((val / Math.max(maxVal, 1)) * 100));
    const isMax = key === maxAttr;
    const isMin = key === minAttr && val < maxVal;
    const color = isMax ? 'var(--accent)' : isMin ? 'var(--danger)' : 'var(--primary)';
    const mult  = build?.bonus?.[key] ?? 1;
    const bonusLabel = mult > 1 ? `+${Math.round((mult - 1) * 100)}%` : '';
    return `<div class="attr-row">
      <span class="attr-icon">${a.icon}</span>
      <span class="attr-label">${esc(a.label)}</span>
      <div class="attr-bar-wrap">
        <div class="attr-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="attr-val" style="color:${color}">${val}</span>
      <span class="attr-bonus" style="color:${mult>1?'var(--accent)':'var(--muted)'}">${bonusLabel}</span>
    </div>`;
  }).join('');

  // Identifica os 2 atributos mais fracos para o hint de próximo nível
  const sorted = Object.entries(attrs).sort((a, b) => (a[1].value ?? 0) - (b[1].value ?? 0));
  const hints  = sorted.slice(0, 2).map(([k, a]) => `${a.icon} ${k.toUpperCase()} ${(a.value ?? 0) + 10}`);

  return `<div class="player-card">
    <div class="player-card-top">
      <div class="player-avatar">${build.icon ?? '⚡'}</div>
      <div class="player-info">
        <div class="player-name">${esc(p.name)} — ${esc(build.label)}</div>
        <div class="player-title">Lv${p.level} · ${esc(p.title)}</div>
        <div class="xp-bar-wrap">
          <div class="xp-bar"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
          <div class="xp-label">${p.xp} / ${xpToNext} XP</div>
        </div>
      </div>
      <div class="player-stats-right">
        <div class="player-level">Lv${p.level}</div>
        <div class="player-level-lbl">nível</div>
        <div class="streak-badge" style="margin-top:6px">🔥 ${p.streak}d</div>
      </div>
    </div>
    <div class="attr-grid">${attrRows}</div>
    <div class="player-card-footer">
      <div class="player-next-lv">Próximo nível: <span>${hints.join(' ou ')}</span></div>
      <button class="build-badge" onclick="openBuildModal()">
        ${build.icon} ${esc(build.label)} · Trocar Build
      </button>
    </div>
  </div>`;
}

// ── BUILD MODAL ───────────────────────────────────────────────────

let _pendingBuildId = null;

function openBuildModal() {
  if (!SYNC?.player?.availableBuilds) return;
  const current = getActiveBuild();
  _pendingBuildId = current.id;

  document.getElementById('build-list').innerHTML =
    SYNC.player.availableBuilds.map(b => {
      const bonusTags = Object.entries(b.bonus ?? {})
        .map(([k, v]) => `<span class="build-bonus-tag">${k.toUpperCase()} +${Math.round((v-1)*100)}%</span>`)
        .join('');
      return `<div class="build-option${b.id === current.id ? ' active' : ''}"
          onclick="selectBuildOption('${b.id}', this)">
          <div class="build-icon">${b.icon}</div>
          <div class="build-info">
            <div class="build-name">${esc(b.label)}</div>
            <div class="build-desc">${esc(b.desc)}</div>
            <div class="build-bonus-tags">${bonusTags}</div>
          </div>
        </div>`;
    }).join('');

  openM('m-build');
}

function selectBuildOption(id, el) {
  _pendingBuildId = id;
  document.querySelectorAll('.build-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
}

function confirmBuild() {
  if (!_pendingBuildId) return;
  localStorage.setItem('agh_build', _pendingBuildId);
  closeM('m-build');
  renderPlayerCard();
  const b = getActiveBuild();
  toast(`Build: ${b.icon} ${b.label}`);
}

function renderQuests() {
  const active = (SYNC.quests || []).filter(q => q.status !== 'done');
  const done   = (SYNC.quests || []).filter(q => q.status === 'done');
  if (!active.length && !done.length) return;
  document.getElementById('quests-section').style.display = '';
  document.getElementById('quests-list').innerHTML =
    [...active, ...done].map(q => `
      <div class="quest-card ${q.status === 'done' ? 'done' : ''}">
        <div class="quest-icon">${q.icon || '🎯'}</div>
        <div class="quest-body">
          <div class="quest-title">${esc(q.title)} ${q.status === 'done' ? '✓' : ''}</div>
          <div class="quest-desc">${esc(q.desc)}</div>
          ${q.hint && q.status !== 'done' ? `<div class="quest-hint">${esc(q.hint)}</div>` : ''}
        </div>
        <div class="quest-xp">+${q.xp} XP</div>
      </div>`).join('');
}

function renderAchievements() {
  const achs = SYNC.achievements || [];
  if (!achs.length) return;
  document.getElementById('achievements-section').style.display = '';
  document.getElementById('achievements-grid').innerHTML = achs.map(a => `
    <div class="achievement-card">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-info">
        <div class="ach-name">${esc(a.name)}</div>
        <div class="ach-desc">${esc(a.desc)}</div>
        <div class="ach-date">${fmtD(a.unlockedAt)}</div>
      </div>
    </div>`).join('');
}

function renderXpLog() {
  const log = (SYNC.recentActivity || []).slice(0, 8);
  if (!log.length) return;
  document.getElementById('xp-log-section').style.display = '';
  document.getElementById('xp-log-list').innerHTML = log.map(e => `
    <div class="xp-entry">
      <div class="xp-entry-icon">${e.icon || '✅'}</div>
      <div class="xp-entry-desc">${esc(e.title)}</div>
      <div class="xp-entry-date">${fmtD(e.date)}</div>
      <div class="xp-entry-pts">+${e.xp}</div>
    </div>`).join('');
}

// ── DATA ─────────────────────────────────────────────────────────
const DB = {
  get tasks()    { return JSON.parse(localStorage.getItem('agh_tasks')    || '[]') },
  set tasks(v)   { localStorage.setItem('agh_tasks',    JSON.stringify(v)) },
  get projects() { return JSON.parse(localStorage.getItem('agh_projects') || '[]') },
  set projects(v){ localStorage.setItem('agh_projects', JSON.stringify(v)) },
  get events()   { return JSON.parse(localStorage.getItem('agh_events')   || '[]') },
  set events(v)  { localStorage.setItem('agh_events',   JSON.stringify(v)) },
  get studies()  { return JSON.parse(localStorage.getItem('agh_studies')  || '[]') },
  set studies(v) { localStorage.setItem('agh_studies',  JSON.stringify(v)) },
};

const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const esc  = s  => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtD = d  => { if(!d) return ''; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}`; };
const today= ()  => new Date().toISOString().slice(0,10);

// ── P3 SFX (opt-in, WebAudio sintetizado) ─────────────────────────
const P3_SFX_KEY = 'p3_sfx';
let p3AudioCtx = null;
function p3SfxEnabled() { return localStorage.getItem(P3_SFX_KEY) === '1'; }
function p3SfxToggle(on) {
  const val = on === undefined ? !p3SfxEnabled() : !!on;
  localStorage.setItem(P3_SFX_KEY, val ? '1' : '0');
  if (val) p3Sfx();
  return val;
}
function p3Sfx() {
  if (!p3SfxEnabled()) return;
  try {
    p3AudioCtx = p3AudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = p3AudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1720, t + 0.05);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.12);
  } catch (e) { /* áudio indisponível — silêncio */ }
}
function p3SfxUiToggle() {
  const on = p3SfxToggle();
  const el = document.getElementById('p3-sfx-state');
  if (el) el.textContent = on ? 'on' : 'off';
}
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('p3-sfx-state');
  if (el) el.textContent = p3SfxEnabled() ? 'on' : 'off';
});

// ── NAV ───────────────────────────────────────────────────────────
let curView = 'dash';

function go(view) {
  p3Sfx();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.getElementById('nav-'+view).classList.add('active');
  curView = view;
  if (view==='dash')     renderDash();
  if (view==='projects') renderProjects();
  if (view==='tasks')    renderTasks();
  if (view==='agenda')   renderCal();
  if (view==='growth')       { renderGrowth(); renderModules(); }
  if (view==='quest-board')  renderQuestBoard();
  if (view==='trilha')       renderTrilha();
}

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.textContent = (type==='ok'?'✓  ':'✕  ') + msg;
  el.className = 'toast '+type+' show';
  setTimeout(()=>el.classList.remove('show'), 2500);
}

// ── MODAL ─────────────────────────────────────────────────────────
function openM(id)  { document.getElementById(id).classList.add('open'); }
function closeM(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(o =>
  o.addEventListener('click', e => { if(e.target===o) o.classList.remove('open'); })
);

// ── RING SVG ──────────────────────────────────────────────────────
function ring(pct, color, size=44) {
  const s=3.5, r=(size-s*2)/2, c=2*Math.PI*r;
  const offset = c - (pct/100)*c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="${s}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${s}"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
      stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
    <text x="${size/2}" y="${size/2+4}" text-anchor="middle" font-size="9" font-weight="700"
      fill="${color}" font-family="Inter,system-ui,sans-serif">${pct}%</text>
  </svg>`;
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function renderDash() {
  const now   = new Date();
  const hr    = now.getHours();
  const greet = hr<12?'Bom dia, ':hr<18?'Boa tarde, ':'Boa noite, ';

  document.querySelector('.dash-greeting').innerHTML =
    `${greet}<span id="greet-name">Ricaliff</span> 👋`;
  document.getElementById('greet-sub').textContent =
    now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  // quick stats
  const tasks   = DB.tasks;
  const projs   = DB.projects;
  const evs     = DB.events;
  const t       = today();
  const pending = tasks.filter(x=>x.status!=='done').length;
  const done    = tasks.filter(x=>x.status==='done').length;
  const activeP = projs.filter(p=>p.status==='ativo').length;
  const todayEv = evs.filter(e=>e.date===t).length;

  document.getElementById('dash-qs').innerHTML = `
    <div class="qs"><div class="qs-val" style="color:var(--phi)">${pending}</div><div class="qs-lbl">pendentes</div></div>
    <div class="qs"><div class="qs-val" style="color:var(--green)">${done}</div><div class="qs-lbl">concluídas</div></div>
    <div class="qs"><div class="qs-val" style="color:var(--cyan)">${activeP}</div><div class="qs-lbl">projetos ativos</div></div>
    <div class="qs"><div class="qs-val" style="color:var(--yellow)">${todayEv}</div><div class="qs-lbl">eventos hoje</div></div>
  `;

  // focus: top 3 high/medium priority pending, by due
  const focus = tasks
    .filter(x=>x.status!=='done')
    .sort((a,b)=>{
      const p={high:0,medium:1,low:2};
      if(p[a.priority]!==p[b.priority]) return p[a.priority]-p[b.priority];
      if(a.due&&b.due) return a.due.localeCompare(b.due);
      return a.due?-1:b.due?1:0;
    })
    .slice(0,4);

  const focusEl = document.getElementById('focus-list');
  if(!focus.length) {
    focusEl.innerHTML='<div class="empty-s" style="color:var(--muted);font-size:.78rem;padding:8px 0">Nenhuma tarefa pendente 🎉</div>';
  } else {
    focusEl.innerHTML = focus.map(tk=>`
      <div class="focus-item" onclick="openTaskModal('${tk.id}')">
        <div class="fcheck ${tk.status==='done'?'done':''}" onclick="toggleT(event,'${tk.id}')">
          ${tk.status==='done'?'<svg width="8" height="8" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''}
        </div>
        <div>
          <div class="focus-text ${tk.status==='done'?'done-text':''}">${esc(tk.title)}</div>
          <div class="focus-meta">
            ${tk.due?`${tk.due<t?'⚠ ':''}`+fmtD(tk.due):''}
            ${tk.priority==='high'?' · 🔴 Alta':''}
          </div>
        </div>
      </div>`).join('');
  }

  // rings: all projects
  const ringsEl = document.getElementById('rings-list');
  if(!projs.length) {
    ringsEl.innerHTML='<div style="color:var(--muted);font-size:.78rem;padding:8px 0">Crie projetos para ver o progresso</div>';
  } else {
    ringsEl.innerHTML = projs.slice(0,4).map(p=>{
      const pt  = tasks.filter(x=>x.projectId===p.id);
      const pct = pt.length ? Math.round(pt.filter(x=>x.status==='done').length/pt.length*100) : 0;
      return `<div class="ring-row" onclick="go('projects')">
        ${ring(pct,p.color)}
        <div class="ring-info">
          <div class="ring-name">${esc(p.name)}</div>
          <div class="ring-tasks">${pt.length} tarefa${pt.length!==1?'s':''} · ${p.status==='ativo'?'Ativo':p.status==='pausado'?'Pausado':'Concluído'}</div>
        </div>
      </div>`;
    }).join('');
  }

  // today events
  const todayEvs = DB.events.filter(e=>e.date===t)
    .sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const todayEl = document.getElementById('dash-today');
  if(!todayEvs.length) {
    todayEl.innerHTML='<div style="color:var(--muted);font-size:.78rem;padding:4px 0">Sem eventos hoje</div>';
  } else {
    todayEl.innerHTML = todayEvs.map(e=>`
      <div class="today-ev" onclick="openEvModal('${e.id}')">
        <div class="ev-time-badge">${e.time?e.time.slice(0,5):'––'}</div>
        <div class="ev-dot ev-${e.type}" style="margin-top:5px"></div>
        <div>
          <div class="ev-t">${esc(e.title)}</div>
          <div class="ev-s">${e.type}${e.duration?' · '+e.duration+'min':''}</div>
        </div>
      </div>`).join('');
  }

  renderFocusSection();
  renderWeeklyDigest();
}

// ── PROJECTS ──────────────────────────────────────────────────────
function renderProjects() {
  const projs = DB.projects;
  const tasks = DB.tasks;
  const grid  = document.getElementById('proj-grid');

  if(!projs.length) {
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-i">◈</div>
      <div class="empty-t">Nenhum projeto ainda</div>
      <div class="empty-s">Crie projetos para organizar suas tarefas</div>
    </div>`;
    return;
  }

  grid.innerHTML = projs.map(p=>{
    const pt   = tasks.filter(t=>t.projectId===p.id);
    const done = pt.filter(t=>t.status==='done').length;
    const pct  = pt.length ? Math.round(done/pt.length*100) : 0;
    const sl   = {ativo:'psb-ativo',pausado:'psb-pausado',concluido:'psb-concluido'};
    const sl2  = {ativo:'Ativo',pausado:'Pausado',concluido:'Concluído'};
    return `
    <div class="proj-card" onclick="openProjModal('${p.id}')">
      <div class="proj-cover" style="background:linear-gradient(135deg,${p.color}55 0%,${p.color}15 100%)">
        <div class="proj-cover-blur" style="background:${p.color}"></div>
        <div class="proj-status-badge ${sl[p.status]}">${sl2[p.status]}</div>
      </div>
      <div class="proj-body">
        <div class="proj-name">${esc(p.name)}</div>
        ${p.description?`<div class="proj-desc">${esc(p.description)}</div>`:''}
        ${p.githubUrl ? `<a class="proj-github" href="${p.githubUrl}" target="_blank" onclick="event.stopPropagation()"><svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>${p.isPrivate ? '🔒 ' : ''}GitHub</a>` : ''}
        ${(()=>{const imp=p.improvements?.filter(Boolean)||[];return imp.length?`<div class="proj-improvements"><span>⚡ ${imp.length} melhoria${imp.length!==1?'s':''} identificada${imp.length!==1?'s':''}</span></div>`:''})()}
        <div class="proj-footer">
          <div>
            <div class="proj-prog-text">${pt.length} tarefa${pt.length!==1?'s':''} · ${(()=>{const d=projStaleDays(p.id);return d===null?'':d>14?`<span style="color:var(--warn)">sem atividade há ${d}d</span>`:d>7?`<span style="color:var(--muted)">${d}d atrás</span>`:''})()}</div>
            <div class="proj-prog-val" style="color:${p.color}">${pct}%</div>
          </div>
          ${ring(pct,p.color,48)}
        </div>
        <div class="prog-bar-thin" style="margin-top:10px">
          <div class="prog-fill-thin" style="width:${pct}%;background:${p.color}"></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openProjModal(id) {
  if(id) {
    const p=DB.projects.find(x=>x.id===id);
    if(!p) return;
    document.getElementById('mp-title').textContent='Editar Projeto';
    document.getElementById('fp-id').value   =p.id;
    document.getElementById('fp-name').value =p.name;
    document.getElementById('fp-desc').value =p.description||'';
    document.getElementById('fp-status').value=p.status;
    document.getElementById('p-del').style.display='';
    document.getElementById('fp-improvements').value=(p.improvements||[]).join('\n');
    document.querySelectorAll('.col').forEach(el=>el.classList.toggle('sel',el.dataset.c===p.color));
  } else {
    document.getElementById('mp-title').textContent='Novo Projeto';
    document.getElementById('fp-id').value='';
    document.getElementById('fp-name').value='';
    document.getElementById('fp-desc').value='';
    document.getElementById('fp-status').value='ativo';
    document.getElementById('fp-improvements').value='';
    document.getElementById('p-del').style.display='none';
    document.querySelectorAll('.col').forEach((el,i)=>el.classList.toggle('sel',i===0));
  }
  openM('m-proj');
  setTimeout(()=>document.getElementById('fp-name').focus(),80);
}

function pickC(el) {
  document.querySelectorAll('.col').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
}

function saveProj() {
  const name=document.getElementById('fp-name').value.trim();
  if(!name){toast('Nome obrigatório','err');return;}
  const c=document.querySelector('.col.sel')?.dataset.c||'#1A7FFF';
  const projs=DB.projects, id=document.getElementById('fp-id').value;
  const existing=id?projs.find(p=>p.id===id):null;
  const data={
    id:id||uid(), name,
    description:document.getElementById('fp-desc').value.trim(),
    status:document.getElementById('fp-status').value, color:c,
    githubUrl: existing?.githubUrl||null,
    isPrivate: existing?.isPrivate||false,
    improvements: document.getElementById('fp-improvements').value.trim()
      .split('\n').map(s=>s.trim()).filter(Boolean),
    createdAt: existing?.createdAt||new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if(id){const i=projs.findIndex(p=>p.id===id);projs[i]=data;}
  else projs.unshift(data);
  DB.projects=projs;
  closeM('m-proj');
  renderProjects();
  toast(id?'Projeto atualizado':'Projeto criado');
}

function delProj() {
  const id=document.getElementById('fp-id').value;
  if(!id||!confirm('Excluir projeto? As tarefas perdem o vínculo.')) return;
  DB.projects=DB.projects.filter(p=>p.id!==id);
  DB.tasks=DB.tasks.map(t=>t.projectId===id?{...t,projectId:null}:t);
  closeM('m-proj');
  renderProjects();
  toast('Projeto excluído');
}

// ── TASKS ─────────────────────────────────────────────────────────
let taskFilter='all';

function setFilter(f,el) {
  taskFilter=f;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const tasks=DB.tasks, t=today();
  const search=document.getElementById('task-search').value.toLowerCase();
  const total=tasks.length, done=tasks.filter(x=>x.status==='done').length;
  const doing=tasks.filter(x=>x.status==='doing').length;
  const over=tasks.filter(x=>x.status!=='done'&&x.due&&x.due<t).length;
  const pend=total-done;

  document.getElementById('tasks-badge').textContent=pend;
  document.getElementById('tasks-sub').textContent=`${pend} pendente${pend!==1?'s':''} · ${done} concluída${done!==1?'s':''}`;
  document.getElementById('task-stats').innerHTML=`
    <div class="tstat"><div class="tstat-val" style="color:var(--phi)">${total}</div><div class="tstat-lbl">Total</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--yellow)">${doing}</div><div class="tstat-lbl">Em andamento</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--green)">${done}</div><div class="tstat-lbl">Concluídas</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--red)">${over}</div><div class="tstat-lbl">Atrasadas</div></div>`;

  let list=[...tasks];
  if(taskFilter==='todo')    list=list.filter(x=>x.status==='todo');
  else if(taskFilter==='doing')   list=list.filter(x=>x.status==='doing');
  else if(taskFilter==='done')    list=list.filter(x=>x.status==='done');
  else if(taskFilter==='high')    list=list.filter(x=>x.priority==='high'&&x.status!=='done');
  else if(taskFilter==='overdue') list=list.filter(x=>x.status!=='done'&&x.due&&x.due<t);
  if(search) list=list.filter(x=>x.title.toLowerCase().includes(search));

  const p={high:0,medium:1,low:2};
  list.sort((a,b)=>{
    if(a.status==='done'&&b.status!=='done') return 1;
    if(a.status!=='done'&&b.status==='done') return -1;
    if(p[a.priority]!==p[b.priority]) return p[a.priority]-p[b.priority];
    if(a.due&&b.due) return a.due.localeCompare(b.due);
    return a.due?-1:b.due?1:0;
  });

  const projs=DB.projects, el=document.getElementById('task-list');
  if(!list.length) {
    el.innerHTML=`<div class="empty">
      <div class="empty-i">✓</div>
      <div class="empty-t">${taskFilter==='done'?'Nenhuma concluída':'Nenhuma tarefa aqui'}</div>
      <div class="empty-s">${taskFilter==='all'?'Clique em "Nova Tarefa" para começar':'Tente outro filtro'}</div>
    </div>`;
    return;
  }

  el.innerHTML=list.map(tk=>{
    const proj=projs.find(p=>p.id===tk.projectId);
    const isOver=tk.status!=='done'&&tk.due&&tk.due<t;
    return `
    <div class="task-row ${tk.status==='done'?'done-row':''}" onclick="openTaskModal('${tk.id}')">
      <div class="tcheck ${tk.status==='done'?'checked':''}" onclick="toggleT(event,'${tk.id}')">
        ${tk.status==='done'?'<svg width="8" height="8" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''}
      </div>
      <div class="tbody">
        <div class="ttitle">${esc(tk.title)}</div>
        <div class="tmeta">
          <span class="tag tg-${tk.priority}">${tk.priority==='high'?'↑ Alta':tk.priority==='low'?'↓ Baixa':'– Média'}</span>
          ${proj?`<span class="tag tg-proj" style="background:${proj.color}22;color:${proj.color}">${esc(proj.name)}</span>`:''}
          ${tk.due?`<span class="tdue ${isOver?'over':''}">${isOver?'⚠ ':''}${fmtD(tk.due)}</span>`:''}
        </div>
      </div>
      <div class="tact">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openTaskModal('${tk.id}')">
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

function toggleT(e,id) {
  e.stopPropagation();
  const tasks=DB.tasks, tk=tasks.find(x=>x.id===id);
  if(!tk) return;
  tk.status=tk.status==='done'?'todo':'done';
  tk.updatedAt=new Date().toISOString();
  DB.tasks=tasks;
  if(curView==='tasks') renderTasks();
  if(curView==='dash')  renderDash();
}

function openTaskModal(id) {
  const projs=DB.projects;
  const sel=document.getElementById('ft-proj');
  sel.innerHTML='<option value="">Sem projeto</option>'+
    projs.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if(id){
    const tk=DB.tasks.find(x=>x.id===id);
    if(!tk) return;
    document.getElementById('mt-title').textContent='Editar Tarefa';
    document.getElementById('ft-id').value    =tk.id;
    document.getElementById('ft-title').value =tk.title;
    document.getElementById('ft-status').value=tk.status;
    document.getElementById('ft-prio').value  =tk.priority;
    document.getElementById('ft-proj').value  =tk.projectId||'';
    document.getElementById('ft-due').value   =tk.due||'';
    document.getElementById('ft-notes').value =tk.notes||'';
    document.getElementById('t-del').style.display='';
  } else {
    document.getElementById('mt-title').textContent='Nova Tarefa';
    document.getElementById('ft-id').value='';
    document.getElementById('ft-title').value='';
    document.getElementById('ft-status').value='todo';
    document.getElementById('ft-prio').value='medium';
    document.getElementById('ft-proj').value='';
    document.getElementById('ft-due').value='';
    document.getElementById('ft-notes').value='';
    document.getElementById('t-del').style.display='none';
  }
  openM('m-task');
  setTimeout(()=>document.getElementById('ft-title').focus(),80);
}

function saveTask() {
  const title=document.getElementById('ft-title').value.trim();
  if(!title){toast('Título obrigatório','err');return;}
  const tasks=DB.tasks, id=document.getElementById('ft-id').value;
  const data={
    id:id||uid(), title,
    status:document.getElementById('ft-status').value,
    priority:document.getElementById('ft-prio').value,
    projectId:document.getElementById('ft-proj').value||null,
    due:document.getElementById('ft-due').value||null,
    notes:document.getElementById('ft-notes').value.trim(),
    createdAt:id?(tasks.find(t=>t.id===id)?.createdAt||new Date().toISOString()):new Date().toISOString(),
    updatedAt:new Date().toISOString(),
  };
  if(id){const i=tasks.findIndex(t=>t.id===id);tasks[i]=data;}
  else tasks.unshift(data);
  DB.tasks=tasks;
  closeM('m-task');
  if(curView==='tasks') renderTasks();
  if(curView==='dash')  renderDash();
  if(curView==='projects') renderProjects();
  toast(id?'Tarefa atualizada':'Tarefa criada');
}

function delTask() {
  const id=document.getElementById('ft-id').value;
  if(!id||!confirm('Excluir esta tarefa?')) return;
  DB.tasks=DB.tasks.filter(t=>t.id!==id);
  closeM('m-task');
  if(curView==='tasks') renderTasks();
  if(curView==='dash')  renderDash();
  toast('Tarefa excluída');
}

// ── CALENDAR ──────────────────────────────────────────────────────
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let calY=new Date().getFullYear(), calM=new Date().getMonth(), selectedDay=null;

function chMonth(d){
  calM+=d;
  if(calM>11){calM=0;calY++;}
  if(calM<0){calM=11;calY--;}
  renderCal();
}
function calToday(){calY=new Date().getFullYear();calM=new Date().getMonth();renderCal();}

function renderCal() {
  document.getElementById('cal-label').textContent=`${MONTHS[calM]} ${calY}`;
  const first=new Date(calY,calM,1).getDay();
  const days=new Date(calY,calM+1,0).getDate();
  const prev=new Date(calY,calM,0).getDate();
  const t=today(), evs=DB.events, tasks=DB.tasks;
  const cells=Math.ceil((first+days)/7)*7;
  let html='';
  for(let i=0;i<cells;i++){
    let day,mo,yr,other=false;
    if(i<first){day=prev-first+i+1;mo=calM===0?11:calM-1;yr=calM===0?calY-1:calY;other=true;}
    else if(i-first>=days){day=i-first-days+1;mo=calM===11?0:calM+1;yr=calM===11?calY+1:calY;other=true;}
    else{day=i-first+1;mo=calM;yr=calY;}
    const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isT=ds===t, isSel=ds===selectedDay;
    const allItems=[
      ...evs.filter(e=>e.date===ds).map(e=>({...e,_k:'ev'})),
      ...tasks.filter(k=>k.due===ds&&k.status!=='done').map(k=>({...k,_k:'task'}))
    ].sort((a,b)=>(a.time||'zz').localeCompare(b.time||'zz'));
    const MAX=3, visible=allItems.slice(0,MAX), overflow=allItems.length-MAX;
    html+=`<div class="cal-day${other?' other':''}${isT?' today':''}${isSel?' sel':''}" onclick="clickDay('${ds}')">
      <div class="cal-day-num">${day}</div>
      <div class="cal-day-evs">
        ${visible.map(item=>item._k==='task'
          ? `<div class="cal-ev-chip cal-task-chip">✓ ${esc(item.title)}</div>`
          : `<div class="cal-ev-chip ev-cal-${item.type}">${item.time?item.time.slice(0,5)+' ':''}${esc(item.title)}</div>`
        ).join('')}
        ${overflow>0?`<div class="cal-overflow">+${overflow} mais</div>`:''}
      </div>
    </div>`;
  }
  document.getElementById('cal-days').innerHTML=html;
  selectedDay ? renderDayPanel(selectedDay) : renderCalSidebar();
}

function clickDay(ds){ selectedDay = selectedDay===ds ? null : ds; renderCal(); }

function renderCalSidebar(){
  const t=today();
  const evs=DB.events.slice().sort((a,b)=>{
    if(a.date!==b.date) return a.date.localeCompare(b.date);
    return (a.time||'').localeCompare(b.time||'');
  });
  const tasks=DB.tasks.filter(k=>k.status!=='done'&&k.due);

  // Hoje — eventos + tarefas com prazo hoje
  const todayItems=[
    ...evs.filter(e=>e.date===t).map(e=>({...e,_k:'ev'})),
    ...tasks.filter(k=>k.due===t).map(k=>({...k,_k:'task'}))
  ].sort((a,b)=>(a.time||'zz').localeCompare(b.time||'zz'));
  document.getElementById('cal-today').innerHTML=todayItems.length
    ? todayItems.map(item=>item._k==='ev'
        ? calEvRow(item,false)
        : `<div class="cal-ev-row" onclick="openTaskModal('${item.id}')">
            <div class="cal-ev-time" style="color:var(--accent)">✓</div>
            <div><div class="cal-ev-name">${esc(item.title)}</div>
            <div class="cal-ev-meta">${DB.projects.find(p=>p.id===item.projectId)?.name||'Sem projeto'}</div></div>
          </div>`
      ).join('')
    : '<div class="no-evs">Dia livre</div>';

  // Próximos — tarefas atrasadas + eventos futuros
  const overdue=tasks.filter(k=>k.due<t).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3);
  const upcoming=evs.filter(e=>e.date>t).slice(0,4);
  const upItems=[
    ...overdue.map(k=>({...k,_k:'overdue'})),
    ...upcoming.map(e=>({...e,_k:'ev'}))
  ];
  document.getElementById('cal-upcoming').innerHTML=upItems.length
    ? upItems.map(item=>item._k==='overdue'
        ? `<div class="cal-ev-row" onclick="openTaskModal('${item.id}')">
            <div class="cal-ev-time" style="color:var(--danger);font-size:.6rem">ATRAS.</div>
            <div><div class="cal-ev-name">${esc(item.title)}</div>
            <div class="cal-ev-meta">${fmtD(item.due)}</div></div>
          </div>`
        : calEvRow(item,true)
      ).join('')
    : '<div class="no-evs">Nenhum pendente</div>';
}

function renderDayPanel(ds){
  const d=new Date(ds+'T12:00:00');
  const label=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const evs=DB.events.filter(e=>e.date===ds).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const tasks=DB.tasks.filter(k=>k.due===ds&&k.status!=='done');
  const allItems=[
    ...evs.map(e=>({...e,_k:'ev'})),
    ...tasks.map(k=>({...k,_k:'task'}))
  ].sort((a,b)=>(a.time||'zz').localeCompare(b.time||'zz'));

  document.getElementById('cal-box-today').style.display='none';
  document.getElementById('cal-box-upcoming').style.display='none';
  const panel=document.getElementById('day-panel');
  panel.style.display='block';
  panel.innerHTML=`
    <div class="day-panel-head">
      <div class="day-panel-title">${label}</div>
      <button class="day-panel-close" onclick="clearDayPanel()">×</button>
    </div>
    <div class="day-panel-counts">
      <span>${evs.length} evento${evs.length!==1?'s':''}</span>
      <span>${tasks.length} tarefa${tasks.length!==1?'s':''}</span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" onclick="openEvModal(null,'${ds}')">+ Evento</button>
      <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center" onclick="openTaskModal()">+ Tarefa</button>
    </div>
    ${allItems.length===0
      ? '<div class="no-evs">Nada neste dia.</div>'
      : allItems.map(item=>item._k==='ev'
          ? calEvRow(item,false)
          : `<div class="cal-ev-row" onclick="openTaskModal('${item.id}')">
              <div class="cal-ev-time" style="color:var(--accent)">
                <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div>
                <div class="cal-ev-name">${esc(item.title)}</div>
                <div class="cal-ev-meta">${item.priority==='high'?'Alta · ':item.priority==='low'?'Baixa · ':''}${DB.projects.find(p=>p.id===item.projectId)?.name||'Sem projeto'}</div>
              </div>
            </div>`
        ).join('')
    }`;
}

function clearDayPanel(){
  selectedDay=null;
  document.getElementById('day-panel').style.display='none';
  document.getElementById('cal-box-today').style.display='';
  document.getElementById('cal-box-upcoming').style.display='';
  renderCal();
}

function calEvRow(e,showDate){
  return `<div class="cal-ev-row" onclick="openEvModal('${e.id}')">
    <div class="cal-ev-time">${e.time?e.time.slice(0,5):'––'}</div>
    <div><div class="cal-ev-name">${esc(e.title)}</div>
    <div class="cal-ev-meta">${showDate?fmtD(e.date)+' · ':''}${e.type}</div></div>
  </div>`;
}

function openEvModal(id,prefill){
  if(id){
    const e=DB.events.find(x=>x.id===id);
    if(!e) return;
    document.getElementById('mev-title').textContent='Editar Evento';
    document.getElementById('fev-id').value   =e.id;
    document.getElementById('fev-title').value=e.title;
    document.getElementById('fev-date').value =e.date;
    document.getElementById('fev-time').value =e.time||'';
    document.getElementById('fev-type').value =e.type;
    document.getElementById('fev-dur').value  =e.duration||'';
    document.getElementById('fev-notes').value=e.notes||'';
    document.getElementById('ev-del').style.display='';
  } else {
    document.getElementById('mev-title').textContent='Novo Evento';
    document.getElementById('fev-id').value='';
    document.getElementById('fev-title').value='';
    document.getElementById('fev-date').value=prefill||today();
    document.getElementById('fev-time').value='';
    document.getElementById('fev-type').value='reuniao';
    document.getElementById('fev-dur').value='';
    document.getElementById('fev-notes').value='';
    document.getElementById('ev-del').style.display='none';
  }
  openM('m-ev');
  setTimeout(()=>document.getElementById('fev-title').focus(),80);
}

function saveEv(){
  const title=document.getElementById('fev-title').value.trim();
  const date =document.getElementById('fev-date').value;
  if(!title){toast('Título obrigatório','err');return;}
  if(!date) {toast('Data obrigatória','err');return;}
  const evs=DB.events, id=document.getElementById('fev-id').value;
  const data={
    id:id||uid(), title, date,
    time:document.getElementById('fev-time').value||null,
    type:document.getElementById('fev-type').value,
    duration:document.getElementById('fev-dur').value||null,
    notes:document.getElementById('fev-notes').value.trim(),
    createdAt:id?(evs.find(e=>e.id===id)?.createdAt||new Date().toISOString()):new Date().toISOString(),
  };
  if(id){const i=evs.findIndex(e=>e.id===id);evs[i]=data;}
  else evs.push(data);
  DB.events=evs;
  closeM('m-ev');
  renderCal();
  if(curView==='dash') renderDash();
  toast(id?'Evento atualizado':'Evento criado');
}

function delEv(){
  const id=document.getElementById('fev-id').value;
  if(!id||!confirm('Excluir este evento?')) return;
  DB.events=DB.events.filter(e=>e.id!==id);
  closeM('m-ev');
  renderCal();
  if(curView==='dash') renderDash();
  toast('Evento excluído');
}

// ── GROWTH ────────────────────────────────────────────────────────
const DOMAINS = [
  { id:'claude-api',   name:'Claude API & Prompt Engineering',      level:'avancado',      pct:70, sub:'Tool use, caching, agents. Próximo: batch API, fine-tuning.' },
  { id:'supabase',     name:'Supabase (PostgreSQL + RLS + Realtime)',level:'avancado',      pct:72, sub:'RLS, realtime, Edge Functions. Próximo: pg_cron, particionamento, índices.' },
  { id:'nodejs-ts',    name:'Node.js + TypeScript',                  level:'avancado',      pct:68, sub:'Express, Prisma, Bull. Próximo: Fastify, monorepos, testes de integração.' },
  { id:'clean-code',   name:'Clean Code & Boas Práticas',            level:'desenvolvendo', pct:60, sub:'SRP, early return, nomes, sem any, Promise.all, N+1. Próximo: aplicar em código real consistentemente.' },
  { id:'security',     name:'Segurança (LGPD, secrets, XSS, RLS)',   level:'desenvolvendo', pct:55, sub:'.env, menor privilégio, Privacy by Design, OWASP. Próximo: OWASP Top 10 completo, pen test básico.' },
  { id:'ai-native',    name:'Desenvolvimento AI-native',             level:'desenvolvendo', pct:55, sub:'IA em produtos reais (PULSAR, Meet Hub). Próximo: agentes autônomos, MCP.' },
  { id:'devops',       name:'DevOps (Vercel, Docker, DigitalOcean)', level:'desenvolvendo', pct:50, sub:'Deploy, containers, CI/CD básico. Próximo: IaC, monitoramento, alertas.' },
  { id:'react-fe',     name:'React + TypeScript (Frontend)',         level:'desenvolvendo', pct:45, sub:'Lovable/Vite/Tailwind. Próximo: performance, state management, testes de UI.' },
  { id:'system-design',name:'System Design & Arquitetura',           level:'iniciando',     pct:32, sub:'Trade-offs, ADRs, SOLID/DRY/KISS/YAGNI. Próximo: patterns distribuídos, microsserviços vs monolito.' },
  { id:'testes',       name:'Testes (unitários, integração, e2e)',   level:'iniciando',     pct:20, sub:'Teoria estudada. Próximo: primeiro teste real num projeto AG — começar pelo PULSAR-RH.' },
];

// Atualizado por /mentor em 2026-05-25
const SUGGESTIONS = [
  { title:'Escrever o primeiro teste real',          sub:'Escolha uma função crítica do PULSAR-RH (validação de dados, cálculo de indicador) e escreva o primeiro teste unitário. Teoria virou prática.' },
  { title:'Aplicar /revisao num projeto real',       sub:'Rode /revisao no PULSAR-RH ou Cliente Varejo e corrija os achados 🔴. Aprendizado de clean code fixado em código que você conhece.' },
  { title:'Publicar um case técnico no GitHub',      sub:'Documente o bug de quota do Cliente Varejo ou o leak do PULSAR-RH. Portfólio real > projetos fictícios.' },
  { title:'Estudar MCP (Model Context Protocol)',    sub:'Você já usa Claude Code com MCP — aprofundar abre projetos de tooling e integração IA de próximo nível.' },
  { title:'Formalizar o processo Dev+IA como método',sub:'Documente como você trabalha com Claude (planejamento → execução → revisão). Pode virar conteúdo ou serviço AG.' },
];

// ── MODULES ──────────────────────────────────────────────────────────
const expandedTopics = new Set();
const STATUS_CYCLE = { pending: 'studying', studying: 'mastered', mastered: 'pending' };
const STATUS_ICON  = { pending: '⬜', studying: '🔵', mastered: '✅' };
const STATUS_CLR   = { pending: 'var(--muted)', studying: 'var(--phi)', mastered: 'var(--green)' };

const MODULE_GRAD = {
  js: 'linear-gradient(135deg, #FF9500 0%, #FFCC02 100%)',
  ts: 'linear-gradient(135deg, #0079FF 0%, #00B4FF 100%)',
  supabase: 'linear-gradient(135deg, #00B45E 0%, #3ECF8E 100%)',
  'html-css': 'linear-gradient(135deg, #E91E8C 0%, #FF6CAB 100%)',
  'git-deploy': 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)',
  'node-api': 'linear-gradient(135deg, #38A169 0%, #68D391 100%)',
  'clean-code': 'linear-gradient(135deg, #7C3AED 0%, #B794F4 100%)',
};

const MODULE_SVG = {
  js: '<path d="M6 9l6 6 6-6M12 3v15" stroke-linecap="round" stroke-linejoin="round"/>',
  ts: '<path d="M7 7h10v10H7zM12 7v10M9 12h6" stroke-linecap="round" stroke-linejoin="round"/>',
  supabase: '<path d="M8 8v8a2 2 0 002 2h4a2 2 0 002-2v-8M6 8h12M9 4h6a2 2 0 012 2v2H9V6a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round"/>',
  'html-css': '<path d="M9 8h6M9 12h6M9 16h3M6 7l-1 12a1 1 0 001 1h12a1 1 0 001-1l-1-12" stroke-linecap="round" stroke-linejoin="round"/>',
  'git-deploy': '<path d="M9 15l-5-5m0 0l5-5M4 10h12m-4 9l8-8m0 0l-8-8" stroke-linecap="round" stroke-linejoin="round"/>',
  'node-api': '<path d="M9 5l3 3 3-3M9 11l3 3 3-3M6 8h12" stroke-linecap="round" stroke-linejoin="round"/>',
  'clean-code': '<path d="M9 7l-3 3 3 3m6-6l3 3-3 3M15 4l-6 16" stroke-linecap="round" stroke-linejoin="round"/>',
};

const STUDY_MATERIAL = {
  'js-const-arrow': {
    concept: 'Use const por padrão para todo valor que não será reatribuído. Arrow functions herdam o this do escopo pai — diferente de function declarations que criam seu próprio this.',
    code: 'const users = [{ id: 1, name: "Ana" }];\nconst active = users.filter(u => u.id > 0);\n\n// Arrow herda this do escopo externo:\nconst handler = () => this.state; // this = contexto pai\nfunction Handler() { this.state = {}; } // this = instância',
    mistake: 'Usar var em vez de const/let. var tem escopo de função e sofre hoisting — cria bugs difíceis de rastrear. let para reatribuição, const para todo o resto.',
    exercise: 'Abra app.js do ag-hub. Localize qualquer var restante e substitua por const ou let conforme necessidade de reatribuição.',
    tip: 'Se tentou usar const e deu erro de reatribuição, aí sim usa let. Senão, const sempre.',
  },
  'js-async-await': {
    concept: 'async/await é açúcar sintático para Promises. Sempre use Promise.all() para operações independentes em paralelo — awaits sequenciais acumulam latência.',
    code: '// Ruim: sequencial (300ms + 200ms = 500ms)\nconst users = await fetchUsers();\nconst posts = await fetchPosts();\n\n// Bom: paralelo (max 300ms)\nconst [users, posts] = await Promise.all([\n  fetchUsers(),\n  fetchPosts(),\n]);',
    mistake: 'Usar await dentro de forEach — o callback é async mas forEach não espera. O código continua antes das Promises resolverem.',
    exercise: 'Em ag-hub app.js, loadSync() faz fetch e depois processa. Os dois passos são dependentes? Poderiam ser paralelos?',
    tip: 'Múltiplos awaits sequenciais independentes = latência acumulada. Promise.all paraleliza.',
  },
  'js-array-methods': {
    concept: 'map, filter, reduce, find não mutam o array original — retornam novo array ou valor. Compor métodos evita loops aninhados e torna o fluxo de dados explícito.',
    code: 'const orders = [{ value: 100, paid: true }, { value: 200, paid: false }];\n\nconst revenue = orders\n  .filter(o => o.paid)\n  .map(o => o.value)\n  .reduce((sum, v) => sum + v, 0); // 100',
    mistake: 'Usar forEach para transformar dados — forEach só para side effects (log, render, evento). Para transformação: map. Para filtro: filter.',
    exercise: 'Em app.js linha ~1138, a lógica de mastered usa filter+length. Tente reescrever usando reduce em vez de duas variáveis separadas.',
    tip: 'Encadeamento de métodos = pipeline de dados legível. Evita variáveis temporárias.',
  },
  'js-optional-ops': {
    concept: 'obj?.prop retorna undefined se obj é null/undefined, sem TypeError. ?? escolhe default só se o valor é null/undefined — diferente de || que também substitui 0 e false.',
    code: 'const city = user?.address?.city; // undefined se user null\nconst age = data.age ?? 18; // 18 só se age for undefined/null\nconst score = data.score || 0; // PROBLEMA: substitui 0 também!',
    mistake: 'Usar || para defaults quando 0 ou false são valores válidos. score || 0 retorna 0 mesmo se score já é 0 — use ?? para checar apenas null/undefined.',
    exercise: 'Em sync.json do ag-hub, o player tem xpToNext. No código que lê esse campo, verificar se usa || ou ??. Se for ||, pode ter bug quando xpToNext = 0.',
    tip: 'Trocar a && b && c.d por a?.b?.c?.d. && é para booleanos, ?. é para navegação segura em objetos.',
  },
  'js-fetch-api': {
    concept: 'Sempre verificar response.ok antes de chamar response.json(). Status 404 e 400 não rejeitam a Promise — só erros de rede rejeitam.',
    code: 'async function getData(url) {\n  const r = await fetch(url);\n  if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);\n  return r.json();\n}',
    mistake: 'Chamar r.json() sem checar r.ok. Se o servidor retorna { error: "not found" } com status 404, a Promise resolve normalmente — código trata erro como dado válido.',
    exercise: 'loadSync() em app.js faz fetch de sync.json. Adicionar verificação de r.ok e throw com status + url para facilitar debug de deploy.',
    tip: 'fetch() rejeita Promise apenas em erro de rede. Status 4xx/5xx = response.ok é false, mas Promise resolve.',
  },
  'js-dom-events': {
    concept: 'Event delegation: escuta em elemento pai, filtra por e.target. Evita reattach de listeners ao re-renderizar. innerHTML com conteúdo de usuário = XSS.',
    code: 'document.getElementById("list").addEventListener("click", (e) => {\n  if (e.target.matches(".btn-delete")) {\n    deleteItem(e.target.dataset.id);\n  }\n});\n\n// Sempre escapar antes de innerHTML:\nel.innerHTML = `<span>${esc(userInput)}</span>`;',
    mistake: 'Adicionar addEventListener dentro de renderX() sem remover o anterior — a cada re-render, novo listener é adicionado no mesmo elemento, causando execução múltipla.',
    exercise: 'Em app.js, a função esc() está definida? Localizar onde está e verificar se dados externos (sync.json) passam por ela antes de ir para innerHTML.',
    tip: 'innerHTML sem esc() = XSS. Use textContent para texto puro. esc() obrigatório ao interpolar dado externo.',
  },
  'ts-basic-types': {
    concept: 'interface descreve forma fixa de objeto — ideal para modelos de dados e contratos. type é mais geral: unions, intersections, tipos derivados.',
    code: 'interface User { id: number; name: string; email: string; }\ntype Status = "pending" | "active" | "deleted";\ntype UserWithStatus = User & { status: Status };\n\nconst user: User = { id: 1, name: "Ana", email: "a@ag.com" };',
    mistake: 'Criar tipos duplicados em dois arquivos diferentes. Quando User muda em um, o outro fica desatualizado e TypeScript não avisa.',
    exercise: 'No PULSAR-RH, existe um tipo User definido em mais de um arquivo? Se sim, criar types/user.ts compartilhado e importar nos dois.',
    tip: 'Nome de interface = PascalCase. Se precisa de union (A | B), use type. Objeto com forma fixa = interface.',
  },
  'ts-strict-no-any': {
    concept: 'any desativa toda verificação de tipo — é pior que JavaScript puro. unknown força narrowing explícito antes do uso. strict: true pega bugs que any silencia.',
    code: 'let data: unknown = JSON.parse(rawStr);\n\n// Narrowing obrigatório:\nif (typeof data === "object" && data !== null && "id" in data) {\n  const id = (data as { id: number }).id;\n}',
    mistake: 'Usar any para "resolver" erro de tipo rapidamente. O erro desaparece, mas o bug permanece — TS não vai mais avisar sobre uso incorreto desse valor.',
    exercise: 'Abrir qualquer arquivo .ts do PULSAR-RH e rodar: grep -n ": any" src/. Cada hit = dívida técnica. Escolher um e substituir por unknown com narrowing.',
    tip: 'any = silenciar tipo. unknown = "não sei o tipo ainda, prove antes de usar". Sempre prefira unknown em dados externos (API, localStorage).',
  },
  'ts-utility-types': {
    concept: 'Partial, Pick, Omit, Readonly, Required derivam tipos sem duplicar. Quando o tipo base muda, os derivados acompanham automaticamente.',
    code: 'interface User { id: number; name: string; email: string; }\n\ntype CreateUser = Omit<User, "id">; // sem id\ntype UserPreview = Pick<User, "name" | "email">; // só esses\ntype UpdateUser = Partial<User>; // todos opcionais',
    mistake: 'Criar CreateUserData: { name: string; email: string } manualmente em vez de Omit<User, "id">. Quando User ganha campo obrigatório, CreateUserData não atualiza.',
    exercise: 'No PULSAR-RH, existe algum tipo de formulário que é basicamente User sem id? Substituir por Omit<User, "id">.',
    tip: 'Nunca duplicar tipo manualmente. Utility types extraem tipo derivado. Base muda, derivados acompanham.',
  },
  'ts-generics': {
    concept: '<T> parametriza função ou classe com tipo. Reutiliza lógica sem perder type safety. <T extends Base> restringe T a tipos que têm certas propriedades.',
    code: 'function getById<T extends { id: number }>(items: T[], id: number): T | undefined {\n  return items.find(i => i.id === id);\n}\n\nconst user = getById(users, 1); // infere T = User',
    mistake: 'Usar any como workaround quando generics seriam corretos. getById(items: any[], ...) perde o tipo de retorno — não sabe mais que é User.',
    exercise: 'Criar função wrap<T>(value: T): { value: T; timestamp: Date } e testar com string, number e User. Verificar que o tipo inferido está correto.',
    tip: 'Generics evitam any quando reutiliza lógica com tipos diferentes. Constraints garantem propriedades disponíveis.',
  },
  'ts-discriminated': {
    concept: 'Union com campo literal discriminante (kind/type) permite narrowing seguro no switch/if. Elimina estados impossíveis como loading=true e data=X juntos.',
    code: 'type State =\n  | { kind: "loading" }\n  | { kind: "ok"; data: User[] }\n  | { kind: "error"; error: string };\n\nif (state.kind === "ok") {\n  console.log(state.data); // type-safe\n}',
    mistake: 'Estado com isLoading: boolean + data: T | null + error: string | null separados. Isso permite estados impossíveis: isLoading=true e data="valor" ao mesmo tempo.',
    exercise: 'Em ag-hub app.js, loadSync() tem estados implícitos (SYNC definido/não). Como ficaria como discriminated union em TypeScript?',
    tip: 'default: satisfies never no switch pega caso novo não tratado em compile time — evita bugs silenciosos ao adicionar novo estado.',
  },
  'supabase-crud': {
    concept: 'Fluent API: .from().select().eq().order() encadeia o query builder. .data retorna array ou null. Sempre tratar error antes de usar data.',
    code: 'const { data, error } = await supabase\n  .from("employees")\n  .select("id, name, department_id")\n  .eq("active", true)\n  .order("name");\n\nif (error) throw error;\nreturn data ?? [];',
    mistake: 'Usar select("*") em tabela com muitas colunas. Retorna dados desnecessários, aumenta payload e pode expor campos sensíveis.',
    exercise: 'No PULSAR-RH, localizar a query de lista de colaboradores. Está usando select("*")? Substituir por seleção explícita das colunas usadas na UI.',
    tip: 'select("*") = todos os campos. Especifique colunas — menor payload, melhor cache, sem vazamento acidental de dados.',
  },
  'supabase-auth': {
    concept: 'onAuthStateChange é o único source of truth de sessão — dispara em login, logout, refresh e expiração. Session pode ser null mesmo após login em tab nova.',
    code: 'supabase.auth.onAuthStateChange((event, session) => {\n  if (session) {\n    setUser(session.user);\n  } else {\n    setUser(null);\n    router.push("/login");\n  }\n});',
    mistake: 'Guardar sessão em variável local fora do listener. onAuthStateChange pode atualizar a sessão (refresh token) sem que o estado local saiba.',
    exercise: 'No PULSAR-RH, o login multi-portal (admin/rh/gestor) — cada portal tem seu próprio onAuthStateChange? Verificar se um portal faz signOut e corrompe sessão do outro.',
    tip: 'Não guarde sessão em estado local. onAuthStateChange é a fonte. signOut() emite evento que o listener processa.',
  },
  'supabase-rls': {
    concept: 'RLS habilitado sem nenhuma policy = tudo bloqueado para authenticated e anon. Policy define quem vê o quê. auth.uid() retorna o UUID do usuário logado.',
    code: '-- Ver só os próprios registros:\nCREATE POLICY "select_own_data"\n  ON employee_evaluations FOR SELECT\n  TO authenticated\n  USING (auth.uid() = user_id);\n\n-- Admin vê tudo:\n-- USING (auth.uid() IN (SELECT user_id FROM admins));',
    mistake: 'Desabilitar RLS "temporariamente" para resolver bug de acesso. Isso expõe todos os dados via API pública sem autenticação.',
    exercise: 'No PULSAR-RH, abrir Supabase Dashboard > Authentication > Policies. Quais tabelas estão sem policy mas com RLS habilitado?',
    tip: 'RLS enabled sem policies = tudo bloqueado. Use SQL Editor do Dashboard: SELECT * FROM tabela AS authenticated_user.',
  },
  'supabase-realtime': {
    concept: 'channel.subscribe() abre WebSocket. Sem cleanup (removeChannel no unmount/destroy) = memory leak acumulando conexões abertas.',
    code: '// React:\nuseEffect(() => {\n  const channel = supabase\n    .channel("evaluations")\n    .on("postgres_changes",\n      { event: "*", schema: "public", table: "evaluations" },\n      payload => updateState(payload))\n    .subscribe();\n  return () => supabase.removeChannel(channel);\n}, []);',
    mistake: 'Não fazer cleanup do canal. Em SPAs com muitas navegações, cada montagem cria novo WebSocket sem fechar o anterior.',
    exercise: 'No PULSAR-RH, existe algum useEffect com .channel().subscribe()? Verificar se todos têm o return () => supabase.removeChannel(channel).',
    tip: 'Realtime = WebSocket. Sem unsubscribe = conexão persistindo. Testar: DevTools > Network > WS — deve ter só uma conexão por canal.',
  },
  'supabase-migrations': {
    concept: 'Migrations são o source of truth do schema. Nunca editar migration já aplicada em prod. Para reverter: nova migration. supabase db push aplica localmente.',
    code: '# Criar nova migration:\nnpx supabase migration new add_risk_score\n\n# Editar o arquivo gerado em supabase/migrations/\n# Aplicar localmente:\nnpx supabase db push\n\n# Ver estado das migrations:\nnpx supabase migration list',
    mistake: 'Fazer ALTER TABLE direto no Supabase Dashboard SQL Editor sem criar migration. O banco local e produção ficam fora de sincronia.',
    exercise: 'No PULSAR-RH, rodar "supabase migration list" — todas as migrations locais aparecem como applied em prod? Listar diferenças se houver.',
    tip: 'Prod diverge de local? supabase migration list mostra o estado de cada migration. Migration versionada em git = diff do schema auditável.',
  },
  'supabase-types-gen': {
    concept: 'supabase gen types gera tipos TypeScript do schema atual. Roda após cada migration. Importar Database type para ter autocomplete e type safety em queries.',
    code: '# Gerar tipos:\nnpx supabase gen types typescript \\\n  --project-id SEU_PROJECT_ID \\\n  > src/types/supabase.ts\n\n# Usar no código:\nimport type { Database } from "@/types/supabase";\ntype Employee = Database["public"]["Tables"]["employees"]["Row"];',
    mistake: 'Usar interface Employee manual desincronizada da tabela real. Quando o schema muda, TypeScript não avisa que Employee está desatualizado.',
    exercise: 'No PULSAR-RH, verificar se src/types/supabase.ts existe. Está desatualizado? Rodar gen types e comparar diff — especialmente após migrations recentes.',
    tip: 'Rodou migration mas tipos antigos? Roda gen types. CI pode fazer isso automaticamente a cada migration aplicada.',
  },
  'html-semantics': {
    concept: '<section>, <article>, <main>, <header>, <nav> descrevem a estrutura do documento. Leitores de tela navegam por landmarks semânticos. Divs sem semântica não ajudam.',
    code: '<main>\n  <nav aria-label="Menu principal">...</nav>\n  <section aria-labelledby="dash-title">\n    <h1 id="dash-title">Dashboard</h1>\n    <article>...</article>\n  </section>\n</main>\n<button aria-label="Fechar modal">×</button>',
    mistake: 'Usar <div class="button"> em vez de <button>. Buttons têm comportamento nativo (foco por teclado, Enter/Space ativam) que divs não têm.',
    exercise: 'Em index.html do ag-hub, verificar se os botões do nav são <button> ou <a> ou <div>. Se forem divs, qual o impacto na navegação por teclado?',
    tip: 'Nunca usar div onde existe tag semântica. Screen readers navegam por h1-h6, nav, main, section — estrutura boa = app mais acessível.',
  },
  'html-layout': {
    concept: 'Grid para layout 2D (linhas e colunas). Flexbox para layout 1D (só horizontal ou só vertical). Combinados: Grid para estrutura macro, Flex para alinhamento interno.',
    code: '/* Grid: estrutura da página */\n.page { display: grid; grid-template-columns: 240px 1fr; }\n\n/* Flex: itens dentro de um card */\n.card-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}',
    mistake: 'Usar Flexbox para grade de cards (2D) — resulta em quebra de linha imprevisível. Grid é feito para isso: grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)).',
    exercise: 'A .modules-grid em index.html usa qual propriedade? Verificar se auto-fill/auto-fit está sendo usado. Em mobile (375px), colapsa para 1 coluna?',
    tip: 'Sidebar + main? Grid. Card internamente? Flex. Mobile-first: começa 1 coluna, media query expande para 2 ou 3.',
  },
  'html-css-vars': {
    concept: 'CSS Custom Properties em :root reutilizáveis em todo CSS. Mudar um valor no :root = muda em todos os elementos. Ideal para temas e tokens de design.',
    code: ':root {\n  --primary: #1A7FFF;\n  --bg: #050C1A;\n  --text: #EEF5FF;\n  --radius: 8px;\n}\n\n.card {\n  background: var(--bg);\n  color: var(--text);\n  border-radius: var(--radius);\n}',
    mistake: 'Copiar valores de cor hardcoded em vários lugares (#1A7FFF aqui, #1a7fff lá, rgba(26,127,255,.1) acolá). Quando a cor muda, precisa buscar todos os lugares.',
    exercise: 'Em index.html, contar quantas vezes #1A7FFF aparece fora das definições de --primary. Cada ocorrência é uma dívida técnica.',
    tip: 'Trocar de tema? Escrever novo :root[data-theme="light"] e trocar o atributo via JS. Todos os elementos pegam as novas vars automaticamente.',
  },
  'html-spa-vanilla': {
    concept: 'SPA sem framework: go(view) troca display das divs, curView rastreia estado, renderX() popula innerHTML. Sem reactivity automática — re-render manual a cada mudança.',
    code: 'let curView = "dash";\n\nfunction go(view) {\n  document.querySelectorAll(".view").forEach(v =>\n    v.classList.remove("active"));\n  document.getElementById(`view-${view}`).classList.add("active");\n  curView = view;\n  if (view === "growth") { renderGrowth(); renderModules(); }\n}',
    mistake: 'Adicionar listeners diretamente em renderX() sem verificar se já existem — a cada navegação, os eventos se acumulam no mesmo elemento.',
    exercise: 'Em app.js, a função go() chama renderModules() diretamente. Por que isso foi necessário além de renderGrowth()? Qual bug isso corrigiu?',
    tip: 'Sem framework = controle total, mas re-render manual. Estado muda? Chama a função de render correspondente.',
  },
  'html-localstorage': {
    concept: 'localStorage persiste entre reloads e sessões. Só armazena strings — JSON.stringify ao salvar, JSON.parse ao ler. Limite de ~5MB por origin.',
    code: 'function saveProgress(data) {\n  localStorage.setItem("agh_modules", JSON.stringify(data));\n}\n\nfunction getProgress() {\n  return JSON.parse(localStorage.getItem("agh_modules") ?? "{}"); \n}',
    mistake: 'localStorage.setItem("key", objeto) — salva "[object Object]" em vez do JSON. Sempre JSON.stringify ao escrever.',
    exercise: 'No ag-hub, listar todas as chaves localStorage: DevTools > Application > Local Storage. Quantas chaves existem? Estão todas documentadas no código?',
    tip: 'localStorage nunca guarda objetos diretamente. JSON.stringify ao salvar, JSON.parse ao ler. Erro "undefined" ao ler = parse de string null.',
  },
  'html-responsive': {
    concept: 'Mobile-first: CSS base para tela pequena, @media (min-width: X) adiciona layout maior. Mobile-first força priorização do conteúdo essencial.',
    code: '/* Base: mobile */\n.grid { grid-template-columns: 1fr; gap: 12px; }\n\n/* Tablet: 2 colunas */\n@media (min-width: 600px) {\n  .grid { grid-template-columns: 1fr 1fr; }\n}\n\n/* Desktop: 3 colunas */\n@media (min-width: 1200px) {\n  .grid { grid-template-columns: repeat(3, 1fr); }\n}',
    mistake: 'Desktop-first com @media (max-width: X) — o CSS começa complexo e vai simplificando. Mais difícil de manter. Mobile-first é progressivo: começa simples.',
    exercise: 'Em index.html, verificar a .modules-grid. Ela usa @media (min-width) ou (max-width)? Em tela de 375px (iPhone SE), fica usável?',
    tip: 'Começa mobile (constraints forçam prioridade de conteúdo). Depois adiciona richeza em breakpoints maiores.',
  },
  'git-git-core': {
    concept: 'git commit = snapshot do estado. git branch isola trabalho paralelo. git rebase lineariza histórico reescrevendo commits. git merge junta branches preservando histórico.',
    code: 'git checkout -b feat/study-modules\ngit add app.js index.html\ngit commit -m "feat(modules): adiciona material de estudo expandido"\ngit rebase main\ngit push origin feat/study-modules',
    mistake: 'Trabalhar direto na branch main. Um commit com bug em main = produção quebrada antes de qualquer review.',
    exercise: 'No ag-hub, quantos commits foram feitos direto em main? git log --oneline origin/main | head -20. Qual seria a branch correta para cada um?',
    tip: 'git log --oneline mostra histórico. git rebase evita merge commits. Commit atômico = uma mudança lógica, reversível individualmente.',
  },
  'git-conv-commits': {
    concept: 'feat: nova funcionalidade. fix: corrige bug. chore: deps, config. docs: documentação. refactor: sem mudança de comportamento. Escopo em parênteses opcional.',
    code: 'feat(modules): adiciona ícones SVG e material de estudo\nfix(sync): corrige cálculo de streak quando dia pula\nchore(deps): atualiza supabase-js para 2.39\ndocs(readme): adiciona instruções de setup local\nrefactor(render): extrai renderTopicMaterial para função separada',
    mistake: 'Mensagem de commit descrevendo O QUÊ: "add button" ou "fix bug". Descreva O POR QUÊ: "fix: corrige crash ao navegar sem SYNC carregado".',
    exercise: 'No ag-hub, git log --oneline. Identificar commits sem prefixo convencional. Qual seria o prefixo correto para cada um?',
    tip: 'Commit message narra POR QUÊ, não O QUÊ (o que está no diff). Histórico linear = git bisect acha bugs em minutos.',
  },
  'git-gitignore-env': {
    concept: '.gitignore antes do primeiro commit. .env, node_modules/, dist/ nunca entram no git. .env.example documenta variáveis sem valores reais.',
    code: '# .gitignore\n.env\n.env.local\n.env.*.local\nnode_modules/\ndist/\nbuild/\n*.pem\n.DS_Store\n\n# .env.example (commitado, sem valores)\nSUPABASE_URL=\nSUPABASE_ANON_KEY=\nPORT=3000',
    mistake: 'Fazer commit do .env com chaves reais. Mesmo que você delete no próximo commit, o git history preserva o arquivo — chaves comprometidas para sempre.',
    exercise: 'Verificar o .gitignore do ag-hub: git check-ignore -v .env. Se não está ignorado, adicionar e verificar git status.',
    tip: 'Fez commit de .env? git rm --cached .env imediatamente. Depois limpar histórico e revogar todas as chaves do arquivo.',
  },
  'git-vercel': {
    concept: 'Vercel detecta push em main e faz deploy automático. PRs geram preview URLs. Env vars configuradas no dashboard, não no .env commitado.',
    code: '# Push para main = deploy em produção:\ngit push origin main\n\n# Verificar se deploy chegou:\ncurl -s https://ag-hub-tan.vercel.app/app.js | grep "MODULE_SVG"\n\n# Variáveis de ambiente:\n# Vercel Dashboard > Settings > Environment Variables',
    mistake: 'Colocar variáveis de ambiente diretamente no .env commitado ou hardcoded no código. Vercel Dashboard tem o campo certo para isso.',
    exercise: 'No ag-hub, verificar se o último push chegou ao Vercel: curl -s URL | grep algum trecho único do código. Se não chegou, verificar o log de deploy no dashboard.',
    tip: 'Preview URL por PR = testar antes de chegar em main. Variáveis de prod no dashboard = nunca no repositório.',
  },
  'git-ci-cd': {
    concept: '.github/workflows/*.yml define pipeline. Roda em cada push: instala deps, testa, builda, deploya. Secrets do repositório via ${{ secrets.NOME }}.',
    code: 'name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n      - run: npm run build',
    mistake: 'Colocar API keys diretamente no yml. GitHub Actions logs são visíveis — secrets expostos. Use ${{ secrets.NOME_DA_KEY }} sempre.',
    exercise: 'Criar .github/workflows/check.yml no ag-hub que rode "node --check app.js" a cada push para detectar syntax errors antes do deploy.',
    tip: 'CI roda a cada push — fail rápido bloqueia merge. GitHub Secrets para API keys, nunca hardcoded no yml.',
  },
  'node-express-basics': {
    concept: 'app.get/post/put/delete(path, handler). Status codes: 200 ok, 201 criado, 400 request inválido, 401 não autenticado, 403 sem permissão, 404 não encontrado, 500 erro interno.',
    code: 'app.get("/employees/:id", async (req, res) => {\n  const employee = await findEmployee(req.params.id);\n  if (!employee) return res.status(404).json({ error: "not found" });\n  res.json(employee);\n});\n\napp.post("/employees", async (req, res) => {\n  const employee = await createEmployee(req.body);\n  res.status(201).json(employee);\n});',
    mistake: 'Retornar 200 para erro: res.json({ success: false, error: "..." }) com status 200. Clientes precisam do status code para saber se deu certo.',
    exercise: 'Se o ag-hub tivesse uma API Express, qual seria a rota para buscar o perfil do player? Escrever o handler completo com status codes corretos.',
    tip: '404 vs 400: 404 = recurso não existe. 400 = request inválido (parâmetro com tipo errado, campo obrigatório ausente).',
  },
  'node-env-validation': {
    concept: 'Validar todas as env vars no startup com Zod ou joi — se uma variável obrigatória faltar, a aplicação falha imediatamente com mensagem clara.',
    code: 'import { z } from "zod";\n\nconst env = z.object({\n  PORT: z.string().default("3000"),\n  SUPABASE_URL: z.string().url(),\n  SUPABASE_SERVICE_KEY: z.string().min(20),\n}).parse(process.env);\n\nexport default env;',
    mistake: 'Ler process.env.SUPABASE_URL no meio de um handler de rota. Se a variável está ausente, o erro ocorre quando aquela rota é chamada — difícil de diagnosticar.',
    exercise: 'No PULSAR-RH, onde process.env é lido pela primeira vez? Está em um arquivo de configuração centralizado ou espalhado pelo código?',
    tip: 'Falha no startup > silenciar variável faltando e descobrir em crash aleatório em produção depois.',
  },
  'node-error-handling': {
    concept: 'Error middleware Express: 4 parâmetros (err, req, res, next). Centraliza tratamento de erros. next(err) encaminha para o middleware. Sem ele, crashes não retornam JSON.',
    code: '// No final, após todas as rotas:\napp.use((err, req, res, next) => {\n  console.error("[error]", { path: req.path, message: err.message });\n  res.status(err.status ?? 500).json({\n    error: err.message ?? "Internal server error",\n  });\n});',
    mistake: 'catch vazio ou só console.log sem relançar. O erro some, a rota trava esperando resposta, o cliente recebe timeout.',
    exercise: 'Escrever um wrapper asyncRoute(fn) que envolve handlers async para chamar next(error) automaticamente sem try/catch em cada rota.',
    tip: 'throw em rota async sem try/catch = crash não capturado no Express 4. Express 5 captura automaticamente. No 4, use wrapper ou try/catch.',
  },
  'node-async-node': {
    concept: 'async/await em handlers Express. forEach com async não funciona — forEach não espera. Promise.all para paralelo, for...of para sequencial com dependência.',
    code: '// forEach com await: não funciona\nreq.body.ids.forEach(async (id) => {\n  await processItem(id); // forEach não espera\n});\n\n// Correto — paralelo:\nconst results = await Promise.all(\n  req.body.ids.map(id => processItem(id))\n);',
    mistake: 'forEach(async ...) — o código continua antes das Promises resolverem. Parece funcionar em teste, quebra em produção com dados reais.',
    exercise: 'No PULSAR-RH ou OFICINA, existe algum forEach(async...) no código? grep -r "forEach(async" src/. Se sim, substituir por Promise.all + map.',
    tip: 'forEach(async): fire and forget. Para esperar: Promise.all(arr.map(async x => ...)). Para sequencial com dependência: for...of.',
  },
  'node-graceful-shutdown': {
    concept: 'SIGTERM é enviado pelo container/orquestrador antes de matar o processo. Usar para fechar servidor e encerrar conexões DB — evita requests pendentes e dados corrompidos.',
    code: 'const server = app.listen(PORT);\n\nprocess.on("SIGTERM", () => {\n  server.close(async () => {\n    await db.end();\n    process.exit(0);\n  });\n});',
    mistake: 'Ignorar SIGTERM e deixar o container receber SIGKILL depois do timeout. Conexões abertas com DB, requests pela metade, possível corrupção de dados.',
    exercise: 'Em qualquer API Node.js que você escrever, adicionar o handler de SIGTERM como padrão antes de subir para produção.',
    tip: 'SIGTERM = aviso prévio de encerramento. SIGKILL = morte imediata. Containers enviam SIGTERM, esperam X segundos, então SIGKILL.',
  },
  'clean-srp': {
    concept: 'Uma função, uma responsabilidade. Se precisa de "e" para descrever o que faz, está fazendo coisas demais. Extrai subfunções.',
    code: '// Violação: valida E salva E notifica\nfunction processUser(data) {\n  if (!data.email) throw new Error();\n  db.save(data);\n  sendEmail(data.email);\n}\n\n// SRP:\nfunction validateUser(data) { ... }\nfunction saveUser(data) { ... }\nfunction notifyUser(email) { ... }',
    mistake: 'Função renderAndFetchData() — busca dados E renderiza tela. Quando a renderização muda, a lógica de fetch é impactada desnecessariamente.',
    exercise: 'Em app.js, a função renderGrowth() chama renderGamification() e renderGrowthBody(). Isso é SRP violado ou responsabilidades relacionadas? Argumentar a decisão.',
    tip: 'Teste fácil = SRP ok. Descreve em 1 frase sem "e"? SRP ok. Difícil de nomear = função fazendo coisa demais.',
  },
  'clean-dry-kiss': {
    concept: 'DRY: não repetir código — mas só extrai na 3ª duplicação (2× pode ser coincidência). KISS: solução mais simples que funciona. YAGNI: só implementa o necessário agora.',
    code: '// Duplicação ×2: ok, pode ser coincidência\n// Duplicação ×3: extrai\nconst format = (date) => date.toISOString().slice(0, 10);\n\n// YAGNI: não cria plugin system para 1 caso de uso\n// KISS: função direta > classe abstrata > factory > strategy',
    mistake: 'Criar abstração genérica antes de ver o segundo uso real. Premature abstraction = mais código para manter, não menos bug.',
    exercise: 'Em app.js, existe alguma lógica de formatação de data repetida? Identificar e medir: vale extrair ou é só uma linha simples?',
    tip: 'Abstrações prematuras = mais bug, não menos. Espera padrão emergir na 3ª ocorrência antes de extrair.',
  },
  'clean-early-return': {
    concept: 'Guard clauses no início da função verificam condições inválidas e retornam cedo. Elimina else e reduz nesting. Caminho feliz fica no nível zero de indentação.',
    code: 'function processOrder(order) {\n  if (!order) return null;\n  if (order.cancelled) return { status: "cancelled" };\n  if (order.items.length === 0) return { status: "empty" };\n\n  // caminho feliz sem nesting\n  return calculateTotal(order);\n}',
    mistake: 'if (condition) { grande bloco } else { outro grande bloco } — o else pode ser evitado se o if faz return/throw. Eliminar else sempre que possível.',
    exercise: 'Em app.js, a função renderTopicRow tem ifs aninhados? Se sim, aplicar early return para achatar o nesting.',
    tip: 'Nesting > 2 níveis? Refatora com early return ou extrai função. Leitura de cima a baixo sem indentação profunda = claro.',
  },
  'clean-naming': {
    concept: 'Nomes descrevem O QUÊ e POR QUÊ. Sem abreviações. Sem genéricos (data, temp, x). Booleanos começam com is/has/can. Funções são verbos.',
    code: 'const isActive = user.status === "active"; // boolean\nconst hasPermission = roles.includes("admin"); // boolean\nconst formatCurrency = (n) => ...; // verbo + substantivo\nconst employees = await fetchEmployees(); // plural = coleção',
    mistake: 'Nomear variável como "data" ou "result" — não informa o tipo de dado. employeeList, orderSummary, validationErrors são autoexplicativos.',
    exercise: 'Em app.js, localizar todas as variáveis de 1-2 letras (exceto loops com i, j). Nomear explicitamente e verificar se o código fica mais legível.',
    tip: 'Nome ruim = comentário explicando O QUÊ faz. Nome bom = comentário desnecessário. Nome = self-documenting.',
  },
  'clean-code-smells': {
    concept: 'God object: classe que sabe de tudo. Dead code: nada chama. Shotgun surgery: 1 mudança = 5 arquivos. Feature envy: função usa mais dados de outro módulo que do próprio.',
    code: '// God object:\nclass User {\n  getFullName() {}\n  validateEmail() {}\n  saveToDatabase() {}\n  sendNotification() {}\n  checkPermission() {}\n}\n\n// Melhor:\nclass User { getFullName() {} }\nclass UserValidator { validate() {} }\nclass UserRepository { save() {} }',
    mistake: 'Ignorar code smell porque "funciona". Code smell = dívida técnica que cresce. Feature envy especialmente — indica abstração no lugar errado.',
    exercise: 'Em app.js, a função renderModuleCard faz muita coisa? Contar as responsabilidades. Se passar de 3, identificar o que pode ser extraído.',
    tip: 'Code smell = alerta, não erro obrigatório. Revisar em PR: é problema real ou design aceitável para o escopo?',
  },
  'clean-testing': {
    concept: 'Arrange, Act, Assert: prepara estado, executa ação, verifica resultado. Testa COMPORTAMENTO observável, não implementação interna. Mock só em boundary (DB, API externa).',
    code: 'test("should return mastered topics count correctly", () => {\n  // Arrange\n  const progress = { js: { "const-arrow": "mastered" } };\n  const mod = MODULES.find(m => m.id === "js");\n\n  // Act\n  const pct = modPct(mod, progress);\n\n  // Assert\n  expect(pct).toBe(Math.round(1 / 6 * 100));\n});',
    mistake: 'Mockar funções internas do módulo. Se o teste verifica que findUser() foi chamada com certo argumento, está testando implementação — refactor quebra o teste sem mudar comportamento.',
    exercise: 'Escrever 1 teste para modPct() do ag-hub: módulo com 6 tópicos onde 3 estão mastered. Verificar se retorna 50.',
    tip: 'Teste frágil = testa implementação. Teste robusto = testa comportamento. Refactor não deve quebrar testes, só adição de funcionalidade.',
  },
};

function getModProgress()        { return JSON.parse(localStorage.getItem('agh_modules') ?? '{}'); }
function saveModProgress(data)   { localStorage.setItem('agh_modules', JSON.stringify(data)); }
function topicStatus(p, mid, tid){ return p[mid]?.[tid] ?? 'pending'; }
function getTopicNote(key)       { return JSON.parse(localStorage.getItem('agh_topic_notes') ?? '{}')[key] ?? ''; }
function saveTopicNote(key, val) {
  const notes = JSON.parse(localStorage.getItem('agh_topic_notes') ?? '{}');
  notes[key] = val;
  localStorage.setItem('agh_topic_notes', JSON.stringify(notes));
}

function buildModIcon(mod) {
  const svg = MODULE_SVG[mod.id] || '';
  return `<div class="mod-icon-box" style="background: ${MODULE_GRAD[mod.id] || 'var(--primary)'}">
    <svg class="mod-icon-svg" viewBox="0 0 24 24">${svg}</svg>
  </div>`;
}

function toggleTopic(modId, topicId) {
  const p = getModProgress();
  const cur = topicStatus(p, modId, topicId);
  if (!p[modId]) p[modId] = {};
  p[modId][topicId] = STATUS_CYCLE[cur];
  saveModProgress(p);
  renderModules();
}

function toggleTopicExpand(modId, topicId) {
  const key = `${modId}-${topicId}`;
  if (expandedTopics.has(key)) {
    expandedTopics.delete(key);
  } else {
    expandedTopics.add(key);
  }
  const el = document.getElementById(`material-${key}`);
  if (el) el.classList.toggle('open');
}

function renderTopicMaterial(modId, t) {
  const key = `${modId}-${t.id}`;
  const mat = STUDY_MATERIAL[key] ?? { concept: 'Material em construção', code: '', tip: '' };
  const note = getTopicNote(key);
  return `<div class="tm-concept">${esc(mat.concept)}</div>
    ${mat.code ? `<pre class="tm-code">${esc(mat.code)}</pre>` : ''}
    ${mat.mistake ? `<div class="tm-block tm-block-err"><div class="tm-lbl">Erro comum</div>${esc(mat.mistake)}</div>` : ''}
    ${mat.exercise ? `<div class="tm-block tm-block-ex"><div class="tm-lbl">Exercício</div>${esc(mat.exercise)}</div>` : ''}
    ${mat.tip ? `<div class="tm-tip">${esc(mat.tip)}</div>` : ''}
    <textarea class="tm-textarea" placeholder="Suas anotações sobre este tópico..." oninput="saveTopicNote('${key}',this.value)">${esc(note)}</textarea>`;
}

function renderTopicRow(modId, t, p) {
  const s = topicStatus(p, modId, t.id);
  const key = `${modId}-${t.id}`;
  const isOpen = expandedTopics.has(key);
  return `<div class="topic-row">
    <span class="topic-status-icon" style="color:${STATUS_CLR[s]};cursor:pointer;margin-right:4px" onclick="toggleTopic('${modId}','${t.id}')">${STATUS_ICON[s]}</span>
    <span class="topic-name ${s === 'mastered' ? 'topic-done' : ''}" style="flex:1;cursor:pointer" onclick="toggleTopicExpand('${modId}','${t.id}')">${esc(t.title)}</span>
    ${isOpen ? '<span style="color:var(--muted);font-size:.65rem">⬆</span>' : '<span style="color:var(--muted);font-size:.65rem">⬇</span>'}
    <div class="topic-material ${isOpen ? 'open' : ''}" id="material-${key}">
      ${renderTopicMaterial(t)}
    </div>
  </div>`;
}

function modPct(mod, p) {
  const done = mod.topics.filter(t => topicStatus(p, mod.id, t.id) === 'mastered').length;
  return Math.round((done / mod.topics.length) * 100);
}

function renderModuleCard(mod, p, idx) {
  const pct = modPct(mod, p);
  const done = pct === 100;
  const topics = mod.topics.map(t => renderTopicRow(mod.id, t, p)).join('');
  return `<div class="mod-card ${done ? 'mod-complete' : ''}" data-index="${idx}">
    <div class="mod-head">
      ${buildModIcon(mod)}
      <div class="mod-info">
        <div class="mod-title">${esc(mod.title)}</div>
        <div class="mod-sub">${esc(mod.desc)}</div>
      </div>
      <div class="mod-pct ${done ? 'mod-pct-done' : ''}">${pct}%</div>
    </div>
    <div class="mod-bar"><div class="mod-bar-fill" style="width:${pct}%"></div></div>
    <div class="mod-topics">${topics}</div>
  </div>`;
}

const MODULES = [
  {
    id: 'js', title: 'JavaScript Moderno', desc: 'Base de todos os projetos AG',
    topics: [
      { id: 'const-arrow' },
      { id: 'async-await' },
      { id: 'array-methods' },
      { id: 'optional-ops' },
      { id: 'fetch-api' },
      { id: 'dom-events' },
    ],
  },
  {
    id: 'ts', title: 'TypeScript', desc: 'Tipagem para evitar bugs em runtime',
    topics: [
      { id: 'basic-types' },
      { id: 'strict-no-any' },
      { id: 'utility-types' },
      { id: 'generics' },
      { id: 'discriminated' },
    ],
  },
  {
    id: 'supabase', title: 'Supabase', desc: 'Backend de PULSAR-RH, OFICINA, Varejo',
    topics: [
      { id: 'crud' },
      { id: 'auth' },
      { id: 'rls' },
      { id: 'realtime' },
      { id: 'migrations' },
      { id: 'types-gen' },
    ],
  },
  {
    id: 'html-css', title: 'HTML + CSS + Vanilla JS', desc: 'Stack do ag-hub, Café com AG',
    topics: [
      { id: 'semantics' },
      { id: 'layout' },
      { id: 'css-vars' },
      { id: 'spa-vanilla' },
      { id: 'localstorage' },
      { id: 'responsive' },
    ],
  },
  {
    id: 'git-deploy', title: 'Git + Deploy', desc: 'Controle de versão e entrega',
    topics: [
      { id: 'git-core' },
      { id: 'conv-commits' },
      { id: 'gitignore-env' },
      { id: 'vercel' },
      { id: 'ci-cd' },
    ],
  },
  {
    id: 'node-api', title: 'Node.js + Express', desc: 'Backend das APIs AG',
    topics: [
      { id: 'express-basics' },
      { id: 'env-validation' },
      { id: 'error-handling' },
      { id: 'async-node' },
      { id: 'graceful-shutdown' },
    ],
  },
  {
    id: 'clean-code', title: 'Clean Code', desc: 'Princípios aplicados em toda sessão',
    topics: [
      { id: 'srp' },
      { id: 'dry-kiss' },
      { id: 'early-return' },
      { id: 'naming' },
      { id: 'code-smells' },
      { id: 'testing' },
    ],
  },
];

function renderModules() {
  const p = getModProgress();
  const total = MODULES.reduce((a, m) => a + m.topics.length, 0);
  const mastered = MODULES.reduce((a, m) =>
    a + m.topics.filter(t => topicStatus(p, m.id, t.id) === 'mastered').length, 0);
  const overall = Math.round((mastered / total) * 100);
  document.getElementById('modules-overall').textContent =
    `${mastered}/${total} tópicos dominados · ${overall}% do objetivo`;
  document.getElementById('modules-grid').innerHTML =
    MODULES.map((m, i) => renderModuleCard(m, p, i)).join('');
}

function renderGrowth() {
  if (SYNC) renderGamification();
  try { renderGrowthBody(); } catch(e) { console.error('[renderGrowth]', e); }
}

function renderGrowthBody() {
  const sessions = JSON.parse(localStorage.getItem('agh_sessions') || '[]');
  const totalSess = sessions.length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const waStr = weekAgo.toISOString().slice(0,10);
  const thisWeek = sessions.filter(s=>s.date>=waStr).length;
  const byType = {};
  sessions.forEach(s => { byType[s.type] = (byType[s.type]||0)+1; });
  const topType = Object.entries(byType).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
  const studies = DB.studies;
  const studyHoursTotal = studies.reduce((acc,s)=>acc+(parseFloat(s.hours)||0),0);
  const studyHoursWeek  = studies.filter(s=>s.date>=waStr).reduce((acc,s)=>acc+(parseFloat(s.hours)||0),0);

  document.getElementById('growth-stats').innerHTML = `
    <div class="tstat"><div class="tstat-val" style="color:var(--phi)">${totalSess}</div><div class="tstat-lbl">Sessões Claude</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--green)">${thisWeek}</div><div class="tstat-lbl">Essa semana</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--cyan)">${studyHoursTotal.toFixed(1)}h</div><div class="tstat-lbl">Total estudado</div></div>
    <div class="tstat"><div class="tstat-val" style="color:var(--secondary)">${studyHoursWeek.toFixed(1)}h</div><div class="tstat-lbl">Estudando/semana</div></div>
  `;

  renderStudies();

  const sl = document.getElementById('sessions-list');
  const sorted = [...sessions].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length) {
    sl.innerHTML = `<div class="empty"><div class="empty-i">📋</div><div class="empty-t">Nenhuma sessão registrada</div><div class="empty-s">Clique em "Registrar Sessão" após cada trabalho com Claude</div></div>`;
  } else {
    sl.innerHTML = sorted.map(s => `
      <div class="session-card" onclick="openSessionModal('${s.id}')">
        <div class="session-head">
          <div class="session-title">${esc(s.title)}</div>
          <span class="session-badge sb-${s.type}">${s.type}</span>
        </div>
        <div class="session-meta">
          <span>${fmtD(s.date)}</span>
          ${s.projectId ? `<span style="color:var(--phi)">${esc(DB.projects.find(p=>p.id===s.projectId)?.name||'')}</span>` : ''}
          <span class="impact-${s.impact}">impacto ${s.impact}</span>
        </div>
        ${s.notes ? `<div style="font-size:.72rem;color:var(--muted);margin-top:5px;line-height:1.5">${esc(s.notes).slice(0,120)}${s.notes.length>120?'…':''}</div>` : ''}
      </div>`).join('');
  }

  const lvlColor = {iniciando:'#5C82B8',desenvolvendo:'#FFBC7D',avancado:'#08C16A',dominando:'#1A7FFF'};
  document.getElementById('domains-list').innerHTML = DOMAINS.map(d => `
    <div class="domain-row">
      <div class="domain-head">
        <div class="domain-name">${d.name}</div>
        <span class="domain-level dl-${d.level}">${d.level}</span>
      </div>
      <div class="domain-bar"><div class="domain-fill" style="width:${d.pct}%;background:${lvlColor[d.level]}"></div></div>
      <div class="domain-sub">${d.sub}</div>
    </div>`).join('');

  document.getElementById('suggestions-list').innerHTML = SUGGESTIONS.map(s => `
    <div class="suggestion-card">
      <div class="suggestion-title">→ ${s.title}</div>
      <div class="suggestion-sub">${s.sub}</div>
    </div>`).join('');
}

function openSessionModal(id) {
  const projs = DB.projects;
  const sel = document.getElementById('fs-proj');
  sel.innerHTML = '<option value="">Sem projeto específico</option>' +
    projs.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');

  if(id) {
    const s = JSON.parse(localStorage.getItem('agh_sessions')||'[]').find(x=>x.id===id);
    if(!s) return;
    document.getElementById('fs-id').value   = s.id;
    document.getElementById('fs-title').value= s.title;
    document.getElementById('fs-proj').value = s.projectId||'';
    document.getElementById('fs-type').value = s.type;
    document.getElementById('fs-date').value = s.date;
    document.getElementById('fs-impact').value=s.impact;
    document.getElementById('fs-notes').value= s.notes||'';
    document.getElementById('s-del').style.display='';
  } else {
    document.getElementById('fs-id').value='';
    document.getElementById('fs-title').value='';
    document.getElementById('fs-proj').value='';
    document.getElementById('fs-type').value='feature';
    document.getElementById('fs-date').value=today();
    document.getElementById('fs-impact').value='medio';
    document.getElementById('fs-notes').value='';
    document.getElementById('s-del').style.display='none';
  }
  openM('m-session');
  setTimeout(()=>document.getElementById('fs-title').focus(),80);
}

function saveSession() {
  const title = document.getElementById('fs-title').value.trim();
  if(!title){toast('Descreva o que foi feito','err');return;}
  const sessions = JSON.parse(localStorage.getItem('agh_sessions')||'[]');
  const id = document.getElementById('fs-id').value;
  const data = {
    id: id||uid(), title,
    projectId: document.getElementById('fs-proj').value||null,
    type:   document.getElementById('fs-type').value,
    date:   document.getElementById('fs-date').value||today(),
    impact: document.getElementById('fs-impact').value,
    notes:  document.getElementById('fs-notes').value.trim(),
    createdAt: new Date().toISOString(),
  };
  if(id){const i=sessions.findIndex(s=>s.id===id);sessions[i]=data;}
  else sessions.unshift(data);
  localStorage.setItem('agh_sessions', JSON.stringify(sessions));
  closeM('m-session');
  renderGrowth();
  toast(id?'Sessão atualizada':'Sessão registrada');
}

function delSession() {
  const id=document.getElementById('fs-id').value;
  if(!id||!confirm('Excluir esta sessão?')) return;
  const sessions=JSON.parse(localStorage.getItem('agh_sessions')||'[]').filter(s=>s.id!==id);
  localStorage.setItem('agh_sessions', JSON.stringify(sessions));
  closeM('m-session');
  renderGrowth();
  toast('Sessão excluída');
}

// ── KEYBOARD ──────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
    const o=document.querySelector('.overlay.open');
    if(!o) return;
    if(o.id==='m-task')    saveTask();
    else if(o.id==='m-proj')    saveProj();
    else if(o.id==='m-ev')      saveEv();
    else if(o.id==='m-session') saveSession();
    else if(o.id==='m-study')   saveStudy();
  }
});

// ── BACKUP / RESTORE ──────────────────────────────────────────────
function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: DB.projects,
    tasks:    DB.tasks,
    events:   DB.events,
    sessions: JSON.parse(localStorage.getItem('agh_sessions') || '[]'),
    studies:  DB.studies,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ag-hub-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('Backup exportado');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.projects || !data.tasks) { toast('Arquivo inválido', 'err'); return; }
        if (!confirm(`Importar backup de ${data.exportedAt?.slice(0,10) || '?'}?\nIsso substituirá todos os dados atuais.`)) return;
        DB.projects = data.projects;
        DB.tasks    = data.tasks;
        DB.events   = data.events || [];
        if (data.sessions) localStorage.setItem('agh_sessions', JSON.stringify(data.sessions));
        if (data.studies)  DB.studies = data.studies;
        localStorage.setItem('agh_seed_v', '7');
        go(curView);
        toast('Dados restaurados com sucesso');
      } catch { toast('Erro ao ler o arquivo', 'err'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── FOCUS PROJECT ─────────────────────────────────────────────────
function getFocusProj() { return localStorage.getItem('agh_focus_proj')||null; }
function setFocusProj(id) {
  if(localStorage.getItem('agh_focus_proj')===id) localStorage.removeItem('agh_focus_proj');
  else localStorage.setItem('agh_focus_proj', id);
  renderDash();
}

function renderFocusSection() {
  const section=document.getElementById('focus-proj-section');
  if(!section) return;
  const projs=DB.projects.filter(p=>p.status==='ativo');
  const focusId=getFocusProj();
  const tasks=DB.tasks, t=today();
  const focusTasks=focusId
    ? tasks.filter(k=>k.projectId===focusId&&k.status!=='done')
           .sort((a,b)=>{const p={high:0,medium:1,low:2};return (p[a.priority]||1)-(p[b.priority]||1);})
    : tasks.filter(k=>k.status!=='done'&&(k.priority==='high'||(k.due&&k.due<=t)))
           .sort((a,b)=>a.due&&b.due?a.due.localeCompare(b.due):a.due?-1:1).slice(0,5);
  const focusProj=focusId?DB.projects.find(p=>p.id===focusId):null;

  section.innerHTML=`
    <div class="focus-proj-bar">
      <span class="focus-label">Foco</span>
      <div class="focus-btns">
        ${projs.map(p=>`
          <button class="fpb-btn${p.id===focusId?' fpb-active':''}"
            style="${p.id===focusId?`background:${p.color}22;border-color:${p.color};color:${p.color}`:''}"
            onclick="setFocusProj('${p.id}')">
            <span class="fpb-dot" style="background:${p.color}"></span>
            ${esc(p.name.length>16?p.name.slice(0,16)+'…':p.name)}
          </button>`).join('')}
      </div>
    </div>
    ${focusTasks.length?`<div class="focus-task-list">
      ${focusTasks.slice(0,6).map(tk=>`
        <div class="focus-item" onclick="openTaskModal('${tk.id}')">
          <div class="fcheck" onclick="toggleT(event,'${tk.id}')"></div>
          <div style="flex:1;min-width:0">
            <div class="focus-text">${esc(tk.title)}</div>
            <div class="focus-meta">
              ${tk.due&&tk.due<t?`<span style="color:var(--danger)">⚠ ${fmtD(tk.due)}</span>`:tk.due?fmtD(tk.due):''}
              ${tk.priority==='high'?' · <span style="color:var(--danger)">Alta</span>':''}
              ${!focusId&&tk.projectId?` · <span style="color:var(--muted)">${esc(DB.projects.find(p=>p.id===tk.projectId)?.name||'')}</span>`:''}
            </div>
          </div>
        </div>`).join('')}
    </div>`:`<div style="font-size:.78rem;color:var(--muted);padding:6px 0">${focusId?'Nenhuma tarefa pendente neste projeto 🎉':'Sem tarefas urgentes ou com prazo hoje'}</div>`}
  `;
}

function renderWeeklyDigest() {
  const el=document.getElementById('weekly-digest');
  if(!el) return;
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const waStr=weekAgo.toISOString().slice(0,10);
  const t=today();
  const doneThisWeek=DB.tasks.filter(k=>k.status==='done'&&(k.updatedAt||'').slice(0,10)>=waStr).length;
  const sessThisWeek=JSON.parse(localStorage.getItem('agh_sessions')||'[]').filter(s=>s.date>=waStr).length;
  const studyHours=DB.studies.filter(s=>s.date>=waStr).reduce((acc,s)=>acc+(parseFloat(s.hours)||0),0);
  const overdue=DB.tasks.filter(k=>k.status!=='done'&&k.due&&k.due<t).length;
  el.innerHTML=`
    <div class="weekly-digest-card">
      <div class="card-title">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Essa semana
      </div>
      <div class="weekly-row">
        <div class="wstat"><div class="wstat-val" style="color:var(--accent)">${doneThisWeek}</div><div class="wstat-lbl">tarefas feitas</div></div>
        <div class="wstat"><div class="wstat-val" style="color:var(--secondary)">${sessThisWeek}</div><div class="wstat-lbl">sessões Claude</div></div>
        <div class="wstat"><div class="wstat-val" style="color:var(--cyan)">${studyHours.toFixed(1)}h</div><div class="wstat-lbl">estudando</div></div>
        <div class="wstat"><div class="wstat-val" style="color:${overdue?'var(--danger)':'var(--muted)'}">${overdue}</div><div class="wstat-lbl">atrasadas</div></div>
      </div>
    </div>`;
}

// ── STALENESS ─────────────────────────────────────────────────────
function projStaleDays(projId) {
  const tasks=DB.tasks.filter(t=>t.projectId===projId);
  if(!tasks.length) return null;
  const dates=tasks.map(t=>t.updatedAt||t.createdAt||'').filter(Boolean).sort().reverse();
  if(!dates.length) return null;
  return Math.floor((Date.now()-new Date(dates[0]).getTime())/(1000*60*60*24));
}

// ── STUDIES ───────────────────────────────────────────────────────
function renderStudies() {
  const studies=DB.studies.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const waStr=weekAgo.toISOString().slice(0,10);
  const totalH=studies.reduce((acc,s)=>acc+(parseFloat(s.hours)||0),0);
  const weekH=studies.filter(s=>s.date>=waStr).reduce((acc,s)=>acc+(parseFloat(s.hours)||0),0);
  const bySubject={};
  studies.forEach(s=>{bySubject[s.subject]=(bySubject[s.subject]||0)+(parseFloat(s.hours)||0);});

  const statsEl=document.getElementById('study-stats');
  if(statsEl) statsEl.innerHTML=`
    <div class="study-stats-row">
      <div class="study-stat"><span class="ss-val" style="color:var(--cyan)">${totalH.toFixed(1)}h</span><span class="ss-lbl">total</span></div>
      <div class="study-stat"><span class="ss-val" style="color:var(--secondary)">${weekH.toFixed(1)}h</span><span class="ss-lbl">essa semana</span></div>
      <div class="study-stat"><span class="ss-val" style="color:var(--accent)">${studies.length}</span><span class="ss-lbl">sessões</span></div>
      ${Object.entries(bySubject).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([s,h])=>`<div class="study-stat"><span class="ss-val" style="color:var(--tertiary)">${h.toFixed(1)}h</span><span class="ss-lbl">${esc(s)}</span></div>`).join('')}
    </div>`;

  const listEl=document.getElementById('studies-list');
  if(!listEl) return;
  if(!studies.length){
    listEl.innerHTML='<div class="empty-s" style="color:var(--muted);font-size:.78rem;padding:8px 0">Nenhum estudo registrado ainda</div>';
    return;
  }
  listEl.innerHTML=studies.map(s=>`
    <div class="study-card" onclick="openStudyModal('${s.id}')">
      <div class="study-head">
        <div class="study-topic">${esc(s.topic)}</div>
        <span class="study-badge">${esc(s.subject)}</span>
      </div>
      <div class="study-meta">
        <span>${fmtD(s.date)}</span>
        <span style="color:var(--cyan);font-weight:700">${s.hours}h</span>
        ${s.notes?`<span style="color:var(--muted);font-size:.63rem">${esc(s.notes).slice(0,80)}${s.notes.length>80?'…':''}</span>`:''}
      </div>
    </div>`).join('');
}

function openStudyModal(id) {
  if(id){
    const s=DB.studies.find(x=>x.id===id);
    if(!s) return;
    document.getElementById('fst-id').value   =s.id;
    document.getElementById('fst-topic').value=s.topic;
    document.getElementById('fst-subj').value =s.subject;
    document.getElementById('fst-hours').value=s.hours;
    document.getElementById('fst-date').value =s.date;
    document.getElementById('fst-notes').value=s.notes||'';
    document.getElementById('st-del').style.display='';
  } else {
    document.getElementById('fst-id').value='';
    document.getElementById('fst-topic').value='';
    document.getElementById('fst-subj').value='IFPB';
    document.getElementById('fst-hours').value='1';
    document.getElementById('fst-date').value=today();
    document.getElementById('fst-notes').value='';
    document.getElementById('st-del').style.display='none';
  }
  openM('m-study');
  setTimeout(()=>document.getElementById('fst-topic').focus(),80);
}

function saveStudy() {
  const topic=document.getElementById('fst-topic').value.trim();
  if(!topic){toast('Tópico obrigatório','err');return;}
  const studies=DB.studies, id=document.getElementById('fst-id').value;
  const data={
    id:id||uid(), topic,
    subject:document.getElementById('fst-subj').value||'Autodidata',
    hours:parseFloat(document.getElementById('fst-hours').value)||1,
    date:document.getElementById('fst-date').value||today(),
    notes:document.getElementById('fst-notes').value.trim(),
    createdAt:new Date().toISOString(),
  };
  if(id){const i=studies.findIndex(s=>s.id===id);studies[i]=data;}
  else studies.unshift(data);
  DB.studies=studies;
  closeM('m-study');
  if(curView==='growth') renderGrowth();
  if(curView==='dash')   renderDash();
  toast(id?'Estudo atualizado':'Estudo registrado');
}

function delStudy() {
  const id=document.getElementById('fst-id').value;
  if(!id||!confirm('Excluir este registro?')) return;
  DB.studies=DB.studies.filter(s=>s.id!==id);
  closeM('m-study');
  if(curView==='growth') renderGrowth();
  toast('Registro excluído');
}

// ── TRILHA / ESTUDOS ──────────────────────────────────────────────

let TRILHA_DATA = null;

// Cores por prioridade (borda-topo dos cards)
const TRILHA_COR_PRIORIDADE = {
  maxima: 'var(--danger)',
  alta:   'var(--danger)',
  media:  'var(--warn)',
  baixa:  'var(--muted)',
};

async function loadTrilhaIndex() {
  if (TRILHA_DATA) return TRILHA_DATA;
  try {
    const r = await fetch('/data/trilha-index.json?v=' + Date.now());
    if (!r.ok) throw new Error(`${r.status}`);
    TRILHA_DATA = await r.json();
    return TRILHA_DATA;
  } catch(e) {
    console.warn('[trilha] falha ao carregar trilha-index.json:', e);
    return null;
  }
}

function loadTrilhaProgress() {
  return JSON.parse(localStorage.getItem('trilhaProgress') || '{}');
}

function saveTrilhaProgress(progress) {
  localStorage.setItem('trilhaProgress', JSON.stringify(progress));
}

function calcularProgressoTrilha(trilhaId, progress) {
  const trilha = TRILHA_DATA?.trilhas?.find(t => t.id === trilhaId);
  if (!trilha) return { lidos: 0, checkpoints: 0, total: 0, percentual: 0 };
  const total = trilha.modulos.length;
  const lidos = trilha.modulos.filter(m =>
    progress[m.id] === 'lido' || progress[m.id] === 'checkpoint'
  ).length;
  const checkpoints = trilha.modulos.filter(m => progress[m.id] === 'checkpoint').length;
  const percentual = total ? Math.round((lidos / total) * 100) : 0;
  return { lidos, checkpoints, total, percentual };
}

function buildTrilhaCard(trilha, progress) {
  const { lidos, checkpoints, total, percentual } = calcularProgressoTrilha(trilha.id, progress);
  const corBorda = TRILHA_COR_PRIORIDADE[trilha.prioridade] || 'var(--muted)';
  const badgeClass = `trilha-badge-${trilha.prioridade}`;
  const badgeLabel = trilha.prioridade === 'maxima' ? '⚡ máxima' : trilha.prioridade;

  return `
    <div class="trilha-card" onclick="renderTrilhaModulos('${trilha.id}')"
      style="border-top:3px solid ${corBorda}">
      <div class="trilha-card-icon">${trilha.icone}</div>
      <div class="trilha-card-nome">${esc(trilha.nome)}</div>
      <div class="trilha-card-foco">${esc(trilha.foco)}</div>
      <span class="trilha-badge ${badgeClass}">${esc(badgeLabel)}</span>
      <div class="trilha-progress-bar">
        <div class="trilha-progress-fill" style="width:${percentual}%"></div>
      </div>
      <div class="trilha-progress-text">
        <span>${lidos}/${total} lidos · ${checkpoints} checkpoint${checkpoints!==1?'s':''}</span>
        <span>${percentual}%</span>
      </div>
    </div>`;
}

async function renderTrilha() {
  const data = await loadTrilhaIndex();
  if (!data) {
    document.getElementById('trilha-body').innerHTML =
      '<div class="empty"><div class="empty-i">📚</div><div class="empty-t">Erro ao carregar trilhas</div><div class="empty-s">Verifique se data/trilha-index.json existe</div></div>';
    return;
  }
  renderTrilhaMapa();
}

let _trilhaTreeMode = false; // false = lista, true = skill tree

function renderTrilhaMapa() {
  if (!TRILHA_DATA) return;
  const progress   = loadTrilhaProgress();
  const total      = TRILHA_DATA.trilhas.reduce((a, t) => a + t.totalModulos, 0);
  const lidos      = TRILHA_DATA.trilhas.reduce((a, t) => a + calcularProgressoTrilha(t.id, progress).lidos, 0);
  const checkpoints= TRILHA_DATA.trilhas.reduce((a, t) => a + calcularProgressoTrilha(t.id, progress).checkpoints, 0);

  document.getElementById('trilha-header').innerHTML = `
    <div>
      <div class="view-title">Estudos</div>
      <div class="view-sub">
        ${TRILHA_DATA.totalTrilhas} trilhas · ${total} módulos ·
        ${lidos} lidos · ${checkpoints} checkpoints
      </div>
    </div>
    <div id="trilha-tree-toggle" style="display:flex;gap:8px;align-items:center">
      <button class="trilha-tree-btn${!_trilhaTreeMode ? ' active' : ''}" onclick="_trilhaTreeMode=false;renderTrilhaMapa()">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Grade
      </button>
      <button class="trilha-tree-btn${_trilhaTreeMode ? ' active' : ''}" onclick="_trilhaTreeMode=true;renderTrilhaMapa()">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 14h8M8 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>
        Skill Tree
      </button>
    </div>`;

  if (_trilhaTreeMode) {
    renderSkillTree(progress);
  } else {
    document.getElementById('trilha-body').innerHTML =
      `<div class="trilha-grid">
        ${TRILHA_DATA.trilhas.map(t => buildTrilhaCard(t, progress)).join('')}
      </div>`;
  }
}

// ── SKILL TREE (SVG inline, colunas por trilha) ───────────────────
//
// Layout escolhido: colunas verticais — cada trilha é uma coluna.
// Alternativa seria radial (centro-saída), mas com 11 trilhas ficaria
// muito apertado sem lib. Colunas permitem ler sequência 01→02→...
// e pré-requisitos como linhas tracejadas entre colunas.
// Pan/zoom via pointer events — sem lib.

const ST_NODE_R   = 10;   // raio do nó
const ST_COL_W    = 90;   // largura de cada coluna
const ST_ROW_H    = 52;   // altura entre nós
const ST_PAD_X    = 50;   // padding horizontal
const ST_PAD_Y    = 50;   // padding vertical

// Pré-requisitos entre trilhas: linhas tracejadas
const ST_PREREQS  = [
  ['00-fundamentos', '10-codigo-limpo'],
  ['00-fundamentos', '30-banco'],
  ['00-fundamentos', '50-backend'],
  ['10-codigo-limpo','20-arquitetura'],
  ['30-banco',       '80-system-design'],
  ['50-backend',     '70-devops'],
  ['00-fundamentos', '60-seguranca'],
  ['00-fundamentos', '90-entrevista'],
  ['90-entrevista',  '95-diferencial'],
  ['00-fundamentos', '15-git'],
  ['50-backend',     '55-apis'],
  ['55-apis',        '35-ia-ml'],
  ['80-system-design','85-escala'],
];

function stNodeColor(status) {
  if (status === 'checkpoint') return 'var(--accent)';
  if (status === 'lido')       return 'var(--primary)';
  return 'var(--border)';
}

function stTextColor(status) {
  if (status === 'checkpoint' || status === 'lido') return 'var(--text)';
  return 'var(--muted)';
}

function buildSkillTreeSvg(progress) {
  const trilhas = TRILHA_DATA.trilhas;
  const cols    = trilhas.length;
  const maxRows = Math.max(...trilhas.map(t => t.modulos.length));
  const W = ST_PAD_X * 2 + cols * ST_COL_W;
  const H = ST_PAD_Y * 2 + maxRows * ST_ROW_H;

  // Calcula centros dos nós: { moduloId: {cx,cy} }
  const centers = {};
  trilhas.forEach((trilha, ci) => {
    const cx = ST_PAD_X + ci * ST_COL_W + ST_COL_W / 2;
    trilha.modulos.forEach((m, ri) => {
      const cy = ST_PAD_Y + ri * ST_ROW_H;
      centers[m.id] = { cx, cy };
    });
  });

  // Linhas de sequência dentro de cada trilha
  const seqLines = trilhas.flatMap(trilha =>
    trilha.modulos.slice(0, -1).map((m, i) => {
      const a = centers[m.id];
      const b = centers[trilha.modulos[i + 1].id];
      return `<line x1="${a.cx}" y1="${a.cy}" x2="${b.cx}" y2="${b.cy}"
        stroke="var(--border)" stroke-width="1.5" stroke-opacity=".6"/>`;
    })
  );

  // Linhas tracejadas pré-requisito (última linha da trilha origem → primeira da destino)
  const prereqLines = ST_PREREQS.flatMap(([fromId, toId]) => {
    const fromTrilha = trilhas.find(t => t.id === fromId);
    const toTrilha   = trilhas.find(t => t.id === toId);
    if (!fromTrilha || !toTrilha) return [];
    const lastMod  = fromTrilha.modulos.at(-1);
    const firstMod = toTrilha.modulos[0];
    if (!lastMod || !firstMod) return [];
    const a = centers[lastMod.id];
    const b = centers[firstMod.id];
    return [`<line x1="${a.cx}" y1="${a.cy}" x2="${b.cx}" y2="${b.cy}"
      stroke="rgba(26,127,255,.3)" stroke-width="1" stroke-dasharray="4 3"/>`];
  });

  // Cabeçalhos de trilha
  const headers = trilhas.map((trilha, ci) => {
    const cx = ST_PAD_X + ci * ST_COL_W + ST_COL_W / 2;
    const cy = ST_PAD_Y - 24;
    return `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="14" font-family="Inter,system-ui,sans-serif">${trilha.icone}</text>`;
  });

  // Nós
  const nodes = trilhas.flatMap(trilha =>
    trilha.modulos.map(m => {
      const status = progress[m.id] ?? 'pending';
      const { cx, cy } = centers[m.id];
      const fill   = stNodeColor(status);
      const fillOpacity = status === 'pending' ? '0.15' : '0.9';
      const stroke = status === 'pending' ? 'var(--border)' : fill;
      const checkmark = status === 'checkpoint'
        ? `<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="9" fill="white" font-weight="700" font-family="Inter,system-ui,sans-serif">✓</text>`
        : status === 'lido'
        ? `<circle cx="${cx}" cy="${cy}" r="4" fill="white" fill-opacity=".7"/>`
        : '';
      // safe: m.id é só letras/números/hífens do trilha-index.json
      return `<g class="st-node" data-modulo-id="${m.id}" data-titulo="${m.titulo.replace(/"/g, '&quot;')}">
        <circle class="st-ring" cx="${cx}" cy="${cy}" r="${ST_NODE_R + 4}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-opacity=".4"/>
        <circle cx="${cx}" cy="${cy}" r="${ST_NODE_R}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="1.5"/>
        ${checkmark}
      </g>`;
    })
  );

  return { svg: [...prereqLines, ...seqLines, ...headers, ...nodes].join('\n'), W, H, centers };
}

// Estado de pan/zoom do skill tree
let _stTransform = { x: 0, y: 0, scale: 1 };
let _stDrag      = null;

function renderSkillTree(progress) {
  const { svg, W, H } = buildSkillTreeSvg(progress);

  document.getElementById('trilha-body').innerHTML = `
    <div class="skill-tree-wrap" id="st-wrap" style="height:520px">
      <svg class="skill-tree-svg" id="st-svg"
        viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
        xmlns="http://www.w3.org/2000/svg">
        <g id="st-canvas" transform="translate(${_stTransform.x},${_stTransform.y}) scale(${_stTransform.scale})">
          ${svg}
        </g>
      </svg>
    </div>`;

  attachSkillTreeEvents();
}

function attachSkillTreeEvents() {
  const wrap = document.getElementById('st-wrap');
  const canvas = document.getElementById('st-canvas');
  const tip    = document.getElementById('st-tooltip-el');
  if (!wrap) return;

  // Delegação de click nos nós
  wrap.addEventListener('click', e => {
    const node = e.target.closest('.st-node');
    if (!node) return;
    const id = node.dataset.moduloId;
    if (!id || !TRILHA_DATA) return;
    for (const trilha of TRILHA_DATA.trilhas) {
      if (trilha.modulos.find(m => m.id === id)) {
        renderTrilhaModulo(id, trilha.id);
        return;
      }
    }
  });

  // Tooltip via mousemove
  wrap.addEventListener('mousemove', e => {
    const node = e.target.closest('.st-node');
    if (!node || !tip) return;
    const titulo = node.dataset.titulo ?? '';
    const id     = node.dataset.moduloId ?? '';
    const prog   = loadTrilhaProgress();
    const status = prog[id] ?? 'pendente';
    tip.textContent = `${titulo} · ${status}`;
    tip.style.display = 'block';
    const rect = wrap.getBoundingClientRect();
    tip.style.left = (e.clientX - rect.left + 12) + 'px';
    tip.style.top  = (e.clientY - rect.top  - 8)  + 'px';
  });
  wrap.addEventListener('mouseleave', () => { if (tip) tip.style.display = 'none'; });

  // Zoom via wheel
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const delta  = e.deltaY > 0 ? -0.1 : 0.1;
    _stTransform.scale = Math.max(0.4, Math.min(2, _stTransform.scale + delta));
    applyStTransform();
  }, { passive: false });

  // Pan via pointer drag
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.st-node')) return;
    _stDrag = { startX: e.clientX - _stTransform.x, startY: e.clientY - _stTransform.y };
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => {
    if (!_stDrag) return;
    _stTransform.x = e.clientX - _stDrag.startX;
    _stTransform.y = e.clientY - _stDrag.startY;
    applyStTransform();
  });
  wrap.addEventListener('pointerup', () => { _stDrag = null; });
}

function applyStTransform() {
  const c = document.getElementById('st-canvas');
  if (c) c.setAttribute('transform',
    `translate(${_stTransform.x},${_stTransform.y}) scale(${_stTransform.scale})`);
}

function renderTrilhaModulos(trilhaId) {
  if (!TRILHA_DATA) return;
  const trilha = TRILHA_DATA.trilhas.find(t => t.id === trilhaId);
  if (!trilha) return;
  const progress = loadTrilhaProgress();

  const buildStatusEl = (moduloId) => {
    const st = progress[moduloId];
    if (st === 'checkpoint') return '<div class="trilha-status trilha-status-checkpoint">✓</div>';
    if (st === 'lido')       return '<div class="trilha-status trilha-status-lido">◐</div>';
    return '<div class="trilha-status">○</div>';
  };

  const buildCheckBtn = (moduloId) => {
    const isCheck = progress[moduloId] === 'checkpoint';
    const cls = isCheck ? 'trilha-checkpoint-btn-on' : 'trilha-checkpoint-btn-off';
    const label = isCheck ? '✓ Checkpoint' : '+ Checkpoint';
    return `<button class="trilha-checkpoint-btn ${cls} btn-sm"
      onclick="event.stopPropagation();marcarCheckpoint('${moduloId}')">${label}</button>`;
  };

  document.getElementById('trilha-header').innerHTML = `
    <div style="width:100%">
      <button class="trilha-back-btn" onclick="renderTrilhaMapa()">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Voltar ao mapa
      </button>
      <div class="trilha-modulos-header">
        <span style="font-size:1.4rem">${trilha.icone}</span>
        <div class="trilha-modulos-titulo">${esc(trilha.nome)}</div>
        <span style="font-size:.75rem;color:var(--muted)">${trilha.foco}</span>
      </div>
    </div>`;

  document.getElementById('trilha-body').innerHTML = trilha.modulos.map(m => `
    <div class="trilha-modulo-item">
      ${buildStatusEl(m.id)}
      <div class="trilha-modulo-titulo">${esc(m.titulo)}</div>
      <div class="trilha-modulo-actions">
        ${buildCheckBtn(m.id)}
        <button class="btn btn-ghost btn-sm"
          onclick="event.stopPropagation();renderTrilhaModulo('${m.id}','${trilhaId}')">Abrir</button>
      </div>
    </div>`).join('');
}

async function renderTrilhaModulo(moduloId, trilhaId) {
  if (!TRILHA_DATA) return;
  const trilha = TRILHA_DATA.trilhas.find(t => t.id === trilhaId);
  const modulo = trilha?.modulos.find(m => m.id === moduloId);
  if (!modulo) return;

  marcarLido(moduloId);

  document.getElementById('trilha-header').innerHTML = `
    <div style="width:100%">
      <button class="trilha-back-btn" onclick="renderTrilhaModulos('${trilhaId}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Voltar para módulos
      </button>
      <div class="trilha-reader-header" style="margin-top:8px">
        <div class="trilha-reader-titulo">${esc(modulo.titulo)}</div>
        <div id="trilha-ck-btn-wrap"></div>
      </div>
    </div>`;

  updateCheckpointBtn(moduloId);

  document.getElementById('trilha-body').innerHTML =
    '<div id="trilha-md-content"><div style="color:var(--muted);text-align:center;padding:40px">Carregando...</div></div>';

  try {
    const r = await fetch(modulo.caminho + '?v=' + Date.now());
    if (!r.ok) throw new Error(`${r.status}`);
    const md = await r.text();
    const html = marked.parse(md);
    document.getElementById('trilha-md-content').innerHTML = html;
  } catch(e) {
    document.getElementById('trilha-md-content').innerHTML =
      `<div style="color:var(--muted);text-align:center;padding:40px">
        Arquivo não encontrado: ${esc(modulo.caminho)}
      </div>`;
  }
}

function updateCheckpointBtn(moduloId) {
  const wrap = document.getElementById('trilha-ck-btn-wrap');
  if (!wrap) return;
  const isCheck = loadTrilhaProgress()[moduloId] === 'checkpoint';
  const cls = isCheck ? 'trilha-checkpoint-btn-on' : 'trilha-checkpoint-btn-off';
  const label = isCheck ? '✓ Checkpoint ativo' : '+ Marcar checkpoint';
  wrap.innerHTML = `<button class="trilha-checkpoint-btn ${cls}"
    onclick="marcarCheckpoint('${moduloId}')">${label}</button>`;
}

function marcarLido(moduloId) {
  const progress = loadTrilhaProgress();
  if (progress[moduloId]) return; // já tem status, não sobrescreve
  progress[moduloId] = 'lido';
  saveTrilhaProgress(progress);
  addXpTrilha(20, 'lido: ' + (moduloNome(moduloId) || moduloId));
  addAttribute('int', 2, 'leitura: ' + (moduloNome(moduloId) || moduloId));
}

function marcarCheckpoint(moduloId) {
  const progress = loadTrilhaProgress();
  const atual = progress[moduloId];
  if (atual === 'checkpoint') {
    progress[moduloId] = 'lido';
    saveTrilhaProgress(progress);
    toast('Checkpoint removido');
    addXpTrilha(-40, 'checkpoint removido: ' + (moduloNome(moduloId) || moduloId));
  } else {
    const eraLido = atual === 'lido';
    progress[moduloId] = 'checkpoint';
    saveTrilhaProgress(progress);
    addXpTrilha(40, 'checkpoint: ' + (moduloNome(moduloId) || moduloId));
    if (!eraLido) addXpTrilha(20, 'lido: ' + (moduloNome(moduloId) || moduloId));
    addAttribute('int', 5, 'checkpoint: ' + (moduloNome(moduloId) || moduloId));
    verificarConquistasTrilha(progress);
  }
  // Atualiza UI no contexto atual sem recarregar tudo
  updateCheckpointBtn(moduloId);
  // Atualiza botão na lista de módulos se estiver visível
  const ckBtns = document.querySelectorAll(`[onclick*="marcarCheckpoint('${moduloId}')"]`);
  const isNowCheck = progress[moduloId] === 'checkpoint';
  ckBtns.forEach(btn => {
    btn.className = btn.className.replace(
      /trilha-checkpoint-btn-(on|off)/,
      isNowCheck ? 'trilha-checkpoint-btn-on' : 'trilha-checkpoint-btn-off'
    );
    btn.textContent = isNowCheck ? '✓ Checkpoint' : '+ Checkpoint';
  });
  // Cross-quest: notifica Quest Board se este módulo é side quest de algum projeto
  if (isNowCheck) queueMicrotask(() => notificarCrossQuest(moduloId));
}

function moduloNome(moduloId) {
  if (!TRILHA_DATA) return moduloId;
  for (const trilha of TRILHA_DATA.trilhas) {
    const m = trilha.modulos.find(x => x.id === moduloId);
    if (m) return m.titulo;
  }
  return moduloId;
}

// Adiciona XP usando o sistema existente de SYNC (via xpLog no recentActivity)
// Como SYNC é readonly (vem de sync.json), gravamos em localStorage separado
// e exibimos toast. O sync.json é atualizado pelo script ag-hub-sync.sh.
function addXpTrilha(xp, desc) {
  if (xp <= 0) return;
  // Registra no localStorage para histórico local
  const log = JSON.parse(localStorage.getItem('trilhaXpLog') || '[]');
  log.unshift({ date: today(), xp, desc });
  localStorage.setItem('trilhaXpLog', JSON.stringify(log.slice(0, 50)));
}

function verificarConquistasTrilha(progress) {
  const desbloqueadas = JSON.parse(localStorage.getItem('trilhaConquistas') || '[]');

  const desbloquear = (id) => {
    if (desbloqueadas.includes(id)) return false;
    desbloqueadas.push(id);
    localStorage.setItem('trilhaConquistas', JSON.stringify(desbloqueadas));
    return true;
  };

  if (!TRILHA_DATA) return;

  // trilha-primeira: concluiu 1 trilha completa (todos com checkpoint)
  const trilhaCompleta = TRILHA_DATA.trilhas.find(t =>
    t.modulos.every(m => progress[m.id] === 'checkpoint')
  );
  if (trilhaCompleta && desbloquear('trilha-primeira')) {
    toast('🎓 Conquista: Primeira Trilha!', 'ok');
  }

  // trilha-diferencial: todos os módulos de 95-diferencial com checkpoint
  const diferencial = TRILHA_DATA.trilhas.find(t => t.id === '95-diferencial');
  if (diferencial && diferencial.modulos.every(m => progress[m.id] === 'checkpoint')) {
    if (desbloquear('trilha-diferencial')) {
      toast('⚡ Conquista: Diferencial Dominado!', 'ok');
    }
  }

  // trilha-maratonista: 10 checkpoints marcados no mesmo dia
  const hoje = today();
  const checkpointHoje = Object.entries(progress)
    .filter(([, v]) => v === 'checkpoint')
    .length;
  // Simplificação: conta total de checkpoints acumulados (não temos timestamp por módulo)
  // Rastreia via localStorage de sessão
  const sessaoCheckpoints = parseInt(sessionStorage.getItem('trilhaCheckpointsHoje') || '0') + 1;
  sessionStorage.setItem('trilhaCheckpointsHoje', String(sessaoCheckpoints));
  if (sessaoCheckpoints >= 10 && desbloquear('trilha-maratonista')) {
    toast('🏃 Conquista: Maratonista!', 'ok');
  }

  // trilha-portfolio: trilhas de prioridade alta (00, 10, 30, 60, 90) com checkpoint completo
  const trilhasAlta = ['00-fundamentos', '10-codigo-limpo', '30-banco', '60-seguranca', '90-entrevista'];
  const todasAlta = trilhasAlta.every(tid => {
    const t = TRILHA_DATA.trilhas.find(x => x.id === tid);
    return t && t.modulos.every(m => progress[m.id] === 'checkpoint');
  });
  if (todasAlta && desbloquear('trilha-portfolio')) {
    toast('💼 Conquista: Portfólio Defensável!', 'ok');
  }
}

// ── QUEST BOARD ───────────────────────────────────────────────────

let QUEST_BOARD_DATA = null;

function loadQuestBoardProgress() {
  return JSON.parse(localStorage.getItem('questBoardProgress') || '{}');
}

function saveQuestBoardProgress(progress) {
  localStorage.setItem('questBoardProgress', JSON.stringify(progress));
}

async function loadQuestBoard() {
  if (QUEST_BOARD_DATA) return QUEST_BOARD_DATA;
  try {
    const r = await fetch('/data/quest-board.json?v=' + Date.now());
    if (!r.ok) throw new Error(`${r.status}`);
    QUEST_BOARD_DATA = await r.json();
    return QUEST_BOARD_DATA;
  } catch(e) {
    console.warn('[quest-board] falha ao carregar quest-board.json:', e);
    return null;
  }
}

function buildSideQuestItem(sq, projId, progress) {
  const key = `sq:${projId}:${sq.id}`;
  const done = progress[key] || sq.concluida;
  const projIdSafe = esc(projId);
  const sqIdSafe = sq.id.replace(/'/g, "\\'");
  return `
    <div class="qb-sidequest-item ${done ? 'sq-done' : ''}"
         onclick="concluirSideQuest('${projIdSafe}','${sqIdSafe}')">
      <div class="qb-sq-circle ${done ? 'sq-done-circle' : ''}">${done ? '&#10003;' : ''}</div>
      <div class="qb-sq-text ${done ? 'sq-done-text' : ''}">${esc(sq.titulo)}</div>
      <div class="qb-sq-xp">+${sq.xpBase + sq.xpBonus} XP</div>
    </div>`;
}

function buildBountyItem(b, projId, progress) {
  const key = `bnt:${projId}:${b.id}`;
  const done = progress[key] || b.concluida;
  const projIdSafe = esc(projId);
  const bntIdSafe = b.id.replace(/'/g, "\\'");
  return `
    <div class="qb-bounty-item ${done ? 'bnt-done' : ''}"
         onclick="concluirBounty('${projIdSafe}','${bntIdSafe}')">
      <div class="qb-bounty-icon">&#x1F4B0;</div>
      <div class="qb-bounty-text ${done ? 'bnt-done-text' : ''}">${esc(b.titulo)}</div>
      <div class="qb-bounty-xp">+${b.xp} XP</div>
    </div>`;
}

function buildQuestCardHeader(proj, prioClass, atividadeLabel) {
  return `
    <div class="qb-proj-header ${prioClass}">
      <div class="qb-proj-icon">${proj.icone}</div>
      <div class="qb-proj-info">
        <div class="qb-proj-name">${esc(proj.nome)}</div>
        <div class="qb-proj-meta">
          <span class="qb-prio-badge qb-prio-${proj.prioridade}">${proj.prioridade}</span>
          ${atividadeLabel ? `<span class="qb-last-activity">Última atividade: ${esc(atividadeLabel)}</span>` : ''}
        </div>
      </div>
      <div class="qb-stack-chips">
        ${proj.stack.map(s => `<span class="qb-chip">${esc(s)}</span>`).join('')}
      </div>
    </div>`;
}

function buildProjetoQuestCard(proj, progress) {
  const hpPct = proj.hp.max ? Math.round((proj.hp.atual / proj.hp.max) * 100) : 0;
  const prioClass = `prio-${proj.prioridade}`;
  const completedSQ = proj.sideQuests.filter(sq =>
    progress[`sq:${proj.id}:${sq.id}`] || sq.concluida
  ).length;

  const diasAtiv = proj.ultimaAtividade
    ? Math.floor((Date.now() - new Date(proj.ultimaAtividade)) / 86400000)
    : null;
  const atividadeLabel = diasAtiv !== null
    ? (diasAtiv === 0 ? 'hoje' : `${diasAtiv}d atrás`)
    : '';

  const sidequestsHtml = proj.sideQuests.map(sq => buildSideQuestItem(sq, proj.id, progress)).join('');
  const bountiesHtml = proj.bounties.map(b => buildBountyItem(b, proj.id, progress)).join('');

  return `
    <div class="qb-proj-card">
      ${buildQuestCardHeader(proj, prioClass, atividadeLabel)}
      <div class="qb-proj-body">
        <div class="qb-hp-row">
          <div class="qb-hp-label">${esc(proj.hp.label)}</div>
          <div class="qb-hp-bar"><div class="qb-hp-fill ${prioClass}" style="width:${hpPct}%"></div></div>
          <div class="qb-hp-pct">${hpPct}%</div>
        </div>
        <div class="qb-section-lbl">&#9654; Side quests (${completedSQ}/${proj.sideQuests.length})</div>
        ${sidequestsHtml}
        <div class="qb-section-lbl" style="margin-top:12px">&#x1F4B0; Bounties extras</div>
        ${bountiesHtml}
      </div>
    </div>`;
}

async function renderQuestBoard() {
  const data = await loadQuestBoard();
  if (!data) {
    document.getElementById('qb-body').innerHTML =
      '<div class="empty"><div class="empty-i">&#127919;</div><div class="empty-t">Erro ao carregar Quest Board</div><div class="empty-s">Verifique se data/quest-board.json existe</div></div>';
    return;
  }

  const progress = loadQuestBoardProgress();

  const totalSQ = data.projetos.reduce((a, p) => a + p.sideQuests.length, 0);
  const completedSQ = data.projetos.reduce((a, p) =>
    a + p.sideQuests.filter(sq => progress[`sq:${p.id}:${sq.id}`] || sq.concluida).length, 0
  );
  const totalBounties = data.projetos.reduce((a, p) => a + p.bounties.length, 0);
  const completedBounties = data.projetos.reduce((a, p) =>
    a + p.bounties.filter(b => progress[`bnt:${p.id}:${b.id}`] || b.concluida).length, 0
  );

  document.getElementById('qb-sub').textContent =
    `${data.projetos.length} projetos · ${totalSQ - completedSQ} side quests disponíveis · XP×2 quando vinculadas`;

  document.getElementById('qb-body').innerHTML = `
    <div class="qb-summary">
      <div class="qb-stat"><div class="qb-stat-val">${data.projetos.length}</div><div class="qb-stat-lbl">projetos</div></div>
      <div class="qb-stat"><div class="qb-stat-val" style="color:var(--accent)">${completedSQ}</div><div class="qb-stat-lbl">side quests concluídas</div></div>
      <div class="qb-stat"><div class="qb-stat-val" style="color:var(--warn)">${totalSQ - completedSQ}</div><div class="qb-stat-lbl">side quests abertas</div></div>
      <div class="qb-stat"><div class="qb-stat-val" style="color:var(--secondary)">${completedBounties}/${totalBounties}</div><div class="qb-stat-lbl">bounties</div></div>
    </div>
    ${data.projetos.map(p => buildProjetoQuestCard(p, progress)).join('')}
  `;
}

function concluirSideQuest(projetoId, questId) {
  const progress = loadQuestBoardProgress();
  const key = `sq:${projetoId}:${questId}`;
  if (progress[key]) return;

  progress[key] = true;
  saveQuestBoardProgress(progress);

  const proj = QUEST_BOARD_DATA?.projetos?.find(p => p.id === projetoId);
  const sq = proj?.sideQuests?.find(s => s.id === questId);
  const xpTotal = sq ? (sq.xpBase + sq.xpBonus) : 80;
  const projNome = proj?.nome || projetoId;

  addXpTrilha(xpTotal, `side quest ${projNome}: ${questId}`);
  toast(`Side quest concluída! +${xpTotal} XP (${esc(projNome)})`, 'ok');

  verificarConquistaQuestBoard(projetoId, progress);
  renderQuestBoard();
}

function concluirBounty(projetoId, bountyId) {
  const progress = loadQuestBoardProgress();
  const key = `bnt:${projetoId}:${bountyId}`;
  if (progress[key]) return;

  progress[key] = true;
  saveQuestBoardProgress(progress);

  const proj = QUEST_BOARD_DATA?.projetos?.find(p => p.id === projetoId);
  const bounty = proj?.bounties?.find(b => b.id === bountyId);
  const xp = bounty?.xp || 60;
  const projNome = proj?.nome || projetoId;

  addXpTrilha(xp, `bounty ${projNome}: ${bountyId}`);
  toast(`Bounty coletada! +${xp} XP (${esc(projNome)})`, 'ok');

  renderQuestBoard();
}

function verificarConquistaQuestBoard(projetoId, progress) {
  const conquistas = JSON.parse(localStorage.getItem('trilhaConquistas') || '[]');

  const desbloquear = (id) => {
    if (conquistas.includes(id)) return false;
    conquistas.push(id);
    localStorage.setItem('trilhaConquistas', JSON.stringify(conquistas));
    return true;
  };

  if (desbloquear('primeira-side-quest')) {
    toast('Conquista: Aplicação Real!', 'ok');
  }

  if (!QUEST_BOARD_DATA) return;
  const proj = QUEST_BOARD_DATA.projetos.find(p => p.id === projetoId);
  if (!proj) return;

  const todasConcluidas = proj.sideQuests.every(
    sq => progress[`sq:${projetoId}:${sq.id}`] || sq.concluida
  );
  if (todasConcluidas && projetoId === 'PULSAR-RH' && desbloquear('quest-board-pulsar')) {
    toast('Conquista: PULSAR Dominado!', 'ok');
  }
}

// Integração: marcarCheckpoint → Quest Board cross-XP
// Não sobrescreve — wraps via reatribuição após execução do módulo trilha.
// queueMicrotask garante que roda depois da lógica original.
function notificarCrossQuest(moduloId) {
  if (!QUEST_BOARD_DATA) return;
  const progress = loadQuestBoardProgress();
  const trilhaProgress = loadTrilhaProgress();

  if (trilhaProgress[moduloId] !== 'checkpoint') return;

  for (const proj of QUEST_BOARD_DATA.projetos) {
    const sq = proj.sideQuests.find(s => s.id === moduloId);
    if (!sq) continue;
    const key = `sq:${proj.id}:${sq.id}`;
    if (progress[key]) continue;

    progress[key] = true;
    saveQuestBoardProgress(progress);

    const xpBonus = sq.xpBonus;
    addXpTrilha(xpBonus, `cross-quest bonus ${proj.nome}: ${moduloId}`);
    setTimeout(() => {
      toast(`Side quest do ${esc(proj.nome)} cumprida! +${xpBonus} XP cruzado.`, 'ok');
    }, 650);
  }
}

// ── STREAKS ───────────────────────────────────────────────────────
const STREAK_DEFAULTS = {
  geral:    { atual: 0, recorde: 0, ultimoDia: null },
  estudo:   { atual: 0, recorde: 0, ultimoDia: null },
  semIa:    { atual: 0, recorde: 0, ultimoDia: null },
  decisoes: { atual: 0, recorde: 0, ultimoDia: null },
};

function getStreaks() {
  const raw = localStorage.getItem('agh_streaks');
  if (!raw) return JSON.parse(JSON.stringify(STREAK_DEFAULTS));
  return { ...JSON.parse(JSON.stringify(STREAK_DEFAULTS)), ...JSON.parse(raw) };
}

function saveStreaks(data) {
  localStorage.setItem('agh_streaks', JSON.stringify(data));
}

// Avança ou quebra streak de um tipo ao registrar atividade no dia
function updateStreak(tipo) {
  const streaks = getStreaks();
  const s = streaks[tipo];
  if (!s) return;
  const t = today();
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().slice(0, 10);

  if (s.ultimoDia === t) return; // já foi registrado hoje

  if (s.ultimoDia === ontemStr) {
    s.atual += 1;
  } else if (s.ultimoDia !== t) {
    s.atual = 1; // reinicia se pulou dia (ou nunca teve)
  }

  s.recorde = Math.max(s.recorde, s.atual);
  s.ultimoDia = t;
  streaks[tipo] = s;
  saveStreaks(streaks);
}

// ── POMODORO ──────────────────────────────────────────────────────
const POMO_DURATIONS = { foco: 25 * 60, break: 5 * 60, sagrada: 30 * 60 };
const POMO_KEY = 'agh_pomo_session';
const POMO_LOG_KEY = 'agh_pomo_log';

let pomoRafId = null;

function getPomoCurrent() {
  const raw = localStorage.getItem(POMO_KEY);
  return raw ? JSON.parse(raw) : null;
}

function savePomoCurrent(data) {
  localStorage.setItem(POMO_KEY, JSON.stringify(data));
}

function clearPomoCurrent() {
  localStorage.removeItem(POMO_KEY);
}

function getPomoDayCount() {
  const t = today();
  const log = JSON.parse(localStorage.getItem(POMO_LOG_KEY) || '[]');
  return log.filter(e => e.date === t && e.type === 'foco' && e.completed).length;
}

function getPomoStreakDays() {
  const log = JSON.parse(localStorage.getItem(POMO_LOG_KEY) || '[]');
  const dias = [...new Set(log.filter(e => e.completed && e.type === 'foco').map(e => e.date))].sort().reverse();
  if (!dias.length) return 0;
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < dias.length; i++) {
    const expected = new Date(now);
    expected.setDate(expected.getDate() - i);
    if (dias[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function logPomoEntry(type, completed, duration) {
  const log = JSON.parse(localStorage.getItem(POMO_LOG_KEY) || '[]');
  log.unshift({ date: today(), type, completed, duration, completedAt: new Date().toISOString() });
  localStorage.setItem(POMO_LOG_KEY, JSON.stringify(log.slice(0, 200)));
}

function requestNotificationPermission(cb) {
  if (!('Notification' in window)) return cb && cb();
  if (Notification.permission === 'granted') return cb && cb();
  if (Notification.permission === 'denied') return cb && cb();
  Notification.requestPermission().then(() => cb && cb());
}

function sendNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.png' });
}

function pomoSecondsRemaining(session) {
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.max(0, session.totalSeconds - elapsed);
}

function formatPomoTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updatePomoDisplay() {
  const session = getPomoCurrent();
  const timeEl = document.getElementById('pomo-time-display');
  const typeEl = document.getElementById('pomo-type-label');
  if (!timeEl) return;

  if (!session) {
    timeEl.textContent = '25:00';
    timeEl.className = 'pomodoro-time';
    if (typeEl) typeEl.textContent = 'pronto';
    document.getElementById('pomodoro-fab')?.classList.remove('active-session');
    document.body.classList.remove('pomo-running');
    updatePomoBtns(null);
    updatePomoStats();
    return;
  }

  const rem = pomoSecondsRemaining(session);
  timeEl.textContent = formatPomoTime(rem);
  timeEl.className = 'pomodoro-time' + (rem < 60 ? ' warn' : '');
  if (typeEl) {
    const labels = { foco: 'foco 25min', break: 'break 5min', sagrada: 'hora sagrada 30min' };
    typeEl.textContent = labels[session.type] || session.type;
  }
  document.getElementById('pomodoro-fab')?.classList.add('active-session');
  if (session.type === 'foco') document.body.classList.add('pomo-running');

  if (rem <= 0) {
    onPomoComplete(session);
    return;
  }

  pomoRafId = requestAnimationFrame(updatePomoDisplay);
}

function onPomoComplete(session) {
  cancelAnimationFrame(pomoRafId);
  clearPomoCurrent();
  logPomoEntry(session.type, true, session.totalSeconds);
  document.body.classList.remove('pomo-running');
  document.getElementById('pomodoro-fab')?.classList.remove('active-session');

  if (session.type === 'foco') {
    addXpTrilha(20, 'pomodoro foco completo');
    updateStreak('geral');
    sendNotification('Pomodoro completo!', 'Foco de 25min concluido. Tome um break.');
    toast('Pomodoro! +20 XP +1 INT', 'ok');
  } else if (session.type === 'break') {
    sendNotification('Break encerrado!', 'Hora de voltar ao foco.');
    toast('Break encerrado — de volta ao trabalho!');
  } else if (session.type === 'sagrada') {
    completarHoraSagrada();
    return;
  }

  updatePomoDisplay();
  updatePomoStats();
}

function updatePomoBtns(session) {
  const focoBtn = document.getElementById('pomo-btn-foco');
  const breakBtn = document.getElementById('pomo-btn-break');
  const sagradaBtn = document.getElementById('pomo-btn-sagrada');
  if (!focoBtn) return;

  if (session) {
    focoBtn.textContent = '⏹ Parar';
    focoBtn.className = 'pomo-btn running';
    focoBtn.onclick = () => pararPomodoro(session);
    breakBtn.style.display = 'none';
    sagradaBtn.style.display = 'none';
  } else {
    focoBtn.textContent = '▶ Foco 25min';
    focoBtn.className = 'pomo-btn';
    focoBtn.onclick = () => iniciarPomodoro('foco');
    breakBtn.style.display = '';
    sagradaBtn.style.display = '';
  }
}

function updatePomoStats() {
  const el = document.getElementById('pomo-stats');
  if (!el) return;
  const count = getPomoDayCount();
  const streakDias = getPomoStreakDays();
  el.innerHTML = `Hoje: ${count} pomodoro${count !== 1 ? 's' : ''}<br>Streak foco: ${streakDias} dia${streakDias !== 1 ? 's' : ''}`;
}

function iniciarPomodoro(type) {
  const existing = getPomoCurrent();
  if (existing) pararPomodoro(existing);

  const doStart = () => {
    const session = {
      type,
      startedAt: Date.now(),
      totalSeconds: POMO_DURATIONS[type],
    };
    savePomoCurrent(session);
    cancelAnimationFrame(pomoRafId);
    pomoRafId = requestAnimationFrame(updatePomoDisplay);
    updatePomoBtns(session);
  };

  // Pede permissão só na primeira vez que o usuário inicia pomodoro
  if (Notification.permission === 'default') {
    requestNotificationPermission(doStart);
  } else {
    doStart();
  }
}

function pararPomodoro(session) {
  cancelAnimationFrame(pomoRafId);
  logPomoEntry(session?.type || 'foco', false, 0);
  clearPomoCurrent();
  document.body.classList.remove('pomo-running');
  document.getElementById('pomodoro-fab')?.classList.remove('active-session');
  updatePomoDisplay();
  toast('Pomodoro interrompido');
}

function togglePomodoroPanel() {
  const panel = document.getElementById('pomodoro-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    // Retoma display se havia sessão ativa
    const session = getPomoCurrent();
    if (session && !pomoRafId) {
      pomoRafId = requestAnimationFrame(updatePomoDisplay);
    }
    updatePomoStats();
    updatePomoBtns(session);
  }
}

// Fecha painel ao clicar fora
document.addEventListener('click', e => {
  const panel = document.getElementById('pomodoro-panel');
  const fab = document.getElementById('pomodoro-fab');
  if (!panel || !fab) return;
  if (!panel.contains(e.target) && e.target !== fab) {
    panel.classList.remove('open');
  }
});

// ── HORA SAGRADA ──────────────────────────────────────────────────
const HORA_SAGRADA_KEY = 'agh_hora_sagrada';

function getHoraSagrada() {
  const raw = localStorage.getItem(HORA_SAGRADA_KEY);
  return raw ? JSON.parse(raw) : null;
}

function iniciarHoraSagrada() {
  // Fecha painel do pomodoro
  document.getElementById('pomodoro-panel')?.classList.remove('open');
  document.getElementById('standup-overlay')?.classList.remove('open');
  iniciarPomodoro('sagrada');
  showHoraSagradaBanner();
}

function iniciarHoraSagradaFromStandup() {
  closeStandup();
  iniciarHoraSagrada();
}

function showHoraSagradaBanner() {
  const banner = document.getElementById('hora-sagrada-banner');
  if (banner) banner.classList.add('active');
  tickHoraSagradaBanner();
}

function tickHoraSagradaBanner() {
  const session = getPomoCurrent();
  const timerEl = document.getElementById('hora-sagrada-timer');
  if (!timerEl) return;
  if (!session || session.type !== 'sagrada') {
    document.getElementById('hora-sagrada-banner')?.classList.remove('active');
    return;
  }
  const rem = pomoSecondsRemaining(session);
  timerEl.textContent = formatPomoTime(rem);
  if (rem > 0) setTimeout(tickHoraSagradaBanner, 1000);
}

function interromperHoraSagrada() {
  const session = getPomoCurrent();
  if (session && session.type === 'sagrada') {
    const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
    logPomoEntry('sagrada', false, elapsed);
    // Registra como interrompida — honestidade > gamificar batota
    const log = JSON.parse(localStorage.getItem('agh_hora_sagrada_log') || '[]');
    log.unshift({ date: today(), status: 'interrompida', duration: elapsed, completedAt: new Date().toISOString() });
    localStorage.setItem('agh_hora_sagrada_log', JSON.stringify(log.slice(0, 100)));
    clearPomoCurrent();
    cancelAnimationFrame(pomoRafId);
    document.body.classList.remove('pomo-running');
  }
  document.getElementById('hora-sagrada-banner')?.classList.remove('active');
  document.getElementById('pomodoro-fab')?.classList.remove('active-session');
  updatePomoDisplay();
  toast('Hora Sagrada interrompida — registrada sem XP');
}

function completarHoraSagrada() {
  // Registra no log de hora sagrada
  const log = JSON.parse(localStorage.getItem('agh_hora_sagrada_log') || '[]');
  log.unshift({ date: today(), status: 'completa', duration: 1800, completedAt: new Date().toISOString() });
  localStorage.setItem('agh_hora_sagrada_log', JSON.stringify(log.slice(0, 100)));

  updateStreak('semIa');
  updateStreak('geral');

  // +50 XP +5 INT +3 CON (registra no xp trilha local)
  addXpTrilha(50, 'hora sagrada completa');

  document.getElementById('hora-sagrada-banner')?.classList.remove('active');
  document.body.classList.remove('pomo-running');
  document.getElementById('pomodoro-fab')?.classList.remove('active-session');
  sendNotification('Hora Sagrada concluida!', '+50 XP +5 INT +3 CON. Voce no comando.');
  toast('Hora Sagrada completa! +50 XP +5 INT +3 CON', 'ok');
  updatePomoDisplay();
  updatePomoStats();
}

// ── DAILY STANDUP ─────────────────────────────────────────────────
function buildOntemItems(ontemStr) {
  const xpLog = SYNC?.xpLog || [];
  const trilhaLog = JSON.parse(localStorage.getItem('trilhaXpLog') || '[]');
  const ontemXp = xpLog.filter(e => e.date === ontemStr);
  const ontemTrilha = trilhaLog.filter(e => e.date === ontemStr);
  const ontemPomo = JSON.parse(localStorage.getItem(POMO_LOG_KEY) || '[]')
    .filter(e => e.date === ontemStr && e.completed);

  const items = [];
  const commits = ontemXp.filter(e => ['feat','bugfix','deploy'].includes(e.type));
  if (commits.length) items.push({ icon: '⚙', text: `${commits.length} atividade(s) registrada(s)` });

  const leituras = ontemTrilha.filter(e => e.desc?.startsWith('lido'));
  if (leituras.length) items.push({ icon: '📚', text: `${leituras.length} módulo(s) lido(s)` });

  const checkpoints = ontemTrilha.filter(e => e.desc?.startsWith('checkpoint'));
  if (checkpoints.length) items.push({ icon: '🎓', text: `${checkpoints.length} checkpoint(s)` });

  const foco = ontemPomo.filter(e => e.type === 'foco');
  if (foco.length) {
    const mins = foco.reduce((acc, e) => acc + Math.floor(e.duration / 60), 0);
    items.push({ icon: '⏱', text: `${foco.length} pomodoro(s) · ${mins}min de foco` });
  }

  if (!items.length) items.push({ icon: '😴', text: 'Nenhuma atividade registrada ontem' });
  return items;
}

function buildSugestoes(t) {
  const sugs = [];
  if (TRILHA_DATA) {
    const proxModulo = findProxModulo(loadTrilhaProgress());
    if (proxModulo) sugs.push(`Próximo módulo: "${proxModulo}" (trilha de estudo)`);
  }
  const horaSagradaHoje = JSON.parse(localStorage.getItem('agh_hora_sagrada_log') || '[]')
    .some(e => e.date === t);
  if (!horaSagradaHoje) sugs.push('Hora Sagrada 30min (ainda não fez hoje)');
  DB.tasks.filter(k => k.status !== 'done' && k.priority === 'high').slice(0, 2)
    .forEach(tk => sugs.push(`Tarefa alta: "${tk.title}"`));
  return sugs.slice(0, 3);
}

function buildStandupBody() {
  const t = today();
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().slice(0, 10);

  const ontemItems = buildOntemItems(ontemStr);
  const sugestoes = buildSugestoes(t);
  const streaks = getStreaks();
  const sg = streaks.geral    || STREAK_DEFAULTS.geral;
  const se = streaks.estudo   || STREAK_DEFAULTS.estudo;
  const ss = streaks.semIa    || STREAK_DEFAULTS.semIa;
  const sd = streaks.decisoes || STREAK_DEFAULTS.decisoes;

  return `
    <div class="standup-section">
      <div class="standup-section-label">Ontem</div>
      ${ontemItems.map(i => `
        <div class="standup-item">
          <span class="standup-item-icon">${i.icon}</span>
          <span>${esc(i.text)}</span>
        </div>`).join('')}
    </div>
    <div class="standup-section">
      <div class="standup-section-label">Streaks</div>
      <div class="streak-cards">
        ${buildStreakCard('🔥', sg, 'Geral')}
        ${buildStreakCard('📖', se, 'Estudo')}
        ${buildStreakCard('🚫', ss, 'Sem-IA')}
        ${buildStreakCard('✍', sd, 'Decisoes')}
      </div>
    </div>
    ${sugestoes.length ? `
    <div class="standup-section">
      <div class="standup-section-label">Hoje sugiro priorizar</div>
      ${sugestoes.map(s => `
        <div class="standup-suggest">
          <span class="standup-suggest-arrow">▶</span>
          <span>${esc(s)}</span>
        </div>`).join('')}
    </div>` : ''}
  `;
}

function buildStreakCard(icon, streak, label) {
  return `
    <div class="streak-card" title="Recorde: ${streak.recorde} dias">
      <span class="streak-card-icon">${icon}</span>
      <span class="streak-card-val">${streak.atual}</span>
      <span class="streak-card-lbl">${esc(label)}</span>
      <span class="streak-card-rec">rec: ${streak.recorde}</span>
    </div>`;
}

function findProxModulo(progress) {
  if (!TRILHA_DATA) return null;
  for (const trilha of TRILHA_DATA.trilhas) {
    for (const m of trilha.modulos) {
      if (!progress[m.id]) return m.titulo;
    }
  }
  return null;
}

function openStandup() {
  const el = document.getElementById('standup-overlay');
  const dateEl = document.getElementById('standup-date');
  const bodyEl = document.getElementById('standup-body');
  if (!el) return;

  const now = new Date();
  if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (bodyEl) bodyEl.innerHTML = buildStandupBody();
  el.classList.add('open');
}

function closeStandup() {
  document.getElementById('standup-overlay')?.classList.remove('open');
  localStorage.setItem('lastStandupDate', today());
}

function checkStandupOnLoad() {
  const last = localStorage.getItem('lastStandupDate');
  if (last === today()) return; // já mostrou hoje
  // Aguarda TRILHA_DATA carregar para ter sugestões melhores
  setTimeout(openStandup, 600);
}

// ── DAILY REFLECTION ─────────────────────────────────────────────
function openReflectionModal() {
  closeStandup();
  document.getElementById('ref-melhor').value = '';
  document.getElementById('ref-falhou').value = '';
  document.getElementById('reflection-overlay').classList.add('open');
}

function closeReflection() {
  document.getElementById('reflection-overlay').classList.remove('open');
}

function saveReflection() {
  const melhor = document.getElementById('ref-melhor').value.trim();
  const falhou = document.getElementById('ref-falhou').value.trim();
  if (!melhor && !falhou) { toast('Preencha ao menos um campo', 'err'); return; }

  const log = JSON.parse(localStorage.getItem('agh_reflection_log') || '[]');
  log.unshift({ date: today(), melhor, falhou, savedAt: new Date().toISOString() });
  localStorage.setItem('agh_reflection_log', JSON.stringify(log.slice(0, 90)));

  addXpTrilha(30, 'daily reflection');
  updateStreak('geral');
  closeReflection();
  toast('Reflection salvo! +30 XP +2 WIS', 'ok');
}

document.querySelectorAll('.reflection-overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
);

// ── INIT ──────────────────────────────────────────────────────────
(function(){
  // Configura marked.js para renderizar markdown das trilhas
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
  }

  document.getElementById('sb-date').textContent =
    new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  renderDash();
  renderModules();
  loadSync();

  // Retoma pomodoro se estava ativo quando a tab foi fechada
  const existingSession = getPomoCurrent();
  if (existingSession) {
    const rem = pomoSecondsRemaining(existingSession);
    if (rem > 0) {
      pomoRafId = requestAnimationFrame(updatePomoDisplay);
      if (existingSession.type === 'sagrada') showHoraSagradaBanner();
      if (existingSession.type === 'foco') document.body.classList.add('pomo-running');
      document.getElementById('pomodoro-fab')?.classList.add('active-session');
    } else {
      // Sessão terminou enquanto tab estava fechada — registra como completa
      logPomoEntry(existingSession.type, true, existingSession.totalSeconds);
      clearPomoCurrent();
    }
  }

  // Standup: verifica 1s após init para dar tempo ao TRILHA_DATA carregar
  checkStandupOnLoad();
})();
