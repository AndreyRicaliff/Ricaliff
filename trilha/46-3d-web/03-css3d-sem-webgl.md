# 03 — CSS3D: 3D sem WebGL

## O que é

CSS3D é o compositor do browser aplicando matrizes de transformação 4×4 em elementos DOM — a mesma matemática do WebGL, sem canvas, sem shader, sem GPU programável. Quatro peças formam o sistema inteiro:

- **`perspective: 1200px`** no pai: a distância do "olho" ao plano da tela. Valor menor = distorção mais agressiva (grande-angular); 800–1600px é a faixa útil. Sem `perspective`, `rotateY` só achata o elemento — não há profundidade.
- **`transform-style: preserve-3d`**: por padrão o browser achata os filhos no plano do pai. `preserve-3d` mantém os filhos no espaço 3D do pai. **Pegadinha que já custou horas de debug:** `overflow: hidden`, `filter`, `opacity < 1` e `will-change` criam stacking context e **forçam o achatamento de volta**, silenciosamente — o sintoma é "o 3D sumiu e ninguém mudou o transform".
- **`rotateX/Y/Z`, `translate3d`, `translateZ`**: compõem da esquerda pra direita — `rotateY(30deg) translateZ(400px)` (gira o eixo, depois empurra: órbita) é diferente de `translateZ(400px) rotateY(30deg)` (empurra, depois gira no lugar). Ordem de transform é a fonte nº 1 de "por que ficou torto".
- **`matrix3d(...)`**: os 16 números da matriz crua, column-major. Você raramente escreve na mão — é o que o `CSS3DRenderer` do three emite.

Limites honestos: não há z-buffer confiável entre irmãos quando stacking contexts entram no jogo, não há iluminação, e cada elemento é um layer do compositor — centenas de cards com `will-change` estouram memória. Em troca: texto nítido em qualquer zoom, seleção, foco de teclado, Tailwind — tudo grátis.

---

### Passo-a-passo: a esfera de cards (o deck esfera)

Caso real: o deck esfera da AG distribui N cards numa esfera e gira o conjunto. A matemática é distribuir pontos por latitude/longitude e aplicar a órbita `rotateY → rotateX → translateZ` em cada card:

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

Dois pontos de raciocínio: (1) a hipótese ingênua "distribuo por ângulo igual" aglomera cards nos polos — o ângulo áureo (137.5°) resolve; testei com N=8 e N=40 antes de dar por bom. (2) `overflow: hidden` fica no `.palco`, **nunca** num ancestral entre `perspective` e os cards — senão achata (o bug silencioso de cima).

### CSS3DRenderer do three

Quando a cena CSS3D precisa de câmera de verdade (órbita com damping, sincronia com uma cena WebGL), o three tem `CSS3DRenderer`: você cria `CSS3DObject(elementoDOM)`, adiciona à cena, e o renderer escreve `matrix3d` nos elementos usando a mesma câmera do WebGL. É o coração do modo híbrido do módulo 08 — DOM real posicionado por three.

---

## Por que cai em entrevista

CSS3D revela se o candidato entende compositor, stacking context e ordem de transform — conceitos que valem pra QUALQUER animação CSS, não só 3D. E a resposta "usei CSS3D em vez de WebGL porque o conteúdo era texto" demonstra decisão por trade-off, que é exatamente o que se cobra de pleno.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que `transform-style: preserve-3d` faz e o que pode quebrá-lo?"
>
> **R (30s):** "Por padrão o browser projeta os filhos no plano do pai — achata. `preserve-3d` mantém os filhos no espaço 3D. O detalhe que já me custou debug: propriedades que criam stacking context — `overflow: hidden`, `filter`, `opacity` menor que 1 — reativam o achatamento sem erro nenhum no console. Num deck com cards em esfera, o sintoma foi 'o 3D sumiu'; a causa era um `overflow: hidden` adicionado num contêiner intermediário. Hoje eu isolo: `perspective` no palco, `preserve-3d` só na cadeia que precisa."

---

## Checkpoint

- [ ] Montei a esfera de cards do zero e ela gira ao clicar
- [ ] Provoquei o bug do achatamento (adicionei `overflow:hidden` no meio) e o expliquei
- [ ] Sei explicar por que `rotateY() translateZ()` orbita e o inverso não
- [ ] Sei o que `backface-visibility: hidden` faz e quando omitir
- [ ] Sei citar 2 limites do CSS3D vs WebGL e 2 vantagens

---

## Recursos

- [Intro to CSS 3D Transforms — David DeSandro](https://3dtransforms.desandro.com/) — o melhor tutorial do assunto
- [MDN — transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style) — lista das propriedades que forçam achatamento
- [MDN — matrix3d()](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d)
- [three.js — CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer) — exemplos "css3d_*" na galeria oficial
