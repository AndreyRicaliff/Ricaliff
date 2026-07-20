# 44 — Motion Design

Motion como disciplina de engenharia, não decoração: por que animar, como animar barato, e quando não animar. A trilha vai do critério (propósito, easing, coreografia) à mecânica (FLIP, compositor, rAF) e fecha nas cicatrizes de produção da AG — reduced-motion forçado por RDP e o transform residual que prende `position: fixed`.

**Ordem sugerida** (cada módulo assume os anteriores):

1. `01-motion-com-proposito` — orientar/confirmar/encantar; quando não animar
2. `02-easing-timing` — curvas, durações por porte, springs vs bezier
3. `03-coreografia-stagger` — sequência, hierarquia temporal, o reveal de slide
4. `04-transicoes-de-estado` — FLIP, View Transitions, continuidade espacial
5. `05-microinteracoes` — feedback <100ms, o botão que salvou, loading honesto
6. `06-performance-de-animacao` — pixel pipeline, thrashing, rAF+lerp, profiling
7. `07-motion-acessivel-e-armadilhas` — reduced-motion bem usado + as pegadinhas

**Pré-requisitos:** CSS sólido (transitions/keyframes básicos), JS no DOM, e o módulo de estados de tela da trilha 40-frontend ajuda no 05. DevTools Performance panel é ferramenta obrigatória a partir do 04.

**Fio condutor:** medir antes de otimizar, verificar antes de culpar (o matchMedia do módulo 07), e toda animação é culpada até provar propósito.
