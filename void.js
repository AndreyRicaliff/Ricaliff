// void.js — fundo "Infinite Void" (tema Gojo). Canvas 2D fixo atrás do app:
// estrelas em drift lento + duas nebulosas (six eyes azul / hollow purple).
// Técnica do template imersivo (§12 canvas generativo) reduzida pra dashboard:
// DPR capado em 1.5, ~ 90 estrelas, 1 frame a cada 2 (30fps é suficiente pra
// ambiente), pausa total em aba oculta. Zero interação — é atmosfera, não show.
(function () {
  const cv = document.getElementById('void-bg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, stars = [], t = 0, frame = 0;

  function resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // estrelas re-semeadas por tamanho de tela (determinístico por índice)
    const n = Math.round(Math.min(120, W * H / 14000));
    stars = Array.from({ length: n }, (_, i) => ({
      x: (i * 137.508) % W,                    // ângulo áureo: espalha sem random
      y: (i * 89.73 + (i * i % 47)) % H,
      r: 0.4 + (i % 5) * 0.28,
      v: 0.02 + (i % 7) * 0.008,
      tw: (i % 9) / 9 * Math.PI * 2,
    }));
  }

  function nebula(cx, cy, raio, cor, alfa) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, raio);
    g.addColorStop(0, cor.replace('A)', alfa + ')'));
    g.addColorStop(1, cor.replace('A)', '0)'));
    ctx.fillStyle = g;
    ctx.fillRect(cx - raio, cy - raio, raio * 2, raio * 2);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // nebulosas em drift orbital lento — six eyes (azul) e hollow purple
    const cx1 = W * 0.72 + Math.sin(t * 0.11) * W * 0.06;
    const cy1 = H * 0.22 + Math.cos(t * 0.09) * H * 0.05;
    const cx2 = W * 0.18 + Math.cos(t * 0.07) * W * 0.05;
    const cy2 = H * 0.78 + Math.sin(t * 0.08) * H * 0.06;
    nebula(cx1, cy1, Math.min(W, H) * 0.55, 'rgba(46,168,255,A)', 0.055);
    nebula(cx2, cy2, Math.min(W, H) * 0.6, 'rgba(157,111,255,A)', 0.05);

    // estrelas: drift vertical lento + cintilação senoidal
    ctx.fillStyle = '#EDF4FF';
    for (const s of stars) {
      s.y -= s.v; if (s.y < -2) s.y = H + 2;
      const a = 0.25 + 0.3 * Math.abs(Math.sin(t * 0.6 + s.tw));
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    if (++frame % 2) return;              // 30fps: ambiente, não jogo
    t += 0.016;
    draw();
  }

  addEventListener('resize', resize, { passive: true });
  resize();
  draw();   // primeiro frame síncrono: o void existe mesmo com rAF pausado (aba oculta/RDP)
  tick();
})();
