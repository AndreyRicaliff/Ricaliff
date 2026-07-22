// ── SYNC (gamificação — carregado de /data/sync.json) ─────────────
let SYNC = null;

async function loadSync() {
  try {
    const r = await fetch('/data/sync.json?v=' + Date.now());
    if (!r.ok) return;
    SYNC = await r.json();
    renderGamification();
    if (curView === 'growth') renderGrowth();
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

// Atributos = base do PRODUTOR (sync.json, cresce a cada commit via ag-hub-sync)
// + delta local acumulado (ganhos de UI). O modelo antigo guardava um SNAPSHOT
// absoluto que vencia o sync.json pra sempre, mascarando todo ganho do produtor
// após o 1º ganho local. O delta compõe com a base e sobrevive a novos commits.
function loadAttrDelta()      { return safeParse('agh_attr_delta', {}); }
function saveAttrDelta(delta) { localStorage.setItem('agh_attr_delta', JSON.stringify(delta)); }

// Migração 1×: converte o snapshot absoluto legado (agh_attrs) em delta relativo
// à base atual, preservando o valor exibido na troca de modelo.
function migrateLegacyAttrs(base) {
  const legacy = safeParse('agh_attrs', null);
  if (!legacy || localStorage.getItem('agh_attr_delta') !== null) return;
  const delta = {};
  Object.keys(base).forEach(k => {
    if (legacy[k] !== undefined) delta[k] = legacy[k] - (base[k].value ?? 0);
  });
  saveAttrDelta(delta);
  localStorage.removeItem('agh_attrs');
}

function loadAttrState() {
  if (!SYNC?.player?.attributes) return null;
  const base = JSON.parse(JSON.stringify(SYNC.player.attributes));
  migrateLegacyAttrs(base);
  const delta = loadAttrDelta();
  Object.keys(base).forEach(k => { base[k].value = (base[k].value ?? 0) + (delta[k] ?? 0); });
  return base;
}

// Retorna o build ativo (localStorage sobrepõe sync.json para permitir troca sem editar o arquivo)
function getActiveBuild() {
  const saved = localStorage.getItem('agh_build');
  const builds = SYNC?.player?.availableBuilds ?? [];
  const id = saved ?? SYNC?.player?.build?.id ?? 'backend-mage';
  return builds.find(b => b.id === id) ?? builds[0] ?? { id, label: id, bonus: {}, icon: '⚡' };
}

function addAttribute(attr, rawVal, source) {
  if (!SYNC?.player?.attributes?.[attr]) return;

  const build = getActiveBuild();
  const mult = build?.bonus?.[attr] ?? 1;
  const finalVal = Math.round(rawVal * mult);
  if (!finalVal) return;

  const delta = loadAttrDelta();
  delta[attr] = (delta[attr] ?? 0) + finalVal;
  saveAttrDelta(delta);

  // Log dos últimos 50 eventos
  const log = safeParse('attributeLog', []);
  log.unshift({ attr, val: finalVal, source, date: today() });
  localStorage.setItem('attributeLog', JSON.stringify(log.slice(0, 50)));

  const bonusStr = mult > 1 ? ` (×${mult.toFixed(2)} build)` : '';
  const sinal = finalVal >= 0 ? '+' : '';
  toast(`${sinal}${finalVal} ${attr.toUpperCase()}${bonusStr} — ${source}`);
  renderPlayerCard();
}

// Ganhos de UI (lido/checkpoint) vêm das attributeRules do sync.json — mesma
// tabela que o produtor (ag-hub-sync.ps1) usa pros tipos de commit
// sign=-1 estorna a MESMA tabela de regras que foi creditada (simétrico) —
// o estorno antigo era 'int' hardcoded e recomputava do SYNC no momento da remoção
function applyAttributeRules(type, source, sign = 1) {
  if (!SYNC?.attributeRules) return;
  const rules = SYNC.attributeRules[type] ?? {};
  Object.entries(rules).forEach(([attr, val]) => addAttribute(attr, val * sign, source ?? type));
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
      <div class="player-avatar"><svg class="ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7Z"/></svg></div>
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
        <div class="streak-badge" style="margin-top:6px"><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-1.5.7-3 2-4 .3 1.2 1 2 2 2-1-3 0-5 1-7Z"/></svg> ${p.streak}d</div>
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
      <span class="attr-icon">${deEmoji(a.icon,16)}</span>
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
  const hints  = sorted.slice(0, 2).map(([k, a]) => `${deEmoji(a.icon,13)} ${k.toUpperCase()} ${(a.value ?? 0) + 10}`);

  return `<div class="player-card">
    <div class="player-card-top">
      <div class="player-avatar">${deEmoji(build.icon ?? '⚡',24)}</div>
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
        <div class="streak-badge" style="margin-top:6px"><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-1.5.7-3 2-4 .3 1.2 1 2 2 2-1-3 0-5 1-7Z"/></svg> ${p.streak}d</div>
      </div>
    </div>
    <div class="attr-grid">${attrRows}</div>
    <div class="player-card-footer">
      <div class="player-next-lv">Próximo nível: <span>${hints.join(' ou ')}</span></div>
      <button class="build-badge" onclick="openBuildModal()">
        ${deEmoji(build.icon,16)} ${esc(build.label)} · Trocar Build
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
          <div class="build-icon">${deEmoji(b.icon,20)}</div>
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
  toast(`Build: ${b.label}`);
}

function renderQuests() {
  const active = (SYNC.quests || []).filter(q => q.status !== 'done');
  const done   = (SYNC.quests || []).filter(q => q.status === 'done');
  if (!active.length && !done.length) return;
  document.getElementById('quests-section').style.display = '';
  document.getElementById('quests-list').innerHTML =
    [...active, ...done].map(q => `
      <div class="quest-card ${q.status === 'done' ? 'done' : ''}">
        <div class="quest-icon">${deEmoji(q.icon || '🎯',18)}</div>
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
  // Conquistas de trilha/quest board desbloqueiam no browser (trilhaConquistas);
  // sem distinguir, as travadas apareciam iguais às obtidas
  const locais = safeParse('trilhaConquistas', []);
  document.getElementById('achievements-section').style.display = '';
  document.getElementById('achievements-grid').innerHTML = achs.map(a => {
    const unlocked = !!a.unlockedAt || locais.includes(a.id);
    const dateLbl = a.unlockedAt ? fmtD(a.unlockedAt) : unlocked ? 'desbloqueada' : '<svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/></svg> bloqueada';
    return `
    <div class="achievement-card${unlocked ? '' : ' ach-locked'}">
      <div class="ach-icon">${deEmoji(a.icon,20)}</div>
      <div class="ach-info">
        <div class="ach-name">${esc(a.name)}</div>
        <div class="ach-desc">${esc(a.desc)}</div>
        <div class="ach-date">${dateLbl}</div>
      </div>
    </div>`;
  }).join('');
}

function renderXpLog() {
  const log = (SYNC.recentActivity || []).slice(0, 8);
  if (!log.length) return;
  document.getElementById('xp-log-section').style.display = '';
  document.getElementById('xp-log-list').innerHTML = log.map(e => `
    <div class="xp-entry">
      <div class="xp-entry-icon">${deEmoji(e.icon || '✅',14)}</div>
      <div class="xp-entry-desc">${esc(e.title)}</div>
      <div class="xp-entry-date">${fmtD(e.date)}</div>
      <div class="xp-entry-pts">+${e.xp}</div>
    </div>`).join('');
}

// ── DATA ─────────────────────────────────────────────────────────
// Leitura direta do localStorage (fonte da verdade): um cache em memória
// deixava uma 2ª aba ler stale e regravar por cima, apagando a outra em silêncio.
// Re-parse por acesso é irrelevante nessa escala (dezenas de itens).
const DB = {
  get tasks()    { return safeParse('agh_tasks', []) },
  set tasks(v)   { localStorage.setItem('agh_tasks',    JSON.stringify(v)) },
  get projects() { return safeParse('agh_projects', []) },
  set projects(v){ localStorage.setItem('agh_projects', JSON.stringify(v)) },
  get events()   { return safeParse('agh_events', []) },
  set events(v)  { localStorage.setItem('agh_events',   JSON.stringify(v)) },
  get studies()  { return safeParse('agh_studies', []) },
  set studies(v) { localStorage.setItem('agh_studies',  JSON.stringify(v)) },
};

const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const esc  = s  => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtD = d  => { if(!d) return ''; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}`; };
// Data LOCAL (não UTC): toISOString virava "amanhã" depois das 21h em UTC-3 e corrompia streak/standup
const localISO = d => { const x = d ?? new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const today= ()  => localISO();
const daysAgoISO = n => { const d = new Date(); d.setDate(d.getDate() - n); return localISO(d); };
// Boundary: cor vinda de dado persistido/importado só entra em style se for hex válido
const safeColor = c => /^#[0-9A-Fa-f]{3,8}$/.test(String(c ?? '')) ? c : '#1A7FFF';
// Boundary: URL externa só entra em href se for https
const safeHttpUrl = u => { try { return new URL(u).protocol === 'https:' ? u : null; } catch { return null; } };
// Storage corrompido não pode derrubar o app: parse com fallback (uma chave ruim ≠ tela morta)
const safeParse = (key, fb) => {
  try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fb; }
  catch { console.warn('[storage] chave corrompida, usando fallback:', key); return fb; }
};

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

// ── P3 THEME (persona ↔ pro — espelho do ThemeMode.qml / Win+T do rice) ──
const P3_THEME_KEY = 'p3_theme';
function p3Theme() { return localStorage.getItem(P3_THEME_KEY) === 'pro' ? 'pro' : 'persona'; }
function p3ThemeApply() {
  const mode = p3Theme();
  document.documentElement.dataset.theme = mode;
  const img = document.getElementById('sb-mark-img');
  if (img) img.src = mode === 'pro' ? 'assets/start_neutral.png' : 'assets/jackfrost.png';
  const st = document.getElementById('p3-theme-state');
  if (st) st.textContent = mode;
}
function p3ThemeUiToggle() {
  localStorage.setItem(P3_THEME_KEY, p3Theme() === 'pro' ? 'persona' : 'pro');
  p3ThemeApply();
  p3Sfx();
}
function p3JackPoke() {
  const el = document.querySelector('.sb-mark');
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  p3Sfx();
}
document.addEventListener('keydown', e => {
  if (e.key !== 't' && e.key !== 'T') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest('input,textarea,select,[contenteditable]')) return;
  p3ThemeUiToggle();
});
document.addEventListener('DOMContentLoaded', p3ThemeApply);

// ── NAV ───────────────────────────────────────────────────────────
let curView = 'dash';
let p3WipeBusy = false;
const P3_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

function go(view) {
  p3Sfx();
  const wipe = document.getElementById('p3-wipe');
  if (view === curView || P3_REDUCED.matches || p3WipeBusy || !wipe) {
    activateView(view);
    return;
  }
  p3WipeBusy = true;
  wipe.classList.add('run');
  setTimeout(() => activateView(view), 350); // troca no pico do wipe (48% de 720ms)
  setTimeout(() => { wipe.classList.remove('run'); p3WipeBusy = false; }, 740);
}

function activateView(view) {
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
  if (view==='revisar')      renderRevisar();
}

// ── TOAST ─────────────────────────────────────────────────────────
// Fila: chamadas em sequência (conquista + XP + atributo) sobrescreviam a anterior.
// Cap + dedup para rajada de gamificação não represar a tela por minutos; itens
// drenam mais rápido quando há backlog. Erro nunca é descartado pelo cap.
const _toastQueue = [];
let _toastShowing = false;
const TOAST_CAP = 5;
function toast(msg, type='ok') {
  const last = _toastQueue[_toastQueue.length - 1];
  if (last && last.msg === msg && last.type === type) return; // dedup consecutivo
  if (_toastQueue.length >= TOAST_CAP) {
    const i = _toastQueue.findIndex(t => t.type !== 'err');
    _toastQueue.splice(i >= 0 ? i : 0, 1); // descarta o 'ok' mais antigo, preserva erros
  }
  _toastQueue.push({ msg, type });
  if (!_toastShowing) _toastNext();
}
function _toastNext() {
  const item = _toastQueue.shift();
  const el = document.getElementById('toast');
  if (!item || !el) { _toastShowing = false; return; }
  _toastShowing = true;
  el.textContent = (item.type==='ok'?'✓  ':'✕  ') + item.msg;
  el.className = 'toast '+item.type+' show';
  const dur = _toastQueue.length ? 1100 : 2200; // com backlog, drena rápido
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(_toastNext, 180);
  }, dur);
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
      fill="${color}" font-family="Montserrat,system-ui,sans-serif">${pct}%</text>
  </svg>`;
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function renderDash() {
  if (typeof srsAtualizarDash === 'function') srsAtualizarDash();
  const now   = new Date();
  const hr    = now.getHours();
  const greet = hr<6?'Boa madrugada, ':hr<12?'Bom dia, ':hr<18?'Boa tarde, ':'Boa noite, ';

  document.querySelector('.dash-greeting').innerHTML =
    `${greet}<span id="greet-name">Ricaliff</span> <svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12V7a1.5 1.5 0 0 1 3 0M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 11V6.5a1.5 1.5 0 0 1 3 0V12M15 9.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.6 1.6 0 0 1 2.7-1.6L9 14"/></svg>`;
  document.getElementById('greet-sub').textContent =
    now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  updateTasksBadge();

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
    focusEl.innerHTML='<div class="empty-s" style="color:var(--muted);font-size:.78rem;padding:8px 0">Nenhuma tarefa pendente <svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l5-13 8 8Z"/><path d="M9 7l1 2M14 4c1 1 1 2 0 3M18 8c1 0 2 .5 2 2M17 13h.01M20 15h.01"/></svg></div>';
  } else {
    focusEl.innerHTML = focus.map(tk=>`
      <div class="focus-item" onclick="openTaskModal('${tk.id}')">
        <div class="fcheck ${tk.status==='done'?'done':''}" onclick="toggleT(event,'${tk.id}')">
          ${tk.status==='done'?'<svg width="8" height="8" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''}
        </div>
        <div>
          <div class="focus-text ${tk.status==='done'?'done-text':''}">${esc(tk.title)}</div>
          <div class="focus-meta">
            ${tk.due?`${tk.due<t?'<svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l9 16H3Z"/><path d="M12 10v4M12 17h.01"/></svg> ':''}`+fmtD(tk.due):''}
            ${tk.priority==='high'?' · <svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/></svg> Alta':''}
          </div>
        </div>
      </div>`).join('');
  }

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

  renderWeeklyDigest();
}

// ── PROJECTS ──────────────────────────────────────────────────────
function renderProjects() {
  const projs = DB.projects;
  const tasks = DB.tasks;
  const grid  = document.getElementById('proj-grid');

  if(!projs.length) {
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-i"><svg class="ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 9-9 9-9-9Z"/></svg></div>
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
    const pc   = safeColor(p.color);
    const gh   = safeHttpUrl(p.githubUrl);
    return `
    <div class="proj-card" onclick="openProjModal('${p.id}')">
      <div class="proj-cover" style="background:linear-gradient(135deg,${pc}55 0%,${pc}15 100%)">
        <div class="proj-cover-blur" style="background:${pc}"></div>
        <div class="proj-status-badge ${sl[p.status]}">${sl2[p.status]}</div>
      </div>
      <div class="proj-body">
        <div class="proj-name">${esc(p.name)}</div>
        ${p.description?`<div class="proj-desc">${esc(p.description)}</div>`:''}
        ${gh ? `<a class="proj-github" href="${esc(gh)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>${p.isPrivate ? '<svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/></svg> ' : ''}GitHub</a>` : ''}
        ${(()=>{const imp=p.improvements?.filter(Boolean)||[];return imp.length?`<div class="proj-improvements"><span><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7Z"/></svg> ${imp.length} melhoria${imp.length!==1?'s':''} identificada${imp.length!==1?'s':''}</span></div>`:''})()}
        <div class="proj-footer">
          <div>
            <div class="proj-prog-text">${pt.length} tarefa${pt.length!==1?'s':''} · ${(()=>{const d=projStaleDays(p.id);return d===null?'':d>14?`<span style="color:var(--warn)">sem atividade há ${d}d</span>`:d>7?`<span style="color:var(--muted)">${d}d atrás</span>`:''})()}</div>
            <div class="proj-prog-val" style="color:${pc}">${pct}%</div>
          </div>
          ${ring(pct,pc,48)}
        </div>
        <div class="prog-bar-thin" style="margin-top:10px">
          <div class="prog-fill-thin" style="width:${pct}%;background:${pc}"></div>
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
    status:document.getElementById('fp-status').value, color:safeColor(c),
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

// Badge da sidebar era atualizado só dentro de renderTasks — no boot ficava no "0"
// estático do HTML até a primeira navegação
function updateTasksBadge() {
  const el = document.getElementById('tasks-badge');
  if (el) el.textContent = DB.tasks.filter(x => x.status !== 'done').length;
}

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

  updateTasksBadge();
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
      <div class="empty-i"><svg class="ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg></div>
      <div class="empty-t">${taskFilter==='done'?'Nenhuma concluída':'Nenhuma tarefa aqui'}</div>
      <div class="empty-s">${taskFilter==='all'?'Clique em "Nova Tarefa" para começar':'Tente outro filtro'}</div>
    </div>`;
    return;
  }

  el.innerHTML=list.map(tk=>{
    const proj=projs.find(p=>p.id===tk.projectId);
    const projColor=proj?safeColor(proj.color):'';
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
          ${proj?`<span class="tag tg-proj" style="background:${projColor}22;color:${projColor}">${esc(proj.name)}</span>`:''}
          ${tk.due?`<span class="tdue ${isOver?'over':''}">${isOver?'<svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l9 16H3Z"/><path d="M12 10v4M12 17h.01"/></svg> ':''}${fmtD(tk.due)}</span>`:''}
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
  { title:'Aplicar /revisao num projeto real',       sub:'Rode /revisao no PULSAR-RH ou Cliente Varejo e corrija os achados <svg class="ico" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/></svg>. Aprendizado de clean code fixado em código que você conhece.' },
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

let STUDY_MATERIAL = {};
async function loadStudyMaterial() {
  try {
    const r = await fetch('data/study-material.json');
    if (!r.ok) throw new Error(`${r.status}`);
    STUDY_MATERIAL = await r.json();
    if (curView === 'growth') renderModules();
  } catch (e) {
    console.warn('study material indisponível (render usa fallback):', e.message);
  }
}

function getModProgress()        { return safeParse('agh_modules', {}); }
function saveModProgress(data)   { localStorage.setItem('agh_modules', JSON.stringify(data)); }
function topicStatus(p, mid, tid){ return p[mid]?.[tid] ?? 'pending'; }
// Buffer de anotações pendentes: um único timer cancelava a gravação de OUTRO
// tópico (clearTimeout global) — o texto do tópico anterior sumia. Aqui as notas
// pendentes acumulam num buffer e são gravadas juntas; getTopicNote lê o buffer
// primeiro para o re-render não redesenhar valor velho por cima do em-voo.
const _pendingNotes = {};
let _noteTimer = null;
function getTopicNote(key) {
  return key in _pendingNotes ? _pendingNotes[key] : (safeParse('agh_topic_notes', {})[key] ?? '');
}
function flushNotes() {
  const keys = Object.keys(_pendingNotes);
  if (!keys.length) return;
  const notes = safeParse('agh_topic_notes', {});
  keys.forEach(k => { notes[k] = _pendingNotes[k]; delete _pendingNotes[k]; });
  localStorage.setItem('agh_topic_notes', JSON.stringify(notes));
}
function saveTopicNote(key, val) {
  _pendingNotes[key] = val;
  clearTimeout(_noteTimer);
  _noteTimer = setTimeout(flushNotes, 400);
}
window.addEventListener('pagehide', flushNotes);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushNotes(); });

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
    <span class="topic-status-icon" style="color:${STATUS_CLR[s]};cursor:pointer;margin-right:4px" onclick="toggleTopic('${modId}','${t.id}')">${deEmoji(STATUS_ICON[s],13)}</span>
    <span class="topic-name ${s === 'mastered' ? 'topic-done' : ''}" style="flex:1;cursor:pointer" onclick="toggleTopicExpand('${modId}','${t.id}')">${esc(t.title || t.id)}</span>
    ${isOpen ? '<span style="color:var(--muted);font-size:.65rem"><svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></span>' : '<span style="color:var(--muted);font-size:.65rem"><svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span>'}
    <div class="topic-material ${isOpen ? 'open' : ''}" id="material-${key}">
      ${renderTopicMaterial(modId, t)}
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
      { id: 'const-arrow',  title: 'const & arrow functions' },
      { id: 'async-await',  title: 'async/await e Promises' },
      { id: 'array-methods',title: 'map, filter, reduce' },
      { id: 'optional-ops', title: 'Optional chaining (?.) e nullish (??)' },
      { id: 'fetch-api',    title: 'fetch API e JSON' },
      { id: 'dom-events',   title: 'DOM e eventos' },
    ],
  },
  {
    id: 'ts', title: 'TypeScript', desc: 'Tipagem para evitar bugs em runtime',
    topics: [
      { id: 'basic-types',  title: 'Tipos básicos e inferência' },
      { id: 'strict-no-any',title: 'strict mode — proibido any' },
      { id: 'utility-types',title: 'Utility types (Partial, Pick, Omit)' },
      { id: 'generics',     title: 'Generics' },
      { id: 'discriminated',title: 'Discriminated unions' },
    ],
  },
  {
    id: 'supabase', title: 'Supabase', desc: 'Backend de PULSAR-RH, OFICINA, Varejo',
    topics: [
      { id: 'crud',      title: 'CRUD com supabase-js' },
      { id: 'auth',      title: 'Auth — login, sessão, perfis' },
      { id: 'rls',       title: 'Row Level Security' },
      { id: 'realtime',  title: 'Realtime subscriptions' },
      { id: 'migrations',title: 'Migrations' },
      { id: 'types-gen', title: 'Geração de types do schema' },
    ],
  },
  {
    id: 'html-css', title: 'HTML + CSS + Vanilla JS', desc: 'Stack do ag-hub, Café com AG',
    topics: [
      { id: 'semantics',   title: 'HTML semântico' },
      { id: 'layout',      title: 'Flexbox e Grid' },
      { id: 'css-vars',    title: 'CSS custom properties' },
      { id: 'spa-vanilla', title: 'SPA vanilla — views e estado' },
      { id: 'localstorage',title: 'localStorage como storage' },
      { id: 'responsive',  title: 'Design responsivo' },
    ],
  },
  {
    id: 'git-deploy', title: 'Git + Deploy', desc: 'Controle de versão e entrega',
    topics: [
      { id: 'git-core',     title: 'Git core — commit, branch, merge' },
      { id: 'conv-commits', title: 'Conventional commits' },
      { id: 'gitignore-env',title: '.gitignore e .env' },
      { id: 'vercel',       title: 'Deploy na Vercel' },
      { id: 'ci-cd',        title: 'CI/CD básico' },
    ],
  },
  {
    id: 'node-api', title: 'Node.js + Express', desc: 'Backend das APIs AG',
    topics: [
      { id: 'express-basics',   title: 'Express — rotas e middleware' },
      { id: 'env-validation',   title: 'Validação de env na boundary' },
      { id: 'error-handling',   title: 'Tratamento de erros' },
      { id: 'async-node',       title: 'Async em Node — event loop' },
      { id: 'graceful-shutdown',title: 'Graceful shutdown' },
    ],
  },
  {
    id: 'clean-code', title: 'Clean Code', desc: 'Princípios aplicados em toda sessão',
    topics: [
      { id: 'srp',         title: 'Single Responsibility' },
      { id: 'dry-kiss',    title: 'DRY, KISS, YAGNI' },
      { id: 'early-return',title: 'Early return' },
      { id: 'naming',      title: 'Nomes que explicam' },
      { id: 'code-smells', title: 'Code smells' },
      { id: 'testing',     title: 'Testes — pirâmide e unidade' },
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
  const sessions = safeParse('agh_sessions', []);
  const totalSess = sessions.length;
  const waStr = daysAgoISO(7);
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
    sl.innerHTML = `<div class="empty"><div class="empty-i"><svg class="ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9Z"/><path d="M9 11h6M9 15h4"/></svg></div><div class="empty-t">Nenhuma sessão registrada</div><div class="empty-s">Clique em "Registrar Sessão" após cada trabalho com Claude</div></div>`;
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
    const s = safeParse('agh_sessions', []).find(x=>x.id===id);
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
  const sessions = safeParse('agh_sessions', []);
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
  const sessions=safeParse('agh_sessions', []).filter(s=>s.id!==id);
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
// v2: TODAS as chaves de dados do app — o v1 exportava 5 de ~22 e restaurar
// perdia trilha, streaks, conquistas, anotações e atributos.
const BACKUP_PREFIXES = ['agh_', 'trilha', 'questBoard', 'attributeLog', 'lastStandupDate', 'p3_'];
// Estado transitório de sessão — NÃO entra no backup: um pomodoro em andamento
// exportado vira, no reload pós-import, um pomodoro "concluído" fabricado.
const BACKUP_EXCLUDE = new Set(['agh_pomo_session']);
function backupKeys() {
  return Object.keys(localStorage)
    .filter(k => BACKUP_PREFIXES.some(p => k.startsWith(p)) && !BACKUP_EXCLUDE.has(k));
}

function exportData() {
  const data = { version: 2, exportedAt: new Date().toISOString(), keys: {} };
  backupKeys().forEach(k => { data.keys[k] = localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ricaliff-backup-${today()}.json`;
  a.click();
  toast(`Backup exportado (${Object.keys(data.keys).length} chaves)`);
}

function aplicarBackup(data) {
  if (data.version === 2) {
    // Valida ANTES de apagar: um arquivo v2 vazio/corrompido não pode destruir tudo
    const entries = data.keys && typeof data.keys === 'object' ? Object.entries(data.keys) : [];
    const valid = entries.filter(([, v]) => typeof v === 'string');
    if (!valid.length) throw new Error('backup v2 sem chaves válidas');
    backupKeys().forEach(k => localStorage.removeItem(k));
    valid.forEach(([k, v]) => { if (!BACKUP_EXCLUDE.has(k)) localStorage.setItem(k, v); });
  } else if (data.projects && data.tasks) {
    // Formato v1 (5 chaves) — aceito para backups antigos
    DB.projects = data.projects;
    DB.tasks    = data.tasks;
    DB.events   = data.events || [];
    if (data.sessions) localStorage.setItem('agh_sessions', JSON.stringify(data.sessions));
    if (data.studies)  DB.studies = data.studies;
    // Marca como seed atual: restaurar um dataset completo NÃO deve re-mergear o
    // seed e ressuscitar itens que o usuário apagou antes de exportar.
    localStorage.setItem('agh_seed_v', '8');
  } else {
    throw new Error('estrutura de backup desconhecida');
  }
  // Boundary: backup é input externo — sanitizar campos que entram em style/href
  const projs = safeParse('agh_projects', []);
  projs.forEach(p => { p.color = safeColor(p.color); p.githubUrl = safeHttpUrl(p.githubUrl); });
  localStorage.setItem('agh_projects', JSON.stringify(projs));
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
        if (!confirm(`Importar backup de ${data.exportedAt?.slice(0,10) || '?'}?\nIsso substituirá todos os dados atuais.`)) return;
        aplicarBackup(data);
        toast('Dados restaurados — recarregando');
        setTimeout(() => location.reload(), 600);
      } catch (err) {
        console.warn('[backup] import falhou:', err);
        toast(`Erro ao importar: ${err.message}`, 'err');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function renderWeeklyDigest() {
  const el=document.getElementById('weekly-digest');
  if(!el) return;
  const waStr=daysAgoISO(7);
  const t=today();
  const doneThisWeek=DB.tasks.filter(k=>k.status==='done'&&(k.updatedAt||'').slice(0,10)>=waStr).length;
  const sessThisWeek=safeParse('agh_sessions', []).filter(s=>s.date>=waStr).length;
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
  const waStr=daysAgoISO(7);
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
  return safeParse('trilhaProgress', {});
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
  // badgeLabel carrega SVG próprio — NÃO passa por esc() (viraria texto visível)
  const badgeLabel = trilha.prioridade === 'maxima' ? icon('zap', 13) + ' máxima' : trilha.prioridade;
  const pcSt = loadProjetoState()[trilha.id];
  const formada = pcSt?.status === 'aceito' && total > 0 && checkpoints === total;
  const formadaBadge = formada
    ? `<span class="trilha-badge pc-formada">${icon('grad-cap', 13)} FORMADA</span>`
    : pcSt?.status === 'aceito' ? `<span class="trilha-badge pc-aceito-mini">${icon('grad-cap', 12)} projeto ok</span>` : '';

  return `
    <div class="trilha-card" onclick="renderTrilhaModulos('${trilha.id}')"
      style="border-top:3px solid ${corBorda}">
      <div class="trilha-card-icon">${deEmoji(trilha.icone,22)}</div>
      <div class="trilha-card-nome">${esc(trilha.nome)}</div>
      <div class="trilha-card-foco">${esc(trilha.foco)}</div>
      <span class="trilha-badge ${badgeClass}">${badgeLabel}</span>${formadaBadge}
      <div class="trilha-progress-bar">
        <div class="trilha-progress-fill" style="width:${percentual}%"></div>
      </div>
      <div class="trilha-progress-text">
        <span>${lidos}/${total} lidos · ${checkpoints} checkpoint${checkpoints!==1?'s':''}</span>
        <span>${trilha.horas ? `~${trilha.horas}h · ` : ''}${percentual}%</span>
      </div>
    </div>`;
}

async function renderTrilha() {
  await loadProjetosConclusao();
  const data = await loadTrilhaIndex();
  if (!data) {
    document.getElementById('trilha-body').innerHTML =
      '<div class="empty"><div class="empty-i"><svg class="ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4v16H5ZM11 4h4v16h-4Z"/><path d="M17 5l3 .5-2.5 15L14.5 20"/></svg></div><div class="empty-t">Erro ao carregar trilhas</div><div class="empty-s">Verifique se data/trilha-index.json existe</div></div>';
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
    return `${iconG(trilha.icone, cx, cy, 20, "var(--muted)")}`;
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
        ? `<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="9" fill="white" font-weight="700" font-family="Montserrat,system-ui,sans-serif">✓</text>`
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

  return { svg: [...prereqLines, ...seqLines, ...headers, ...nodes].join('\n'), W, H };
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
    if (st === 'checkpoint') return '<div class="trilha-status trilha-status-checkpoint"><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg></div>';
    if (st === 'lido')       return '<div class="trilha-status trilha-status-lido"><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14Z" fill="currentColor" stroke="none"/></svg></div>';
    return '<div class="trilha-status"><svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg></div>';
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
        <span style="font-size:1.4rem">${deEmoji(trilha.icone,22)}</span>
        <div class="trilha-modulos-titulo">${esc(trilha.nome)}</div>
        <span style="font-size:.75rem;color:var(--muted)">${trilha.foco}</span>
        ${trilha.horas ? `<span class="trilha-horas">${icon('timer',12)} ~${trilha.horas}h</span>` : ''}
        <button class="btn btn-ghost btn-sm" style="margin-left:auto"
          onclick="renderSyllabus('${trilhaId}')">${icon('book-open',13)} Syllabus</button>
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
    </div>`).join('') + buildProjetoConclusao(trilhaId);
}

async function renderSyllabus(trilhaId) {
  const trilha = TRILHA_DATA?.trilhas?.find(t => t.id === trilhaId);
  if (!trilha) return;
  document.getElementById('trilha-header').innerHTML = `
    <div style="width:100%">
      <button class="trilha-back-btn" onclick="renderTrilhaModulos('${trilhaId}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Voltar à trilha
      </button>
      <div class="trilha-modulos-header">
        ${icon('book-open',20)}
        <div class="trilha-modulos-titulo">Syllabus — ${esc(trilha.nome)}</div>
      </div>
    </div>`;
  const body = document.getElementById('trilha-body');
  body.innerHTML = '<div style="color:var(--muted);text-align:center;padding:40px">Carregando…</div>';
  try {
    const r = await fetch(`/trilha/${trilhaId}/SYLLABUS.md?v=` + Date.now());
    if (!r.ok) throw new Error(r.status);
    const md = await r.text();
    body.innerHTML = `<div id="trilha-md-content">${window.DOMPurify
      ? DOMPurify.sanitize(marked.parse(md))
      : `<pre style="white-space:pre-wrap">${esc(md)}</pre>`}</div>`;
  } catch (e) {
    body.innerHTML = `<div class="empty"><div class="empty-t">Syllabus ainda não escrito</div>
      <div class="empty-s">Esta disciplina ainda não tem o plano de aprofundamento (trilha/${esc(trilhaId)}/SYLLABUS.md).</div></div>`;
  }
}

// ── PROJETO DE CONCLUSÃO (a trilha só está FORMADA com checkpoints + projeto aceito) ──
let PROJETOS_CONCLUSAO = null;
async function loadProjetosConclusao() {
  if (PROJETOS_CONCLUSAO) return;
  try {
    const r = await fetch('/data/projetos-conclusao.json?v=' + Date.now());
    if (r.ok) { PROJETOS_CONCLUSAO = (await r.json()).projetos || {}; }
  } catch (e) { console.warn('[projeto] falha ao carregar projetos-conclusao.json:', e); }
}
const loadProjetoState = () => safeParse('agh_projetos_trilha', {});

function buildProjetoConclusao(trilhaId) {
  const p = PROJETOS_CONCLUSAO?.[trilhaId];
  if (!p) return '';
  const st = loadProjetoState()[trilhaId];
  const status = st?.status; // undefined | 'entregue' | 'aceito'
  const badge = status === 'aceito'
    ? `<span class="pc-badge pc-aceito">${icon('grad-cap',13)} aceito</span>`
    : status === 'entregue'
      ? '<span class="pc-badge pc-entregue">entregue — aguarda revisão</span>'
      : '<span class="pc-badge">pendente</span>';
  return `
    <div class="pc-card">
      <div class="pc-head">
        <div class="pc-ico">${icon('grad-cap',20)}</div>
        <div style="flex:1">
          <div class="pc-titulo">Projeto de conclusão: ${esc(p.titulo)}</div>
          <div class="pc-missao">${esc(p.missao)}</div>
        </div>
        ${badge}
      </div>
      <div class="pc-rubrica">${p.rubrica.map(r => `<div class="pc-rub-item">${icon('check',12)} ${esc(r)}</div>`).join('')}</div>
      <div class="pc-evid">
        <input id="pc-evid-${trilhaId}" type="text" placeholder="Evidência: ${esc(p.evidencia)}"
          value="${esc(st?.evidencia || '')}" ${status === 'aceito' ? 'disabled' : ''}>
        ${status === 'aceito' ? '' : status === 'entregue'
          ? `<button class="btn btn-primary btn-sm" onclick="pcAceitar('${trilhaId}')">Marcar aceito (revisão aprovou)</button>`
          : `<button class="btn btn-primary btn-sm" onclick="pcEntregar('${trilhaId}')">Marcar entregue</button>`}
      </div>
      <div class="pc-nota">Aceite honesto: rode a /revisao no projeto e só marque aceito com a rubrica aprovada lá. Formar-se no fácil é se enganar no caro.</div>
    </div>`;
}

function pcEntregar(trilhaId) {
  const evid = document.getElementById('pc-evid-' + trilhaId)?.value.trim();
  if (!evid) { toast('Cole a evidência (commit/PR/link) antes de entregar', 'err'); return; }
  const all = loadProjetoState();
  all[trilhaId] = { status: 'entregue', evidencia: evid, data: today() };
  localStorage.setItem('agh_projetos_trilha', JSON.stringify(all));
  toast('Projeto entregue — agora a /revisao decide');
  renderTrilhaModulos(trilhaId);
}

function pcAceitar(trilhaId) {
  if (!confirm('A /revisao aprovou a rubrica? Aceite sem revisão é auto-engano.')) return;
  const all = loadProjetoState();
  if (!all[trilhaId]) return;
  all[trilhaId].status = 'aceito';
  all[trilhaId].aceitoEm = today();
  localStorage.setItem('agh_projetos_trilha', JSON.stringify(all));
  addXpTrilha(50, 'projeto de conclusão aceito: ' + trilhaId);
  applyAttributeRules('checkpoint', 'projeto de conclusão: ' + trilhaId);
  toast('Projeto aceito — trilha a caminho de FORMADA');
  renderTrilhaModulos(trilhaId);
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
    // marked@9 não sanitiza HTML cru — DOMPurify no sink; sem a lib, degrada pra texto escapado (fail-closed)
    const html = window.DOMPurify
      ? DOMPurify.sanitize(marked.parse(md))
      : `<pre style="white-space:pre-wrap">${esc(md)}</pre>`;
    document.getElementById('trilha-md-content').innerHTML = html;
  } catch(e) {
    console.warn('[trilha] falha ao carregar módulo:', modulo.caminho, e);
    document.getElementById('trilha-md-content').innerHTML =
      `<div style="color:var(--muted);text-align:center;padding:40px">
        Falha ao carregar o módulo (${esc(e.message)}): ${esc(modulo.caminho)}
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
  applyAttributeRules('lido', 'leitura: ' + (moduloNome(moduloId) || moduloId));
}

function marcarCheckpoint(moduloId) {
  const progress = loadTrilhaProgress();
  const atual = progress[moduloId];
  const nome = moduloNome(moduloId) || moduloId;
  if (atual === 'checkpoint') {
    progress[moduloId] = 'lido';
    saveTrilhaProgress(progress);
    toast('Checkpoint removido');
    // Estorno simétrico (XP + toda a tabela attributeRules.checkpoint + contador) — sem ele, toggle repetido farmava
    addXpTrilha(-40, 'checkpoint removido: ' + nome);
    applyAttributeRules('checkpoint', 'checkpoint removido: ' + nome, -1);
    const n = parseInt(sessionStorage.getItem('trilhaCheckpointsHoje') || '0');
    if (n > 0) sessionStorage.setItem('trilhaCheckpointsHoje', String(n - 1));
  } else {
    const eraLido = atual === 'lido';
    progress[moduloId] = 'checkpoint';
    saveTrilhaProgress(progress);
    addXpTrilha(40, 'checkpoint: ' + nome);
    if (!eraLido) addXpTrilha(20, 'lido: ' + nome);
    applyAttributeRules('checkpoint', 'checkpoint: ' + nome);
    verificarConquistasTrilha(progress);
  }
  // Atualiza UI no contexto atual sem recarregar tudo
  updateCheckpointBtn(moduloId);
  // Atualiza botão E ícone de status na lista de módulos se estiver visível
  const ckBtns = document.querySelectorAll(`[onclick*="marcarCheckpoint('${moduloId}')"]`);
  const isNowCheck = progress[moduloId] === 'checkpoint';
  ckBtns.forEach(btn => {
    btn.className = btn.className.replace(
      /trilha-checkpoint-btn-(on|off)/,
      isNowCheck ? 'trilha-checkpoint-btn-on' : 'trilha-checkpoint-btn-off'
    );
    btn.textContent = isNowCheck ? '✓ Checkpoint' : '+ Checkpoint';
    const st = btn.closest('.trilha-modulo-item')?.querySelector('.trilha-status');
    if (st) {
      st.className = 'trilha-status ' + (isNowCheck ? 'trilha-status-checkpoint' : 'trilha-status-lido');
      st.innerHTML = isNowCheck ? icon('check', 13) : icon('half-circle', 13);
    }
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
  if (!xp) return; // negativo É registrado: estorno de checkpoint precisa aparecer no log
  // Registra no localStorage para histórico local
  const log = safeParse('trilhaXpLog', []);
  log.unshift({ date: today(), xp, desc });
  localStorage.setItem('trilhaXpLog', JSON.stringify(log.slice(0, 50)));
}

function verificarConquistasTrilha(progress) {
  const desbloqueadas = safeParse('trilhaConquistas', []);

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
    toast('Conquista: Primeira Trilha!', 'ok');
  }

  // trilha-diferencial: todos os módulos de 95-diferencial com checkpoint
  const diferencial = TRILHA_DATA.trilhas.find(t => t.id === '95-diferencial');
  if (diferencial && diferencial.modulos.every(m => progress[m.id] === 'checkpoint')) {
    if (desbloquear('trilha-diferencial')) {
      toast('Conquista: Diferencial Dominado!', 'ok');
    }
  }

  // trilha-maratonista: 10 checkpoints na mesma sessão (não há timestamp por módulo)
  const sessaoCheckpoints = parseInt(sessionStorage.getItem('trilhaCheckpointsHoje') || '0') + 1;
  sessionStorage.setItem('trilhaCheckpointsHoje', String(sessaoCheckpoints));
  if (sessaoCheckpoints >= 10 && desbloquear('trilha-maratonista')) {
    toast('Conquista: Maratonista!', 'ok');
  }

  // trilha-portfolio: todas as trilhas de prioridade alta com checkpoint completo
  // (derivado do trilha-index.json — a lista hardcoded já tinha drifted dos dados)
  const trilhasAlta = TRILHA_DATA.trilhas.filter(t => t.prioridade === 'alta').map(t => t.id);
  const todasAlta = trilhasAlta.every(tid => {
    const t = TRILHA_DATA.trilhas.find(x => x.id === tid);
    return t && t.modulos.every(m => progress[m.id] === 'checkpoint');
  });
  if (todasAlta && desbloquear('trilha-portfolio')) {
    toast('Conquista: Portfólio Defensável!', 'ok');
  }
}

// ── QUEST BOARD ───────────────────────────────────────────────────

let QUEST_BOARD_DATA = null;

function loadQuestBoardProgress() {
  return safeParse('questBoardProgress', {});
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
      <div class="qb-proj-icon">${deEmoji(proj.icone,20)}</div>
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
      '<div class="empty"><div class="empty-i"><svg class="ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg></div><div class="empty-t">Erro ao carregar Quest Board</div><div class="empty-s">Verifique se data/quest-board.json existe</div></div>';
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
  toast(`Side quest concluída! +${xpTotal} XP (${projNome})`, 'ok');

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
  toast(`Bounty coletada! +${xp} XP (${projNome})`, 'ok'); // toast usa textContent — sem esc()

  renderQuestBoard();
}

function verificarConquistaQuestBoard(projetoId, progress) {
  const conquistas = safeParse('trilhaConquistas', []);

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
      toast(`Side quest do ${proj.nome} cumprida! +${xpBonus} XP cruzado.`, 'ok');
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
  return { ...JSON.parse(JSON.stringify(STREAK_DEFAULTS)), ...safeParse('agh_streaks', {}) };
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
  const ontemStr = daysAgoISO(1);

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

// Timer em duas camadas: tick de display (só com aba visível) + deadline absoluto.
// rAF morria em aba oculta e a conclusão — notificação/XP, o caso de uso central
// de um timer de 25min — nunca disparava até o usuário voltar.
let pomoTickId = null;
let pomoDeadlineId = null;

function pomoStopTimers() {
  clearTimeout(pomoTickId); pomoTickId = null;
  clearTimeout(pomoDeadlineId); pomoDeadlineId = null;
}

function pomoClearVisuals() {
  document.body.classList.remove('pomo-running');
  document.getElementById('pomodoro-fab')?.classList.remove('active-session');
}

function pomoArmDeadline(session) {
  clearTimeout(pomoDeadlineId);
  // setTimeout sofre throttle em background mas DISPARA (rAF não)
  pomoDeadlineId = setTimeout(updatePomoDisplay, pomoSecondsRemaining(session) * 1000 + 50);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && getPomoCurrent()) updatePomoDisplay();
});

function getPomoCurrent() {
  return safeParse(POMO_KEY, null);
}

function savePomoCurrent(data) {
  localStorage.setItem(POMO_KEY, JSON.stringify(data));
}

function clearPomoCurrent() {
  localStorage.removeItem(POMO_KEY);
}

function getPomoDayCount() {
  const t = today();
  const log = safeParse(POMO_LOG_KEY, []);
  return log.filter(e => e.date === t && e.type === 'foco' && e.completed).length;
}

function getPomoStreakDays() {
  const log = safeParse(POMO_LOG_KEY, []);
  const dias = [...new Set(log.filter(e => e.completed && e.type === 'foco').map(e => e.date))].sort().reverse();
  if (!dias.length) return 0;
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < dias.length; i++) {
    const expected = new Date(now);
    expected.setDate(expected.getDate() - i);
    if (dias[i] === localISO(expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function logPomoEntry(type, completed, duration) {
  const log = safeParse(POMO_LOG_KEY, []);
  log.unshift({ date: today(), type, completed, duration, completedAt: new Date().toISOString() });
  localStorage.setItem(POMO_LOG_KEY, JSON.stringify(log.slice(0, 200)));
}

function requestNotificationPermission(cb) {
  if (!('Notification' in window)) return cb && cb();
  if (Notification.permission === 'granted') return cb && cb();
  if (Notification.permission === 'denied') return cb && cb();
  Notification.requestPermission().then(() => cb && cb()).catch(e => console.warn('notificações indisponíveis:', e.message));
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
    pomoClearVisuals();
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

  // Tick de 500s só enquanto o contador está VISÍVEL (painel aberto). A conclusão
  // não depende dele — pomoArmDeadline dispara no fim mesmo com painel fechado/aba oculta.
  clearTimeout(pomoTickId);
  const panelOpen = document.getElementById('pomodoro-panel')?.classList.contains('open');
  pomoTickId = (!document.hidden && panelOpen) ? setTimeout(updatePomoDisplay, 500) : null;
}

function onPomoComplete(session) {
  pomoStopTimers();
  clearPomoCurrent();
  logPomoEntry(session.type, true, session.totalSeconds);
  pomoClearVisuals();

  if (session.type === 'foco') {
    addXpTrilha(20, 'pomodoro foco completo');
    addAttribute('int', 1, 'pomodoro foco');
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
    focoBtn.innerHTML = '<svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg> Parar';
    focoBtn.className = 'pomo-btn running';
    focoBtn.onclick = () => pararPomodoro(session);
    breakBtn.style.display = 'none';
    sagradaBtn.style.display = 'none';
  } else {
    focoBtn.innerHTML = '<svg class="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l13 8-13 8Z"/></svg> Foco 25min';
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
    pomoStopTimers();
    pomoArmDeadline(session);
    updatePomoDisplay();
    updatePomoBtns(session);
  };

  // Pede permissão só na 1ª vez; guard 'Notification' in window — acessar
  // Notification.permission direto lança ReferenceError onde a API não existe
  if ('Notification' in window && Notification.permission === 'default') {
    requestNotificationPermission(doStart);
  } else {
    doStart();
  }
}

function pararPomodoro(session) {
  pomoStopTimers();
  logPomoEntry(session?.type || 'foco', false, 0);
  clearPomoCurrent();
  pomoClearVisuals();
  updatePomoDisplay();
  toast('Pomodoro interrompido');
}

function togglePomodoroPanel() {
  const panel = document.getElementById('pomodoro-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    // Retoma display se havia sessão ativa
    const session = getPomoCurrent();
    if (session) updatePomoDisplay();
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
    const log = safeParse('agh_hora_sagrada_log', []);
    log.unshift({ date: today(), status: 'interrompida', duration: elapsed, completedAt: new Date().toISOString() });
    localStorage.setItem('agh_hora_sagrada_log', JSON.stringify(log.slice(0, 100)));
    clearPomoCurrent();
    pomoStopTimers();
  }
  document.getElementById('hora-sagrada-banner')?.classList.remove('active');
  pomoClearVisuals();
  updatePomoDisplay();
  toast('Hora Sagrada interrompida — registrada sem XP');
}

function completarHoraSagrada() {
  // Registra no log de hora sagrada
  const log = safeParse('agh_hora_sagrada_log', []);
  log.unshift({ date: today(), status: 'completa', duration: 1800, completedAt: new Date().toISOString() });
  localStorage.setItem('agh_hora_sagrada_log', JSON.stringify(log.slice(0, 100)));

  updateStreak('semIa');
  updateStreak('geral');

  // O toast prometia +5 INT +3 CON e nada creditava — agora credita
  addXpTrilha(50, 'hora sagrada completa');
  addAttribute('int', 5, 'hora sagrada');
  addAttribute('con', 3, 'hora sagrada');

  document.getElementById('hora-sagrada-banner')?.classList.remove('active');
  pomoClearVisuals();
  sendNotification('Hora Sagrada concluida!', '+50 XP +5 INT +3 CON. Voce no comando.');
  toast('Hora Sagrada completa! +50 XP +5 INT +3 CON', 'ok');
  updatePomoDisplay();
  updatePomoStats();
}

// ── DAILY STANDUP ─────────────────────────────────────────────────
function buildOntemItems(ontemStr) {
  const xpLog = SYNC?.xpLog || [];
  const trilhaLog = safeParse('trilhaXpLog', []);
  const ontemXp = xpLog.filter(e => e.date === ontemStr);
  const ontemTrilha = trilhaLog.filter(e => e.date === ontemStr);
  const ontemPomo = safeParse(POMO_LOG_KEY, [])
    .filter(e => e.date === ontemStr && e.completed);

  const items = [];
  const commits = ontemXp.filter(e => ['feat','bugfix','deploy'].includes(e.type));
  if (commits.length) items.push({ icon: '⚙', text: `${commits.length} atividade(s) registrada(s)` });

  // xp>0 e prefixo com ':' exclui os estornos ('checkpoint removido: X') do contador
  const leituras = ontemTrilha.filter(e => e.xp > 0 && e.desc?.startsWith('lido:'));
  if (leituras.length) items.push({ icon: '📚', text: `${leituras.length} módulo(s) lido(s)` });

  const checkpoints = ontemTrilha.filter(e => e.xp > 0 && e.desc?.startsWith('checkpoint:'));
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
  const horaSagradaHoje = safeParse('agh_hora_sagrada_log', [])
    .some(e => e.date === t);
  if (!horaSagradaHoje) sugs.push('Hora Sagrada 30min (ainda não fez hoje)');
  DB.tasks.filter(k => k.status !== 'done' && k.priority === 'high').slice(0, 2)
    .forEach(tk => sugs.push(`Tarefa alta: "${tk.title}"`));
  return sugs.slice(0, 3);
}

function buildStandupBody() {
  const t = today();
  const ontemStr = daysAgoISO(1);

  const ontemItems = buildOntemItems(ontemStr);
  const sugestoes = buildSugestoes(t);
  const streaks = getStreaks();
  // Geral = streak de commits do produtor (sync.json), a fonte que vive de verdade;
  // estudo/sem-IA/decisões seguem locais (só existem neste browser)
  const sg = SYNC?.player
    ? { atual: SYNC.player.streak ?? 0, recorde: SYNC.player.longestStreak ?? 0 }
    : (streaks.geral || STREAK_DEFAULTS.geral);
  const se = streaks.estudo   || STREAK_DEFAULTS.estudo;
  const ss = streaks.semIa    || STREAK_DEFAULTS.semIa;
  const sd = streaks.decisoes || STREAK_DEFAULTS.decisoes;

  return `
    <div class="standup-section">
      <div class="standup-section-label">Ontem</div>
      ${ontemItems.map(i => `
        <div class="standup-item">
          <span class="standup-item-icon">${deEmoji(i.icon,16)}</span>
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
          <span class="standup-suggest-arrow"><svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l13 8-13 8Z"/></svg></span>
          <span>${esc(s)}</span>
        </div>`).join('')}
    </div>` : ''}
  `;
}

function buildStreakCard(icon, streak, label) {
  return `
    <div class="streak-card" title="Recorde: ${streak.recorde} dias">
      <span class="streak-card-icon">${deEmoji(icon,16)}</span>
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

async function checkStandupOnLoad() {
  const last = localStorage.getItem('lastStandupDate');
  if (last === today()) return; // já mostrou hoje
  // A sugestão de próximo módulo depende do índice — o sleep fixo de 600ms
  // esperava um load que nunca era disparado no init
  await loadTrilhaIndex();
  setTimeout(openStandup, 400);
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

  const log = safeParse('agh_reflection_log', []);
  log.unshift({ date: today(), melhor, falhou, savedAt: new Date().toISOString() });
  localStorage.setItem('agh_reflection_log', JSON.stringify(log.slice(0, 90)));

  addXpTrilha(30, 'daily reflection');
  addAttribute('wis', 2, 'daily reflection');
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
  loadStudyMaterial();
  loadSync();

  // Retoma pomodoro se estava ativo quando a tab foi fechada
  const existingSession = getPomoCurrent();
  if (existingSession) {
    const rem = pomoSecondsRemaining(existingSession);
    if (rem > 0) {
      pomoArmDeadline(existingSession);
      updatePomoDisplay();
      if (existingSession.type === 'sagrada') showHoraSagradaBanner();
      if (existingSession.type === 'foco') document.body.classList.add('pomo-running');
      document.getElementById('pomodoro-fab')?.classList.add('active-session');
    } else {
      // Sessão expirou com a tab FECHADA (com a tab aberta, pomoArmDeadline já teria
      // completado): não dá pra confirmar que rodou até o fim e a notificação nunca
      // disparou — descarta em silêncio em vez de creditar/logar um pomodoro fantasma.
      clearPomoCurrent();
    }
  }

  checkStandupOnLoad();
})();
