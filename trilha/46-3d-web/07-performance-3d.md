# 07 — Performance 3D

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Performance em 3D web tem um orçamento duro: **16,6 ms por frame** a 60 fps — pra tudo (JS, física, render, compositor). O tema é o mais cobrado da trilha em entrevista porque é onde 3D vira engenharia de verdade: medir antes de otimizar, saber onde o gargalo realmente mora (quase nunca é polígono), e assumir que o número "seguro" depende da GPU. Este módulo dá os gargalos em ordem de frequência real, a teoria de cada otimização, e a disciplina de provar com número.

---

## § BASE — o fundamento

**O gargalo nº 1 é draw call, não polígono (Wloka 2003).** Cada par mesh×material é uma **submissão CPU→GPU com rebind de estado** (shader, texturas, uniforms). Matthias Wloka mediu e nomeou isso na GDC 2003, "Batch, Batch, Batch: What Does It Really Mean?": o custo dominante de uma cena típica não é a GPU rasterizando triângulos, é a **CPU montando e enviando os comandos**. Uma GPU moderna come milhões de triângulos por frame; algumas centenas de draw calls já estrangulam a CPU. Alvo de bolso: **< 100 calls** pra cena com UI em cima. Medir: `renderer.info.render.calls`. Isso **inverte a intuição** de contar polígono — e é a chave do módulo.

**Instancing — N cópias em 1 draw call.** Quando você tem N cópias do mesmo mesh (partículas, cards, colunas de um gráfico 3D), o `InstancedMesh(geo, mat, N)` as envia numa **única** submissão: `setMatrixAt(i, matrix)` posiciona cada instância, `instanceMatrix.needsUpdate = true` sobe pra GPU. Transforma 500 calls em 1. É a otimização com melhor razão esforço/ganho do three, e é o mecanismo por trás do "não baixe polígono, baixe draw call".

**LOD e frustum culling — Clark (1976).** James Clark, "Hierarchical Geometric Models for Visible Surface Algorithms" (CACM 1976), fundou duas ideias que ainda estruturam todo engine:
- **Frustum culling:** não desenhe o que a câmera não vê. Objetos fora do volume da câmera são descartados **antes** da rasterização (o three faz por bounding sphere automaticamente). Clark propôs a hierarquia que torna isso barato: testa o pai; se o pai está fora, pula a subárvore inteira.
- **LOD (Level of Detail):** troque a geometria pela distância. `THREE.LOD()` com `addLevel(meshDetalhado, 0)`, `addLevel(meshSimples, 20)`, `addLevel(placa, 60)` — longe, ninguém vê o detalhe, então não pague por ele. Relevante em cena com profundidade real; **irrelevante num deck onde tudo está a 5 unidades da câmera** — saber quando NÃO usar é parte da skill.

**Fill rate e pixel ratio — o custo quadrático.** O fragment shader (módulo 01) roda por *fragmento*, e o número de fragmentos escala com a **área em pixels**. Retina tem `devicePixelRatio` 2–3; como área é largura×altura, dpr 3 = **9×** os fragmentos de dpr 1. `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` é a linha de maior ganho por caractere do three. Em mobile com cena pesada, capar em 1,5 é defensável — ninguém vê a diferença num fundo em movimento.

**Leaks de GPU — o GC não libera VRAM.** O garbage collector do JS libera objetos JS, **não** os buffers na GPU. Remover um mesh sem `geometry.dispose()`, `material.dispose()` e `texture.dispose()` deixa a VRAM ocupada — em SPA React que monta/desmonta a cena a cada navegação, a memória sobe até o **context lost** (o browser mata o contexto WebGL). Verificação: `renderer.info.memory` (`geometries`, `textures`) deve voltar ao baseline após desmontar. Em React, isso mora no cleanup do `useEffect`.

**A armadilha declarada — nenhum número aqui é constante universal.** "< 100 draw calls", "dpr ≤ 2", "esfera 16×16 basta" são **regras de bolso**, não leis. Performance 3D na web é altamente dependente de **GPU e driver**: a mesma cena roda a 120 fps num desktop com GPU dedicada e a 15 fps num integrado sob throttling térmico, ou a 3 fps sob SwiftShader via RDP (módulo 01). Por isso a disciplina não é "decore o teto seguro" — é **medir no alvo**. O número que importa é o que o `renderer.info` mostra na máquina do cliente, não o do tutorial.

