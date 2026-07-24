# 03 — CSS3D: 3D sem WebGL

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

CSS3D é a **mesma matemática do módulo 02** — matrizes 4×4 homogêneas — aplicada pelo **compositor do browser** a elementos DOM, sem canvas, sem shader, sem GPU programável (módulo 01). É o caminho da família "compositor": você perde iluminação e z-buffer confiável, mas cada "objeto" é DOM real — texto nítido em qualquer zoom, seleção, foco de teclado, Tailwind, tudo grátis. Este módulo é o que sustenta os decks CSS3D da AG (o deck esfera), que rodam onde WebGL não roda.

---

## § BASE — o fundamento

**A spec e a matriz.** A *CSS Transforms Module Level 1/2* (W3C) define que toda `transform` 3D é, no fundo, uma **matriz 4×4** — as mesmas coordenadas homogêneas de Möbius do módulo 02. A função `matrix3d(a1, b1, c1, d1, …)` recebe os **16 valores column-major** dessa matriz; `rotateY`, `translate3d`, `scale3d` etc. são só *açúcar* que a spec traduz para uma `matrix3d` equivalente. Quando você compõe `rotateY(30deg) translateZ(400px)`, o browser multiplica as duas matrizes 4×4 na ordem escrita — exatamente o que o pipeline WebGL faz com M·V·P, só que o resultado é aplicado a um layer de compositor em vez de a vértices.

**As quatro peças do sistema:**
- **`perspective: 1200px`** no pai: a distância do "olho" ao plano da tela. É o análogo CSS da matriz de projeção P: define quanto a **divisão perspectiva** (÷w, módulo 02) encolhe o que está longe. Valor menor = distorção mais agressiva (grande-angular); 800–1600px é a faixa útil. Sem `perspective`, a matriz de projeção é ortográfica: `rotateY` só achata o elemento, sem profundidade.
- **`transform-style: preserve-3d`**: por padrão o browser **achata** (flatten) os filhos no plano do pai — projeta a subárvore num único layer 2D. `preserve-3d` mantém os filhos vivos no espaço 3D do pai, cada um com sua matriz. **Pegadinha que a própria spec lista:** propriedades que criam *stacking context* ou *containing block* de composição — `overflow` diferente de `visible`, `filter`, `opacity < 1`, `will-change`, `clip-path`, `mask` — **forçam o achatamento de volta**, silenciosamente. O sintoma é "o 3D sumiu e ninguém mudou o transform".
- **Ordem de transform**: `rotateY(30deg) translateZ(400px)` (gira o eixo, depois empurra: **órbita**) ≠ `translateZ(400px) rotateY(30deg)` (empurra, depois gira **no lugar**). Multiplicação de matriz não comuta — é a fonte nº 1 de "por que ficou torto".
- **`backface-visibility: hidden`**: esconde a face de trás de um elemento quando a normal aponta para longe da câmera — o análogo CSS do *backface culling* do módulo 02.

**Limites honestos, e de onde vêm.** Não há z-buffer por fragmento como no pipeline WebGL: entre irmãos com stacking contexts próprios, a ordem de pintura vira `z-index`/ordem de documento, não profundidade real — daí oclusão errada entre cards que se cruzam. Não há iluminação (não há fragment shader para calcular Lambert/Phong — módulo 04). E cada elemento transformado vira um **layer do compositor**: centenas de cards com `will-change` estouram memória de GPU do compositor. Em troca do que se perde, ganha-se tudo o que é DOM — e para conteúdo textual isso é o trade-off certo (módulo 01).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O modelo mental é uma **cadeia de contexto 3D** que não pode ser quebrada:

```
.palco   { perspective: 1200px }      ← define a projeção (a "câmera")
   │        (aqui pode ter overflow:hidden — está ACIMA do 3D)
   └─ .cena { transform-style: preserve-3d }   ← abre o espaço 3D
        │     ⚠ NADA entre aqui e os filhos pode criar stacking context
        ├─ .card { transform: rotateY() translateZ() }  ← vive no 3D
        ├─ .card
        └─ .card
```

