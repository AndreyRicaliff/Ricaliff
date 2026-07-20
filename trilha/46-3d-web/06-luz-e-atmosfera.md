# 06 — Luz e Atmosfera

## O que é

Iluminação é onde a cena deixa de parecer "objeto flutuando no void". O three oferece quatro luzes diretas, cada uma com custo e papel distintos:

- **`AmbientLight`** — constante em tudo, sem direção, sem sombra. Custo ~zero. Sozinha, achata tudo (sem shading não há volume); serve pra levantar o piso de escuridão.
- **`DirectionalLight`** — raios paralelos (sol). Uma direção, alcance infinito. É a luz-chave padrão e a mais barata que projeta sombra.
- **`PointLight`** — lâmpada: emite em todas as direções com decaimento por distância (`decay = 2` é o fisicamente correto). Sombra dela custa 6 renders (cube map) — cara.
- **`SpotLight`** — cone com penumbra. O drama de palco: recorte de luz no chão, produto destacado.

**Sombra não vem de graça nem por padrão.** É preciso ligar `renderer.shadowMap.enabled = true`, `luz.castShadow = true` e, por objeto, `castShadow`/`receiveShadow`. Cada luz com sombra re-renderiza a cena inteira do ponto de vista dela pra gerar o *shadow map* — ou seja, sombra dobra (ou mais) o custo de render. Resolução (`shadow.mapSize`, padrão 512²) e o frustum da shadow camera controlam a qualidade: sombra serrilhada quase sempre é frustum largo demais, não mapSize baixo — verifique com `CameraHelper(luz.shadow.camera)` antes de subir resolução no chute.

**Fog** (`scene.fog = new THREE.Fog(cor, near, far)` ou `FogExp2`) desvanece objetos com a distância. Barato (é shader, não geometria) e resolve dois problemas de uma vez: dá profundidade atmosférica e esconde o "fim do mundo" da cena — o corte seco do `far` da câmera.

**Environment map** é a peça que o iniciante não sabe que falta: uma imagem panorâmica (HDRI, formato `.hdr`) em `scene.environment` vira iluminação baseada em imagem (IBL) pra TODOS os materiais PBR — é o que faz metal refletir e roughness baixa ter cara de estúdio. É por isso que o metal do módulo 04 ficava preto: não tinha mundo pra refletir.

---

### Passo-a-passo: o look dark+neon dos decks AG

O visual dos decks 3D da AG (fundo quase-preto, acentos roxo/ciano emissivos, halo suave) é uma receita de 4 camadas — compor, verificar, e só então ajustar:

```js
scene.background = new THREE.Color(0x08080f);          // 1. quase-preto azulado
scene.fog = new THREE.FogExp2(0x08080f, 0.06);         // 2. fog NA COR do fundo — funde o horizonte

scene.add(new THREE.AmbientLight(0x1a1a2e, 0.6));      // 3. piso de luz fria, bem baixo
const chave = new THREE.DirectionalLight(0x8b5cf6, 1.4); // luz-chave roxa, de cima/lado
chave.position.set(3, 5, 2);
scene.add(chave);
const contra = new THREE.PointLight(0x22d3ee, 8, 12);  // contra-luz ciano: recorta silhuetas
contra.position.set(-4, 1, -3);
scene.add(contra);

// 4. o "neon" dos objetos não é luz — é emissive (módulo 04) + bloom no pós, se houver
```

Método, não estética no chute: mude **uma luz por vez** com lil-gui e olhe o resultado; luz é o domínio onde mexer em três coisas juntas garante não saber o que causou o quê. A regra do fog na cor do fundo não é opinião — com cores diferentes o horizonte vira uma faixa suja visível; teste os dois e compare.

Sombras aqui: **desligadas**. Deck roda em máquina de cliente (às vezes via RDP, render por software); sombra dobraria o custo pra um ganho que ninguém percebe em fundo escuro. Trade-off explícito, revisitável se o alvo mudar.

---

## Por que cai em entrevista

Luz é onde se separa "fiz o tutorial" de "entendo o pipeline": explicar por que sombra custa um render extra por luz, ou por que metal precisa de envmap, demonstra compreensão do que acontece na GPU — e a decisão "desliguei sombra porque o alvo não aguenta" é exatamente o tipo de trade-off que entrevistador de pleno quer ouvir.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Sua cena está lenta e tem 4 luzes com sombra. O que você faz?"
>
> **R (30s):** "Primeiro meço — cada luz com sombra re-renderiza a cena pro shadow map dela, então 4 luzes podem significar 5× o custo de render. Normalmente deixo sombra só na luz-chave direcional, troco as demais por luzes sem sombra ou por um environment map, que ilumina tudo por imagem a custo fixo. E confiro o frustum da shadow camera com um CameraHelper antes de mexer em resolução: sombra ruim geralmente é frustum largo, não mapSize baixo. Num deck nosso a decisão foi mais radical: zero sombras, porque o alvo rodava via RDP sem GPU."

---

## Checkpoint

- [ ] Sei o papel e o custo relativo das 4 luzes e qual delas tem a sombra mais barata
- [ ] Ativei sombra numa cena e visualizei o frustum com CameraHelper
- [ ] Carreguei um HDRI de Poly Haven em `scene.environment` e vi o metal "ligar"
- [ ] Montei o look dark+neon e sei explicar a função de cada camada
- [ ] Sei justificar quando DESLIGAR sombras é a decisão certa

---

## Recursos

- [three.js — manual, capítulos Lights e Shadows](https://threejs.org/manual/#en/lights)
- [three.js — DirectionalLight.shadow](https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow)
- [Poly Haven — HDRIs](https://polyhaven.com/hdris) — gratuitos, CC0
- [three.js — RGBELoader (carregar .hdr)](https://threejs.org/docs/#examples/en/loaders/RGBELoader)
