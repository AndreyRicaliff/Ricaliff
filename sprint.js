// sprint.js — Scrum solo. UMA view de gestão: backlog → sprint semanal → done com evidência.
// Substitui Tarefas + Quest Board na navegação (dados antigos migram pro backlog 1×).
// Regras do método (simplificado pra um dev solo):
//   Planning: escolher até 7 itens + 1 meta da semana. WIP: máx 2 em "fazendo".
//   Done: só com evidência (link/commit/nota). Virada de semana: retro de 1 campo,
//   itens não-feitos voltam pro backlog, sprint fecha no histórico.
(function () {
  const KEY = 'agh_sprint';
  const MAX_SPRINT = 7, MAX_WIP = 2;

  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function semanaISO(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dow = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dow);
    const y = t.getUTCFullYear();
    const w = Math.ceil((((t - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
    return `${y}-W${String(w).padStart(2, '0')}`;
  }
  function diasRestantes() {
    const d = new Date(); const dow = d.getDay() || 7;
    return 7 - dow + 1; // domingo fecha a semana
  }

  function load() {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
    if (!s) s = { backlog: [], atual: null, historico: [], migrado: false };

    // migração 1×: tarefas abertas viram backlog (Tarefas/Quest Board saem da nav)
    if (!s.migrado) {
      try {
        const tasks = JSON.parse(localStorage.getItem('agh_tasks') || '[]');
        for (const t of tasks) {
          if (!t || t.status === 'done') continue;
          s.backlog.push({
            id: 'bk-' + t.id, titulo: t.title, tipo: t.projectId ? 'projeto' : 'outro',
            origem: 'task', projectId: t.projectId || null, status: 'backlog', evidencia: '',
          });
        }
      } catch { /* sem tasks — backlog começa vazio */ }
      s.migrado = true;
      save(s);
    }

    // virada de semana: fecha a sprint anterior, não-feitos voltam pro backlog
    const semana = semanaISO();
    if (s.atual && s.atual.semana !== semana) {
      const done = s.atual.itens.filter(i => i.status === 'done').length;
      s.historico.unshift({
        semana: s.atual.semana, meta: s.atual.meta,
        done, total: s.atual.itens.length, retro: s.atual.retro || '',
      });
      for (const i of s.atual.itens) if (i.status !== 'done') { i.status = 'backlog'; s.backlog.unshift(i); }
      s.atual = null;
      save(s);
      setTimeout(() => toast('Sprint anterior fechada — planeje a nova semana'), 600);
    }
    return s;
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

  // ── ações ─────────────────────────────────────────────────────────
  window.sprintPlanejar = function () {
    const meta = document.getElementById('sp-meta-input')?.value.trim();
    if (!meta) { toast('Defina a meta da semana (1 frase)', 'err'); return; }
    const s = load();
    s.atual = { semana: semanaISO(), meta, itens: [], retro: '' };
    save(s); renderSprint();
  };
  window.sprintAddNovo = function () {
    const el = document.getElementById('sp-novo-input');
    const titulo = el?.value.trim(); if (!titulo) return;
    const tipo = document.getElementById('sp-novo-tipo')?.value || 'projeto';
    const s = load();
    const item = { id: 'sp-' + Date.now(), titulo, tipo, origem: 'sprint', status: 'backlog', evidencia: '' };
    s.backlog.unshift(item); save(s); el.value = ''; renderSprint();
  };
  window.sprintPuxar = function (id) {
    const s = load(); if (!s.atual) return;
    if (s.atual.itens.length >= MAX_SPRINT) { toast(`Sprint cheia (${MAX_SPRINT}) — foco > volume`, 'err'); return; }
    const i = s.backlog.findIndex(x => x.id === id); if (i < 0) return;
    const [item] = s.backlog.splice(i, 1);
    item.status = 'sprint'; s.atual.itens.push(item); save(s); renderSprint();
  };
  window.sprintMover = function (id, para) {
    const s = load(); if (!s.atual) return;
    const item = s.atual.itens.find(x => x.id === id); if (!item) return;
    if (para === 'doing' && s.atual.itens.filter(x => x.status === 'doing').length >= MAX_WIP) {
      toast(`WIP ${MAX_WIP}: termine algo antes de puxar outro`, 'err'); return;
    }
    if (para === 'done') {
      const evid = prompt('Evidência do feito (commit/link/nota curta) — done sem evidência não existe:');
      if (!evid || !evid.trim()) { toast('Sem evidência, sem done', 'err'); return; }
      item.evidencia = evid.trim();
      try {
        addXpTrilha(5, 'sprint: ' + item.titulo.slice(0, 40));
        applyAttributeRules(item.tipo === 'formacao' ? 'learning' : 'feat', 'sprint: ' + item.titulo.slice(0, 30));
      } catch (e) { /* gamificação indisponível */ }
      if (typeof dailyMarcarAuto === 'function') dailyMarcarAuto('sprint-done');
    }
    item.status = para; save(s); renderSprint();
  };
  window.sprintDevolver = function (id) {
    const s = load(); if (!s.atual) return;
    const i = s.atual.itens.findIndex(x => x.id === id); if (i < 0) return;
    const [item] = s.atual.itens.splice(i, 1);
    item.status = 'backlog'; s.backlog.unshift(item); save(s); renderSprint();
  };
  window.sprintRetro = function () {
    const v = document.getElementById('sp-retro-input')?.value.trim();
    const s = load(); if (!s.atual) return;
    s.atual.retro = v || ''; save(s); toast('Retro anotada');
  };

  // itens pro focus-card do dashboard
  window.sprintFocusItems = function () {
    const s = load();
    if (!s.atual) return null;
    return {
      meta: s.atual.meta,
      itens: s.atual.itens.filter(i => i.status !== 'done').slice(0, 3),
      done: s.atual.itens.filter(i => i.status === 'done').length,
      total: s.atual.itens.length,
    };
  };

  // ── render ────────────────────────────────────────────────────────
  const tipoChip = t => `<span class="sp-tipo sp-tipo-${t}">${t}</span>`;

  function cardItem(i, col) {
    const acoes = col === 'sprint'
      ? `<button onclick="sprintMover('${i.id}','doing')">Começar</button><button onclick="sprintDevolver('${i.id}')">Devolver</button>`
      : col === 'doing'
        ? `<button onclick="sprintMover('${i.id}','done')">Concluir</button><button onclick="sprintMover('${i.id}','sprint')">Pausar</button>`
        : '';
    return `<div class="sp-item sp-item-${col}">
      <div class="sp-item-t">${esc2(i.titulo)}</div>
      <div class="sp-item-b">${tipoChip(i.tipo)}${i.evidencia ? `<span class="sp-evid" title="${esc2(i.evidencia)}">${icon('check', 11)} evidência</span>` : ''}
        <span class="sp-acoes">${acoes}</span></div>
    </div>`;
  }

  window.renderSprint = function () {
    const body = document.getElementById('sprint-body'); if (!body) return;
    const s = load();

    if (!s.atual) {
      body.innerHTML = `
        <div class="sp-planning">
          <div class="sp-plan-t">${icon('flag', 18)} Planejar a semana ${semanaISO()}</div>
          <div class="sp-plan-s">Uma meta. Até ${MAX_SPRINT} itens. Formação primeiro, projeto junto.</div>
          <div class="sp-plan-form">
            <input id="sp-meta-input" type="text" placeholder="Meta da semana (ex: formar 05-raciocinio + lab resilient-fetch)">
            <button class="btn btn-primary" onclick="sprintPlanejar()">Abrir sprint</button>
          </div>
        </div>
        ${renderBacklog(s, false)}`;
      return;
    }

    const done = s.atual.itens.filter(i => i.status === 'done');
    const doing = s.atual.itens.filter(i => i.status === 'doing');
    const todo = s.atual.itens.filter(i => i.status === 'sprint');
    const pct = s.atual.itens.length ? Math.round(done.length / s.atual.itens.length * 100) : 0;

    body.innerHTML = `
      <div class="sp-head">
        <div>
          <div class="sp-meta">${icon('target', 15)} ${esc2(s.atual.meta)}</div>
          <div class="sp-sub">${s.atual.semana} · ${diasRestantes()}d restantes · ${done.length}/${s.atual.itens.length} feitos (${pct}%)</div>
        </div>
        <div class="sp-bar"><div class="sp-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="sp-cols">
        <div class="sp-col"><div class="sp-col-t">Sprint (${todo.length})</div>${todo.map(i => cardItem(i, 'sprint')).join('') || '<div class="sp-vazio">puxe do backlog</div>'}</div>
        <div class="sp-col"><div class="sp-col-t">Fazendo (${doing.length}/${MAX_WIP})</div>${doing.map(i => cardItem(i, 'doing')).join('') || '<div class="sp-vazio">WIP vazio</div>'}</div>
        <div class="sp-col"><div class="sp-col-t">Feito (${done.length})</div>${done.map(i => cardItem(i, 'done')).join('') || '<div class="sp-vazio">—</div>'}</div>
      </div>
      <div class="sp-retro">
        <input id="sp-retro-input" type="text" value="${esc2(s.atual.retro || '')}"
          placeholder="Retro (1 frase): o que muda na próxima semana?">
        <button class="btn btn-ghost btn-sm" onclick="sprintRetro()">Salvar</button>
      </div>
      ${renderBacklog(s, true)}
      ${s.historico.length ? `<div class="sp-hist"><div class="sp-col-t">Sprints anteriores</div>${s.historico.slice(0, 6).map(h =>
        `<div class="sp-hist-item"><b>${h.semana}</b> · ${esc2(h.meta)} · ${h.done}/${h.total}${h.retro ? ` · <i>${esc2(h.retro)}</i>` : ''}</div>`).join('')}</div>` : ''}
    `;
  };

  function renderBacklog(s, comPuxar) {
    return `
      <div class="sp-backlog">
        <div class="sp-col-t">Backlog (${s.backlog.length})</div>
        <div class="sp-novo">
          <input id="sp-novo-input" type="text" placeholder="Novo item...">
          <select id="sp-novo-tipo"><option value="formacao">formação</option><option value="projeto" selected>projeto</option><option value="outro">outro</option></select>
          <button class="btn btn-ghost btn-sm" onclick="sprintAddNovo()">Adicionar</button>
        </div>
        ${s.backlog.slice(0, 25).map(i => `<div class="sp-item">
          <div class="sp-item-t">${esc2(i.titulo)}</div>
          <div class="sp-item-b">${tipoChip(i.tipo)}<span class="sp-acoes">${comPuxar ? `<button onclick="sprintPuxar('${i.id}')">Puxar</button>` : ''}</span></div>
        </div>`).join('') || '<div class="sp-vazio">vazio</div>'}
        ${s.backlog.length > 25 ? `<div class="sp-vazio">+${s.backlog.length - 25} itens antigos</div>` : ''}
      </div>`;
  }
})();