Duas regras estruturais decorrem disso:
1. **`perspective` fica no ancestral, `preserve-3d` na cadeia**, e o `overflow: hidden` (quando preciso) vai no `.palco` — **nunca** num nó *entre* o `preserve-3d` e os cards, senão achata.
2. **Para navegar, gira-se o contêiner, nunca os cards.** Os cards têm transform *estático* (a posição deles na esfera); a navegação altera só a matriz do pai `.cena`. Misturar os dois é como tentar reposicionar objetos mexendo na câmera e nos objetos ao mesmo tempo — ininterpretável.

**Ponte para o módulo 08 — o `CSS3DRenderer` do three.** Quando a cena CSS3D precisa de câmera de verdade (órbita com damping, sincronia com uma cena WebGL), o three tem o `CSS3DRenderer`: você cria `CSS3DObject(elementoDOM)`, adiciona à cena, e o renderer **escreve `matrix3d` nos elementos usando a mesma câmera V·P do WebGL**. É o coração do modo híbrido do módulo 08: DOM real, posicionado pela matemática do módulo 02.

---

## § METODOLOGIA — o passo-a-passo replicável

**Construir um layout CSS3D sem cair nas armadilhas:**

**1. Isole a "câmera".** `perspective` num `.palco` dedicado, `overflow: hidden` aqui se precisar recortar a viewport.

**2. Abra o espaço 3D num único nó filho** com `transform-style: preserve-3d` e mais nada que crie stacking context.

**3. Posicione cada elemento com transform estático**, na ordem correta (órbita = `rotate…` antes de `translateZ`). Centralize com `left:50%; top:50%` + margens negativas de meia-dimensão.

**4. Anime só o contêiner** (`transition` na matriz do pai). Nunca anime os cards individualmente para navegar.

**5. Teste o achatamento de propósito.** Adicione `overflow:hidden` num nó intermediário e veja o 3D colapsar — para reconhecer o sintoma na próxima vez que aparecer sem querer.

**Anti-padrões:**
- **`overflow`/`filter`/`opacity` na cadeia 3D:** o achatamento silencioso. Sem erro no console; o 3D só "some".
- **Ordem de transform trocada:** `translateZ` antes de `rotate` gira no lugar em vez de orbitar. Torto sem explicação até você lembrar que matriz não comuta.
- **Centenas de layers com `will-change`:** promove cada card a layer de compositor e estoura VRAM. `will-change` é bisturi, não default.
- **Distribuir por ângulo igual numa esfera:** aglomera nos polos. Use o ângulo áureo (137,5°) — veja abaixo.

---

## Passo-a-passo aplicado (faça agora, ~40min)

Caso real: o deck esfera da AG distribui N cards numa esfera e gira o conjunto. A matemática distribui pontos por latitude/longitude e aplica a órbita `rotateY → rotateX → translateZ` a cada card:

```html
<div class="palco">
  <div class="esfera" id="esfera"><!-- cards entram via JS --></div>
</div>
<style>
  .palco  { perspective: 1200px; width: 100vw; height: 100vh; overflow: hidden; }
  .esfera { transform-style: preserve-3d; position: absolute; inset: 0;
            transition: transform 1.2s cubic-bezier(.2,.8,.2,1); }
  .card   { position: absolute; left: 50%; top: 50%; width: 220px; height: 130px;
            margin: -65px 0 0 -110px; backface-visibility: hidden; }
</style>
<script>
  const N = 24, R = 420, esfera = document.getElementById('esfera');
  for (let i = 0; i < N; i++) {
    const lat = Math.acos(1 - 2 * (i + .5) / N) * 180 / Math.PI - 90; // Fibonacci-ish
    const lon = i * 137.5; // ângulo áureo: distribui sem aglomerar nos polos
    const card = document.createElement('div');
    card.className = 'card';
    card.style.transform =
      `rotateY(${lon}deg) rotateX(${lat}deg) translateZ(${R}px)`;
    esfera.appendChild(card);
  }
  // navegar = girar a ESFERA inteira, nunca os cards:
  let rot = 0;
  addEventListener('click', () => {
    rot -= 137.5;
    esfera.style.transform = `rotateY(${rot}deg)`;
  });
</script>
```

