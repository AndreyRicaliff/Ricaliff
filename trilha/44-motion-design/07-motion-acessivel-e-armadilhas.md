# 07 — Motion Acessível & Armadilhas

## O que é

Motion tem custo de acessibilidade real: pessoas com desordens vestibulares (labirintite, enxaqueca vestibular) sentem tontura e náusea com parallax, zoom e grandes translações. A WCAG cobre isso em **2.3.3 (Animation from Interactions, AAA)** — animação disparada por interação deve poder ser desativada — e 2.2.2 (conteúdo que se move por mais de 5s precisa de pausa). O mecanismo da plataforma é a media query **`prefers-reduced-motion: reduce`**, que reflete a preferência do sistema operacional.

**Reduzir ≠ congelar.** O erro comum é tratar o flag como "desligue tudo":

- **Certo:** substituir o que enjoa (grandes translações, parallax, zoom, autoplay) por equivalentes calmos — fade de opacity, corte seco. Feedback funcional (loading, confirmação de ação, focus) **permanece**: o usuário pediu menos movimento, não menos informação.
- **Errado:** `animation: none` global. Se o estado inicial do elemento era `opacity: 0` esperando a animação trazê-lo, matar a animação **congela a página invisível**. O flag vira interruptor de quebrar o site.

O padrão estrutural que imuniza contra isso (já apareceu nos módulos 03): **o estado final mora no CSS normal do elemento; a animação só descreve a viagem** (`from` sem `to`, ou classe que remove o estado inicial). Animação que não roda = conteúdo visível no destino. Aí a redução é segura:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal { animation-duration: 0.01ms; animation-delay: 0ms; }
  .parallax { transform: none !important; }
  /* loading e feedback de ação: intocados */
}
```

`0.01ms` em vez de `none`: os keyframes ainda "acontecem" (eventos `animationend` disparam, fill-modes resolvem), só que instantâneos — lógica JS que espera o fim da animação não trava.

### A exceção documentada: RDP/Windows força o flag

Caso real AG, duas vezes: **Windows com "Efeitos de animação" desligado — e sessões RDP, que desligam sozinhas — reportam `prefers-reduced-motion: reduce`** sem nenhum pedido consciente do usuário. Resultado: deck de apresentação aberto via área de trabalho remota com a intro congelada em `opacity: 0` — tela preta, parecia bug de render. A hipótese inicial ("quebrou o JS do deck") foi refutada verificando o dado: `matchMedia('(prefers-reduced-motion: reduce)').matches` → `true` numa máquina onde ninguém configurou isso.

Lição em duas camadas:

1. **Universal:** nunca gatear *visibilidade* nesse flag — só a viagem (o padrão acima já resolve).
2. **Decisão de produto documentada:** em deck de apresentação da AG — artefato cuja função É o motion, apresentado 1× em telão muitas vezes via RDP — o flag é deliberadamente ignorado (`reduce = false` no código, com comentário do porquê). Isso é uma **exceção com escopo**, registrada em DECISIONS.md, não uma licença geral: num produto de uso diário (PULSAR-RH), respeitar o flag continua obrigatório.

### A armadilha do fill-mode: `backwards` vs `both` (o bug do position:fixed)

`animation-fill-mode` define o que os keyframes aplicam **fora** da janela da animação: `backwards` aplica o `from` durante o delay; `forwards` mantém o último keyframe **para sempre**; `both` = os dois. A pegadinha: por spec CSS, **`transform` não-none num ancestral vira containing block de `position: fixed`** — o "fixed" passa a ser relativo àquele ancestral, não ao viewport.

O bug real de catálogo AG: container entra com `animation: rise 400ms both`, keyframe termina em `transform: translateY(0)`. Visualmente idêntico a nada — mas com `both`/`forwards` esse transform **fica aplicado eternamente**, e o modal `position: fixed` lá dentro abre "grudado no topo" do container em vez de centralizado no viewport. Diagnóstico no DevTools: inspecionar o modal → Computed → achar quem é o containing block; o transform residual aparece no ancestral.

Fixes, do melhor pro paliativo: usar **`backwards`** quando o estado final já é o CSS normal (padrão do módulo 03 — não há o que "manter"); ou remover a classe de animação num `animationend`; ou nunca animar `transform` em containers que abrigam elementos `fixed` (portar o modal pra fora, ex.: React portal).

## Por que cai em entrevista

Acessibilidade de motion é o diferencial que quase nenhum candidato leva: citar `prefers-reduced-motion` já destaca; explicar "reduzir sem congelar" + um caso real de flag forçado por ambiente demonstra cicatriz de produção, que é o que separa pleno de júnior com portfólio bonito. O bug do containing block é pergunta armadilha clássica de CSS avançado.

> **P:** "Como você lida com prefers-reduced-motion?"
>
> **R (30s):** "Reduzo, não congelo: troco translações grandes e parallax por fade ou corte seco, e mantenho feedback funcional. Estruturalmente, o estado final vive no CSS normal e a animação só descreve a viagem — assim, animação que não roda nunca esconde conteúdo. E aprendi na prática que o flag pode vir do ambiente, não do usuário: sessão RDP no Windows liga reduced-motion sozinha e congelou uma apresentação minha em opacity zero. Verifiquei com matchMedia antes de culpar o código — e a exceção pra decks ficou documentada em DECISIONS.md com escopo fechado."

## Checkpoint

- [ ] Sei explicar "reduzir ≠ congelar" com o exemplo do opacity: 0 preso
- [ ] Apliquei o padrão "estado final no CSS, animação é só a viagem" num projeto
- [ ] Sei por que `0.01ms` em vez de `animation: none` no media query
- [ ] Reproduzi o flag forçado (Windows: desligar efeitos de animação) e vi o matchMedia virar true
- [ ] Sei explicar o bug do position:fixed por transform residual e os 3 fixes
- [ ] Sei defender quando ignorar o flag é decisão legítima (e onde documentar)

## Recursos

- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) — inclui o padrão de reduzir sem remover
- [WCAG 2.3.3 — Animation from Interactions (Understanding)](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [MDN — Containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block) — a regra do transform que prende o fixed
- Val Head — *Designing Safer Web Animation for Motion Sensitivity* (A List Apart)
