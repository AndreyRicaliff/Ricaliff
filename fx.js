// fx.js — camada de encantamento do hub (nível "site imersivo", reduzido pra app).
// Três módulos ADITIVOS — zero mudança na lógica do app:
//   A) VOID GL   — upgrade do fundo 2D (void.js) pra fragment shader WebGL
//                  theme-aware: lê --primary/--accent/--bg do CSS e recolore
//                  ao vivo quando data-theme muda (Gojo <-> pro).
//   B) INTRO     — boot 1×/sessão: símbolo geométrico se desenha e funde no app.
//   C) REVEALS   — stagger nos cards ao trocar de view (engancha em activateView).
// Disciplina de app (não é showcase): 30fps, DPR capado, pausa em aba oculta,
// P3_REDUCED/?static colapsam tudo pro estado final. Som continua sendo do p3Sfx.
(function () {
'use strict';

// NUNCA gatear no prefers-reduced-motion: em Windows/RDP o flag liga sozinho e
// mataria a camada inteira justamente no ambiente do dono (bug já pago 2×).
// O escape explícito e confiável é ?static=1.
const REDUCED = false;
const STATIC = new URLSearchParams(location.search).has('static');
if (STATIC) document.documentElement.dataset.static = '1'; // CSS colapsa via html[data-static]

/* ---------- helpers ---------- */
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function hexToVec3(n, fb) {
  const h = cssVar(n).replace('#', '');
  if (h.length < 6) return fb;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

/* ---------- CSS injetado (intro + reveals) ---------- */
const st = document.createElement('style');
st.textContent = `
#fx-intro{position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:22px;
  background:radial-gradient(120% 90% at 50% 40%,#0A0620 0%,#040309 60%,#020106 100%);
  transition:opacity .7s cubic-bezier(.22,1,.36,1)}
#fx-intro.done{opacity:0;pointer-events:none}
#fx-intro svg{width:min(150px,30vw);height:auto;overflow:visible}
#fx-intro .fxm-ring{stroke-dasharray:100.5;stroke-dashoffset:100.5;
  animation:fxDraw .8s cubic-bezier(.5,0,.15,1) .15s forwards}
#fx-intro .fxm-ring2{stroke-dasharray:100.5;stroke-dashoffset:100.5;
  animation:fxDraw .7s cubic-bezier(.5,0,.15,1) .4s forwards}
#fx-intro .fxm-core{transform-box:fill-box;transform-origin:center;transform:scale(0);
  animation:fxCore .7s cubic-bezier(.34,1.56,.64,1) .55s forwards}
#fx-intro .fxm-ping{transform-box:fill-box;transform-origin:center;opacity:0;
  animation:fxPing 1.4s cubic-bezier(.16,1,.3,1) .9s forwards}
@keyframes fxDraw{to{stroke-dashoffset:0}}
@keyframes fxCore{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes fxPing{0%{transform:scale(.4);opacity:.6}100%{transform:scale(2.4);opacity:0}}
#fx-intro .fxm-name{font-family:'Montserrat',system-ui,sans-serif;font-weight:800;
  font-size:clamp(26px,5vw,44px);letter-spacing:.34em;text-indent:.34em;color:var(--text,#EDF4FF);
  opacity:0;transform:translateY(10px);animation:fxUp .7s cubic-bezier(.16,1,.3,1) .8s forwards}
#fx-intro .fxm-sub{font-family:'Montserrat',system-ui,sans-serif;font-weight:600;font-size:11px;
  letter-spacing:.3em;text-transform:uppercase;color:var(--muted,#5F79AD);
  opacity:0;animation:fxUp .7s cubic-bezier(.16,1,.3,1) 1.05s forwards}
@keyframes fxUp{to{opacity:1;transform:none}}
.fx-r{animation:fxIn .5s cubic-bezier(.16,1,.3,1) var(--fxd,0ms) backwards}
@keyframes fxIn{from{opacity:0;transform:translateY(14px)}}`;
document.head.appendChild(st);

/* ---------- A · VOID GL — o fundo sobe de canvas 2D pra shader ---------- */
const GLBG = (() => {
  const old = document.getElementById('void-bg');
  if (!old || REDUCED) return null;                 // reduced: mantém o 2D parado que já existe
  const cv = document.createElement('canvas');
  cv.id = 'fx-gl'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
  old.after(cv);
  const gl = cv.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { cv.remove(); return null; }            // sem WebGL: void.js segue no comando
  old.dataset.off = '1'; old.style.display = 'none';  // aposenta o pintor 2D

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  // Mesma linguagem do void 2D (nebulosa azul no alto-direita, roxa embaixo-esquerda,
  // estrelas em drift) — agora com fbm, 3 camadas de parallax de mouse e dither.
  const FRAG = `
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;
uniform vec3 uBg;uniform vec3 uColA;uniform vec3 uColB;uniform vec3 uFg;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
float stars(vec2 uv,float scale,float t){
  vec2 g=uv*scale;vec2 id=floor(g);vec2 f=fract(g)-.5;
  float h=hash(id);if(h<.93)return 0.;
  vec2 o=vec2(hash(id+7.),hash(id+13.))-.5;
  float d=length(f-o*.8);
  float tw=.55+.45*sin(t*(.4+h)+h*40.);
  return smoothstep(.05,.0,d)*tw;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec2 sc=gl_FragCoord.xy/uRes;             // 0..1 na tela
  vec3 col=uBg;
  // nebulosas nas MESMAS posições do void 2D, com drift orbital + fbm respirando
  vec2 c1=vec2(.72+.05*sin(uTime*.11),.80-.05*cos(uTime*.09));
  vec2 c2=vec2(.18+.05*cos(uTime*.07),.24+.05*sin(uTime*.08));
  float n1=fbm(uv*1.6+vec2(uTime*.03,0.));
  float n2=fbm(uv*1.4-vec2(uTime*.024,uTime*.01)+7.3);
  float f1=exp(-3.4*length(sc-c1))*(.55+.45*n1);
  float f2=exp(-3.0*length(sc-c2))*(.55+.45*n2);
  col+=uColA*f1*.38+uColB*f2*.34;
  // 3 camadas de estrelas com parallax de mouse (profundidade)
  vec2 m1=uv+uMouse*.012, m2=uv+uMouse*.026, m3=uv+uMouse*.045;
  col+=uFg*stars(m1+vec2(0.,uTime*.006),20.,uTime)*.45;
  col+=uFg*stars(m2+vec2(.3,uTime*.011),36.,uTime)*.28;
  col+=uFg*stars(m3+vec2(.7,uTime*.018),60.,uTime)*.17;
  // pulso do void: um anel fraco emana do centro a cada ~7s (eco do wipe)
  float ph=fract(uTime/7.0);float rr=ph*1.2;
  col+=mix(uColA,uColB,.5)*smoothstep(.02,0.,abs(length(uv)-rr))*(1.-ph)*.05;
  // vinheta + dither (textura fina, mata banding)
  col*=1.-.34*length(uv);
  float bx=mod(gl_FragCoord.x,4.),by=mod(gl_FragCoord.y,4.);
  col+=(mod(bx*4.+by*3.+bx*by,16.)/16.-.5)*.016;
  gl_FragColor=vec4(col,1.);
}`;
  function sh(t, src) {
    const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('fx shader:', gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uTime', 'uMouse', 'uBg', 'uColA', 'uColB', 'uFg'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

  // tokens do tema -> uniforms; MutationObserver recolore quando data-theme muda
  let colA, colB, colBg, colFg;
  function loadTheme() {
    colA = hexToVec3('--primary', [.18, .66, 1]);
    colB = hexToVec3('--accent', [.62, .44, 1]);
    colBg = hexToVec3('--bg', [.016, .012, .035]);
    colFg = hexToVec3('--text', [.93, .96, 1]);
  }
  loadTheme();
  new MutationObserver(loadTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let mx = 0, my = 0, smx = 0, smy = 0, frame = 0;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1);
  }, { passive: true });

  function resize() {
    const dpr = Math.min(1.5, devicePixelRatio || 1) * .66;   // meia-res: é fundo
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (!w || !h) return false;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    return true;
  }
  addEventListener('resize', resize, { passive: true });

  function draw(t) {
    if (!resize()) return;
    smx += (mx - smx) * .05; smy += (my - smy) * .05;
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uTime, t / 1000);
    gl.uniform2f(U.uMouse, smx, smy);
    gl.uniform3fv(U.uBg, colBg); gl.uniform3fv(U.uColA, colA);
    gl.uniform3fv(U.uColB, colB); gl.uniform3fv(U.uFg, colFg);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  draw(0);                                   // primeiro frame síncrono (aba oculta/RDP)
  if (!STATIC) {
    (function tick(t) {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      if (++frame % 2) return;               // 30fps: ambiente, não jogo
      draw(t || 0);
    })(0);
  }
  return { draw };
})();

/* ---------- B · INTRO 1×/sessão — símbolo se desenha e funde no app ---------- */
(function intro() {
  if (REDUCED || STATIC) return;
  try { if (sessionStorage.getItem('fx-intro')) return; sessionStorage.setItem('fx-intro', '1'); }
  catch (e) { return; }
  const el = document.createElement('div');
  el.id = 'fx-intro';
  el.innerHTML =
    '<svg viewBox="0 0 96 96" aria-hidden="true">' +
    '<circle class="fxm-ring" pathLength="100" transform="rotate(-90 48 48)" cx="48" cy="48" r="30" fill="none" stroke="var(--primary,#2EA8FF)" stroke-width="1.6" opacity=".8"/>' +
    '<circle class="fxm-ring2" pathLength="100" transform="rotate(90 48 48)" cx="48" cy="48" r="40" fill="none" stroke="var(--accent,#9D6FFF)" stroke-width="1.1" opacity=".45"/>' +
    '<circle class="fxm-ping" cx="48" cy="48" r="14" fill="none" stroke="var(--secondary,#6FD3FF)" stroke-width="1.4"/>' +
    '<circle class="fxm-core" cx="48" cy="48" r="5.5" fill="var(--primary,#2EA8FF)"/>' +
    '</svg>' +
    '<div class="fxm-name">RICALIFF</div>' +
    '<div class="fxm-sub">Dev &amp; Estudos</div>';
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('done'), 1900);
  setTimeout(() => el.remove(), 2750);
})();

/* ---------- C · REVEALS — stagger nos cards ao trocar de view ---------- */
function reveal(root) {
  if (REDUCED || STATIC || !root) return;
  const kids = [...root.children].slice(0, 16);   // teto: lista gigante não vira strobo
  kids.forEach((el, i) => {
    el.classList.remove('fx-r'); void el.offsetWidth;   // re-arma a animação
    el.style.setProperty('--fxd', (i * 45) + 'ms');
    el.classList.add('fx-r');
  });
}
if (typeof window.activateView === 'function') {
  const orig = window.activateView;
  window.activateView = function (v) {
    orig(v);
    reveal(document.getElementById('view-' + v));  // no wipe, dispara no pico: os cards montam enquanto a cortina abre
  };
}
reveal(document.querySelector('.view.active'));    // primeira carga

})();
