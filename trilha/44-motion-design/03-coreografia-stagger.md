# 03 — Coreografia & Stagger

## O que é

Coreografia é a camada acima do easing: não *como* um elemento se move, mas **como vários elementos se relacionam no tempo**. O princípio central é brutal de simples: **se tudo entra junto, nada se destaca**. Atenção visual é serial — o olho acompanha um movimento por vez. Dez cards fazendo fade-in simultâneo lêem-se como um blob único; os mesmos dez entrando em sequência criam ritmo, direção de leitura e sensação de sistema vivo.

**Stagger** é a ferramenta: um delay incremental entre elementos irmãos. Os números que funcionam:

- **30–60ms de intervalo** entre itens. Abaixo de ~30ms o olho não separa (vira "tudo junto" com custo extra); acima de ~80ms começa a parecer lento e teatral.
- **Teto no total**: stagger × n itens somado à duração não pode passar muito de ~600–800ms num contexto de trabalho. Lista de 30 itens com 50ms de stagger = 1.5s só de delays — inaceitável. Solução: stagger só nos primeiros 8–10 itens e o resto entra junto, ou stagger decrescente.
- **A ordem segue a hierarquia de informação, não a ordem do DOM por acaso.** Título → número-chave → conteúdo de apoio → chrome (navegação, rodapé). O stagger é uma narração: o que entra primeiro é anunciado como mais importante (módulo 01, hierarquia temporal). Stagger em ordem errada narra a história errada.

### O caso real: reveal de slide nos decks AG

Os decks HTML da AG (apresentações single-file, vanilla JS) usam exatamente esse padrão: cada slide entra com título primeiro, depois o dado-destaque, depois os bullets em cascata. A primeira versão de um deck tinha tudo em fade simultâneo — tecnicamente animado, perceptualmente morto. O diagnóstico não foi "falta animação", foi "falta *ordem*". Mesma quantidade de motion, coreografado, mudou a leitura do slide.

### Passo a passo: stagger declarativo em CSS (padrão dos decks)

Sem lib. O truque é indexar irmãos com uma custom property e derivar o delay:

```html
<section class="slide">
  <h2 class="reveal" style="--i:0">Título</h2>
  <p  class="reveal num" style="--i:1">R$ 1,2M</p>
  <li class="reveal" style="--i:2">Ponto um</li>
  <li class="reveal" style="--i:3">Ponto dois</li>
</section>
```

```css
.slide.active .reveal {
  animation: rise 400ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 50ms);   /* 50ms de stagger */
}
@keyframes rise {
  from { opacity: 0; transform: translateY(12px); }
}
```

Detalhes que separam sênior de júnior aqui:

1. **`animation-fill-mode: backwards`** — aplica o `from` durante o delay (senão o item aparece, some e reaparece). E é `backwards`, **não `both`** — `both` congela o transform final e cria o bug do `position:fixed` (módulo 07).
2. **`from` sem `to`** — o estado final é o CSS normal do elemento. Se a animação nunca rodar (reduced-motion, módulo 07), o conteúdo está visível. Animação é a viagem, nunca o destino.
3. **Deslocamento curto (8–16px)** — stagger com translateY de 60px vira montanha-russa.
4. Em React, o mesmo padrão é `style={{ '--i': index }}` no map — o mecanismo não muda.

Verificação (não confie no olho em replay mental): grave a tela ou use DevTools → Animations panel, e confira se a ordem percebida = hierarquia pretendida. Duas vezes já bastou pra achar item entrando antes do título por causa de ordem de DOM.

## Por que cai em entrevista

Coreografia é o tópico que revela se o candidato pensa em **sistema** ou em elemento isolado. "Como você animaria a entrada de um dashboard?" — quem responde "fade-in nos cards" para no júnior; quem fala em ordem por hierarquia, stagger de 30–60ms e teto de tempo total demonstra critério de produto, não de efeito.

> **P:** "Você tem uma lista de resultados que entra na tela. Como anima?"
>
> **R (30s):** "Stagger de 40 a 50ms entre itens, cada um com fade + translateY curto de uns 12px, ease-out, 300–400ms. A ordem segue a hierarquia: cabeçalho antes dos itens. E eu ponho um teto — se a lista tem 30 itens, só os 8 primeiros ganham stagger e o resto entra junto, senão o usuário espera 1,5s de puro delay. O princípio é que atenção é serial: tudo junto, nada se destaca; em sequência, eu controlo a ordem de leitura. Uso esse padrão nos reveals de slide das apresentações que faço."

## Checkpoint

- [ ] Sei os números de cabeça: 30–60ms de stagger, teto de ~600–800ms no total
- [ ] Implementei stagger via `--i` + `calc()` sem lib num deck ou componente
- [ ] Sei explicar por que `backwards` e não `both` no fill-mode
- [ ] Sei explicar por que o keyframe só tem `from` (destino = CSS normal)
- [ ] Conferi no Animations panel que a ordem percebida = hierarquia pretendida

## Recursos

- [MDN — animation-delay](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay) e [animation-fill-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode)
- [Material Design — Applying transitions](https://m3.material.io/styles/motion/transitions/applying-transitions) — coreografia de elementos relacionados
- [Framer Motion — staggerChildren](https://motion.dev) — o mesmo conceito com orquestração declarativa em React
- Emil Kowalski — *Animations on the Web* (animations.dev) — curso de referência em coreografia de UI
