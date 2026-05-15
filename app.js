// ── DATA ─────────────────────────────────────────────────────────
const DB = {
  get tasks()    { return JSON.parse(localStorage.getItem('agh_tasks')    || '[]') },
  set tasks(v)   { localStorage.setItem('agh_tasks',    JSON.stringify(v)) },
  get projects() { return JSON.parse(localStorage.getItem('agh_projects') || '[]') },
  set projects(v){ localStorage.setItem('agh_projects', JSON.stringify(v)) },
  get events()   { return JSON.parse(localStorage.getItem('agh_events')   || '[]') },
  set events(v)  { localStorage.setItem('agh_events',   JSON.stringify(v)) },
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
        <div class="proj-footer">
          <div>
            <div class="proj-prog-text">${pt.length} tarefa${pt.length!==1?'s':''}</div>
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
    document.querySelectorAll('.col').forEach(el=>el.classList.toggle('sel',el.dataset.c===p.color));
  } else {
    document.getElementById('mp-title').textContent='Novo Projeto';
    document.getElementById('fp-id').value='';
    document.getElementById('fp-name').value='';
    document.getElementById('fp-desc').value='';
    document.getElementById('fp-status').value='ativo';
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
  const c=document.querySelector('.col.sel')?.dataset.c||'#7C3AED';
  const projs=DB.projects, id=document.getElementById('fp-id').value;
  const data={
    id:id||uid(), name,
    description:document.getElementById('fp-desc').value.trim(),
    status:document.getElementById('fp-status').value, color:c,
    createdAt:id?(projs.find(p=>p.id===id)?.createdAt||new Date().toISOString()):new Date().toISOString(),
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
let calY=new Date().getFullYear(), calM=new Date().getMonth();

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
  const t=today(), evs=DB.events;
  const cells=Math.ceil((first+days)/7)*7;
  let html='';
  for(let i=0;i<cells;i++){
    let day,mo,yr,other=false;
    if(i<first){day=prev-first+i+1;mo=calM===0?11:calM-1;yr=calM===0?calY-1:calY;other=true;}
    else if(i-first>=days){day=i-first-days+1;mo=calM===11?0:calM+1;yr=calM===11?calY+1:calY;other=true;}
    else{day=i-first+1;mo=calM;yr=calY;}
    const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isT=ds===t;
    const de=evs.filter(e=>e.date===ds).slice(0,2);
    html+=`<div class="cal-day${other?' other':''}${isT?' today':''}" onclick="clickDay('${ds}')">
      <div class="cal-day-num">${day}</div>
      <div class="cal-day-evs">${de.map(e=>`<div class="cal-ev-chip ev-cal-${e.type}">${e.time?e.time.slice(0,5)+' ':''}${esc(e.title)}</div>`).join('')}</div>
    </div>`;
  }
  document.getElementById('cal-days').innerHTML=html;
  renderCalSidebar();
}

function clickDay(ds){openEvModal(null,ds);}

function renderCalSidebar(){
  const t=today();
  const evs=DB.events.slice().sort((a,b)=>{
    if(a.date!==b.date) return a.date.localeCompare(b.date);
    return (a.time||'').localeCompare(b.time||'');
  });
  const te=evs.filter(e=>e.date===t);
  const ue=evs.filter(e=>e.date>t).slice(0,5);

  const calToEl=document.getElementById('cal-today');
  calToEl.innerHTML=te.length
    ? te.map(e=>calEvRow(e,false)).join('')
    : '<div class="no-evs">Sem eventos hoje</div>';

  const calUpEl=document.getElementById('cal-upcoming');
  calUpEl.innerHTML=ue.length
    ? ue.map(e=>calEvRow(e,true)).join('')
    : '<div class="no-evs">Nenhum evento futuro</div>';
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

// ── KEYBOARD ──────────────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
    const o=document.querySelector('.overlay.open');
    if(!o) return;
    if(o.id==='m-task') saveTask();
    else if(o.id==='m-proj') saveProj();
    else if(o.id==='m-ev')   saveEv();
  }
});

// ── INIT ──────────────────────────────────────────────────────────
(function(){
  document.getElementById('sb-date').textContent =
    new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  renderDash();
})();
