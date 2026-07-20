# 06 — Performance de Animação

## O que é

Animação fluida = 60fps = orçamento de **16,7ms por frame** (na prática ~10ms, porque o browser tem overhead). Estourar o orçamento = frame dropado = jank visível. Onde o tempo vai é definido pelo **pixel pipeline** do browser:

```
JS → Style → Layout → Paint → Composite
```

Cada propriedade CSS entra no pipeline num ponto diferente — e paga tudo dali pra baixo:

- **`width`, `height`, `top`, `left`, `margin`** → disparam **Layout** (reflow): o browser recalcula geometria da árvore, e depois repinta e recompõe. O mais caro. Animar isso é pagar o preço máximo 60×/segundo.
- **`background`, `color`, `box-shadow`, `border-radius`** → disparam **Paint**: rasterizar pixels de novo. Caro (box-shadow animado é vilão clássico).
- **`transform` e `opacity`** → só **Composite**: a GPU reposiciona/esmaece texturas já pintadas, **fora da main thread**. É por isso que a regra número 1 do domínio é: **animar só transform e opacity**. Mover = `translate`, crescer = `scale`, nunca `top/width`. (O antigo csstriggers.com catalogava isso por propriedade; a referência viva hoje é o guia de animações do web.dev.)

### Layout thrashing

O assassino silencioso em JS: **intercalar leitura e escrita de geometria**. Ler `offsetHeight` depois de mudar um estilo força o browser a resolver layout **sincronamente, na hora** — num loop, isso é um reflow por iteração:

```js
// RUIM: layout forçado a cada iteração
els.forEach(el => { el.style.height = el.offsetHeight * 2 + 'px'; });

// BOM: fase de leitura, depois fase de escrita
const alturas = els.map(el => el.offsetHeight);   // lê tudo
els.forEach((el, i) => { el.style.height = alturas[i] * 2 + 'px' }); // escreve tudo
```

É exatamente por isso que o FLIP (módulo 04) mede tudo antes de animar.

### will-change: com moderação

`will-change: transform` promove o elemento a uma layer própria da GPU **antes** da animação — elimina o custo de promoção no primeiro frame. Mas cada layer custa memória (textura na GPU); `will-change: *` espalhado é como deixar todas as luzes acesas: em máquina fraca ou mobile, degrada tudo. Regra: aplicar em **poucos** elementos que animam com frequência, ou aplicar/remover dinamicamente em volta da animação. Nunca em lista inteira "por garantia".

### rAF + lerp: o loop dos decks 3D

Para valores que seguem input contínuo (tilt de card 3D acompanhando o mouse nos decks CSS3D da AG), o padrão é `requestAnimationFrame` com interpolação linear — o valor **persegue** o alvo em vez de saltar:

```js
let atual = 0, alvo = 0;
window.addEventListener('pointermove', e => { alvo = calcularTilt(e); }); // só escreve o alvo
(function loop() {
  atual += (alvo - atual) * 0.1;                          // lerp: 10% do gap por frame
  card.style.transform = `rotateY(${atual}deg)`;          // só transform → compositor
  requestAnimationFrame(loop);
})();
```

Duas decisões escondidas aí: o handler de `pointermove` (dispara mais que 60×/s) **não toca o DOM** — só atualiza o alvo; e o fator 0.1 é o "amortecimento" (maior = mais duro, menor = mais flutuante). Ressalva do módulo 07: rAF **pausa em aba oculta** — screenshot de aba em background pega a animação congelada; já nos enganou em verificação de deck.

### Passo a passo: medir ANTES de otimizar (deck AG)

Otimização sem medição é chute. O rito com DevTools:

```text
1. DevTools → Performance → engrenagem → CPU: 4x slowdown (simula máquina modesta)
2. Gravar ~5s interagindo com a parte suspeita do deck
3. Ler o flame chart: procurar frames vermelhos (estourou 16,7ms)
4. Dentro do frame lento: barra ROXA (Layout) = animando propriedade de layout
   ou thrashing; barra VERDE longa (Paint) = box-shadow/filter animado
5. Formular hipótese ("é o box-shadow do card"), aplicar UM fix, medir DE NOVO
```

Fix clássico do passo 4: em vez de animar `box-shadow`, pré-pintar a sombra final num `::after` com `opacity: 0` e animar só a opacity — Paint vira Composite. O ponto de método: se a segunda medição não confirmar a melhora, a hipótese estava errada — voltar atrás, não empilhar "otimizações" por fé.

## Por que cai em entrevista

"Por que transform e não top/left?" é possivelmente A pergunta de front performance — resposta exige explicar o pixel pipeline, o que separa quem decorou a regra de quem entende o browser. Layout thrashing e will-change são o degrau seguinte, de pleno. E a postura "medi antes de otimizar" é o que o entrevistador sênior quer ouvir em qualquer resposta de performance.

> **P:** "Uma animação está engasgando. Como você investiga?"
>
> **R (30s):** "Primeiro meço: Performance panel com CPU 4x, gravo a interação e olho os frames que estouram 16,7ms. Se tem Layout roxo em todo frame, alguém está animando top/width ou intercalando leitura e escrita de geometria — troco por transform, que roda só no compositor. Se é Paint, suspeito de box-shadow ou filter animado — pré-pinto num pseudo-elemento e animo opacity. Aplico um fix por vez e meço de novo; se não confirmar, a hipótese estava errada. Foi assim que estabilizei os efeitos 3D dos decks de apresentação que faço."

## Checkpoint

- [ ] Sei desenhar o pixel pipeline e dizer onde cada tipo de propriedade entra
- [ ] Sei explicar por que transform/opacity são baratos (compositor, fora da main thread)
- [ ] Identifiquei (ou provoquei) layout thrashing e corrigi separando leitura de escrita
- [ ] Gravei um profile com CPU 4x num deck e li o flame chart até a causa
- [ ] Sei justificar quando usar will-change — e por que não usar em todo lugar

## Recursos

- [web.dev — Animations guide](https://web.dev/articles/animations-guide) — quais propriedades disparam o quê
- [web.dev — Rendering performance](https://web.dev/articles/rendering-performance) — o pixel pipeline explicado
- [Chrome DevTools — Performance panel reference](https://developer.chrome.com/docs/devtools/performance)
- [MDN — will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — inclui o aviso oficial de moderação
- Paul Irish — *What forces layout/reflow* (gist no GitHub) — a lista das propriedades que forçam layout síncrono
