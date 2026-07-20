# 07 — Performance 3D

## O que é

Performance em 3D web tem um orçamento duro: **16.6 ms por frame** a 60 fps — pra tudo (JS, física, render, compositor). Os gargalos, em ordem de frequência real:

**Draw calls.** Cada par mesh×material é uma submissão CPU→GPU com rebind de estado. É quase sempre O gargalo — não polígono. Alvo de bolso: **< 100 calls** pra cena com UI em cima, algumas centenas no máximo em desktop. Medir: `renderer.info.render.calls`.

**Instancing.** N cópias do mesmo mesh (partículas, cards, colunas de um gráfico 3D) em **1 draw call**: `InstancedMesh(geo, mat, N)` + `setMatrixAt(i, matrix)` + `instanceMatrix.needsUpdate = true`. Transforma 500 calls em 1. É a otimização com melhor razão esforço/ganho do three.

**LOD (Level of Detail).** `THREE.LOD()` troca a geometria pela distância: `lod.addLevel(meshDetalhado, 0)`, `addLevel(meshSimples, 20)`, `addLevel(placa, 60)`. Relevante em cena com profundidade real; irrelevante num deck onde tudo está a 5 unidades da câmera — saber quando NÃO usar também é a skill.

**Pixel ratio.** Retina tem `devicePixelRatio` 2–3; fragment shader escala com o **quadrado** disso: dpr 3 = 9× os pixels de dpr 1. `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` é a linha de maior ganho por caractere do three. Em mobile com cena pesada, capar em 1.5 é defensável — ninguém vê a diferença num fundo em movimento.

**Leaks de GPU.** O garbage collector do JS **não** libera VRAM. Remover um mesh da cena sem `geometry.dispose()`, `material.dispose()` e `texture.dispose()` deixa os buffers na GPU — em SPA React que monta/desmonta a cena a cada navegação, a memória sobe até o contexto WebGL morrer ("context lost"). Verificação: `renderer.info.memory` (`geometries`, `textures`) deve voltar ao baseline após desmontar. Em React, isso mora no cleanup do `useEffect`.

**Mobile como restrição de projeto, não afterthought:** GPU de celular tem fração da banda, throttling térmico após ~2 min, e bateria. Orçamento mobile: metade dos draw calls, dpr capado, sombras off, texturas ≤ 1024². Se o projeto "vai ver mobile depois", vai reescrever depois.

---

### Passo-a-passo: auditoria de uma cena (fundo 3D de dashboard)

Cenário AG plausível: fundo 3D atrás de um dashboard começa a derrubar o fps da UI. Método — medir, formular hipótese, refutar ou confirmar, só então mexer:

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

Pra ver frame a frame o que a GPU fez, **Spector.js** (extensão do time Babylon.js): captura um frame e lista cada draw call com estado, shaders e texturas — é o "explain plan" do WebGL. Complemento: overlay de fps com `stats.js` (mrdoob) e o Performance panel do DevTools pra separar tempo de JS do tempo de GPU.

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

---

## Por que cai em entrevista

Performance é o tema onde 3D vira pergunta de engenharia de verdade: orçamento de frame, medição antes de otimização, e trade-offs de plataforma. "Como você descobriria por que a cena está lenta?" é pergunta de processo — a resposta certa começa com medir, nunca com "usaria useMemo".

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Sua cena three.js caiu pra 20 fps. Qual seu processo?"
>
> **R (30s):** "Meço antes de tocar em código: `renderer.info` me dá draw calls e triângulos; se calls está nas centenas, a hipótese principal é submissão CPU, e instancing ou merge de geometria resolve. Pra separar CPU de GPU, um teste barato: derrubo o pixel ratio pra 1 — se o fps sobe, o gargalo é fill rate, e eu capo o dpr ou simplifico o shader. Se nada disso explica, capturo um frame no Spector.js e olho call a call. E num caso de SPA, sempre confiro `info.memory` após desmontar — leak de VRAM por falta de dispose degrada aos poucos e não aparece em profiler de JS."

---

## Checkpoint

- [ ] Sei o orçamento de ms por frame a 60 fps e o que disputa esse tempo
- [ ] Converti uma cena de N meshes pra InstancedMesh e provei a queda de calls com `renderer.info`
- [ ] Fiz o teste do pixel ratio e sei o que cada resultado significa
- [ ] Provoquei um leak (montar/desmontar sem dispose) e o vi em `info.memory`
- [ ] Capturei um frame no Spector.js e li a lista de draw calls
- [ ] Sei de cor o orçamento mobile (dpr, sombras, texturas) e por quê

---

## Recursos

- [Spector.js](https://spector.babylonjs.com/) — captura e inspeção de frame WebGL
- [stats.js — mrdoob](https://github.com/mrdoob/stats.js) — overlay de fps/ms
- [three.js — InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh)
- [three.js — manual: Cleanup](https://threejs.org/manual/#en/cleanup) — o padrão de dispose oficial
- [three.js — WebGLRenderer.info](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info)
