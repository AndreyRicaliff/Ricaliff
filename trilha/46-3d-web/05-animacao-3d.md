# 05 — Animação 3D

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Animação em tempo real é uma função `estado(t)` avaliada a cada frame. O bug estrutural de todo iniciante é confundir **frame** com **tempo** — animar por incremento fixo por frame, que roda 2× mais rápido num monitor de 120 Hz e salta num engasgo. Este módulo é a matemática que torna a animação **independente de frame rate**, mais a cicatriz de produção que nenhum tutorial conta: o `requestAnimationFrame` pausa em aba oculta e o RDP força `prefers-reduced-motion`.

---

## § BASE — o fundamento

**O loop e a spec.** O `requestAnimationFrame` (rAF) é definido no *HTML Living Standard* (WHATWG), na seção "Animation frames": o browser chama seu callback **antes de cada repaint** — 60×/s num monitor comum, 120+ em telas high-refresh. Ponto crítico da spec: os callbacks só rodam para documentos **renderizáveis e visíveis**. Consequência prática que já nos custou um falso diagnóstico: **em aba oculta o rAF pausa** (`document.hidden === true`) — testar um deck num painel de preview em aba de fundo mostra a animação "travada" quando ela só está suspensa. A evidência certa ali é o dado (`document.hidden`, contador de frames), não o screenshot.

**Por que incremento fixo é bug — a matemática.** `x += 0.01` por frame é uma **integração de Euler com passo implícito = 1 frame**. Mas frame não é unidade de tempo constante: a velocidade real vira `0.01 × (taxa de frames)`, que muda com o monitor e engasga com o GC. As duas correções:
- **Delta time:** meça o tempo entre frames (`dt`) e escale tudo por ele — `x += velocidade * dt`. A velocidade passa a ser "por segundo", não "por frame".
- **Tempo absoluto:** quando dá, derive o estado direto de `t` — `rotation.y = t * 0.0005`. Imune a acúmulo de erro, porque não integra: reavalia.

**Lerp e damping — a assinatura de animação "cara", e a sutileza que quase todo mundo erra.** Em vez de pular pro alvo, persegui-lo: `atual += (alvo - atual) * fator`. Isso dá desaceleração exponencial — rápido longe, suave perto. Mas esse **`fator` fixo por frame reintroduz a dependência de frame rate**: é a discretização de Euler da equação diferencial `dx/dt = λ·(alvo − x)`, cuja solução exata é `x(t) = alvo + (x₀ − alvo)·e^(−λt)`. A forma correta, independente de dt, sai de amostrar essa exponencial: `atual += (alvo − atual) · (1 − e^(−λ·dt))`. Rory Driscoll formalizou isso em "Frame Rate Independent Damping Using Lerp" (2016); o three empacota em `THREE.MathUtils.damp(atual, alvo, lambda, dt)`. Ou seja: o damping "certo" é o lerp cujo fator é `1 − e^(−λ·dt)`, não um número mágico por frame.

**Órbita de câmera — coordenadas esféricas.** A câmera vive num raio ao redor do alvo: `x = r·sin(θ)·cos(φ)`, `y = r·sin(φ)`, `z = r·cos(θ)·cos(φ)`, com `camera.lookAt(alvo)` a cada frame. O `OrbitControls` (addon oficial, `enableDamping = true` + `controls.update()` no loop) entrega isso pronto — escrever na mão uma vez é o exercício; usar o pronto é a decisão de produção.

**AnimationMixer.** Pra asset glTF com animação embutida (personagem, logo extrudado): `mixer = new THREE.AnimationMixer(modelo)`, `mixer.clipAction(clip).play()`, `mixer.update(dt)` no loop — de novo `dt`, sempre `dt`. Você não anima osso a osso; o clip veio do Blender.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O campo se organiza por **como o estado no frame N depende do anterior** — e é isso que decide se você tem um bug de frame rate:

```
                    depende de frames anteriores?
   TEMPO ABSOLUTO ─────── NÃO ──────►  estado = f(t)      (imune; reavalia)
   estado(t)                            rotation.y = t·k

   DELTA TIME ──────────  SIM, mas       x += v·dt         (correto se dt entra)
   escalado por dt        escalado

   INCREMENTO FIXO ────── SIM, e         x += 0.01         (BUG: frame ≠ tempo)
   por frame              não escalado

   DAMPING ──────────── SIM, exponencial atual += (alvo-atual)·(1-e^(-λ·dt))
                        + dt correto      (o lerp certo)
```

Regra estrutural: **sempre que o estado do frame depende do anterior, `dt` tem que entrar na conta** — seja linearmente (velocidade) ou dentro da exponencial (damping). O único caso que dispensa `dt` é derivar tudo de `t` absoluto. E um instrumento sustenta os três de baixo: o **clamp do `dt`**. Quando a aba volta do fundo (ou o RDP engasga), o primeiro `dt` pode ser de *segundos* — sem clamp, `x += v·dt` teleporta e o damping salta. `dt = min(dt_medido, 0.1)` é a linha que evita o teleporte.

---

## § METODOLOGIA — o passo-a-passo replicável

**Escrever qualquer animação sem bug de frame rate:**

**1. Pergunte: o estado pode sair de `t` absoluto?** Se sim (rotação constante, órbita automática), use — é o mais robusto.

**2. Se depende do anterior, meça `dt` e clampe.** `const dt = Math.min((t - prev)/1000, 0.1); prev = t;` — sempre, antes de qualquer integração.

**3. Velocidade linear → `x += v·dt`. Perseguição suave → `damp(atual, alvo, λ, dt)`.** Nunca fator fixo por frame.

