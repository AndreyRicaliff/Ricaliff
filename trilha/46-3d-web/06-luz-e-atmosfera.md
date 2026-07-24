# 06 — Luz e Atmosfera

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Iluminação é onde a cena deixa de parecer "objeto flutuando no void". Mas cada recurso de luz tem um **custo de render** concreto — sombra dobra o custo por luz, environment map é o que faz o metal do módulo 04 existir — e a diferença entre uma cena bonita e uma cena que roda no notebook do cliente é saber qual pagar. Este módulo dá a física por trás das quatro luzes, das sombras e da iluminação por imagem, e o critério de quando desligar cada uma.

---

## § BASE — o fundamento

**A equação por trás de tudo.** James Kajiya, "The Rendering Equation" (SIGGRAPH 1986), escreveu a integral que todo renderizador aproxima: a luz que sai de um ponto numa direção é a emissão própria **mais** a integral, sobre o hemisfério, de toda a luz que chega vezes o BRDF (o material do módulo 04) vezes o cosseno de Lambert (`N·L`). Tempo real não resolve essa integral inteira — ela é infinita (luz que reflete em luz que reflete). O que as luzes do three fazem é **amostrar** partes dela: luzes diretas resolvem a contribuição direta; environment maps aproximam a parte indireta. Guardar isso explica por que "faltou luz" e "faltou reflexo" são problemas diferentes: são termos diferentes da mesma integral.

**As quatro luzes diretas, por custo e papel:**
- **`AmbientLight`** — termo constante, sem direção nem sombra. Custo ~zero. Sozinha achata tudo (sem variação de `N·L`, não há volume); serve pra levantar o piso de escuridão.
- **`DirectionalLight`** — raios paralelos (o sol): uma direção, alcance infinito. Luz-chave padrão e a **mais barata que projeta sombra** (uma sombra ortográfica, um render extra).
- **`PointLight`** — lâmpada: emite em todas as direções com decaimento por distância (`decay = 2` é o fisicamente correto, lei do inverso do quadrado). Sombra dela custa **6 renders** (cube map, um por face) — cara.
- **`SpotLight`** — cone com penumbra: o drama de palco, recorte de luz no chão.

**Sombra: por que custa um render extra por luz (Williams 1978).** O algoritmo padrão é o **shadow mapping**, de Lance Williams, "Casting Curved Shadows on Curved Surfaces" (SIGGRAPH 1978): antes de desenhar a cena pela câmera, você a **renderiza inteira do ponto de vista da luz**, guardando só a profundidade (o *shadow map*). Na hora de sombrear cada fragmento, compara a distância dele à luz com o valor no mapa: mais longe = está atrás de algo = na sombra. Consequência direta: **cada luz com sombra é uma passada de render a mais** — 4 luzes com sombra ≈ 5× o custo. E ela **não vem por padrão**: `renderer.shadowMap.enabled = true`, `luz.castShadow = true`, e por objeto `castShadow`/`receiveShadow`. Qualidade: `shadow.mapSize` (padrão 512²) e o **frustum da shadow camera** — sombra serrilhada quase sempre é frustum largo demais (o mapa cobre área grande com poucos texels), não `mapSize` baixo. Verifique com `CameraHelper(luz.shadow.camera)` antes de subir resolução no chute.

**Environment map — a peça que o iniciante não sabe que falta (Debevec 1998).** A **iluminação baseada em imagem (IBL)** foi estabelecida por Paul Debevec em "Rendering Synthetic Objects into Real Scenes" (SIGGRAPH 1998): uma imagem panorâmica de alto alcance dinâmico (HDRI, `.hdr`) captura a luz de um ambiente real, e essa imagem **ilumina** o objeto — é a aproximação da parte indireta da equação de Kajiya. Em `scene.environment`, o HDRI vira luz pra **todos** os materiais PBR: é o que faz metal refletir e roughness baixa ter cara de estúdio. É exatamente por isso que o metal do módulo 04 ficava preto — não tinha mundo pra refletir. Custo do IBL: **fixo** (uma textura pré-filtrada), não escala com número de luzes — daí ser a troca certa quando você tem muitas luzes.

**Fog** (`scene.fog = new THREE.Fog(cor, near, far)` ou `FogExp2`) desvanece objetos com a distância. Barato (é operação no fragment shader, não geometria) e resolve dois problemas: dá profundidade atmosférica e **esconde o corte seco do `far`** da câmera — o "fim do mundo". A cor do fog tem que ser a cor do fundo, senão o horizonte vira uma faixa suja visível (a razão está no blending: o fog interpola a cor do fragmento com a cor do fog pela distância — cor diferente do fundo = descontinuidade no ponto onde o objeto some).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A iluminação se organiza por **qual termo da equação de Kajiya cada recurso aproxima**, e cada camada tem um custo distinto:

```
TERMO DA EQUAÇÃO           RECURSO no three            CUSTO
emissão própria       →    material.emissive           ~zero (não é luz)
direta (N·L)          →    Directional / Point / Spot  1 render extra POR sombra
                           Ambient (piso constante)    ~zero
indireta / reflexo    →    scene.environment (IBL)     fixo (1 textura)
atenuação atmosférica →    scene.fog                   barato (fragment shader)
```

