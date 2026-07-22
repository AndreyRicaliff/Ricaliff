# Syllabus — Frontend (React)

> **Disciplina:** construir UI em React que re-renderiza só quando precisa, é acessível de verdade e carrega rápido — sabendo o que o React faz por baixo, não decorando receitas.
> **Carga horária alvo: 45h** — aulas 3.5h · bibliografia 20h · labs 15h · projeto de conclusão 6.5h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar o ciclo render → commit e por que o estado é um snapshot dentro de um render.
2. Decidir quando `useMemo`/`useCallback`/`memo` compensam — e provar com contagem de renders que o resto é ruído.
3. Estruturar estado (lift, reducer, context) sem prop-drilling nem re-render em cascata.
4. Construir um componente acessível por teclado seguindo o padrão ARIA correto e testá-lo do jeito que o usuário usa.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 render-cycle-e-reconciliation | react.dev — "Learn React": "Render and Commit" e "State as a Snapshot" | 2.5h |
| 02 hooks-essenciais | react.dev — "State: A Component's Memory", "Synchronizing with Effects" e "You Might Not Need an Effect" | 3.5h |
| 03 quando-memoizar-e-quando-nao | react.dev — referência de `useMemo` e `useCallback` (callouts "Should you add … everywhere?") + `memo` | 2.5h |
| 04 state-management | react.dev — "Managing State": "Choosing the State Structure", "Sharing State Between Components", "Scaling Up with Reducer and Context" | 3.5h |
| 05 acessibilidade-aria | web.dev — curso "Learn Accessibility" + WAI-ARIA Authoring Practices Guide (APG, w3.org/WAI/ARIA/apg) para o padrão do componente | 3h |
| 06 performance-web | web.dev — curso "Learn Performance" + "Web Vitals" (LCP/CLS/INP) + Vite docs "Building for Production" (code splitting, chunks) | 3h |
| 07 testes-ui | Testing Library docs — "Guiding Principles" e "React Testing Library" + Vitest docs "Getting Started" | 2.5h |

Regra de leitura: **com um componente AG aberto** — cada conceito, ache onde ele se aplica (ou está sendo violado) numa tela real. Ler sobre re-render sem contar renders no seu app não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `render-tracer` (6h):** app Vite + React mínimo instrumentado para contar renders de cada componente (um contador por componente, incrementado no corpo do render). Demonstra: lift de estado que espalha render, `memo` + `useCallback` que corta render, e um `useMemo` inútil que não muda nada.
*Pronto quando:* um painel mostra a contagem de renders antes/depois de cada otimização, e o README explica em uma frase por que cada mudança cortou (ou não) renders — com o caso do `useMemo` inútil identificado.

**Lab 2 — `a11y-combobox` (6h):** um autocomplete/combobox construído do zero seguindo o padrão "Combobox" do WAI-ARIA APG: navegação por teclado (setas, Enter, Esc, Home/End), `aria-activedescendant`, `role`/`aria-expanded` corretos, foco gerenciado.
*Pronto quando:* dá para operar 100% pelo teclado sem mouse, um leitor de tela anuncia a opção ativa, e um teste com Testing Library (queries por role/nome acessível) cobre abrir, navegar e selecionar.

**Lab 3 — `perf-budget` (4h):** app Vite com um componente propositalmente pesado (lista grande + import gordo). Meça com Lighthouse/Web Vitals, aplique code-splitting (`lazy`/dynamic import) e virtualização/memo, e meça de novo.
*Pronto quando:* um antes/depois documenta a queda de LCP/tamanho do bundle inicial com números reais, e o chunk pesado só carrega sob demanda (visível no network).

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com um componente AG aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Rocketseat** *(PT-BR)* | "React hooks", "useMemo useCallback", "Context API", "React do zero" | módulos 02–04 — fundamentos em português |
| **DevSoutinho** *(PT-BR)* | "React re-render", "acessibilidade web", "como o React funciona por dentro" | módulos 01, 05 |
| **Web Dev Simplified** | "React useMemo useCallback", "React context", "React Testing Library" | módulos 03, 04, 07 |
| **Kevin Powell** | "web accessibility", "focus management", "keyboard navigation" | módulo 05 — a11y e CSS na prática |
| **Fireship** | "React in 100 seconds", "10 React hooks", "web vitals" | módulos 01, 06 — visão-relâmpago |

Ordem sugerida: Fireship/Rocketseat para o mapa; Web Dev Simplified/DevSoutinho DEPOIS, sempre contando renders no seu próprio app. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta numa tela AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — uma tela React com estado bem estruturado, acessível por teclado e com orçamento de performance batido

*Bibliografia sem link direto: procurar pelo título — react.dev, web.dev e os docs do Vite mudam de URL, as seções não.*