Dois pontos de raciocínio: (1) a hipótese ingênua "distribuo por ângulo igual" aglomera cards nos polos — o ângulo áureo (137,5°, o mesmo que a filotaxia das plantas usa para não sobrepor folhas) resolve; testei com N=8 e N=40 antes de dar por bom. (2) `overflow: hidden` fica no `.palco`, **nunca** num ancestral entre `perspective` e os cards — senão achata. Depois de rodar, abra o DevTools e veja o `matrix3d` que o browser gerou de cada `rotateY(...) translateZ(...)`: são os 16 números da §BASE.

---

## Por que cai em entrevista

CSS3D revela se o candidato entende **compositor, stacking context e ordem de transform** — conceitos que valem pra QUALQUER animação CSS, não só 3D. E a resposta "usei CSS3D em vez de WebGL porque o conteúdo era texto" demonstra decisão por trade-off, que é o que se cobra de pleno. Saber que por baixo é a mesma matriz 4×4 do WebGL mostra que você vê o sistema, não dois truques separados.

> **P:** "O que `transform-style: preserve-3d` faz e o que pode quebrá-lo?"
>
> **R (30s):** "Por padrão o browser projeta os filhos no plano do pai — achata. `preserve-3d` mantém os filhos no espaço 3D. O detalhe que já me custou debug: propriedades que criam stacking context — `overflow: hidden`, `filter`, `opacity` menor que 1 — reativam o achatamento sem erro nenhum no console. Num deck com cards em esfera, o sintoma foi 'o 3D sumiu'; a causa era um `overflow: hidden` adicionado num contêiner intermediário. Hoje eu isolo: `perspective` no palco, `preserve-3d` só na cadeia que precisa."

> **P:** "CSS3D e WebGL são coisas diferentes ou a mesma?"
>
> **R (30s):** "A matemática é a mesma — os dois aplicam matriz 4×4 homogênea, e o `matrix3d` do CSS são literalmente os 16 números column-major da matriz. A diferença é quem executa: no WebGL é o pipeline programável da GPU, com vertex e fragment shader, z-buffer por fragmento e iluminação; no CSS3D é o compositor do browser aplicando a matriz a layers de DOM, sem shader e sem z-buffer confiável entre stacking contexts. Por isso texto continua nítido e selecionável no CSS3D e vira textura borrada no WebGL — e por isso escolho CSS3D quando o conteúdo é texto, mesmo perdendo iluminação."

---

## Checkpoint

- [ ] Montei a esfera de cards do zero e ela gira ao clicar
- [ ] Sei que `matrix3d` são os 16 valores da matriz 4×4 homogênea (a mesma do módulo 02)
- [ ] Provoquei o bug do achatamento (adicionei `overflow:hidden` no meio) e o expliquei
- [ ] Sei explicar por que `rotateY() translateZ()` orbita e o inverso não (matriz não comuta)
- [ ] Sei o que `backface-visibility: hidden` e `perspective` fazem no vocabulário de câmera
- [ ] Sei citar 2 limites do CSS3D vs WebGL e 2 vantagens, com a causa de cada um

---

## Recursos

- *CSS Transforms Module Level 1 / Level 2* — W3C: a spec que define `matrix3d` como matriz 4×4 column-major, `perspective`, `transform-style` e as propriedades que forçam achatamento
- MDN — "transform-style" e "Using CSS transforms": a lista prática das propriedades que reativam o flatten (seção sobre stacking context)
- *Intro to CSS 3D Transforms* — David DeSandro (3dtransforms.desandro.com): o melhor tutorial do assunto, do plano ao cubo à órbita
- MDN — "matrix3d()": a função crua e a ordem column-major dos 16 valores
- three.js — docs, `CSS3DRenderer` e os exemplos "css3d_*" da galeria oficial: a ponte para o módulo 08