Duas dependências estruturais governam o resultado:
1. **Metal PBR depende do envmap, não das luzes diretas.** Difuso vem de `N·L` (luzes diretas); reflexo especular de metal vem do IBL. Faltando o segundo, empilhar luzes não resolve — corrige o termo errado.
2. **Sombra escala com o número de luzes; IBL não.** É o eixo que decide o trade-off: muitas luzes com sombra explodem o custo; um envmap ilumina tudo a preço fixo. A decisão de produção quase sempre é "uma luz-chave com sombra + IBL pro resto".

---

## § METODOLOGIA — o passo-a-passo replicável

**Iluminar por camadas, verificando uma de cada vez:**

**1. Fundo + fog na mesma cor.** Estabelece o "vazio" e esconde o `far`.

**2. Piso ambiente baixo.** `AmbientLight` fraco, só pra não ter preto puro.

**3. Uma luz-chave direcional.** É a que dá volume (via `N·L`) e a sombra mais barata, se houver.

**4. Envmap pra reflexo e metal.** `scene.environment` com um HDRI — só agora o metal "liga".

**5. Sombra só onde ela conta, e verificada.** `CameraHelper` no frustum antes de mexer em `mapSize`.

**Anti-padrões:**
- **Empilhar luz pra "consertar" metal preto:** o problema é falta de envmap, não de luz. Termo errado da equação.
- **Mexer em três luzes ao mesmo tempo:** luz é o domínio onde você garante não saber o que causou o quê. Uma por vez, com `lil-gui`.
- **Subir `mapSize` pra sombra serrilhada:** quase sempre é frustum largo. Ajuste o frustum primeiro.
- **Fog de cor diferente do fundo:** faixa suja no horizonte. A cor tem que casar.
- **Ligar sombra em toda luz por default:** cada uma é um render extra. Ligue por decisão, não por hábito.

---

## Passo-a-passo aplicado (faça agora, ~30min)

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

Método, não estética no chute: mude **uma luz por vez** com `lil-gui` e olhe o resultado. Depois carregue um HDRI de Poly Haven em `scene.environment` (via `RGBELoader`) e veja o metal do módulo 04 "ligar" — a prova viva do IBL de Debevec.

Sombras aqui: **desligadas**. Deck roda em máquina de cliente (às vezes via RDP, render por software — módulo 01); sombra dobraria o custo pra um ganho que ninguém percebe em fundo escuro. Trade-off explícito, revisitável se o alvo mudar.

---

## Por que cai em entrevista

Luz é onde se separa "fiz o tutorial" de "entendo o pipeline": explicar por que sombra custa um render extra por luz (o shadow map de Williams), ou por que metal precisa de envmap (o termo indireto de Kajiya, o IBL de Debevec), demonstra compreensão do que acontece na GPU. E "desliguei sombra porque o alvo não aguenta" é exatamente o trade-off que entrevistador de pleno quer ouvir.

> **P:** "Sua cena está lenta e tem 4 luzes com sombra. O que você faz?"
>
> **R (30s):** "Primeiro meço — cada luz com sombra re-renderiza a cena pro shadow map dela, então 4 luzes podem significar 5× o custo de render. Normalmente deixo sombra só na luz-chave direcional, troco as demais por luzes sem sombra ou por um environment map, que ilumina tudo por imagem a custo fixo. E confiro o frustum da shadow camera com um CameraHelper antes de mexer em resolução: sombra ruim geralmente é frustum largo, não mapSize baixo. Num deck nosso a decisão foi mais radical: zero sombras, porque o alvo rodava via RDP sem GPU."

> **P:** "Meu metal aparece preto mesmo com três luzes na cena. Por quê?"
>
> **R (30s):** "Porque metal não tem componente difuso — ele é essencialmente reflexo, e mais luz direta não conserta isso: você está mexendo no termo direto da equação de render, e o que falta é o termo indireto. Metal precisa de algo pra refletir, e isso é um environment map: uma imagem panorâmica em `scene.environment`, a ideia de image-based lighting do Debevec. Sem envmap ele reflete o vazio, que é preto. Adicionei um HDRI e o metal ligou na hora. É o erro mais comum de quem começa: empilhar luz pra resolver ausência de reflexo."

---

## Checkpoint

- [ ] Sei que as luzes aproximam termos da equação de render de Kajiya (direta vs indireta)
- [ ] Sei o papel e o custo relativo das 4 luzes e qual tem a sombra mais barata
- [ ] Sei explicar por que sombra é um render extra por luz (shadow map de Williams)
- [ ] Carreguei um HDRI em `scene.environment` e vi o metal "ligar" (IBL de Debevec)
- [ ] Montei o look dark+neon e sei a função de cada camada, incluindo o fog na cor do fundo
- [ ] Sei justificar quando DESLIGAR sombras é a decisão certa

---

## Recursos

- "The Rendering Equation" — James Kajiya, SIGGRAPH (1986): a integral que todo renderizador aproxima (direta + indireta)
- "Casting Curved Shadows on Curved Surfaces" — Lance Williams, SIGGRAPH (1978): o shadow mapping e por que sombra é um render extra
- "Rendering Synthetic Objects into Real Scenes" — Paul Debevec, SIGGRAPH (1998): a fundação do image-based lighting (envmap/HDRI)
- three.js — manual, capítulos "Lights", "Shadows" e "Fog": os recursos aplicados
- three.js — docs, `DirectionalLightShadow` e `RGBELoader`: o frustum de sombra e o loader de `.hdr`
- Poly Haven — HDRIs (CC0): panoramas gratuitos pra treinar IBL
