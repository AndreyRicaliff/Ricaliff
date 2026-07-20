# 02 — three.js: Fundamentos

## O que é

three.js (mrdoob, 2010) é a biblioteca que transformou WebGL de "800 linhas pra desenhar um triângulo" em uma API de cena. O modelo mental tem 6 substantivos, e todos os projetos 3D do mundo three usam os mesmos:

- **Scene** — o grafo de cena: uma árvore de `Object3D`. Filho herda transformação do pai (mover o pai move os filhos). É só um contêiner; não renderiza nada.
- **Camera** — define a projeção. `PerspectiveCamera(fov, aspect, near, far)` é a padrão: `fov` em graus (45–75 é o usual), `aspect = largura/altura`, e `near/far` delimitam o que existe pro z-buffer. Erro clássico de iniciante: `near: 0.001, far: 1000000` — isso destrói a precisão do z-buffer e causa *z-fighting* (superfícies piscando).
- **Renderer** — `WebGLRenderer` traduz cena+câmera em draw calls. Dono do `<canvas>`, do pixel ratio e do loop.
- **Mesh** — geometria + material. É o que aparece.
- **Material** — como a superfície reage à luz. `MeshBasicMaterial` ignora luz (sempre visível — ótimo pra debug); `MeshStandardMaterial` é PBR (módulo 04) e **precisa de luz na cena, senão renderiza preto**.
- **Light** — módulo 06. Sem ela, material PBR = tela preta. Esse é o bug nº 1 de quem começa.

**Coordenadas e unidades:** sistema destro, **Y para cima**, Z apontando para a câmera (padrão OpenGL — Blender e Unreal usam Z-up, cuidado ao importar). Unidades são arbitrárias, mas a convenção é 1 unidade = 1 metro — luzes físicas e envmaps assumem isso. Rotação em **radianos**, nunca graus: `Math.PI` = 180°.

**O loop:** nada redesenha sozinho. Você chama `renderer.render(scene, camera)` a cada frame, tipicamente via `renderer.setAnimationLoop(fn)` (preferível a `requestAnimationFrame` manual: pausa em aba oculta e funciona em WebXR).

---

### Passo-a-passo: primeiro cubo (protótipo do fundo 3D do hub)

Contexto real: antes de pôr um fundo 3D numa tela do hub, o certo é provar o pipeline mínimo isolado. Projeto do zero:

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
  camera.updateProjectionMatrix(); // sem isso o aspect novo NÃO aplica
  renderer.setSize(innerWidth, innerHeight);
});
```

Método de depuração quando a tela vem preta — em ordem, refutando uma hipótese por vez: (1) troque o material por `MeshBasicMaterial` — apareceu? Era luz. (2) `camera.position.z = 3` está lá? Câmera dentro da geometria não vê nada (backface culling). (3) console limpo? three loga câmera com aspect NaN e afins. Não mude três coisas ao mesmo tempo: você não saberá qual era a causa.

---

## Por que cai em entrevista

O vocabulário Scene/Camera/Renderer é o "hello world" conceitual: entrevistador usa pra medir se você entende o que a lib abstrai (estado de GPU, matrizes, loop) ou se só cola código. Explicar por que um material PBR renderiza preto sem luz demonstra modelo mental, não decoreba.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Descreva o pipeline mínimo do three.js pra pôr um objeto na tela."
>
> **R (30s):** "Quatro peças: uma Scene, que é o grafo de objetos; uma Camera, que define projeção e ponto de vista; um Mesh, que é geometria mais material; e um Renderer, que a cada frame traduz cena e câmera em draw calls de WebGL. Nada desenha sozinho — eu chamo render num animation loop. Os dois erros que sempre pego em code review: material com luz numa cena sem luz, que renderiza preto, e esquecer `updateProjectionMatrix` no resize, que distorce tudo."

---

## Checkpoint

- [ ] Montei o cubo do zero, sem copiar, e ele gira com luz PBR
- [ ] Sei explicar por que `MeshStandardMaterial` sem luz = tela preta
- [ ] Sei o que `near`/`far` fazem e o que é z-fighting
- [ ] Fiz o resize funcionar e sei por que `updateProjectionMatrix` é obrigatório
- [ ] Sei dizer o eixo "pra cima" do three e a unidade de rotação

---

## Recursos

- [three.js — manual oficial](https://threejs.org/manual/) — os capítulos "Fundamentals" e "Responsive"
- [three.js — editor online](https://threejs.org/editor/) — montar cena sem código pra fixar o vocabulário
- [Discover three.js](https://discoverthreejs.com/) — livro gratuito, melhor sequência didática
- Three.js Journey (Bruno Simon) — curso pago referência; o capítulo gratuito de basics já cobre este módulo
