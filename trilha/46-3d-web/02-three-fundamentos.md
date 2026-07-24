# 02 — three.js: Fundamentos

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

three.js (mrdoob, 2010) é a biblioteca que transformou WebGL de "800 linhas pra desenhar um triângulo" em uma API de cena. Mas a API é a casca; por baixo dos seis substantivos (Scene, Camera, Renderer, Mesh, Material, Light) há **uma matemática só** que faz tudo funcionar — a matriz **MVP** que o vertex shader (módulo 01) aplica a cada vértice. Este módulo dá o vocabulário e, principalmente, o porquê matemático dele: entender por que a câmera usa uma matriz **4×4** e não 3×3 é o que separa quem "monta cena" de quem sabe consertar quando ela distorce.

---

## § BASE — o fundamento

**O problema central: por que 4×4 e não 3×3.** Uma matriz 3×3 aplicada a um vetor 3D representa qualquer transformação **linear** — rotação, escala, cisalhamento. Mas toda transformação linear fixa a origem: `M · 0 = 0`, sempre. Isso significa que **translação é impossível com 3×3** — não existe matriz 3×3 que mova um ponto sem mover a origem junto. E translação é metade do que uma câmera faz.

A saída, que é a ideia mais importante de toda a computação gráfica 3D, são as **coordenadas homogêneas**: introduzidas por August Ferdinand Möbius em *Der barycentrische Calcul* (1827) no contexto da geometria projetiva. Você embute o ponto 3D `(x, y, z)` num espaço 4D como `(x, y, z, 1)` — acrescenta uma quarta coordenada `w = 1`. Agora a translação vira uma matriz **4×4** cuja quarta coluna carrega o deslocamento:

```
┌ 1  0  0  tx ┐   ┌ x ┐   ┌ x + tx ┐
│ 0  1  0  ty │ · │ y │ = │ y + ty │
│ 0  0  1  tz │   │ z │   │ z + tz │
└ 0  0  0  1  ┘   └ 1 ┘   └   1    ┘
```

O truque profundo: **uma transformação *afim* em 3D (rotação + translação) é uma transformação *linear* em 4D** — a translação é um cisalhamento no espaço projetivo. Como virou linear, ela **compõe por multiplicação de matriz** com todas as outras. É isso que permite empilhar "gira, depois move, depois projeta" num **único** produto de matrizes, calculado uma vez e aplicado por vértice na GPU. Sem coordenadas homogêneas, cada vértice precisaria de uma multiplicação *mais* uma soma, e nada componível.

**A matriz MVP — três matrizes, uma multiplicação.** A posição final de cada vértice em *clip space* é `gl_Position = P · V · M · posição`:

- **M (Model)** — leva o vértice do espaço local do objeto para o espaço do mundo (a transformação do `Object3D`: sua posição, rotação, escala; herdada do pai no grafo de cena).
- **V (View)** — leva do mundo para o espaço da câmera. É o **inverso** da matriz de mundo da câmera: mover a câmera para a direita é o mesmo que mover o mundo inteiro para a esquerda.
- **P (Projection)** — leva do espaço da câmera para clip space. A `PerspectiveCamera` gera aqui uma matriz onde a **quarta linha não é trivial**: ela copia `-z` para a coordenada `w`. Depois do shader, a GPU faz a **divisão perspectiva** (`x/w, y/w, z/w`) — e é essa divisão por profundidade que produz o *foreshortening*: objetos distantes encolhem. Uma matriz 3×3 não tem quarta linha, logo **não pode fazer perspectiva**. Essa é a segunda razão do 4×4, além da translação.

**Os seis substantivos, com a matemática por trás:**
- **Scene** — o grafo de cena, uma árvore de `Object3D`. Filho herda a matriz M do pai (mover o pai move os filhos). É só um contêiner; não renderiza.
- **Camera** — dona das matrizes V e P. `PerspectiveCamera(fov, aspect, near, far)`: `fov` em graus (45–75 usual), `aspect = largura/altura`, e `near/far` definem o volume visível. `near: 0.001, far: 1000000` destrói a precisão do z-buffer (que é não-linear, concentrado perto de `near`) e causa **z-fighting** — superfícies piscando por empate de profundidade.
- **Renderer** — `WebGLRenderer` traduz cena+câmera nos draw calls do pipeline do módulo 01. Dono do `<canvas>`, do pixel ratio e do loop.
- **Mesh** — geometria + material. É o que aparece.
- **Material** — como a superfície reage à luz. `MeshBasicMaterial` ignora luz (sempre visível — ótimo pra debug); `MeshStandardMaterial` é PBR (módulo 04) e **renderiza preto sem luz na cena**.
- **Light** — módulo 06. Sem ela, PBR = tela preta: o bug nº 1 de quem começa.

