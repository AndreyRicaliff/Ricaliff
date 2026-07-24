# 01 — Mapa do 3D na Web

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Existem quatro caminhos para renderizar "3D" no browser, e escolher errado custa semanas. O erro não é técnico, é de **modelo mental**: tratar "3D na web" como uma coisa só, quando na verdade são duas famílias que não se parecem por dentro — as que te dão o *pipeline de rasterização programável* da GPU (WebGL, WebGPU) e as que só reaproveitam o compositor do browser (CSS3D, SVG). Este módulo é o mapa: entender o que a GPU realmente faz para desenhar um triângulo, e a partir daí saber qual caminho paga o custo certo pelo resultado que você precisa.

---

## § BASE — o fundamento

**O que "renderizar 3D" significa no metal.** Uma GPU não desenha esferas nem cubos: ela **rasteriza triângulos** — converte geometria em fragmentos e colore cada um. A *OpenGL ES 2.0 Specification* (Khronos, 2007) — da qual a **WebGL 1.0** é o binding pro browser (e a WebGL 2.0 mapeia a OpenGL ES 3.0) — define esse fluxo como um **pipeline** de estágios, uns fixos, dois programáveis (cap. 2 "OpenGL ES Operation", cap. 3 "Rasterization", cap. 4 "Per-Fragment Operations and the Framebuffer"):

1. **Vertex shader** (programável) — roda **1× por vértice**. Sua única obrigação é escrever `gl_Position`, a posição do vértice em *clip space* — o resultado de multiplicar a posição pela matriz **MVP** (model-view-projection, módulo 02). Nada de cor ainda; é pura transformação geométrica.
2. **Primitive assembly + clipping** — os vértices viram triângulos e o que cai fora do *frustum* (o volume que a câmera enxerga) é recortado antes de custar qualquer pixel.
3. **Rasterização** (estágio fixo) — cada triângulo é convertido nos **fragmentos** (candidatos a pixel) que ele cobre; os atributos por vértice (cor, `uv`, normal) são **interpolados** para cada fragmento.
4. **Fragment shader** (programável) — roda **1× por fragmento** e devolve a cor final. É aqui que moram iluminação, amostragem de textura e todo o PBR (módulos 04 e 06). Numa tela Full HD, isso são ~2 milhões de execuções por frame.
5. **Per-fragment operations** (fixo) — *depth test* (o z-buffer decide quem está na frente), *blending* (transparência), escrita no framebuffer.

Guardar esses cinco passos é o que faz frases soltas ("draw call", "shader", "z-fighting", "fill rate") virarem um sistema em vez de jargão avulso — cada uma delas é um ponto específico deste pipeline.

**As quatro tecnologias, à luz do pipeline.** **WebGL** (2011) expõe exatamente esse pipeline via GLSL; é o backend do three.js e do Babylon.js, com suporte ~98% dos browsers (verificar em caniuse antes de assumir). **WebGPU** (2023, Chrome 113+; Firefox e Safari depois) é o sucessor: expõe também *compute shaders*, tem menos overhead de driver e usa WGSL — mas em 2026 ainda **exige fallback WebGL** porque o suporte não é universal. **CSS3D** (`perspective` + `transform: rotateY/translate3d`) **não toca esse pipeline**: é o compositor do browser aplicando matrizes 4×4 (módulo 03) a *layers* de DOM. Não há vertex/fragment shader, não há z-buffer confiável entre stacking contexts — mas cada "objeto" é DOM real (acessível, selecionável, estilizável). **SVG** é 2D vetorial; "3D" em SVG é projeção calculada na mão, para diagrama isométrico estático, não cena interativa.

**A armadilha declarada — o ambiente mente.** Todo esse pipeline pressupõe uma GPU real. Quando ela falta (blocklist de driver, VM, sessão RDP), o browser cai para **render por software** — SwiftShader (Chrome) ou llvmpipe (Mesa): o pipeline inteiro roda na CPU, lento. O `renderer` reportado denuncia isso, e é a diferença entre "tenho WebGL" e "tenho WebGL utilizável". Performance 3D na web é **altamente dependente de GPU/driver**: nenhum número de polígono ou de draw call é constante universal — é regra de bolso a confirmar na máquina-alvo (módulo 07). Medir vem antes de escolher.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A pergunta que organiza tudo é uma só: **este caminho me dá o pipeline de rasterização programável, ou não?** Dela sai a pilha:

