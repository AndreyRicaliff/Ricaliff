# Trilha de Fundamentos — Júnior → Pleno

Roadmap de estudo orientado a **defesa em entrevista** + **construção de diferencial real** num mercado onde qualquer um assina Claude.

> **A pergunta que essa trilha responde:**
> Se em 6 meses todo júnior tiver o mesmo Claude que você, **o que sobrevive de você?**
>
> Resposta: fundamentos que você explica sem consultar, decisões registradas em primeira pessoa, comunicação pública, e raciocínio em problema novo. Tudo isso vive em `95-diferencial/`.

---

## Como funciona

Estude em ordem numérica. Cada módulo `.md` segue o mesmo template: conceito → por que cai em entrevista → trade-offs → exercício aplicado num projeto AG → pergunta+resposta de entrevista → checkpoint mensurável.

Marque `[x]` no checkpoint **só quando** (1) conseguir recitar a resposta e (2) o exercício estiver commitado num projeto AG real.

---

## Mapa

| # | Trilha | Foco | Prioridade | Status |
|---|---|---|---|---|
| 00 | [Fundamentos](./00-fundamentos/) | Base que **toda** entrevista júnior cobra | 🔴 Alta | 6/6 ✅ |
| 10 | [Código Limpo](./10-codigo-limpo/) | Teoria por trás do `CLAUDE.md` | 🔴 Alta | 4/4 ✅ |
| 20 | [Arquitetura](./20-arquitetura/) | SOLID, camadas, ADRs | 🟡 Média | 7/7 ✅ |
| 30 | [Banco de Dados](./30-banco/) | Postgres, índices, N+1, RLS | 🔴 Alta | 8/8 ✅ |
| 40 | [Frontend](./40-frontend/) | React render cycle, hooks, perf | 🟡 Média | 7/7 ✅ |
| 50 | [Backend](./50-backend/) | Express, Prisma, queues, idempotência | 🟡 Média | 8/8 ✅ |
| 60 | [Segurança](./60-seguranca/) | OWASP, LGPD, XSS, SQLi | 🔴 Alta | 8/8 ✅ |
| 70 | [DevOps](./70-devops/) | Docker, CI/CD, observabilidade | 🟢 Baixa | 6/6 ✅ |
| 80 | [System Design](./80-system-design/) | Cache, fila, replicação, CAP | 🟢 Baixa | 8/8 ✅ |
| 90 | [Entrevista](./90-entrevista/) | Banco de 40 perguntas + pitch de 5min de cada projeto AG + mock | 🔴 Alta | 3/3 ✅ |
| **95** | [**Diferencial**](./95-diferencial/) | **O que sobrevive ao Claude** | 🔴 **MÁXIMA** | **6/6 ✅** |

---

## Por onde começar (cronograma de 12 semanas)

| Semana | Foco principal |
|---|---|
| 1-2 | `00-fundamentos` (1 módulo/dia) + **começar `95-diferencial/01` hoje** (hora sagrada sem IA, todo dia) |
| 3 | `10-codigo-limpo` + `90-entrevista/walkthrough-projetos.md` (1 projeto por dia) |
| 4-5 | `60-seguranca` (criar módulos a partir do stub) — domínio onde portfólio AG já é forte |
| 6-7 | `30-banco` — base de todo backend, pesa em entrevistas júnior |
| 8-9 | `50-backend` + `40-frontend` (alternando) |
| 10 | `20-arquitetura` — aqui você defende escolhas de design |
| 11-12 | `90-entrevista/simulacao.md` — mock diário |
| **Sempre** | **`95-diferencial`** — exercícios diários/semanais/mensais paralelos a tudo |

`70-devops` e `80-system-design` entram conforme tópicos aparecerem em entrevistas reais (não bloqueiam).

---

## Por que `95-diferencial` é a trilha MÁXIMA

O Claude resolve o que já foi resolvido. Se você só executa o que ele gera, você é substituível — porque qualquer um com $20 vira o que você é.

A trilha `95-diferencial` tem 5 dimensões, cada uma uma rotina **diária ou semanal**:

1. **Fundamentos sem IA** — 30min/dia no caderno, sem Claude aberto
2. **Decisões em primeira pessoa** — `DECISIONS.md` datado em cada projeto AG
3. **Saber quando NÃO usar Claude** — hora sagrada diária + 1 dia/mês sem AI
4. **Comunicação pública** — 1 post LinkedIn técnico/semana + 1 PR open source/mês
5. **Raciocínio em problema novo** — 1 LeetCode medium/dia sem Claude no 1º round

**Métrica de 90 dias:** se você não bater 50 commits sem autocompletar + 12 posts + 1 PR open source aceito, ignorou a parte mais importante.

---

## Regras de aprendizado

1. **Um módulo por dia, no máximo.** Densidade mata fixação.
2. **Sempre fazer o exercício** num projeto AG real — sem isso, é leitura passiva.
3. **Recitar a resposta de entrevista em voz alta** até sair sem pensar.
4. **Marcar o checkpoint** só com evidência mensurável (commit, post, talk, mock gravado).
5. **Linkar com `DECISIONS.md`** do projeto: o exercício vira decisão registrada em primeira pessoa.
6. **Hora sagrada sem IA** (`95-diferencial/01`) começa hoje, não depois.

---

## Recursos paralelos

| Recurso | Para quê |
|---|---|
| `~/.claude/CLAUDE.md` | Regras automáticas que o Claude aplica (espelham `10-codigo-limpo`) — inclui §ENSINAR EM CONTEXTO que força bloco 🎓 + DECISIONS.md em toda mudança não-trivial |
| `~/.claude/neural/learning/` | Histórico do que já foi aprendido em contexto real |
| `~/.claude/neural/patterns/` | Erros recorrentes e como evitar |
| `<projeto>/DECISIONS.md` | Decisões registradas em cada projeto AG — material concreto de entrevista |
| `~/projetos/ag-hub/PROJECTS.md` | Estado de cada projeto AG — escolha o projeto-alvo do exercício a partir daqui |

---

*Última atualização: 2026-06-01 — **sistema 100% completo**: 79 arquivos, 11 trilhas com módulos prontos, DECISIONS.md em 8 projetos AG, skills `/decidir` e `/mock` ativas, regra §ENSINAR EM CONTEXTO no CLAUDE.md global. Próximo movimento = USAR.*
