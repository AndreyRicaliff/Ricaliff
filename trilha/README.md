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

> **Codinomes de cliente:** este repo é público, então os exercícios usam codinomes
> (CLIENTE OFICINA, Cliente Varejo, ERP-externo). A tradução codinome → repo real fica
> em `trilha/.mapa-local.md` (gitignorado, só na sua máquina). Se o arquivo não existir
> nesta máquina, recrie a partir de `~/.claude/clientes/_mapa-codinomes.md`.

---

## Mapa

| # | Trilha | Foco | Prioridade | Status |
|---|---|---|---|---|
| 00 | [Fundamentos](./00-fundamentos/) | Base que **toda** entrevista júnior cobra | 🔴 Alta | 6 |
| 05 | [Raciocínio de Engenheiro](./05-raciocinio/) | Como pensar: verificar, refutar, trade-offs, alvo certo | 🔴 **MÁXIMA** | 7 🆕 |
| 10 | [Código Limpo](./10-codigo-limpo/) | Teoria por trás do `CLAUDE.md` | 🔴 Alta | 4 |
| 12 | [Testes](./12-testes/) | Pirâmide, vitest, Playwright, mocks, TDD honesto | 🔴 Alta | 7 🆕 |
| 15 | [Git](./15-git/) | Modelo mental, rebase, desfazer, fluxo de PR | 🔴 Alta | 7 |
| 20 | [Arquitetura](./20-arquitetura/) | SOLID, camadas, ADRs | 🟡 Média | 7 |
| 25 | [Gestão de Projetos](./25-gestao-projetos/) | Escopo, priorização, estimativa, dívida, cliente | 🔴 Alta | 7 🆕 |
| 30 | [Banco de Dados](./30-banco/) | Postgres, índices, N+1, RLS | 🔴 Alta | 8 |
| 32 | [Engenharia de Dados](./32-engenharia-dados/) | ETL, idempotência, qualidade, cache, zero-downtime | 🔴 Alta | 8 🆕 |
| 35 | [IA & Machine Learning](./35-ia-ml/) | ML do zero, redes, LLMs, usar IA na prática | 🔴 MÁXIMA | 8 |
| 40 | [Frontend](./40-frontend/) | React render cycle, hooks, perf | 🟡 Média | 7 |
| 42 | [Design de Interface](./42-design/) | Hierarquia, tipografia, cor, grid, estados, a11y | 🔴 Alta | 8 🆕 |
| 44 | [Motion Design](./44-motion-design/) | Easing, coreografia, microinterações, perf | 🟡 Média | 7 🆕 |
| 46 | [3D na Web](./46-3d-web/) | three.js, CSS3D, luz, animação — o look dos decks | 🟡 Média | 8 🆕 |
| 50 | [Backend](./50-backend/) | Express, Prisma, queues, idempotência | 🟡 Média | 8 |
| 55 | [APIs](./55-apis/) | HTTP, REST, design, auth (JWT/OAuth) | 🔴 Alta | 7 |
| 60 | [Segurança](./60-seguranca/) | OWASP, LGPD, XSS, SQLi + authn/z, threat model, IR | 🔴 Alta | 14 ⬆️ |
| 70 | [DevOps](./70-devops/) | Docker, CI/CD, observabilidade | 🟢 Baixa | 6 |
| 80 | [System Design](./80-system-design/) | Cache, fila, replicação, CAP | 🟢 Baixa | 8 |
| 82 | [Robustez](./82-robustez/) | Retry, timeout, degradação, observabilidade, chaos | 🔴 Alta | 8 🆕 |
| 85 | [Cargas & Escala](./85-escala/) | Throughput, latência, cache, filas sob carga | 🟡 Média | 7 |
| 90 | [Entrevista](./90-entrevista/) | Banco de perguntas + pitch dos projetos + mock | 🔴 Alta | 3 |
| **95** | [**Diferencial**](./95-diferencial/) | **O que sobrevive ao Claude** | 🔴 **MÁXIMA** | **5** |

> **23 trilhas · 165 módulos.** 🆕 = trilha nova (jul/2026). ⬆️ = expandida. A coluna de status agora conta **módulos existentes** — marque seu progresso pessoal nos checkpoints de cada módulo, não aqui.
>
> **A trilha `05-raciocinio` é a espinha das outras:** ela destila a forma de raciocinar (verificar antes de afirmar, hipótese→refutação, trade-off explícito, alvo certo) que todo módulo técnico aplica. Se for ler uma só primeiro, é essa.

---

## Como se formar (o sistema)

O ritmo agora é dirigido pela **Sprint semanal** do hub (Scrum solo) — não por cronograma fixo.
Cada disciplina tem um **SYLLABUS.md** com carga horária, bibliografia obrigatória por módulo,
labs e critério de formatura. O ciclo por disciplina:

1. **Aula** — ler o módulo (denso, ~20min) e marcar checkpoint honesto.
2. **Recall** — a aba Revisar cobra as perguntas do módulo em recall espaçado. Responder em voz alta.
3. **Bibliografia** — ler o item do SYLLABUS com o repositório aberto (leitura sem aplicação não conta hora).
4. **Lab** — construir o mini-app do syllabus até o "pronto quando".
5. **Projeto de conclusão** — entregar com evidência e só marcar aceito com a `/revisao` aprovando a rubrica 4/4.

**FORMADA** = todos os checkpoints + labs + projeto aceito. Comece por `05-raciocinio` (30h, a espinha das outras). A daily quest (treino, recall, formação, entrega) mantém o ritmo diário; a sprint define o foco da semana.

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
| `~/projetos/PROJECTS.md` (local privado, fora deste repo) | Estado de cada projeto AG — escolha o projeto-alvo do exercício a partir daqui |

---

*Última atualização: 2026-06-01 — **sistema 100% completo**: 79 arquivos, 11 trilhas com módulos prontos, DECISIONS.md em 8 projetos AG, skills `/decidir` e `/mock` ativas, regra §ENSINAR EM CONTEXTO no CLAUDE.md global. Próximo movimento = USAR.*