```
        VOCÊ (código de cena)
    ┌───────────────┬───────────────┬───────────────┐
    │  three.js /   │   CSS3D        │   SVG          │
    │  Babylon      │  (transforms)  │  (projeção     │
    ├───────────────┤                │   na mão)      │
    │ WebGL / WebGPU│                │                │
    ├───────────────┴───────┬────────┴────────────────┤
    │  PIPELINE PROGRAMÁVEL  │   COMPOSITOR DO BROWSER  │
    │  (vertex+fragment sh.) │   (matriz 4×4 em layers) │
    ├────────────────────────┴──────────────────────────┤
    │        DRIVER  →  GPU  (ou SwiftShader na CPU)      │
    └────────────────────────────────────────────────────┘
```

À esquerda, você paga vocabulário (cena, câmera, material, dispose manual de VRAM) e ganha malha, luz, milhares de objetos. À direita, você paga quase nada além de transforms e ganha texto nítido e acessível — mas perde iluminação e oclusão correta. A **árvore de decisão** que atravessa a pilha:

1. **O conteúdo é texto/UI que o usuário lê ou clica?** → CSS3D. Texto em WebGL vira textura: borrado no zoom, invisível pro leitor de tela, fora do fluxo do DOM.
2. **Precisa de malha, iluminação, milhares de objetos, modelo glTF?** → three.js sobre WebGL (WebGPU só se você controla o ambiente do usuário — em produto de cliente, ainda não).
3. **É um diagrama estático com "cara" de 3D?** → SVG isométrico ou até PNG. Zero runtime.
4. **É fundo decorativo atrás de UI?** → three.js com orçamento agressivo (módulo 07) ou CSS3D — e **sempre** com degradação para 2D (módulo 08).

---

## § METODOLOGIA — o passo-a-passo replicável

O método sênior de escolher API 3D não é "qual é a melhor", é **"o que a máquina-alvo aguenta, para o conteúdo que eu tenho"**:

**1. Caracterize o conteúdo.** Texto/UI legível → família compositor. Superfície, luz, volume, asset importado → família pipeline. Essa pergunta sozinha já elimina metade da matriz.

**2. Meça o ambiente-alvo, não o seu.** Rode a detecção de capacidade (abaixo) na máquina onde o produto roda de verdade — não no seu notebook com GPU dedicada.

**3. Cheque a existência do fallback antes de commitar.** Se a resposta é WebGPU, o WebGL de reserva existe? Se é WebGL, o gradiente estático para o caso "sem GPU" está desenhado? Sem plano de degradação, a escolha não está pronta (módulo 08).

**4. Só então escolha, e registre o trade-off.** A decisão vira uma linha de ADR: o que ganhei, o que abri mão, sob qual condição eu revisaria.

**Anti-padrões:**
- **"three.js porque é popular":** popularidade não é restrição de ambiente. É a resposta que denuncia quem copiou tutorial.
- **Texto virando textura WebGL:** troca nitidez, seleção e acessibilidade por nada — o compositor faz isso de graça e melhor.
- **Assumir o ambiente:** decidir por WebGL sem medir e descobrir SwiftShader em produção. O flag e o `renderer` existem para não adivinhar.
- **Escolher sem fallback:** WebGL *pode não existir em runtime* (context lost, driver na blocklist). Quem não planejou a degradação entrega uma tela preta ao cliente.

---

## Passo-a-passo aplicado (faça agora, ~15min)

Raciocínio sênior: não assuma o ambiente — meça nele. Cole isto no console do browser da máquina-alvo (foi assim que confirmamos o cenário RDP num deck em produção):

```js
const gl = document.createElement('canvas').getContext('webgl2');
const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
console.log('webgl2:', !!gl,
  '| renderer:', dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/d',
  '| webgpu:', 'gpu' in navigator,
  '| reduced-motion:', matchMedia('(prefers-reduced-motion: reduce)').matches);
```

