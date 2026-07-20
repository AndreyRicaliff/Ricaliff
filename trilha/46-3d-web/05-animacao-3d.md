# 05 — Animação 3D

## O que é

Animação em tempo real é uma função `estado(t)` avaliada a cada frame do **`requestAnimationFrame`** (rAF): o browser chama seu callback antes de cada repaint — 60×/s num monitor comum, 120+ em telas high-refresh, e **zero em aba oculta** (rAF pausa; já nos custou um falso "animação travada" ao testar um deck num painel de preview em aba de fundo — a evidência certa era o dado, não o print).

O erro estrutural nº 1: animar por incremento fixo (`x += 0.01` por frame). Em 120 Hz roda 2× mais rápido; num frame perdido, salta. A correção tem dois nomes:
- **Delta time:** medir o tempo entre frames e escalar tudo por ele — `x += velocidade * dt`.
- **Tempo absoluto:** quando possível, derivar o estado direto de `t` (`rotation.y = t * 0.0005`) — imune a acúmulo de erro.

**Lerp e damping** são a assinatura de animação "cara": em vez de pular pro alvo, persegui-lo. `atual += (alvo - atual) * fator` por frame dá desaceleração exponencial — rápido longe, suave perto. Mas esse `fator` fixo por frame reintroduz a dependência de frame rate; a forma correta com dt é `atual += (alvo - atual) * (1 - Math.exp(-lambda * dt))` — o `THREE.MathUtils.damp(atual, alvo, lambda, dt)` já faz exatamente isso.

**Órbita de câmera:** coordenadas esféricas — a câmera vive num raio ao redor do alvo: `x = r·sin(θ)·cos(φ)`, `y = r·sin(φ)`, `z = r·cos(θ)·cos(φ)`, e `camera.lookAt(alvo)` a cada frame. O `OrbitControls` (addon oficial, com `enableDamping = true` + `controls.update()` no loop) entrega isso pronto — escrever na mão uma vez é o exercício; usar o pronto é a decisão de produção.

**AnimationMixer:** pra assets glTF com animação embutida (personagem, logo extrudado): `mixer = new THREE.AnimationMixer(modelo)`, `mixer.clipAction(clip).play()`, e `mixer.update(dt)` no loop. Você não anima osso a osso — o clip veio do Blender.

---

### Passo-a-passo: parallax por pointer (o deck imersiva)

Caso real: no deck imersiva da AG, a cena inclina sutilmente seguindo o mouse — profundidade sem roubar o controle do usuário. A receita, com damping correto por dt:

```js
const alvo = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  alvo.x = (e.clientX / innerWidth  - 0.5) * 0.3;  // ±0.15 rad ≈ ±8.6° — sutileza é o ponto
  alvo.y = (e.clientY / innerHeight - 0.5) * 0.2;
});

let prev = 0;
renderer.setAnimationLoop((t) => {
  const dt = Math.min((t - prev) / 1000, 0.1); // clamp: aba voltou do fundo → dt gigante → salto
  prev = t;
  grupo.rotation.y = THREE.MathUtils.damp(grupo.rotation.y, alvo.x, 4, dt);
  grupo.rotation.x = THREE.MathUtils.damp(grupo.rotation.x, alvo.y, 4, dt);
  renderer.render(scene, camera);
});
```

Três decisões defendíveis embutidas: (1) o **clamp do dt** — sem ele, voltar de aba oculta produz um dt de segundos e a cena teleporta; (2) amplitude pequena — parallax é tempero, não prato; (3) `pointermove` em vez de `mousemove` cobre caneta e touch.

**Lição de produção (bug real):** gatear animação em `prefers-reduced-motion` parecia boa prática — até descobrirmos que sessão RDP no Windows **força o flag pra `reduce`**, congelando o deck justamente na máquina da apresentação. Duas vezes. A hipótese "flag = preferência consciente do usuário" foi refutada pelo ambiente. Decisão registrada: em deck de apresentação nosso, o flag não desliga a animação; num produto público, oferecemos toggle explícito. Trade-off consciente, documentado, e não um dogma de checklist.

---

## Por que cai em entrevista

Frame rate independence é pergunta clássica de quem contrata pra qualquer coisa interativa (games, mapas, dashboards animados): denuncia em 30 segundos quem já viu a animação rodar 2× mais rápido num monitor de 120 Hz e quem só testou na própria máquina.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que animar com `x += 0.01` por frame é bug, e como corrige?"
>
> **R (30s):** "Porque frame não é unidade de tempo: em 120 Hz esse código roda o dobro da velocidade, e num engasgo ele salta. Corrijo com delta time — escalo velocidade pelo tempo real entre frames — ou derivo o estado direto do timestamp. E tem a armadilha do retorno de aba: rAF pausa em aba oculta, então o primeiro dt na volta pode ser de segundos; eu clampo o dt pra evitar o teleporte. Pra suavização, uso damping exponencial com dt, que o three já dá pronto no `MathUtils.damp`."

---

## Checkpoint

- [ ] Reproduzi o bug do incremento fixo limitando o monitor/emulando e vi a diferença
- [ ] Implementei o parallax com `damp` + clamp de dt e sei justificar cada linha
- [ ] Sei escrever lerp na mão e explicar por que fator fixo por frame é sutilmente errado
- [ ] Usei OrbitControls com damping e sei o que `controls.update()` faz no loop
- [ ] Sei contar o caso do reduced-motion via RDP e o trade-off decidido

---

## Recursos

- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [three.js — MathUtils.damp](https://threejs.org/docs/#api/en/math/MathUtils.damp)
- [three.js — OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [three.js — AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- "Frame Rate Independent Damping Using Lerp" — artigo de Rory Driscoll (referência clássica do damp com exp)
