# 02 — Easing & Timing

## O que é

Easing é a **curva de velocidade** de uma animação — como o valor interpola entre início e fim ao longo do tempo. Nada no mundo físico se move em velocidade constante: objetos aceleram e desaceleram. `linear` em movimento espacial parece robótico porque viola essa expectativa. A curva certa carrega significado:

- **`ease-out` (rápido → lento) para ENTRADAS.** O elemento responde imediatamente ao gatilho (a parte rápida acontece primeiro, dentro da janela de percepção) e assenta suave no destino. É a curva default de 90% da UI.
- **`ease-in` (lento → rápido) para SAÍDAS.** O elemento "ganha velocidade" ao ir embora — e como está saindo, ninguém precisa acompanhar o final. Usar `ease-in` em entrada é o erro clássico: a interface parece travada porque nada acontece nos primeiros frames.
- **`ease-in-out` para movimento DENTRO da tela** (elemento que muda de posição sem entrar nem sair).
- **`linear` só para propriedades sem posição**: opacity pura, cor, rotação contínua de spinner.

Os keywords CSS (`ease`, `ease-out`…) são `cubic-bezier()` pré-definidos — 4 números que definem 2 pontos de controle da curva. `ease-out` = `cubic-bezier(0, 0, 0.58, 1)`, que é morno. Curvas autorais têm mais personalidade: `cubic-bezier(0.22, 1, 0.36, 1)` (quint-out aproximado) entra com energia e assenta longo — é o tipo de curva que faz UI parecer "cara".

**Duração escala com o porte do elemento.** Referência prática (alinhada ao Material Design):

| Elemento | Duração |
|---|---|
| Micro (hover, toggle, checkbox) | 100–150ms |
| Pequeno (dropdown, tooltip, item de lista) | 150–250ms |
| Médio (modal, painel lateral) | 250–350ms |
| Grande (tela cheia, transição de rota, slide de deck) | 300–400ms |

Acima de ~400ms o usuário está **esperando a interface** em vez de usando. Exceção deliberada: intro/reveal de deck de apresentação (propósito = encantar, roda 1×) pode ir a 600–900ms.

### Springs vs curvas

`cubic-bezier` tem duração fixa e é **não-interrompível com graça**: se o usuário interage no meio, a animação corta ou reinicia. Springs (física de mola: massa, rigidez, amortecimento) não têm duração — têm condições físicas — e **preservam velocidade** quando interrompidas: um drag solto no meio continua do momentum atual. É por isso que Framer Motion e react-spring usam springs como default. Trade-off: spring exige JS (custo de bundle e de main thread); bezier é CSS puro, roda no compositor. Regra: transição disparada 1× → CSS bezier; gesto contínuo/interrompível (drag, swipe) → spring. CSS moderno tem `linear()` que aproxima springs por amostragem, mas o suporte e o tooling ainda fazem de JS o caminho comum.

### Passo a passo: tokens de easing num deck AG

Nos decks HTML da AG (vanilla, arquivo único), centralizar em custom properties — mesma lógica de design tokens:

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* entradas */
  --ease-in: cubic-bezier(0.64, 0, 0.78, 0);     /* saídas */
  --dur-s: 180ms; --dur-m: 300ms; --dur-l: 400ms;
}
.slide-enter { transition: transform var(--dur-l) var(--ease-out),
                           opacity var(--dur-l) var(--ease-out); }
.slide-exit  { transition: transform var(--dur-m) var(--ease-in),
                           opacity var(--dur-m) var(--ease-in); }
```

Método de calibração (não chute): abra [cubic-bezier.com](https://cubic-bezier.com), compare a curva candidata lado a lado com `ease-out`, ajuste, cole o resultado no token. Depois **verifique no alvo real** — a mesma curva parece diferente em 100ms e em 400ms; hipótese ("ficou bom") só vira afirmação depois de ver rodando nos dois portes.

## Por que cai em entrevista

"Por que ease-out na entrada e ease-in na saída?" é a pergunta-filtro de motion: tem resposta objetiva (percepção de resposta imediata vs irrelevância do final da saída) e quase todo júnior responde "porque fica mais bonito". Springs vs bezier testa se você entende interrupção e gesto — assunto de pleno.

> **P:** "Como você escolhe easing e duração de uma animação?"
>
> **R (30s):** "Easing pelo papel: ease-out pra entrada, porque a parte rápida acontece primeiro e o elemento responde na hora; ease-in pra saída, porque o final de quem sai não importa; linear só pra opacidade ou spinner. Duração pelo porte: 100–150ms pra micro-interação, até 400ms pra transição de tela — acima disso o usuário está esperando a UI. E se a interação é um gesto interrompível, tipo drag, eu troco bezier por spring, porque spring preserva a velocidade quando o usuário intervém no meio."

## Checkpoint

- [ ] Sei explicar ease-out/entrada e ease-in/saída pelo mecanismo, não por gosto
- [ ] Sei a tabela de durações por porte de cabeça (micro→tela cheia)
- [ ] Montei uma curva autoral no cubic-bezier.com e apliquei como token num deck
- [ ] Sei dizer quando spring vence bezier (e o custo de cada)
- [ ] Testei a mesma curva em duas durações diferentes e vi a diferença

## Recursos

- [cubic-bezier.com](https://cubic-bezier.com) — editor visual de curvas (Lea Verou)
- [easings.net](https://easings.net) — catálogo de curvas com preview e código
- [Material Design — Easing and duration](https://m3.material.io/styles/motion/easing-and-duration) — tokens de referência da indústria
- Josh Comeau — *A Friendly Introduction to Spring Physics* (joshwcomeau.com)
- [MDN — animation-timing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function)