1. Rode em **2 máquinas diferentes** (idealmente uma com GPU dedicada e uma VM/RDP) e compare o campo `renderer`.
2. Se `renderer` contém **"SwiftShader"**, **"llvmpipe"** ou **"software"**, é render por CPU: trate como "sem WebGL utilizável".
3. Olhe o último campo. Em sessão RDP o Windows **força `prefers-reduced-motion: reduce`** — já congelou animação de deck nosso em produção. A lição não é "ignore o flag": é **verifique o que o flag significa naquele ambiente antes de gatear comportamento nele**.
4. Escreva, para um projeto seu, a linha de decisão: "escolhi X porque a máquina-alvo mostrou Y; fallback = Z".

---

## Por que cai em entrevista

"Por que você usou X e não Y" é a pergunta que separa quem copiou tutorial de quem decidiu por trade-off. 3D é onde ela fica óbvia: o candidato que responde "three.js porque é popular" perde para o que responde com restrições do ambiente, custo de acessibilidade e plano de fallback. E saber descrever o pipeline de rasterização mostra que você entende o que a lib abstrai — não que decorou a API.

> **P:** "Você faria um site 3D com WebGPU hoje?"
>
> **R (30s):** "Depende de quem acessa. WebGPU é melhor tecnicamente — menos overhead, compute shaders — mas o suporte ainda não é universal, então em produto de cliente eu escrevo para WebGL e deixo WebGPU como backend opcional, que o three.js já abstrai. Num deck que fiz, fui além: o alvo rodava via RDP, sem GPU real, então nem WebGL — usei CSS3D puro, que o compositor do browser aguenta. Primeiro eu meço o ambiente, depois escolho a API."

> **P:** "O que acontece, no nível da GPU, entre você chamar `render()` e o pixel aparecer?"
>
> **R (30s):** "É um pipeline de cinco estágios que a spec do OpenGL ES/WebGL define. O vertex shader roda por vértice e transforma cada um para clip space com a matriz MVP. Os triângulos são montados e clipados contra o frustum. A rasterização os quebra em fragmentos e interpola os atributos. O fragment shader roda por fragmento e devolve a cor — é onde vive a iluminação. E o per-fragment: depth test com o z-buffer decide quem está na frente, blending resolve transparência, e escreve no framebuffer. CSS3D não passa por nada disso — é o compositor aplicando matriz 4×4 em DOM, e é por isso que texto continua nítido e selecionável lá, mas não em WebGL."

---

## Checkpoint

- [ ] Sei nomear os 5 estágios do pipeline de rasterização e dizer quais são programáveis
- [ ] Sei explicar a diferença entre WebGL, WebGPU, CSS3D e SVG em uma frase cada
- [ ] Rodei o snippet de detecção em 2 máquinas diferentes e comparei os renderers
- [ ] Sei reconhecer render por software (SwiftShader/llvmpipe) e por que trato como "sem GPU"
- [ ] Sei dizer quando texto NÃO deve virar WebGL (nitidez, seleção, acessibilidade)
- [ ] Respondi as duas perguntas de entrevista em voz alta em menos de 30s cada

---

## Recursos

- *OpenGL ES 2.0 Specification* — Khronos (2007), cap. 2–4: o pipeline de rasterização que a WebGL 1.0 mapeia (WebGL 2.0 = OpenGL ES 3.0)
- *WebGL Specification* — Khronos: como o pipeline é exposto ao JavaScript no browser
- MDN — "WebGL: 2D and 3D graphics for the web" e a seção "Getting started with WebGL": visão do pipeline em prosa
- MDN — "Using CSS transforms" e a propriedade `perspective`: o outro caminho, o do compositor
- caniuse — "WebGPU": conferir suporte atual antes de decidir por ele (o número muda; consulte, não decore)
- *Real-Time Rendering*, 4ª ed. — Akenine-Möller, Haines, Hoffman (2018), cap. 2 "The Graphics Rendering Pipeline": o pipeline tratado a fundo, além do que a spec formaliza
