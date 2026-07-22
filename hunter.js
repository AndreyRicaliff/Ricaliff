// hunter.js — sistema de atributos estilo Solo Leveling.
// Status window com rank E→S por atributo, daily quest com penalidade de streak,
// e log de treino físico alimentando STR/CON/DEX. Substitui o player card do dash
// (app.js delega via hunterWindow()). Reusa a economia existente: loadAttrState(),
// addAttribute(), addXpTrilha() — nada de moeda nova.
(function () {
  const DKEY = 'agh_daily';
  const TKEY = 'agh_treinos';

  // curva calibrada na escala REAL do produtor de XP (str~200 após meses de grind).
  // S é aspiracional de propósito — Solo Leveling começa no E.
  const RANKS = [[300, 'S'], [180, 'A'], [100, 'B'], [50, 'C'], [20, 'D'], [-Infinity, 'E']];
  const rankOf = v => RANKS.find(([min]) => v >= min)[1];
  const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const esc3 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── daily quest (Solo Leveling: obrigatória; falhar zera a streak) ──
  const DAILY_DEFAULT = [
    { id: 'treino', label: 'Treino físico 30min', auto: 'treino' },
    { id: 'recall', label: '10 cards de recall', auto: 'recall' },
    { id: 'formacao', label: '1h de formação (aula/biblio/lab)', auto: null },
    { id: 'entrega', label: '1 item de sprint concluído ou commit real', auto: 'sprint' },
  ];

  function loadDaily() {
    let d;
    try { d = JSON.parse(localStorage.getItem(DKEY) || 'null'); } catch { d = null; }
    if (!d) d = { config: DAILY_DEFAULT, dia: null, checks: {}, streak: 0, recorde: 0, bonusDado: false };

    const h = hoje();
    if (d.dia !== h) {
      // virada de dia: ontem incompleto = penalidade (streak zera) — regra Solo Leveling
      if (d.dia) {
        const completou = d.config.every(q => d.checks[q.id]);
        if (completou) { d.streak++; d.recorde = Math.max(d.recorde, d.streak); }
        else if (d.streak > 0) { d.streak = 0; setTimeout(() => toast('Daily quest incompleta ontem — streak zerada', 'err'), 800); }
      }
      d.dia = h; d.checks = {}; d.bonusDado = false;
      saveDaily(d);
    }
    return d;
  }
  function saveDaily(d) { localStorage.setItem(DKEY, JSON.stringify(d)); }

  window.dailyToggle = function (id) {
    const d = loadDaily();
    d.checks[id] = !d.checks[id];
    saveDaily(d); verificarBonus(d); renderHunter();
  };
  // auto-check disparado por outros sistemas (srs, sprint, treino)
  window.dailyMarcarAuto = function (tipo) {
    const d = loadDaily();
    const mapa = { 'treino': 'treino', 'recall': 'recall', 'sprint-done': 'entrega' };
    const q = d.config.find(x => x.auto === mapa[tipo] || x.id === mapa[tipo]);
    if (q && !d.checks[q.id]) { d.checks[q.id] = true; saveDaily(d); verificarBonus(d); renderHunter(); }
  };
  function verificarBonus(d) {
    if (d.bonusDado || !d.config.every(q => d.checks[q.id])) return;
    d.bonusDado = true; saveDaily(d);
    try {
      addXpTrilha(10, 'daily quest completa');
      applyAttributeRules('learning', 'daily quest do dia');
      toast('Daily quest completa — bônus liberado');
    } catch (e) { /* sem gamificação, sem bônus */ }
  }
  // sincroniza auto-checks com o estado real dos outros sistemas
  function syncAuto(d) {
    try {
      const srs = JSON.parse(localStorage.getItem('agh_srs') || '{}');
      if (srs.day?.date === hoje() && (srs.day.feitos || 0) >= 10 && !d.checks['recall']) d.checks['recall'] = true;
      const treinos = JSON.parse(localStorage.getItem(TKEY) || '[]');
      const minHoje = treinos.filter(t => t.data === hoje()).reduce((a, t) => a + (t.minutos || 0), 0);
      if (minHoje >= 30 && !d.checks['treino']) d.checks['treino'] = true;
      saveDaily(d);
    } catch (e) { /* estado alheio ilegível — segue manual */ }
  }

  // ── treino físico ─────────────────────────────────────────────────
  const TREINO_ATTR = { forca: { str: 2 }, cardio: { con: 2 }, mobilidade: { dex: 1 }, esporte: { dex: 1, con: 1 } };

  window.treinoRegistrar = function () {
    const tipo = document.getElementById('tr-tipo')?.value;
    const min = parseInt(document.getElementById('tr-min')?.value, 10);
    if (!tipo || !min || min <= 0) { toast('Tipo e minutos do treino', 'err'); return; }
    let treinos; try { treinos = JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch { treinos = []; }
    treinos.unshift({ data: hoje(), tipo, minutos: min });
    localStorage.setItem(TKEY, JSON.stringify(treinos.slice(0, 400)));
    try {
      for (const [attr, val] of Object.entries(TREINO_ATTR[tipo] || {}))
        addAttribute(attr, val, `treino: ${tipo} ${min}min`);
      addXpTrilha(Math.min(10, Math.round(min / 10)), `treino ${tipo} ${min}min`);
    } catch (e) { /* atributos indisponíveis */ }
    dailyMarcarAuto('treino');
    renderHunter();
  };

  window.treinosSemana = function () {
    let t; try { t = JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch { t = []; }
    const corte = new Date(); corte.setDate(corte.getDate() - 7);
    const cs = corte.getFullYear() + '-' + String(corte.getMonth() + 1).padStart(2, '0') + '-' + String(corte.getDate()).padStart(2, '0');
    const sem = t.filter(x => x.data >= cs);
    return { sessoes: sem.length, minutos: sem.reduce((a, x) => a + x.minutos, 0) };
  };

  // ── status window ─────────────────────────────────────────────────
  const ATTR_ICON = { int: 'brain', str: 'dumbbell', dex: 'zap', wis: 'owl', cha: 'speech', con: 'shield' };

  window.hunterWindow = function () {
    const el = document.getElementById('player-card-wrap');
    // SYNC é `let` global do app.js — global LEXICAL: existe como identificador, não como window.SYNC
    if (!el || typeof SYNC === 'undefined' || !SYNC?.player) return false;
    const p = SYNC.player;
    const attrs = loadAttrState(); if (!attrs) return false;
    const d = loadDaily(); syncAuto(d);
    const vals = Object.values(attrs).map(a => a.value ?? 0);
    const rankGeral = rankOf(vals.reduce((a, b) => a + b, 0) / vals.length);
    const tsem = treinosSemana();
    const feitos = d.config.filter(q => d.checks[q.id]).length;

    el.innerHTML = `
    <div class="hw">
      <div class="hw-top">
        <div class="hw-rank hw-rank-${rankGeral}">${rankGeral}</div>
        <div class="hw-id">
          <div class="hw-name">${esc3(p.name)} <span class="hw-title">· ${esc3(p.title)}</span></div>
          <div class="hw-sub">HUNTER Lv${p.level} · ${p.xp} XP · streak diária ${d.streak}d (rec ${d.recorde})</div>
        </div>
      </div>
      <div class="hw-attrs">
        ${Object.entries(attrs).map(([k, a]) => {
          const v = a.value ?? 0, r = rankOf(v);
          return `<div class="hw-attr">
            <span class="hw-attr-ico">${icon(ATTR_ICON[k] || 'circle', 14)}</span>
            <span class="hw-attr-k">${k.toUpperCase()}</span>
            <div class="hw-attr-bar"><div class="hw-attr-fill" style="width:${Math.min(100, v / 3)}%"></div></div>
            <span class="hw-attr-v">${v}</span>
            <span class="hw-attr-r hw-rank-${r}">${r}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="hw-daily">
        <div class="hw-daily-t">${icon('flame', 13)} DAILY QUEST <span>${feitos}/${d.config.length}${feitos === d.config.length ? ' — completa' : ''}</span></div>
        ${d.config.map(q => `<label class="hw-dq ${d.checks[q.id] ? 'ok' : ''}">
          <input type="checkbox" ${d.checks[q.id] ? 'checked' : ''} onchange="dailyToggle('${q.id}')"> ${esc3(q.label)}
        </label>`).join('')}
      </div>
      <div class="hw-treino">
        <div class="hw-daily-t">${icon('dumbbell', 13)} TREINO <span>${tsem.sessoes} sessões · ${tsem.minutos}min na semana</span></div>
        <div class="hw-treino-form">
          <select id="tr-tipo"><option value="forca">força</option><option value="cardio">cardio</option><option value="mobilidade">mobilidade</option><option value="esporte">esporte</option></select>
          <input id="tr-min" type="number" min="5" max="300" step="5" placeholder="min">
          <button class="btn btn-ghost btn-sm" onclick="treinoRegistrar()">Registrar</button>
        </div>
      </div>
    </div>`;
    return true;
  };

  window.renderHunter = function () {
    if (typeof renderPlayerCard === 'function') renderPlayerCard();
  };
})();