**Mobile como restrição de projeto, não afterthought.** GPU de celular tem fração da banda, throttling após ~2 min, e bateria. Orçamento mobile: metade dos draw calls, dpr capado, sombras off, texturas ≤ 1024². Se o projeto "vai ver mobile depois", vai reescrever depois.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os gargalos se organizam por **onde no pipeline (módulo 01) o tempo é gasto** — e cada um tem um teste barato que o isola:

```
GARGALO           ONDE            SINTOMA                  TESTE QUE ISOLA         FIX
draw calls        CPU (submissão) fps cai com nº de objetos renderer.info.calls    InstancedMesh / merge
fill rate         GPU (fragment)  fps cai com resolução    setPixelRatio(1)→subiu? capar dpr / shader
geometria fora    rasterização    muito triângulo visível  info.render.triangles   frustum cull / LOD
VRAM leak         memória GPU     degrada com o tempo/nav   info.memory sobe        dispose() no cleanup
```

Regra estrutural: **você não sabe o gargalo até medir, e cada gargalo tem um teste de 1 minuto que o confirma ou refuta** (é o método científico do módulo 05 de raciocínio, aplicado a fps). O erro clássico é "otimizar no escuro" — reduzir polígono quando o gargalo era draw call, ou colocar `useMemo` quando o gargalo era fill rate. A ordem de suspeita, por frequência: draw calls → fill rate → VRAM → triângulo de verdade (o último, raro).

---

## § METODOLOGIA — o passo-a-passo replicável

**Diagnosticar uma cena lenta — medir, hipótese, refutar, só então mexer:**

**1. Baseline objetivo, não "parece lento".** `console.table(renderer.info.render)` (calls, triangles) e `renderer.info.memory` (geometries, textures).

**2. Hipótese A — draw calls.** Calls nas centenas? Converta cópias em `InstancedMesh` e **re-meça**: calls deve despencar. Confirmou ou refutou.

**3. Hipótese B — fill rate.** `renderer.setPixelRatio(1)`. fps subiu muito? O gargalo é o fragment shader/resolução → cape o dpr ou simplifique o shader.

**4. Hipótese C — VRAM.** Navegue/monte-desmonte e olhe `info.memory`. Sobe e não volta? Falta `dispose()`.

**5. Só o que sobra é triângulo de verdade** — LOD/culling. Raro; deixe por último.

**Anti-padrões:**
- **Otimizar antes de medir:** o pecado capital. "Usaria `useMemo`" antes de saber o gargalo é resposta errada.
- **Baixar polígono quando o gargalo é draw call:** mexe no lugar errado, o fps não sobe.
- **LOD num deck de câmera fixa:** complexidade sem ganho. Saber não-usar conta.
- **Confiar no número do tutorial:** o teto seguro é do hardware-alvo, medido — não uma constante.
- **Deixar dispose pro "depois":** o leak degrada devagar e não aparece em profiler de JS.

---

## Passo-a-passo aplicado (faça agora, ~40min)

Cenário AG plausível: um fundo 3D atrás de um dashboard começa a derrubar o fps da UI. Método — medir, formular hipótese, refutar ou confirmar, só então mexer:

```js
// 1. Baseline objetivo (não "parece lento"):
console.table(renderer.info.render);   // calls, triangles
console.table(renderer.info.memory);   // geometries, textures

// 2. Hipótese A: draw calls. 300 partículas como meshes individuais?
//    → InstancedMesh:
const m = new THREE.InstancedMesh(geoParticula, matParticula, 300);
const M = new THREE.Matrix4();
for (let i = 0; i < 300; i++) {
  M.setPosition(rand(-10, 10), rand(-5, 5), rand(-10, 0));
  m.setMatrixAt(i, M);
}
scene.add(m); // re-medir: calls deve despencar de ~300 pra ~1

// 3. Hipótese B: fill rate. Teste barato que isola a variável:
renderer.setPixelRatio(1); // fps subiu muito? → gargalo é fragment shader/resolução
```

