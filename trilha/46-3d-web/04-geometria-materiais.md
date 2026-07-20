# 04 — Geometria e Materiais

## O que é

Toda geometria no three moderno é **`BufferGeometry`**: arrays tipados (`Float32Array`) que vão direto pra GPU como *vertex buffers*. Os atributos padrão: `position` (3 floats por vértice), `normal` (3 floats — direção da superfície, é o que a luz usa), `uv` (2 floats — coordenadas de textura, de 0 a 1) e opcionalmente `index`, que permite reusar vértices entre triângulos (um cubo indexado tem 24 vértices em vez de 36). As primitivas (`BoxGeometry`, `SphereGeometry(raio, widthSegments, heightSegments)`) só geram esses arrays por você. `SphereGeometry(1, 64, 64)` = ~8k triângulos; `(1, 16, 16)` = ~500. Oito esferas de alta resolução num fundo decorativo é dinheiro de GPU jogado fora — ninguém vê a diferença atrás de blur.

**PBR (Physically Based Rendering)** é o modelo de material padrão da indústria (Disney/Unreal popularizaram; glTF adotou): em vez de "cor + brilho" arbitrários, dois parâmetros com significado físico no `MeshStandardMaterial`:
- **`metalness`** (0–1): dielétrico ou metal. Na prática é quase binário — 0 pra plástico/madeira/tecido, 1 pra metal. Valores intermediários só em transições enferrujadas.
- **`roughness`** (0–1): microrrugosidade. 0 = espelho, 1 = fosco. É o dial que você mais mexe.

Regra que economiza horas: **metal sem environment map parece carvão** — metal é essencialmente reflexo, e sem nada pra refletir (módulo 06), fica preto, e a hipótese errada "minha luz tá fraca" leva o iniciante a empilhar luzes inúteis.

**Texturas e UV:** uma textura é uma imagem amostrada pelos UVs. Além da cor (`map`), o PBR usa `normalMap` (relevo falso barato), `roughnessMap`/`metalnessMap` e `aoMap`. Custo real está na **resolução** (2048×2048 RGBA = 16 MB de VRAM, mipmaps à parte) e no formato — em produção usa-se KTX2/basis (comprimido na GPU), não PNG gigante.

**Onde o custo mora de verdade:** contar polígono é intuição de 2005. GPU moderna come milhões de triângulos; o gargalo real é **draw call** (1 por mesh×material) e **troca de material** (rebind de shader/texturas). 200 meshes de 100 triângulos custam mais que 1 mesh de 20 mil. Isso inverte a intuição — e é a ponte pro módulo 07.

---

### Passo-a-passo: material da identidade escura dos decks

Objetivo real: painéis com o look dark+neon dos decks AG (fundos dos slides 3D). Partindo do projeto do módulo 02:

```js
// Painel: pouco polígono, material fazendo o trabalho
const painel = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1.2, 0.06),
  new THREE.MeshStandardMaterial({
    color: 0x0d0d14,          // quase-preto azulado, não #000 (preto puro mata a luz)
    roughness: 0.35,
    metalness: 0.0,
    emissive: 0x7c3aed,       // o "neon": emissive ignora luz da cena
    emissiveIntensity: 0.25,
  })
);
scene.add(painel);

// Verificação, não achismo: quantos draw calls e triângulos custou?
console.log(renderer.info.render); // { calls, triangles, ... } — leia DEPOIS de 1 frame
```

Experimento pra fixar (rode, não leia): varra `roughness` de 0 a 1 com `lil-gui` (`npm i lil-gui`) e observe o highlight abrir; depois ponha `metalness: 1` sem envmap e veja o painel morrer em preto. Você acabou de refutar "metal = brilhante" com evidência.

```js
import GUI from 'lil-gui';
const gui = new GUI();
gui.add(painel.material, 'roughness', 0, 1);
gui.add(painel.material, 'metalness', 0, 1);
```

---

## Por que cai em entrevista

Materiais PBR são vocabulário compartilhado com designers e ferramentas (Blender, Figma-to-3D, glTF) — saber o que `roughness` significa fisicamente mostra que você transita entre código e asset. E "draw call importa mais que polígono" é o tipo de afirmação contraintuitiva que, bem defendida, marca o candidato.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que custa mais numa cena three.js: 100 mil triângulos ou 300 objetos?"
>
> **R (30s):** "Quase sempre os 300 objetos. Cada mesh com seu material é um draw call — uma ida CPU→GPU com rebind de estado — e é aí que o frame morre, não na rasterização. GPU moderna processa milhões de triângulos, mas centenas de draw calls estrangulam a CPU. Eu verifico em `renderer.info.render.calls` antes de otimizar qualquer coisa; se calls está alto, a resposta é mergear geometria ou instancing, não baixar polígono."

---

## Checkpoint

- [ ] Sei listar os 4 atributos padrão de uma BufferGeometry e o que cada um guarda
- [ ] Varri roughness/metalness com lil-gui e sei descrever o efeito de cada um
- [ ] Provoquei o "metal preto sem envmap" e sei explicar a causa
- [ ] Li `renderer.info.render` numa cena minha e sei o que é cada número
- [ ] Sei estimar a VRAM de uma textura 2048×2048 e por que KTX2 existe

---

## Recursos

- [three.js — MeshStandardMaterial](https://threejs.org/docs/#api/en/materials/MeshStandardMaterial)
- [three.js — BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [Khronos — glTF](https://www.khronos.org/gltf/) — o "JPEG do 3D"; a spec de PBR que todo mundo implementa
- [lil-gui](https://lil-gui.georgealways.com/) — painel de tweaking padrão da comunidade three
- [Poly Haven](https://polyhaven.com/) — texturas e HDRIs gratuitos (CC0) pra treinar
