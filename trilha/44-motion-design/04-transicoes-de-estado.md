# 04 — Transições de Estado & FLIP

## O que é

O problema: animar **mudança de layout** (elemento muda de posição, tamanho ou de container) é caro e desajeitado. `top/left/width/height` disparam layout + paint a cada frame (módulo 06) e nem sempre são animáveis (item que muda de posição numa lista reordenada não tem "propriedade" pra transicionar — ele simplesmente re-renderiza em outro lugar e **teleporta**).

**FLIP** (Paul Lewis, Google, 2015) resolve invertendo o problema — *First, Last, Invert, Play*:

1. **First** — meça a posição atual (`getBoundingClientRect()`).
2. **Last** — aplique a mudança de estado (reordene, mude a classe) e meça de novo. O browser já pôs o elemento no destino final.
3. **Invert** — aplique um `transform` que o devolve visualmente pra posição antiga (`translate(firstX - lastX, firstY - lastY)`). Pro usuário, nada se moveu ainda.
4. **Play** — transicione o transform até `none`. O elemento "viaja" do lugar antigo pro novo — mas o layout já estava resolvido no passo 2, e a animação inteira é só transform (compositor, barato).

A sacada de engenharia: em vez de animar *até* um layout futuro desconhecido, você deixa o layout acontecer de graça e anima *a partir* dele, de trás pra frente. É o padrão por baixo do `layout` prop do Framer Motion e das transições de lista do Vue.

### View Transitions API

O browser fazendo FLIP por você. `document.startViewTransition(() => atualizarDOM())` tira um snapshot do estado antigo, aplica a mudança, e cross-fade entre os dois — com `view-transition-name: nome-unico` em CSS, elementos com o mesmo nome nos dois estados são **morfados** (posição + tamanho) em vez de cross-fade. Same-document é suportada em Chromium desde 2023 e Safari 18; Firefox chegou por último — **verifique no caniuse antes de afirmar suporte em call de projeto**, e trate sempre como progressive enhancement:

```js
function navegar(atualizarDOM) {
  if (!document.startViewTransition) return atualizarDOM(); // fallback: sem animação, zero quebra
  document.startViewTransition(atualizarDOM);
}
```

### Continuidade espacial: o item VIRA o detalhe

O padrão-rei de orientação (módulo 01): clicar num card e o card **expandir** até virar a tela de detalhe — em vez de detalhe surgir do nada. O elemento persiste, então o usuário nunca pergunta "onde estou?". Custa: ou FLIP manual entre card e hero do detalhe, ou `view-transition-name` compartilhado entre as duas telas, ou `layoutId` no Framer Motion. Trade-off honesto: em rota Next.js com data fetching no meio, a continuidade exige segurar a transição até os dados chegarem — muitas vezes um skeleton bem coreografado entrega 80% do valor por 20% da complexidade. Decisão, não dogma.

### Passo a passo: FLIP num ranking que reordena (dashboard Cliente Varejo)

Caso plausível dos dashboards comerciais AG: ranking de vendedores que reordena quando o filtro de período muda — sem FLIP, as linhas teleportam.

```js
function reordenarComFlip(container, aplicarNovaOrdem) {
  const linhas = [...container.children];
  const first = new Map(linhas.map(el => [el.dataset.id, el.getBoundingClientRect()]));

  aplicarNovaOrdem(); // muda o DOM — browser resolve o layout final

  for (const el of container.children) {
    const f = first.get(el.dataset.id);
    if (!f) continue; // linha nova: entra sem FLIP (ou com fade)
    const d = f.top - el.getBoundingClientRect().top;
    if (!d) continue;
    el.animate(
      [{ transform: `translateY(${d}px)` }, { transform: 'none' }],
      { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  }
}
```

Verifique de verdade: DevTools → Performance, grave a reordenação. A prova de que o FLIP está certo é **uma** barra de Layout (na mudança de DOM) e frames seguintes só com Composite. Layout roxo em todo frame = você está animando propriedade de layout e o FLIP falhou — evidência antes de "pronto".

## Por que cai em entrevista

FLIP é pergunta clássica de vaga front pleno/sênior porque testa duas coisas de uma vez: entender o pipeline de render (por que transform e não top/left) e capacidade de inverter um problema. View Transitions testa se você acompanha plataforma web moderna — e se sabe tratar API nova como enhancement em vez de apostar o produto nela.

> **P:** "Como você animaria um item de lista que muda de posição após um sort?"
>
> **R (30s):** "FLIP: meço a posição antes com getBoundingClientRect, deixo o DOM reordenar, meço de novo, aplico um transform que devolve o item visualmente pro lugar antigo e transiciono até transform none. O layout acontece uma vez só e a animação inteira é transform no compositor. Usei esse padrão em ranking de vendedores que reordena com filtro de período. Hoje eu testaria também View Transitions API, que faz isso nativo — mas com fallback, porque é progressive enhancement, não baseline."

## Checkpoint

- [ ] Sei recitar os 4 passos do FLIP e o porquê da inversão
- [ ] Implementei FLIP vanilla numa lista que reordena e vi funcionando
- [ ] Provei no Performance panel: 1 layout na mudança, resto só composite
- [ ] Fiz um `startViewTransition` com fallback funcional sem a API
- [ ] Sei defender quando continuidade espacial NÃO vale a complexidade

## Recursos

- [Paul Lewis — FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/) — o artigo original
- [MDN — View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Chrome for Developers — Same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions)
- [Framer Motion — layout animations](https://motion.dev) — FLIP industrializado (`layout` / `layoutId`)
- [caniuse.com — view-transitions](https://caniuse.com/view-transitions) — conferir antes de prometer suporte
