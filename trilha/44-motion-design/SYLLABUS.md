# Syllabus — Motion Design para a Web

> **Disciplina:** movimento que carrega significado e cabe em 16ms — nunca enfeite.
> **Carga horária alvo: 35h** — aulas 2.5h · bibliografia 12.5h · labs 12h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Decidir se uma animação tem propósito (orientar/dar feedback/estabelecer relação) antes de codá-la — e cortar a que só distrai.
2. Escolher easing e duração com intenção (entrada vs saída, distância percorrida) em vez de `ease` default em tudo.
3. Animar só propriedades de composição (transform/opacity), medir 60fps no DevTools e nomear por que layout/paint mata frame.
4. Tornar todo movimento acessível: colapsar para o estado final em `prefers-reduced-motion` e respeitar pausa/stop.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 motion-com-proposito | Material Design 3 — "Motion / Understanding motion" (movimento dá significado, foco e continuidade) + *Disney Animation: The Illusion of Life* (Thomas & Johnston) — os 12 princípios, aplicados a UI | 2h |
| 02 easing-timing | MDN — "Using CSS animations" + `easing-function` reference; web.dev — "Choose the right easing" (slow-in/slow-out como princípio Disney) | 2h |
| 03 coreografia-stagger | Material Design 3 — "Choreography" (ordem, atraso escalonado, staging) + princípios "staging" e "follow through / overlapping action" | 1.5h |
| 04 transicoes-de-estado | MDN — "Web Animations API" (guia de conceitos) + web.dev — "Smooth and simple transitions with the View Transitions API" | 2h |
| 05 microinteracoes | Dan Saffer — *Microinteractions* (O'Reilly) — trigger/rules/feedback/loops + Emil Kowalski — "Great Animations" (emilkowal.ski, artigo gratuito) | 1.5h |
| 06 performance-de-animacao | web.dev — "Animations guide" (fique nas propriedades de composição; gerencie contagem de camadas) + MDN — "CSS `will-change`" (quando e por que não abusar) | 1.5h |
| 07 motion-acessivel-e-armadilhas | WCAG 2.2 quickref — SC 2.3.3 "Animation from Interactions" e 2.2.2 "Pause, Stop, Hide" + MDN — "`prefers-reduced-motion`" | 2h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) num app AG. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `easing-lab` (4h):** página que anima o mesmo elemento com 4 curvas lado a lado — `linear`, `ease-in`, `ease-out`, cubic-bezier custom — com botão de reproduzir e toggle de reduced-motion. Só CSS/transform/opacity.
*Pronto quando:* as 4 curvas correm em paralelo e são visivelmente distintas, nada anima layout/paint (verificado no painel de camadas), e `prefers-reduced-motion` colapsa tudo para instantâneo.

**Lab 2 — `stagger-list` (4h):** lista que revela seus itens com atraso escalonado configurável, via Web Animations API pura (sem lib).
*Pronto quando:* o stagger delay é parametrizável, os itens entram em cascata a 60fps (comprovado no DevTools Performance), e em reduced-motion todos aparecem juntos sem movimento.

**Lab 3 — `view-transition-demo` (4h):** navegação entre duas telas usando a View Transitions API para um morph de elemento compartilhado (ex.: card → detalhe).
*Pronto quando:* o elemento faz morph entre as telas, há fallback gracioso (corte simples) quando a API não é suportada, e o efeito respeita reduced-motion.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Kevin Powell** | "css transitions", "css animation", "prefers-reduced-motion" | módulos 02, 04, 07 |
| **Fireship** | "view transitions api", "css animations", "web animations api" | módulos 04 + visão-relâmpago antes da leitura |
| **Web Dev Simplified** | "css animations tutorial", "microinteractions", "animate on scroll" | módulos 02, 05 |
| **The Coding Train** | "easing functions", "animation with p5" | módulos 02, 03 — intuição de curva e stagger |

Ordem sugerida: vídeo-relâmpago (Fireship) ANTES da bibliografia pra criar o mapa; prática de curva/estado (Kevin Powell/Web Dev Simplified) DEPOIS do módulo pra consolidar. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, as obras não.*