**Convenções que quebram importação:** sistema destro, **Y para cima**, Z apontando para a câmera (padrão OpenGL — Blender e Unreal usam Z-up). Unidade convencional: 1 = 1 metro (luzes físicas e envmaps assumem isso). Rotação em **radianos**: `Math.PI` = 180°.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Há duas hierarquias vivendo ao mesmo tempo, e confundi-las é fonte de bug:

```
GRAFO DE CENA (espaço)           PIPELINE DE RENDER (por frame)
Scene                            setAnimationLoop(fn):
 ├─ Group (M herdada)              1. atualiza estado (rotation, position)
 │   ├─ Mesh  (M própria)          2. renderer.render(scene, camera)
 │   └─ Mesh                          → para cada Mesh: gl_Position = P·V·M·v
 ├─ Light                             → rasteriza, fragment shader, framebuffer
 └─ Camera (define V e P)          3. browser faz repaint
```

- **A hierarquia espacial** é a árvore `Object3D`: transformação relativa ao pai, resolvida na matriz M. É o que você monta.
- **A hierarquia temporal** é o loop: nada redesenha sozinho. Você chama `renderer.render(scene, camera)` a cada frame, tipicamente via `renderer.setAnimationLoop(fn)` — preferível a `requestAnimationFrame` manual porque **pausa em aba oculta** (módulo 05) e funciona em WebXR.

A ponte entre as duas é a câmera: ela pertence ao grafo espacial (tem posição) *e* fornece V e P ao pipeline. Por isso `updateProjectionMatrix()` é obrigatório após mexer em `aspect`/`fov`: você alterou a hierarquia espacial, mas a matriz P que o pipeline usa só recalcula quando você manda.

---

## § METODOLOGIA — o passo-a-passo replicável

**Montar uma cena mínima, na ordem que evita os bugs canônicos:**

**1. Scene + Camera afastada.** A câmera nasce em `(0,0,0)`; deixá-la ali põe o olho *dentro* da geometria (backface culling → nada aparece). `camera.position.z = 3` primeiro.

**2. Renderer com pixel ratio capado.** `setPixelRatio(Math.min(devicePixelRatio, 2))` desde a primeira linha (módulo 07) — retrofitar isso depois é comum.

**3. Mesh com material *sem* luz primeiro.** Comece com `MeshBasicMaterial`: se aparecer, o pipeline está certo; troque para PBR *depois* de adicionar luz. Isolar a variável "luz" evita o falso "minha cena está quebrada".

**4. Luz, então PBR.** Só agora `MeshStandardMaterial` + `DirectionalLight` + `AmbientLight`.

**5. Loop e resize.** `setAnimationLoop`, e no `resize` **sempre** `camera.aspect = …; camera.updateProjectionMatrix()` antes de `renderer.setSize`.

**Método de depuração da tela preta — refutando uma hipótese por vez (módulo 05 de raciocínio):**
- **H1: falta luz.** Troque por `MeshBasicMaterial`. Apareceu? Era luz. (Refuta ou confirma sem tocar em mais nada.)
- **H2: câmera dentro da geometria.** `camera.position.z` está afastado? Backface culling esconde o que está atrás.
- **H3: matriz não atualizada.** Console limpo? three loga `aspect: NaN` quando o resize entrou antes do canvas ter tamanho.
- **Anti-padrão:** mudar as três de uma vez. Se voltar a aparecer, você não sabe qual era a causa — e comprou um bug futuro.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Contexto real: antes de pôr um fundo 3D numa tela do hub (o *void* animado da home), o certo é provar o pipeline mínimo isolado. Projeto do zero:

```bash
mkdir cubo && cd cubo
npm create vite@latest . -- --template vanilla
npm i three
npm run dev
```