**4. Mantenha amplitudes pequenas em efeitos ambientais.** Parallax/inclinação é tempero: ±8° impressiona, ±30° enjoa.

**5. Decida o comportamento em aba oculta e em reduced-motion *conscientemente*** (veja a cicatriz abaixo) — não por default de checklist.

**Anti-padrões:**
- **`x += 0.01` por frame:** velocidade proporcional à taxa de frames. O bug canônico.
- **Fator de lerp fixo por frame:** sutilmente dependente de frame rate; use `1 − e^(−λ·dt)`.
- **`dt` sem clamp:** retorno de aba oculta → `dt` de segundos → teleporte.
- **`mousemove` em vez de `pointermove`:** perde caneta e touch.
- **Gatear animação em `prefers-reduced-motion` sem pensar no ambiente:** vira congelamento em RDP (a cicatriz).

---

## Passo-a-passo aplicado (faça agora, ~30min)

Caso real: no deck imersiva da AG, a cena inclina sutilmente seguindo o mouse — profundidade sem roubar o controle do usuário. A receita, com damping correto por `dt`:

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

Três decisões defendíveis embutidas: (1) o **clamp do dt** — sem ele, voltar de aba oculta produz `dt` de segundos e a cena teleporta; (2) amplitude pequena — parallax é tempero, não prato; (3) `pointermove` em vez de `mousemove` cobre caneta e touch.

**Cicatriz de produção nº 1 — o rAF que pausa (o void do hub).** Como o rAF só dispara antes do primeiro repaint, uma cena que só desenha dentro do loop aparece **em branco** por um instante — e, se o componente monta em aba oculta, nunca desenha o primeiro frame. Correção adotada no *void* animado do hub: **um primeiro `render()` síncrono** logo após montar a cena, fora do loop, garantindo que o estado inicial aparece mesmo antes do rAF começar (ou enquanto a aba está oculta).

**Cicatriz de produção nº 2 — o reduced-motion do RDP.** Gatear animação em `prefers-reduced-motion` parecia boa prática — até descobrirmos que sessão RDP no Windows **força o flag pra `reduce`**, congelando o deck justamente na máquina da apresentação. Duas vezes. A hipótese "flag = preferência consciente do usuário" foi refutada pelo ambiente. Decisão registrada: em deck de apresentação nosso, o flag **não** desliga a animação; num produto público, oferecemos toggle explícito. Trade-off consciente, documentado, não dogma de checklist.

---

## Por que cai em entrevista

Frame rate independence é pergunta clássica de quem contrata pra qualquer coisa interativa (games, mapas, dashboards animados): denuncia em 30 segundos quem já viu a animação rodar 2× mais rápido num monitor de 120 Hz e quem só testou na própria máquina. E a cicatriz do reduced-motion mostra maturidade — que você distingue "boa prática de checklist" de "decisão medida no ambiente real".

> **P:** "Por que animar com `x += 0.01` por frame é bug, e como corrige?"
>
> **R (30s):** "Porque frame não é unidade de tempo: em 120 Hz esse código roda o dobro da velocidade, e num engasgo ele salta. Corrijo com delta time — escalo velocidade pelo tempo real entre frames — ou derivo o estado direto do timestamp. E tem a armadilha do retorno de aba: rAF pausa em aba oculta, então o primeiro dt na volta pode ser de segundos; eu clampo o dt pra evitar o teleporte. Pra suavização, uso damping exponencial com dt, que o three já dá pronto no `MathUtils.damp`."

> **P:** "Você usa lerp com um fator fixo tipo `x += (alvo-x)*0.1` por frame. Tem algo errado nisso?"
>
> **R (30s):** "Sim, sutilmente: esse fator fixo por frame reintroduz dependência de frame rate. Aquele lerp é a integração de Euler da equação `dx/dt = λ(alvo − x)`, cuja solução exata é uma exponencial decaindo. Em 120 Hz ele aplica o fator duas vezes mais, então a suavização fica mais rápida do que em 60. O jeito certo é usar o fator `1 − e^(−λ·dt)`, que amostra a exponencial pelo tempo real — é o que o `MathUtils.damp` do three faz. Na prática quase ninguém percebe a 60 fps fixos, mas quebra assim que o frame rate varia, e num deck que roda de tudo isso acontece."

---

## Checkpoint

- [ ] Reproduzi o bug do incremento fixo (limitando/emulando o monitor) e vi a diferença
- [ ] Sei que o lerp de fator fixo é Euler de `dx/dt=λ(alvo−x)` e por que `1−e^(−λdt)` é o correto
- [ ] Implementei o parallax com `damp` + clamp de dt e sei justificar cada linha
- [ ] Sei por que o rAF pausa em aba oculta e o que o "primeiro frame síncrono" resolve
- [ ] Usei OrbitControls com damping e sei o que `controls.update()` faz no loop
- [ ] Sei contar o caso do reduced-motion via RDP e o trade-off decidido

---

## Recursos

- *HTML Living Standard* — WHATWG, seção "Animation frames" (`requestAnimationFrame`): a regra de que o callback não roda em documento oculto
- "Frame Rate Independent Damping Using Lerp" — Rory Driscoll (2016): a derivação do damping com `1 − e^(−λ·dt)`
- three.js — docs, `MathUtils.damp`, `OrbitControls` e `AnimationMixer`: as ferramentas prontas
- three.js — manual, seção "Animation System": clock, delta time e o loop
- MDN — "requestAnimationFrame" e "Page Visibility API" (`document.hidden`): o par que explica a pausa em aba oculta
