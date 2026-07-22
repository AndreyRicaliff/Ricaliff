// srs.js — revisão espaçada com active recall sobre os cards P/R da trilha.
// Motor + view "Revisar". Carregado antes do app.js; usa em runtime: toast(),
// addXpTrilha(), applyAttributeRules(), icon() — todos globais já definidos no load.
//
// Modelo: Leitner contínuo (SM-2 simplificado). Card novo entra com intervalo 0;
// avaliação define o próximo: De novo=1d · Difícil=×1.2 · Bom=×2.5 · Fácil=×4.
// Estado em localStorage 'agh_srs' (prefixo agh_ → entra no backup v2 de graça).

(function () {
  const KEY = 'agh_srs';
  const NOVOS_POR_DIA = 10;   // não afogar quem abre a fila pela 1ª vez (172 cards)
  const XP_MIN_SESSAO = 5;    // sessão com >=5 cards revisados rende INT (learning)

  let CARDS = null;           // data/recall-cards.json
  let fila = [];              // fila da sessão atual
  let idx = 0;
  let sessao = { total: 0, bons: 0 };
  let verso = false;

  const hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const addDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const escS = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function loadState() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return { cards: s.cards || {}, day: s.day || {} }; }
    catch { return { cards: {}, day: {} }; }
  }
  function saveState(st) { localStorage.setItem(KEY, JSON.stringify(st)); }

  async function loadCards() {
    if (CARDS) return CARDS;
    try {
      const r = await fetch('/data/recall-cards.json?v=' + Date.now());
      if (!r.ok) throw new Error(r.status);
      CARDS = (await r.json()).cards || [];
    } catch (e) { console.warn('[srs] falha ao carregar recall-cards.json:', e); CARDS = []; }
    return CARDS;
  }

  // intervalos previstos por avaliação (mostrados nos botões, padrão Anki)
  function proximos(reg) {
    const iv = reg?.iv || 0;
    return {
      denovo: 1,
      dificil: Math.max(1, Math.round(iv * 1.2)) || 1,
      bom: iv ? Math.round(iv * 2.5) : 2,
      facil: iv ? Math.round(iv * 4) : 4,
    };
  }

  function montarFila(cards, st) {
    const h = hoje();
    if (st.day.date !== h) st.day = { date: h, novos: 0, feitos: 0 };
    const vencidos = [], novos = [];
    for (const c of cards) {
      const reg = st.cards[c.id];
      if (reg) { if (reg.due <= h) vencidos.push(c); }
      else novos.push(c);
    }
    vencidos.sort((a, b) => st.cards[a.id].due.localeCompare(st.cards[b.id].due));
    const cotaNovos = Math.max(0, NOVOS_POR_DIA - (st.day.novos || 0));
    return [...vencidos, ...novos.slice(0, cotaNovos)];
  }

  window.srsDueCount = async function () {
    const cards = await loadCards();
    return montarFila(cards, loadState()).length;
  };

  window.srsRate = function (rating) {   // 'denovo' | 'dificil' | 'bom' | 'facil'
    const c = fila[idx]; if (!c) return;
    const st = loadState();
    const reg = st.cards[c.id] || { iv: 0, reps: 0, lapses: 0 };
    const novoCard = !st.cards[c.id];
    const p = proximos(reg);
    const iv = p[rating] ?? 1;
    if (rating === 'denovo') reg.lapses++;
    reg.iv = iv; reg.due = addDias(iv); reg.reps++;
    st.cards[c.id] = reg;
    if (novoCard) st.day.novos = (st.day.novos || 0) + 1;
    st.day.feitos = (st.day.feitos || 0) + 1;
    saveState(st);
    sessao.total++;
    if (rating === 'bom' || rating === 'facil') sessao.bons++;
    idx++; verso = false;
    renderCard();
  };

  window.srsMostrar = function () { verso = true; renderCard(); };

  function renderCard() {
    const body = document.getElementById('revisar-body'); if (!body) return;
    const st = loadState();

    if (idx >= fila.length) {
      const pct = sessao.total ? Math.round((sessao.bons / sessao.total) * 100) : 0;
      if (sessao.total >= XP_MIN_SESSAO) {
        try {
          addXpTrilha(sessao.total, `revisão espaçada: ${sessao.total} cards`);
          applyAttributeRules('learning', `recall: ${sessao.total} cards (${pct}% bom+)`);
          toast(`Revisão concluída: ${sessao.total} cards · ${pct}% no ponto`);
        } catch (e) { /* gamificação indisponível — a revisão em si já valeu */ }
      }
      body.innerHTML = `
        <div class="empty" style="padding:60px 20px">
          <div class="empty-i">${icon('check-circle', 34)}</div>
          <div class="empty-t">${sessao.total ? `Sessão concluída — ${sessao.total} cards, ${pct}% no ponto` : 'Nada a revisar hoje'}</div>
          <div class="empty-s">${sessao.total ? 'Os intervalos foram reagendados pela sua avaliação.' : 'Volte amanhã — a curva do esquecimento não descansa.'}</div>
        </div>`;
      atualizarDashCard();
      return;
    }

    const c = fila[idx];
    const reg = st.cards[c.id];
    const p = proximos(reg);
    const trilhaLabel = c.trilha.replace(/^\d+-/, '');
    const pos = `${idx + 1}/${fila.length}`;

    body.innerHTML = `
      <div class="srs-card">
        <div class="srs-meta">
          <span class="srs-chip">${escS(trilhaLabel)}</span>
          <span class="srs-mod">${escS(c.tituloModulo)}</span>
          <span class="srs-pos">${pos}</span>
        </div>
        <div class="srs-q">${escS(c.pergunta)}</div>
        ${verso ? `
          <div class="srs-a">${escS(c.resposta)}</div>
          <div class="srs-hint">Responda em voz alta ANTES de ler — recall falado é o treino de entrevista.</div>
          <div class="srs-actions">
            <button class="srs-btn srs-denovo" onclick="srsRate('denovo')">De novo<span>${p.denovo}d</span></button>
            <button class="srs-btn srs-dificil" onclick="srsRate('dificil')">Difícil<span>${p.dificil}d</span></button>
            <button class="srs-btn srs-bom" onclick="srsRate('bom')">Bom<span>${p.bom}d</span></button>
            <button class="srs-btn srs-facil" onclick="srsRate('facil')">Fácil<span>${p.facil}d</span></button>
          </div>` : `
          <div class="srs-actions">
            <button class="srs-btn srs-show" onclick="srsMostrar()">Mostrar resposta</button>
          </div>
          <div class="srs-hint">Tente responder em voz alta, em ~30 segundos, antes de virar o card.</div>`}
      </div>`;
  }

  window.renderRevisar = async function () {
    const body = document.getElementById('revisar-body'); if (!body) return;
    body.innerHTML = '<div style="color:var(--muted);text-align:center;padding:40px">Carregando cards…</div>';
    const cards = await loadCards();
    if (!cards.length) {
      body.innerHTML = '<div class="empty"><div class="empty-t">Cards indisponíveis</div><div class="empty-s">Verifique data/recall-cards.json (bin/build-cards.sh gera).</div></div>';
      return;
    }
    fila = montarFila(cards, loadState());
    idx = 0; verso = false; sessao = { total: 0, bons: 0 };
    renderCard();
  };

  // card "Revisar hoje" no dashboard
  async function atualizarDashCard() {
    const el = document.getElementById('dash-srs-card'); if (!el) return;
    const n = await srsDueCount();
    const st = loadState();
    const feitos = st.day.date === hoje() ? (st.day.feitos || 0) : 0;
    el.innerHTML = `
      <div class="srs-dash" onclick="go('revisar')" role="button" title="Revisão espaçada">
        <div class="srs-dash-ico">${icon('brain', 20)}</div>
        <div class="srs-dash-txt">
          <div class="srs-dash-n">${n ? `Revisar hoje: ${n}` : 'Revisão em dia'}</div>
          <div class="srs-dash-s">${feitos ? `${feitos} cards feitos hoje · ` : ''}recall &gt; releitura</div>
        </div>
      </div>`;
  }
  window.srsAtualizarDash = atualizarDashCard;

  document.addEventListener('DOMContentLoaded', () => { setTimeout(atualizarDashCard, 400); });
})();