`main.js` completo:

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 3; // afasta a câmera — ela nasce em (0,0,0), DENTRO do cubo

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // cap — módulo 07
document.body.appendChild(renderer.domElement);

const cubo = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3 })
);
scene.add(cubo);
scene.add(new THREE.DirectionalLight(0xffffff, 2), new THREE.AmbientLight(0x404040));

renderer.setAnimationLoop((t) => {
  cubo.rotation.y = t / 1000; // tempo, não incremento — módulo 05 explica por quê
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix(); // sem isso o aspect novo NÃO aplica na matriz P
  renderer.setSize(innerWidth, innerHeight);
});
```

Depois de rodar: abra o console e leia `cubo.matrixWorld` e `camera.projectionMatrix` — são as matrizes M e P da §BASE, os 16 números que a GPU multiplica por vértice. Ver os números reais fecha o elo entre a teoria e o que gira na tela.

---

## Por que cai em entrevista

O vocabulário Scene/Camera/Renderer é o "hello world" conceitual: o entrevistador o usa pra medir se você entende o que a lib abstrai — estado de GPU, matrizes, loop — ou se só cola código. Explicar por que um material PBR renderiza preto sem luz demonstra modelo mental; explicar por que a câmera precisa de uma matriz 4×4 demonstra que você sabe a matemática que sustenta *qualquer* engine 3D, não só three.

> **P:** "Descreva o pipeline mínimo do three.js pra pôr um objeto na tela."
>
> **R (30s):** "Quatro peças: uma Scene, que é o grafo de objetos; uma Camera, que define projeção e ponto de vista; um Mesh, que é geometria mais material; e um Renderer, que a cada frame traduz cena e câmera em draw calls de WebGL. Nada desenha sozinho — eu chamo render num animation loop. Os dois erros que sempre pego em code review: material com luz numa cena sem luz, que renderiza preto, e esquecer `updateProjectionMatrix` no resize, que distorce tudo."

> **P:** "Por que a matriz de câmera é 4×4 e não 3×3?"
>
> **R (30s):** "Por duas coisas que uma 3×3 não faz. Uma matriz 3×3 só representa transformações lineares, e toda linear fixa a origem — então translação é impossível com ela. A solução são coordenadas homogêneas: embuto o ponto no 4D com `w=1`, e aí a translação vira uma matriz 4×4 que compõe por multiplicação com rotação e escala; uma transformação afim em 3D é linear em 4D. A segunda razão é a perspectiva: a matriz de projeção usa a quarta linha pra jogar a profundidade no `w`, e a divisão por `w` depois do shader é o que faz objeto distante encolher. Sem a quarta dimensão, não há translação nem perspectiva — por isso 4×4."

---

## Checkpoint

- [ ] Montei o cubo do zero, sem copiar, e ele gira com luz PBR
- [ ] Sei explicar por que translação exige 4×4 e o que são coordenadas homogêneas
- [ ] Sei o que a divisão perspectiva (÷w) faz e por que produz foreshortening
- [ ] Sei explicar por que `MeshStandardMaterial` sem luz = tela preta
- [ ] Sei o que `near`/`far` fazem, por que o z-buffer é não-linear, e o que é z-fighting
- [ ] Fiz o resize funcionar e sei por que `updateProjectionMatrix` é obrigatório

---

## Recursos

- *Der barycentrische Calcul* — August Möbius (1827): a origem das coordenadas homogêneas na geometria projetiva
- *Real-Time Rendering*, 4ª ed. — Akenine-Möller, Haines, Hoffman (2018), cap. 4 "Transforms": as matrizes model/view/projection e o porquê do 4×4, tratado a fundo
- *3D Math Primer for Graphics and Game Development* — Dunn & Parberry: coordenadas homogêneas e matrizes, do zero, para quem quer o degrau intermediário
- three.js — manual (threejs.org/manual), seções "Fundamentals" e "Responsive": o vocabulário aplicado e o resize correto
- three.js — editor online (threejs.org/editor): montar cena sem código pra fixar os seis substantivos
- *Discover three.js* (discoverthreejs.com) — capítulo "First Steps: Your First Scene": a melhor sequência didática do vocabulário
