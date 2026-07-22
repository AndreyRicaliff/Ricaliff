# Syllabus — Arquitetura

> **Disciplina:** organizar o código para caber na cabeça e mudar sem medo — camadas, módulos profundos, e decisões registradas. Com senso crítico, não culto a padrões.
> **Carga horária alvo: 45h** — aulas 4h · bibliografia 20h · labs 13h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Aplicar cada princípio SOLID a um caso real — e reconhecer quando aplicá-lo cega apenas adiciona complexidade.
2. Separar controller/service/repository de forma que a implementação do banco troque sem tocar na regra de negócio (DIP na prática).
3. Argumentar monólito × microsserviço pelo custo real (deploy, dado, time), não pela moda — e defender comunicação síncrona vs assíncrona.
4. Escrever um ADR que um futuro leitor entende, e projetar um "módulo profundo" (interface pequena escondendo complexidade real).

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 solid-na-pratica | *Clean Architecture* (Robert C. Martin) — Parte III "Design Principles" (os 5 capítulos SRP/OCP/LSP/ISP/DIP) + *A Philosophy of Software Design* (Ousterhout) — cap. "Pull Complexity Downwards" como contraponto ao excesso | 4h |
| 02 camadas-controller-service-repository | *Clean Architecture* — caps. "The Clean Architecture" e "Boundaries: Drawing Lines" + *Patterns of Enterprise Application Architecture* (Fowler) — verbete "Repository" | 3h |
| 03 monolito-vs-microsservico | *Building Microservices* (Sam Newman, 2ª ed) — cap. 1 "What Are Microservices?" + ensaio "MonolithFirst" (Martin Fowler) | 2.5h |
| 04 padroes-comunicacao | *Building Microservices* (Newman) — cap. sobre estilos de comunicação (síncrono/bloqueante vs assíncrono/eventos) + *Designing Data-Intensive Applications* (Kleppmann) — cap. 11 "Stream Processing" (introdução: mensageria) | 3h |
| 05 adrs-architecture-decision-records | "Documenting Architecture Decisions" (Michael Nygard, 2011) + adr.github.io (template e catálogo de organização) | 1.5h |
| 06 design-patterns-uteis | *Design Patterns* (Gamma/Helm/Johnson/Vlissides — GoF) — Strategy, Adapter, Factory Method, Observer + *Refactoring to Patterns* (Kerievsky) — introdução (não sair aplicando padrão à toa) | 3h |
| 07 modularidade-pacotes | *A Philosophy of Software Design* (Ousterhout) — caps. "Modules Should Be Deep", "Information Hiding (and Leakage)" e "Different Layer, Different Abstraction" + *Clean Architecture* — caps. "Component Cohesion" (REP/CCP/CRP) e "Component Coupling" (ADP/SDP/SAP) | 3h |

Regra de leitura: **com um app AG aberto** — cada princípio que ler, aponte onde ele foi seguido ou violado no código real. Leitura sem confronto com código não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `layered-crud` (6h):** monte do zero um domínio mínimo (ex.: tarefas) em três camadas — controller / service / repository — com o repositório atrás de uma interface e duas implementações: uma em memória e uma "real" (arquivo/SQLite).
*Pronto quando:* você troca a implementação do repositório sem tocar em service nem controller, provado por testes que rodam a MESMA suíte contra as duas implementações.

**Lab 2 — `pattern-picker` (4h):** implemente a MESMA feature (ex.: cálculo de frete/preço com variantes) duas vezes — uma com padrão Strategy, outra com um `switch` simples.
*Pronto quando:* as duas funcionam e o `QUANDO.md` documenta o ponto de equilíbrio (a partir de quantas variantes o Strategy paga a complexidade que adiciona).

**Lab 3 — `deep-module` (3h):** projete um "módulo profundo" à la Ousterhout — uma interface de ≤ 3 métodos que esconde complexidade real (ex.: um `Cache` com TTL + evicção LRU + serialização por trás de `get`/`set`).
*Pronto quando:* a API pública tem no máximo 3 métodos, esconde TTL/evicção/serialização por completo, e o README compara com uma versão "rasa" (wrapper fino) mostrando a diferença de superfície.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (a fronteira/decisão que ela te fez desenhar diferente)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — com pelo menos 2 ADRs registrados no `DECISIONS.md`

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