Pra ver frame a frame o que a GPU fez, **Spector.js** (extensão do time Babylon.js) captura um frame e lista cada draw call com estado, shaders e texturas — é o "explain plan" do WebGL. Complemento: overlay de fps com `stats.js` (mrdoob) e o Performance panel do DevTools pra separar tempo de JS do tempo de GPU.

E o cleanup React que evita o leak:

```js
useEffect(() => {
  // ...montagem da cena...
  return () => {
    scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((mt) => mt?.dispose());
    });
    renderer.dispose();
  };
}, []);
```

Faça a medição **em duas máquinas diferentes** e compare os fps para a mesma cena: é a prova viva de que o "número seguro" é do hardware, não uma constante.

---

## Por que cai em entrevista

Performance é o tema onde 3D vira pergunta de engenharia de verdade: orçamento de frame, medição antes de otimização, trade-offs de plataforma. "Como você descobriria por que a cena está lenta?" é pergunta de processo — a resposta certa começa com medir, nunca com "usaria useMemo". E dizer "o número seguro depende da GPU, então eu meço no alvo" mostra que você entende a natureza do problema, não decorou um teto.

> **P:** "Sua cena three.js caiu pra 20 fps. Qual seu processo?"
>
> **R (30s):** "Meço antes de tocar em código: `renderer.info` me dá draw calls e triângulos; se calls está nas centenas, a hipótese principal é submissão CPU, e instancing ou merge de geometria resolve. Pra separar CPU de GPU, um teste barato: derrubo o pixel ratio pra 1 — se o fps sobe, o gargalo é fill rate, e eu capo o dpr ou simplifico o shader. Se nada disso explica, capturo um frame no Spector.js e olho call a call. E num caso de SPA, sempre confiro `info.memory` após desmontar — leak de VRAM por falta de dispose degrada aos poucos e não aparece em profiler de JS."

> **P:** "Quantos polígonos são 'seguros' pra uma cena web?"
>
> **R (30s):** "Não existe número fixo, e essa é a resposta — performance 3D na web depende muito de GPU e driver. A mesma cena voa num desktop com GPU dedicada e engasga num integrado sob throttling, ou arrasta a 3 fps sob render por software num RDP. Fora isso, polígono raramente é o gargalo: GPU moderna come milhões de triângulos, o que estrangula é draw call na CPU. Então eu não decoro um teto — eu meço no hardware-alvo com o `renderer.info`, e é esse número que vale, não o do tutorial. Regra de bolso eu tenho, tipo menos de 100 draw calls com UI em cima, mas é ponto de partida pra medir, não garantia."

---

## Checkpoint

- [ ] Sei o orçamento de ms por frame a 60 fps e o que disputa esse tempo
- [ ] Sei por que draw call (submissão CPU) domina, não polígono — e sei citar o "Batch, Batch, Batch"
- [ ] Converti uma cena de N meshes pra InstancedMesh e provei a queda de calls com `renderer.info`
- [ ] Fiz o teste do pixel ratio e sei por que o custo de fill rate é quadrático no dpr
- [ ] Provoquei um leak (montar/desmontar sem dispose) e o vi em `info.memory`
- [ ] Sei explicar por que o "número seguro" depende de GPU/driver e por que meço no alvo

---

## Recursos

- "Batch, Batch, Batch: What Does It Really Mean?" — Matthias Wloka, NVIDIA, GDC (2003): o custo CPU do draw call
- "Hierarchical Geometric Models for Visible Surface Algorithms" — James Clark, CACM (1976): frustum culling e LOD hierárquico
- three.js — docs, `InstancedMesh`, `LOD` e `WebGLRenderer.info`: as ferramentas e os números
- three.js — manual, "Rendering on Demand", "Optimize Lots of Objects" e "Cleanup": os padrões de otimização e dispose
- Spector.js (Babylon) e stats.js (mrdoob): captura de frame e overlay de fps
- MDN — "WebGL best practices": o checklist do lado da spec
