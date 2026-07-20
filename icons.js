// icons.js — set de ícones autorais do hub (monoline 24×24, stroke currentColor).
// Estende a mão que o app já usava na nav/toolbar (Feather-like) para tudo que era emoji.
// Uso: icon('brain', 18) ou icon('brain', 18, 'trilha-ico'). Herda cor via currentColor.
(function () {
  // inner markup de cada ícone (sem o <svg> wrapper — o helper monta)
  const P = {
    // ── trilhas / domínios ─────────────────────────────────────
    target:      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    brain:       '<path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9c0 1 .4 1.7 1 2.3-.6.6-1 1.4-1 2.4A2.6 2.6 0 0 0 7.5 16 2.5 2.5 0 0 0 10 18.5V4.2A.2.2 0 0 0 9 4Z"/><path d="M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 9c0 1-.4 1.7-1 2.3.6.6 1 1.4 1 2.4A2.6 2.6 0 0 1 16.5 16 2.5 2.5 0 0 1 14 18.5V4.2A.2.2 0 0 1 15 4Z"/>',
    broom:       '<path d="M19 5l-7 7"/><path d="M6 21c-1.5-1.5-1.5-4 0-6l3-3 6 6-3 3c-2 1.5-4.5 1.5-6 0Z"/><path d="M9 15l-2 2M12 18l-2 2"/>',
    flask:       '<path d="M9 3h6M10 3v6l-4.5 8A2 2 0 0 0 7.3 20h9.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M8 14h8"/>',
    'git-branch':'<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 7.5v9M18 10.5c0 4-6 2-6 6"/>',
    columns:     '<path d="M3 9l9-5 9 5"/><path d="M4 9v9M9 9v9M15 9v9M20 9v9"/><path d="M3 20h18"/>',
    clipboard:   '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1H9Z"/><path d="M9 11h6M9 15h4"/>',
    database:    '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    refresh:     '<path d="M20 8a8 8 0 0 0-14-2M4 6v4h4"/><path d="M4 16a8 8 0 0 0 14 2M20 18v-4h-4"/>',
    cpu:         '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    palette:     '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.6 1.7-1.6H16a5 5 0 0 0 5-5c0-3.6-3.5-6.4-9-6.4Z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="11" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/>',
    brush:       '<path d="M14 4l6 6-9 9-4 1 1-4Z"/><path d="M11 7l6 6"/><path d="M6 16c-1.5.5-2 2-2 4 2 0 3.5-.5 4-2Z"/>',
    film:        '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    cube:        '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="M12 3v18M20 7.5L12 12 4 7.5"/>',
    plug:        '<path d="M9 3v5M15 3v5"/><path d="M7 8h10v3a5 5 0 0 1-10 0Z"/><path d="M12 16v5"/>',
    gear:        '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 6l2.1 2.1M17.7 15.9l2.1 2.1M2 12h3M19 12h3M4.2 18l2.1-2.1M17.7 8.1l2.1-2.1"/>',
    lock:        '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/>',
    package:     '<path d="M12 3l8 4v10l-8 4-8-4V7Z"/><path d="M4 7l8 4 8-4M12 11v10M8 5l8 4"/>',
    globe:       '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
    shield:      '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z"/>',
    'trending-up':'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    mic:         '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
    zap:         '<path d="M13 2L4 14h7l-1 8 9-12h-7Z"/>',

    // ── atributos RPG ──────────────────────────────────────────
    dumbbell:    '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
    owl:         '<path d="M5 9a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0Z"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M9 10h.01M15 10h.01M12 13v2M6 4l2 2M18 4l-2 2"/>',
    speech:      '<path d="M4 5h16v11H9l-4 4v-4H4Z"/><path d="M8 10h8M8 13h5"/>',

    // ── builds ─────────────────────────────────────────────────
    wizard:      '<path d="M12 2l4 9H8Z"/><path d="M6 11h12l1 3H5Z"/><path d="M4 20c3-2 13-2 16 0"/>',
    sword:       '<path d="M14 3h7v7L11 20l-3-3Z"/><path d="M8 17l-4 4M5 14l5 5"/>',
    crystal:     '<circle cx="12" cy="10" r="6"/><path d="M8 19h8M9 21h6"/><path d="M10 8a2.5 2.5 0 0 1 2.5-2.5"/>',
    dice:        '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    rocket:      '<path d="M12 3c3 1.5 5 5 5 9l-2 3H9l-2-3c0-4 2-7.5 5-9Z"/><circle cx="12" cy="9" r="1.6"/><path d="M9 16l-2 4M15 16l2 4M12 18v3"/>',
    sparkles:    '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>',
    search:      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',

    // ── conquistas / projetos / diversos ───────────────────────
    bug:         '<rect x="8" y="7" width="8" height="12" rx="4"/><path d="M8 11H4M8 15H4M16 11h4M16 15h4M9 7l-1-3M15 7l1-3M12 7v12"/>',
    'grad-cap':  '<path d="M12 4L2 9l10 5 10-5Z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    running:     '<circle cx="13" cy="5" r="2"/><path d="M11 8l-3 3 3 2 1 5M11 13l-3 1-2 3M14 11l3 1 1 3"/>',
    briefcase:   '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    'bar-chart': '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    eye:         '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    phone:       '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    wrench:      '<path d="M15 3a5 5 0 0 0-4 8l-7 7 2 2 7-7a5 5 0 0 0 6-6l-3 3-2-2 3-3a5 5 0 0 0-2-2Z"/>',
    video:       '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3Z"/>',
    flag:        '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
    coffee:      '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 9h2a2 2 0 0 1 0 5h-2"/><path d="M8 3v2M11 3v2M14 3v2"/>',
    'book-open': '<path d="M12 6c-2-1.5-5-2-8-1.5V18c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6Z"/><path d="M12 6v13.5"/>',
    books:       '<path d="M5 4h4v16H5ZM11 4h4v16h-4Z"/><path d="M17 5l3 .5-2.5 15L14.5 20"/>',

    // ── UI / ferramentas / estados ─────────────────────────────
    timer:       '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6M12 5V2"/>',
    play:        '<path d="M7 4l13 8-13 8Z"/>',
    stop:        '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    music:       '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    theme:       '<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/>',
    moon:        '<path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z"/>',
    flame:       '<path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-1.5.7-3 2-4 .3 1.2 1 2 2 2-1-3 0-5 1-7Z"/>',
    wave:        '<path d="M6 12V7a1.5 1.5 0 0 1 3 0M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 11V6.5a1.5 1.5 0 0 1 3 0V12M15 9.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.6 1.6 0 0 1 2.7-1.6L9 14"/>',
    party:       '<path d="M4 20l5-13 8 8Z"/><path d="M9 7l1 2M14 4c1 1 1 2 0 3M18 8c1 0 2 .5 2 2M17 13h.01M20 15h.01"/>',
    pen:         '<path d="M4 20l1-4L16 5l3 3L8 19Z"/><path d="M14 7l3 3"/>',
    alert:       '<path d="M12 4l9 16H3Z"/><path d="M12 10v4M12 17h.01"/>',
    ban:         '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',

    // ── marcadores de status (dot/shape) ───────────────────────
    check:       '<path d="M4 12l5 5L20 6"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    dot:         '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>',
    circle:      '<circle cx="12" cy="12" r="7"/>',
    'half-circle':'<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14Z" fill="currentColor" stroke="none"/>',
    diamond:     '<path d="M12 3l9 9-9 9-9-9Z"/>',
    square:      '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    'chevron-up':'<path d="M6 15l6-6 6 6"/>',
    'chevron-down':'<path d="M6 9l6 6 6-6"/>',
  };

  const FALLBACK = '<circle cx="12" cy="12" r="8"/>';

  // glyph de emoji → nome do ícone. Cobre tudo que o app renderizava como emoji.
  const EMOJI = {
    '🎯':'target','🧠':'brain','🧹':'broom','🧪':'flask','🔀':'git-branch','🏛':'columns',
    '📋':'clipboard','🗄':'database','🔁':'refresh','🔄':'refresh','🔃':'refresh','🤖':'cpu','🎨':'palette','🖌':'brush',
    '🎞':'film','🧊':'cube','🔌':'plug','⚙':'gear','🔒':'lock','📦':'package','🌐':'globe',
    '🛡':'shield','📈':'trending-up','🎤':'mic','⚡':'zap','💪':'dumbbell','🦉':'owl','🗣':'speech',
    '🧙':'wizard','🗡':'sword','🔮':'crystal','🎲':'dice','🚀':'rocket','✨':'sparkles','🔍':'search',
    '🐛':'bug','🎓':'grad-cap','🏃':'running','💼':'briefcase','📊':'bar-chart','👁':'eye',
    '📖':'book-open','📚':'books','⏱':'timer','🍅':'timer','▶':'play','⏹':'stop','🎵':'music',
    '🎭':'theme','😴':'moon','🔥':'flame','👋':'wave','🎉':'party','✍':'pen','⚠':'alert','🚫':'ban',
    '✅':'check-circle','✔':'check','☑':'check-circle','🔴':'dot','🔵':'dot','🟢':'dot','🟡':'dot',
    '◐':'half-circle','○':'circle','◈':'diamond','⬜':'square','⬆':'chevron-up','⬇':'chevron-down',
    '📱':'phone','🏍':'wrench','🎥':'video','🎪':'flag','☕':'coffee',
  };

  function svgOf(name, s, cls) {
    const inner = P[name] || FALLBACK;
    const c = cls ? ` ${cls}` : '';
    return `<svg class="ico${c}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" `
      + `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" `
      + `aria-hidden="true">${inner}</svg>`;
  }

  window.ICONS = P;
  window.ICON_NAME = EMOJI;
  window.icon = (name, size, cls) => svgOf(name, size || 16, cls);

  // troca todo emoji conhecido de uma string por seu SVG autoral (para innerHTML).
  // Remove o variation-selector U+FE0F. Emoji não mapeado é mantido (não deveria ocorrer).
  window.deEmoji = function (str, size, cls) {
    if (str == null) return '';
    return String(str).replace(/([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2705}\u{2714}\u{2611}])️?/gu,
      (m, g) => EMOJI[g] ? svgOf(EMOJI[g], size || 16, cls) : m);
  };

  // remove emoji de uma string (para textContent — toast). Mantém texto e espaços limpos.
  window.stripEmoji = function (str) {
    if (str == null) return '';
    return String(str).replace(/([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2705}\u{2714}\u{2611}])️?\s*/gu, '').trim();
  };

  // ícone embutido em contexto SVG (ex: mapa radial) — <g> em vez de <svg> aninhado.
  window.iconG = function (glyphOrName, cx, cy, size, color) {
    const name = P[glyphOrName] ? glyphOrName : (EMOJI[glyphOrName] || 'circle');
    const s = size || 20, k = s / 24;
    return `<g transform="translate(${(cx - s / 2).toFixed(1)},${(cy - s / 2).toFixed(1)}) scale(${k.toFixed(3)})" `
      + `fill="none" stroke="${color || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || FALLBACK}</g>`;
  };
})();
