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

function renderPlayerCard() {
  const p = SYNC.player;
  const levels = SYNC.levels || [];
  const nextLv = levels.find(l => l.xpMin > p.xp);
  const xpToNext = nextLv ? nextLv.xpMin : p.xp + 1000;
  const pct = Math.min(100, Math.round(((p.xp - (levels.find(l => l.level === p.level)?.xpMin || 0)) /
    (xpToNext - (levels.find(l => l.level === p.level)?.xpMin || 0))) * 100));

  document.getElementById('player-card-wrap').innerHTML = `
    <div class="player-card">
      <div class="player-avatar">⚡</div>
      <div class="player-info">
        <div class="player-name">${esc(p.name)}</div>
        <div class="player-title">${esc(p.title)}</div>
        <div class="xp-bar-wrap">
          <div class="xp-bar"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
          <div class="xp-label">${p.xp} / ${xpToNext} XP</div>
        </div>
      </div>
      <div class="player-stats">
        <div class="player-level">Lv${p.level}</div>
        <div class="player-level-lbl">nível</div>
        <div class="streak-badge" style="margin-top:6px">🔥 ${p.streak}d</div>
      </div>
    </div>`;
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

// ── NAV ───────────────────────────────────────────────────────────
let curView = 'dash';

function go(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.getElementById('nav-'+view).classList.add('active');
  curView = view;
  if (view==='dash')     renderDash();
  if (view==='projects') renderProjects();
  if (view==='tasks')    renderTasks();
  if (view==='agenda')   renderCal();
  if (view==='growth')   { renderGrowth(); renderModules(); }
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
    concept: 'Use const por padrão para todo dado que não será reatribuído. Arrow functions herdam this do escopo pai, diferente de function declarations.',
    code: 'const users = [{id: 1, name: "Ana"}];\nconst active = users.filter(u => u.id > 0);\nconst Component = () => ({ render: () => this.el }); // this = window',
    tip: 'const impediu bug? Sim. Refatore var em const, let so se ja testou reatribuição.'
  },
  'js-async-await': {
    concept: 'async/await é açúcar sintático para Promises. Sempre use Promise.all() para operações independentes em paralelo, não await sequencial.',
    code: 'const [users, posts] = await Promise.all([\n  fetch(\'/api/users\').then(r => r.json()),\n  fetch(\'/api/posts\').then(r => r.json())\n]);',
    tip: 'Múltiplos awaits sequenciais = latência acumulada. Promise.all paraleliza.'
  },
  'js-array-methods': {
    concept: 'map, filter, reduce, find não mutam o array original. Retornam novo array ou valor. Compor métodos evita loops aninhados.',
    code: 'const data = [1, 2, 3, 4];\nconst result = data\n  .filter(n => n > 2)\n  .map(n => n * 2)\n  .reduce((sum, n) => sum + n, 0); // 14',
    tip: 'Evite forEach para transformar dados — use map. forEach só para side effects (log, render).'
  },
  'js-optional-ops': {
    concept: 'obj?.prop retorna undefined se obj é null/undefined, sem erro. ?? escolhe default so se valor é null/undefined, nunca 0 ou false.',
    code: 'const user = response?.data?.user; // sem erro se response ausente\nconst age = obj.age ?? 18; // usa 18 se age undefined, nao se age = 0',
    tip: 'Trocar a && b && c por a?.b?.c. && deveria ser === 0, ?. sempre seguro.'
  },
  'js-fetch-api': {
    concept: 'Sempre verificar response.ok antes de chamar response.json(). 404 nao rejeita Promise automaticamente.',
    code: 'const r = await fetch(\'/api/data\');\nif (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);\nconst data = await r.json();',
    tip: 'Esqueceu de r.ok? Seu catch recebe JSON de erro do servidor, acha erro no formato errado.'
  },
  'js-dom-events': {
    concept: 'Event delegation: escuta em elemento pai, check e.target. querySelector via classe/id. innerHTML = XSS se conteúdo vem de usuario.',
    code: 'parent.addEventListener("click", (e) => {\n  if (e.target.matches(".btn-delete")) deleteItem(e.target.dataset.id);\n});\nconst html = esc(userContent); // sempre escapar',
    tip: 'innerHTML sem esc() = XSS vulnerability. Use textContent para texto, esc() antes de innerHTML.'
  },
  'ts-basic-types': {
    concept: 'interface descreve forma fixa de objeto (contratos). type é mais geral (unions, generics). Prefer interface para modelos de dados.',
    code: 'interface User { id: number; name: string; email: string; }\ntype Status = "pending" | "active" | "deleted";\nconst user: User = { id: 1, name: "Ana", email: "a@x.com" };',
    tip: 'Nome de interface = capitalize. Se precisa de union (type A | type B), use type. Objeto com forma fixa = interface.'
  },
  'ts-strict-no-any': {
    concept: 'any desativa type checking. unknown força narrowing via typeof/type guard. strict: true pega bugs que any esconde.',
    code: 'let data: unknown = JSON.parse(str);\nif (typeof data === "object" && data !== null) {\n  const obj = data as Record<string, unknown>;\n}',
    tip: 'any = silenciar tipo. unknown = "nao sei o tipo ainda, prove o tipo antes de usar". Usar unknown em boundary.'
  },
  'ts-utility-types': {
    concept: 'Partial<T> = todos campos opcionais. Pick<T, Keys> = só alguns campos. Omit<T, Keys> = tudo menos estes campos. Readonly, Required.',
    code: 'interface User { id: number; name: string; email: string; }\ntype CreateUser = Omit<User, "id">;\ntype UserPreview = Pick<User, "name" | "email">;',
    tip: 'Nao duplicar tipos manualmente. Utility types extraem tipo derivado. Refactor: se User muda, CreateUser acompanha.'
  },
  'ts-generics': {
    concept: '<T> = tipo parametrizado. Reutiliza funcao sem perder tipagem. <T extends Base> = constraina tipo valido.',
    code: 'function wrap<T>(value: T): { value: T } { return { value }; }\nfunction getById<T extends { id: number }>(items: T[], id: number): T | undefined {\n  return items.find(i => i.id === id);\n}',
    tip: 'Generics evitam any quando reutiliza logica com tipos diferentes. Constrains garantem propriedades disponiveis.'
  },
  'ts-discriminated': {
    concept: 'Union com campo literal (kind/type) permite type narrowing seguro. Eliminanda estados invalidos (data + error juntos).',
    code: 'type State = { kind: "loading" } | { kind: "ok"; data: User } | { kind: "error"; error: string };\nif (state.kind === "ok") console.log(state.data);',
    tip: 'default: satisfies never no switch pega caso novo nao tratado em compile time.'
  },
  'supabase-crud': {
    concept: 'Fluent API: select().eq().order() retorna QueryBuilder. .data ao final retorna array. Sempre tratar erro.',
    code: 'const { data, error } = await supabase\n  .from("users")\n  .select("id, name, email")\n  .eq("status", "active")\n  .order("created_at", { ascending: false });',
    tip: 'select("*") retorna todas colunas. Especifica colunas — menor payload, melhor cache.'
  },
  'supabase-auth': {
    concept: 'onAuthStateChange é o unico source of truth de sessao. Chama callback ao login/logout. Session pode ser null mesmo dentro do app.',
    code: 'supabase.auth.onAuthStateChange((event, session) => {\n  if (session) { setUser(session.user); } else { setUser(null); }\n});',
    tip: 'Nao guardique sessao em estado local — onAuthStateChange cuida. signOut() emite evento que listener processa.'
  },
  'supabase-rls': {
    concept: 'RLS habilitado = sem policy = bloqueado. Escreve policy por role. usuarios query so dados seu. Sem RLS = todos vem via API.',
    code: 'CREATE POLICY "users_select_own"\n  ON users FOR SELECT TO authenticated\n  USING (auth.uid() = user_id);',
    tip: 'RLS enabled sem policies = tudo bloqueado. Use Supabase Dashboard SQL Editor para testar policy.'
  },
  'supabase-realtime': {
    concept: 'channel.subscribe() retorna RemoveChannelFunc. Sempre chamar no cleanup (React useEffect). Sem cleanup = memory leak.',
    code: 'useEffect(() => {\n  const unsub = supabase.channel("users").on("*", payload => console.log(payload)).subscribe();\n  return () => unsub();\n}, []);',
    tip: 'Realtime = WebSocket. Sem unsubscribe = conexão aberta. Teste com DevTools Network tab WebSocket.'
  },
  'supabase-migrations': {
    concept: 'Nunca editar migration ja aplicada em prod. Cria migration nova para reverter. `supabase db push` aplica local.',
    code: 'npx supabase migration new add_users_table\n# edita migrations/..._add_users_table.sql\nnpx supabase db push',
    tip: 'Migration versionada = source of truth. Prod diverge de local? supabase migration list mostra state.'
  },
  'supabase-types-gen': {
    concept: 'supabase gen types gera tipos TS da schema atual. Roda apos migration. Importa types em API/SPA.',
    code: 'npx supabase gen types typescript --project-id YOUR_ID > src/types/supabase.ts\nimport type { Database } from "./types/supabase";',
    tip: 'Rodou migration mas tipos desincronizados? Roda gen types. CI pode rodar isso automaticamente.'
  },
  'html-semantics': {
    concept: '<section>, <article>, <main>, <header>, <nav> descrevem estrutura. aria-label em ícones. Semantica = acessibilidade + SEO.',
    code: '<main role="main"><section><header><h1>Titulo</h1></header><article>...</article></section></main>\n<button aria-label="Fechar modal">×</button>',
    tip: 'Nunca divs aninhadas sem semântica. Leitores de tela (screen readers) contam na estrutura HTML.'
  },
  'html-layout': {
    concept: 'Grid para layout 2D (tabela-like). Flexbox para layout 1D (horizontal/vertical). Grid + Flexbox = combinados para responsivo.',
    code: 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; /* 2D */\n.card { display: flex; flex-direction: column; gap: 8px; } /* 1D */\n@media (max-width: 600px) { grid-template-columns: 1fr; }',
    tip: 'Sidebar + main? Grid. Card internamente? Flex. Mobile-first: comeca 1 coluna, media query expande.'
  },
  'html-css-vars': {
    concept: 'CSS Custom Properties em :root reutilizaem em todo CSS. Dark mode = trocar valores no :root. Nao repete cor hardcoded.',
    code: ':root { --primary: #7048E8; --text: #EEF5FF; --bg: #0A0F1A; }\nbody { color: var(--text); background: var(--bg); }\n.btn { background: var(--primary); }',
    tip: 'Trocar de tema? Escreve novo :root[data-theme="light"]. JS troca atributo, CSS pega novas vars.'
  },
  'html-spa-vanilla': {
    concept: 'go(view) muda display das views. classList.add/remove("active") para ui. Estado em const DB = {}. Sem virtual DOM.',
    code: 'const go = (view) => { document.querySelectorAll(".view").forEach(v => v.classList.remove("active")); document.getElementById(`view-${view}`).classList.add("active"); curView = view; };\ngo("dash");',
    tip: 'Sem framework = controle completo. Mas sem reactivity — renderiza tudo manualmente ao estado mudar.'
  },
  'html-localstorage': {
    concept: 'localStorage.setItem(key, JSON.stringify(obj)). localStorage.getItem(key) retorna string. Parse antes de usar.',
    code: 'const DB = { data: [] };\nDB.data = [1, 2, 3];\nlocalStorage.setItem("db", JSON.stringify(DB));\nconst restored = JSON.parse(localStorage.getItem("db"));',
    tip: 'LocalStorage persiste apos reload. Nunca guarda objetos diretos — JSON.stringify. Limite: ~5MB por origin.'
  },
  'html-responsive': {
    concept: 'Mobile-first: escreve CSS para tela pequena, @media (min-width) expande. Nao usa max-width (media queries opostas).',
    code: '.card { grid-template-columns: 1fr; }\n@media (min-width: 600px) { .card { grid-template-columns: 1fr 1fr; } }\n@media (min-width: 1200px) { .card { grid-template-columns: 1fr 1fr 1fr; } }',
    tip: 'Começa mobile (constraints forçam prioridade). Depois adiciona layout richter em breakpoints maiores.'
  },
  'git-git-core': {
    concept: 'git commit cria snapshot. git branch isola trabalho. git rebase lineariza history (reescreve commit). git merge junta branches.',
    code: 'git checkout -b feat/xyz\ngit add file.js\ngit commit -m "feat: descricao"\ngit rebase main  # lineariza\ngit merge feat/xyz  # se nao ff',
    tip: 'git log --oneline mostra historico. git rebase evita merge commits. Commit atomico = uma mudanca logica.'
  },
  'git-conv-commits': {
    concept: 'feat: nova funcionalidade. fix: corrige bug. chore: deps, config. docs: docs. test: testes. Escopo em parenteses: feat(api): ...',
    code: 'feat(modules): adiciona icones svg e material de estudo\nfix(supabase): corrige realtime leak\nchore(deps): bump prisma 5.10\ndocs(readme): explica setup chrome profile',
    tip: 'Commit message narra POR QUE, nao O QUE (o que esta no diff). historia linear = git log e git bisect ficam faceis.'
  },
  'git-gitignore-env': {
    concept: '.gitignore antes do primeiro commit. .env, node_modules, dist/ nunca commitam. .env.example sem valores, documenta variaveis.',
    code: '# .gitignore\n.env\n.env.local\nnode_modules/\ndist/\n*.pem\nchrome-profile-*',
    tip: 'Fez commit do .env? git rm --cached .env, limpa historico: git filter-repo --path .env. Revogar chaves!'
  },
  'git-vercel': {
    concept: 'Vercel: deploy automatico em push. Variáveis de ambiente no dashboard (nao no .env). Preview URL por PR. Dominio customizado.',
    code: '# push para main\ngit push origin main\n# Vercel auto-deploys a https://prod.vercel.app\n# PR cria preview URL automaticamente',
    tip: 'Sem env vars no .env para prod. Vercel dashboard > Settings > Environment Variables. Secrets = nao aparece em logs.'
  },
  'git-ci-cd': {
    concept: '.github/workflows/deploy.yml roda apos push. Testa, builda, deploya. Secrets no repo settings (repository secrets, nao env vars).',
    code: 'name: Deploy\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n      - run: npm run build',
    tip: 'CI roda a cada push — fail rápido invalida merge. Usa GitHub Secrets para API keys, nao hardcoded.'
  },
  'node-express-basics': {
    concept: 'app.get(path, (req, res) => {}). Status codes semânticos: 200 ok, 201 created, 400 bad request, 404 not found, 500 server error.',
    code: 'app.get("/users/:id", (req, res) => {\n  const user = findUser(req.params.id);\n  if (!user) return res.status(404).json({ error: "not found" });\n  res.json(user);\n});',
    tip: '404 vs 400: 404 = recurso nao existe. 400 = request invalido (parametro errado, tipo errado).'
  },
  'node-env-validation': {
    concept: 'zod.parse(process.env) no startup — falha rápido se var faltando. Nao deixa app rodar sem config valida.',
    code: 'import z from "zod";\nconst env = z.object({ PORT: z.string().default("3000"), DB_URL: z.string() }).parse(process.env);\nconst PORT = parseInt(env.PORT);',
    tip: 'Falha no startup > silenciar variaveis faltando em producao e descobrir em crash aleatorio.'
  },
  'node-error-handling': {
    concept: 'Error middleware no Express: (err, req, res, next) => {}. Trata erros nao capturados. Nunca catch vazio.',
    code: 'app.use((err, req, res, next) => {\n  console.error("[error]", err);\n  res.status(500).json({ error: err.message });\n});\napp.get("/", (req, res, next) => {\n  try { ... } catch(e) { next(e); }\n});',
    tip: 'throw de rota sem try/catch crashes app se nao tem error middleware. Express chama next(error).'
  },
  'node-async-node': {
    concept: 'async/await em handler do Express. Sempre try/catch ou next(error). Nao forEach+await — Map/Promise.all.',
    code: 'app.post("/users", async (req, res, next) => {\n  try {\n    const users = await Promise.all(req.body.map(u => createUser(u)));\n    res.json(users);\n  } catch (e) { next(e); }\n});',
    tip: 'forEach(async...) = roda em paralelo, mas codigo continua. Nao espera. Use Promise.all se precisa de sequence.'
  },
  'node-graceful-shutdown': {
    concept: 'process.on("SIGTERM") fecha conexões antes de exit. Node em container recebe SIGTERM, nao SIGKILL direto.',
    code: 'const server = app.listen(3000);\nprocess.on("SIGTERM", () => {\n  console.log("Shutting down...");\n  server.close(() => { db.end(); process.exit(0); });\n});',
    tip: 'Sem graceful shutdown = conexões abertas, dados incompletos. Deploy sem downtime usa SIGTERM.'
  },
  'clean-srp': {
    concept: 'Uma funcao, uma responsabilidade. Se precisas de "e" pra descrever, ela faz coisa demais. Extrai subfuncoes.',
    code: 'function validateAndSaveUser(data) { ... } // faz 2 coisas\n// Melhor:\nfunction validateUser(data) { ... }\nfunction saveUser(data) { ... }',
    tip: 'Teste facil? Sim. Descreve em 1 frase? Sim. SRP ok. Teste dificil + "e" na descricao = violado SRP.'
  },
  'clean-dry-kiss': {
    concept: 'DRY = Nao repete codigo. Mas copiar 2x eh ok, 3x extrai. KISS = simplifica, YAGNI = so implementa que eh necessario.',
    code: '// Duplicacao 1 e 2: let estar, eh novo codigo\n// Duplicacao 3: const format = (x) => x.toUpperCase();\n// YAGNI: nao cria plugin system se so eh 1 lugar usa',
    tip: 'Abstracoes prematuras = mais bug, nao menos. Espera padrao emergir antes de extrair.'
  },
  'clean-early-return': {
    concept: 'Early return elimina else, reduz nesting. Valida condicoes invalidas no comeco, retorna cedo.',
    code: 'function process(data) {\n  if (!data) return null;\n  if (data.length === 0) return [];\n  return transform(data);\n}\n// sem if-else-if- outro else',
    tip: 'Nesting > 2 niveis? Refactora com early return ou extrai funcao. Ler de cima a baixo = claro.'
  },
  'clean-naming': {
    concept: 'Nomes descrevem O QUE E POR QUE. Sem abreviacoes. Sem generico (data, temp, x). getUser > u, calculateTotalPrice > price.',
    code: 'const users = fetch("/api/users"); // users: array, nao 1 user\nconst isActive = user.status === "active"; // boolean comeca com is/has/can\nconst formatCurrency = (n) => ...;',
    tip: 'Nome ruim = comenta O QUE faz. Nome bom = comenta NAO eh necessario. Nome = self-documenting.'
  },
  'clean-code-smells': {
    concept: 'God object = sabe demais. Dead code = nada chama. Shotgun surgery = 1 mudanca = 5 arquivos. Feature envy = usa dados doutro mais que proprio.',
    code: 'class User { getFullName, validate, save, delete, checkPermission ... } // god object\n// Melhor: User + UserValidator + UserRepository + PermissionChecker',
    tip: 'Code smell = alerta, nao erro. Revisar em PR se eh problema real ou design aceitavel pro escopo.'
  },
  'clean-testing': {
    concept: 'Arrange, Act, Assert. Testa COMPORTAMENTO, nao implementacao. Nao mocka modulos internos — mocka boundary (DB, API externa).',
    code: 'test("should return 404 when user not found", () => {\n  // Arrange\n  const id = "nonexistent";\n  // Act\n  const user = findUser(id);\n  // Assert\n  expect(user).toBeUndefined();\n});',
    tip: 'Teste que mocka findUserById interno = muito fragil. Testa resultado, nao como eh feito.'
  },
};

function getModProgress()        { return JSON.parse(localStorage.getItem('agh_modules') || '{}'); }
function saveModProgress(data)   { localStorage.setItem('agh_modules', JSON.stringify(data)); }
function topicStatus(p, mid, tid){ return p[mid]?.[tid] ?? 'pending'; }

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

function renderTopicMaterial(t) {
  const mat = STUDY_MATERIAL[t.id] || { concept: 'Material em construção', code: '', tip: '' };
  return `<div class="tm-concept">${esc(mat.concept)}</div>
    ${mat.code ? `<pre class="tm-code">${esc(mat.code)}</pre>` : ''}
    ${mat.tip ? `<div class="tm-tip">${esc(mat.tip)}</div>` : ''}`;
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

// ── INIT ──────────────────────────────────────────────────────────
(function(){
  document.getElementById('sb-date').textContent =
    new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  renderDash();
  renderModules();
  loadSync();
})();
