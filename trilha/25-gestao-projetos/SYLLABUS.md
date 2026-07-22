# Syllabus — Gestão de Projetos (dev solo)

> **Disciplina:** entregar software sozinho com prazo honesto, escopo sob controle e decisões rastreáveis — o processo que substitui o time que você não tem.
> **Carga horária alvo: 30h** — aulas 3h · bibliografia 14h · labs 8h · projeto de conclusão 5h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Fatiar uma feature em incrementos entregáveis fixando o tempo (appetite) e variando o escopo — não o contrário.
2. Dar um prazo com faixa de confiança defensável a partir do seu próprio histórico, em vez de um chute único.
3. Nomear, registrar e pagar dívida técnica de propósito — distinguir a dívida prudente da imprudente.
4. Defender qualquer decisão técnica meses depois lendo o ADR que você escreveu na hora.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 escopo-e-fatiamento | *Shape Up* (Ryan Singer, Basecamp — grátis online) — caps. "Set Boundaries" (appetite) e "Map the Scopes" | 2.5h |
| 02 priorizacao | *Shape Up* — caps. "Bets, Not Backlogs" e "The Betting Table" | 2h |
| 03 estimativa-honesta | Joel Spolsky — ensaio "Evidence Based Scheduling" (joelonsoftware.com) + *Shape Up* cap. "Set Boundaries" (appetite × estimativa) | 2.5h |
| 04 debito-tecnico-gerenciado | Martin Fowler — biblika "TechnicalDebt" e "TechnicalDebtQuadrant" (martinfowler.com/bliki) | 1.5h |
| 05 comunicacao-com-cliente | *Shape Up* — cap. "Show Progress" (hill charts / trabalho descoberto × por-fazer) | 1.5h |
| 06 fluxo-solo-com-ia | *Personal Kanban* (Jim Benson & Tonianne DeMaria Barry) — caps. 1–3 (visualizar o trabalho, limitar WIP, Lei de Little) + *Shape Up* cap. "Get One Piece Done" | 2h |
| 07 documentar-decisoes | Michael Nygard — "Documenting Architecture Decisions" (cognitect.com/blog) + o site de referência adr.github.io (formato e ciclo de vida do ADR) | 2h |

Regra de leitura: **com um projeto AG aberto** — cada conceito que aparecer, ache onde ele existe (ou falta) no seu fluxo real (PENDENCIAS.md, DECISIONS.md, commits, sessões com IA). Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `ebs-simulator` (5h):** ferramenta CLI que lê um CSV de estimativas passadas × tempo real, calcula a distribuição de velocidade (estimado/real) e roda uma simulação de Monte Carlo sobre a fila de tarefas restante para cuspir uma curva de data de entrega. Sem dependências de estimativa mágica — só o seu histórico.
*Pronto quando:* dado um CSV de amostra, imprime as datas P50 / P85 / P95 e um histograma ASCII, e um teste prova que aumentar a incerteza histórica alarga a faixa.

**Lab 2 — `adr-forge` (3h):** CLI que cria e gerencia ADRs em Markdown: numeração sequencial automática, template fixo (Contexto/Decisão/Consequências), transições de status (proposto → aceito → substituído) e link `superseded-by` entre registros.
*Pronto quando:* `adr new "usar X"` cria `0007-usar-x.md` numerado; `adr supersede 3 by 7` marca o 3 como substituído e cria o vínculo bidirecional; suíte de teste cobre a numeração e a transição.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com um projeto AG aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Fabio Akita** *(PT-BR)* | "metodologias ágeis", "estimativa de software", "o mito do programador 10x" | módulos 01–03 — fundamentos com senso crítico em português |
| **Código Fonte TV** *(PT-BR)* | "dívida técnica", "scrum vs kanban", "o que é MVP" | módulos 04, 06 |
| **Fireship** | "agile in 100 seconds", "technical debt explained" | visão-relâmpago antes da leitura densa |

A whitelist cobre pouco desta disciplina — o peso mora na bibliografia (*Shape Up*, EBS, ADR); use o vídeo só para o mapa inicial, nunca como substituto do lab.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso aparece/falta no seu fluxo AG real)
- [ ] 2 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — um projeto AG conduzido do escopo ao deploy com ADRs e PENDENCIAS versionados do início ao fim

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, os textos não.*
