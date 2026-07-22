# Syllabus — Design de Interface

> **Disciplina:** ter critério nomeável para cada decisão visual — e prová-lo com evidência.
> **Carga horária alvo: 40h** — aulas 3h · bibliografia 15h · labs 12h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Estabelecer hierarquia visual com tamanho, peso, cor e espaço — e justificar cada alavanca, não "achar bonito".
2. Montar uma escala de tipografia, cor (HSL) e espaçamento como sistema, e auditar contraste contra o AA por número.
3. Projetar os 5 estados de qualquer tela (vazio/carregando/erro/parcial/cheio), tratando o vazio como primeira impressão.
4. Criticar uma interface com vocabulário de affordance/signifier/feedback/mapeamento em vez de opinião.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 hierarquia-visual | *Refactoring UI* (Wathan & Schoger) — "Hierarchy Is Everything" (não tudo compete por atenção; peso/cor > tamanho) | 2h |
| 02 tipografia | *Refactoring UI* — "Designing Text" (escala modular, medida de linha, line-height por tamanho, tabular-nums) | 2h |
| 03 cor-com-intencao | *Refactoring UI* — "Working with Color" (HSL, define your shades) + WCAG 2.2 quickref — SC 1.4.3 "Contrast (Minimum)" | 2h |
| 04 espacamento-grid | *Refactoring UI* — "Layout and Spacing" (comece com espaço demais; escala de espaçamento; não centralize tudo) | 2h |
| 05 estados-da-interface | *The Design of Everyday Things* (Norman) — cap. 2 "The Psychology of Everyday Actions" (golfos de execução/avaliação, feedback) + *Refactoring UI* — "Finishing Touches" (empty states) | 1.5h |
| 06 acessibilidade-minima | WCAG 2.2 quickref — SC 2.1.1 "Keyboard", 2.4.7 "Focus Visible", 4.1.2 "Name, Role, Value" + MDN — "ARIA basics" | 2h |
| 07 design-system-pratico | *Refactoring UI* — "Systematizing" (definir escalas de espaço/tipo/cor como sistema, não caso a caso) | 1.5h |
| 08 critica-estruturada | *The Design of Everyday Things* (Norman) — cap. 1 "The Psychopathology of Everyday Things" (affordances, signifiers, mapeamento, restrições) | 2h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) num app AG. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `contraste-audit` (4h):** função TS pura `contrastRatio(hexA, hexB)` que calcula a razão de contraste WCAG e retorna aprovação AA/AAA para texto normal e grande. CLI + suíte vitest.
*Pronto quando:* a razão bate com a fórmula WCAG em pares conhecidos (`#000`/`#fff` = 21:1), e os limiares AA (4.5 normal, 3.0 grande) têm teste que passa e teste que reprova.

**Lab 2 — `type-scale` (4h):** gerador de escala tipográfica modular (razão configurável) que emite CSS custom properties + uma página de preview renderizando a escala com line-height correto por tamanho. Sem framework.
*Pronto quando:* a escala renderiza, cada passo é a razão × o anterior (verificável), e uma página monta um card usando **só** os tokens de tipo e espaço gerados.

**Lab 3 — `five-states` (4h):** um único componente (card de lista) construído 5 vezes — vazio, carregando, erro, parcial, cheio — em HTML/CSS puro.
*Pronto quando:* os 5 estados aparecem na mesma página, o vazio tem CTA e não é uma tela em branco, e todo controle é alcançável por teclado com foco visível.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **DesignCourse** | "design theory", "UI design fundamentals", "visual hierarchy" | módulos 01, 07 |
| **The Futur** | "typography principles", "color theory", "design critique" | módulos 02, 03, 08 |
| **Kevin Powell** | "css typography", "spacing", "color contrast accessibility", "focus visible" | módulos 02, 03, 04, 06 |
| **DevSoutinho** *(PT-BR)* | "css na prática", "acessibilidade web" | módulos 04, 06 — reforço em português |

Ordem sugerida: princípio primeiro (The Futur/DesignCourse) pra ter o vocabulário, depois a mão no CSS (Kevin Powell/DevSoutinho) pra provar o número (contraste, escala). Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, as obras não.*
