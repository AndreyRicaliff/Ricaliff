# 07 — Fluxo de Trabalho Profissional

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — Git distribuído e o **debate de estratégias de branch** como controvérsia declarada: git-flow × trunk-based, com a evidência da DORA), §Estruturação (remotes, o fluxo de PR, Conventional Commits ligado ao SemVer) e §Metodologia (o ciclo diário replicável) — além da prática, P/R e checkpoint. O `00-fundamentos/06` deu o fluxo AG (branch → commit atômico → `pull --rebase` → PR); aqui **aprofundamos o porquê** — por que Git é distribuído, e por que "qual estratégia de branch" não tem resposta única, com quem defende o quê e o que a pesquisa mostra.

## O que é

A teoria dos módulos 01–06 vira rotina diária num fluxo previsível: ramifica, comita atômico, sincroniza, abre PR. O objetivo é um histórico **legível** na `main` e mudanças **revisáveis** — não um emaranhado de "fix", "fix2", "agora vai". Mas "qual fluxo" é onde mora a maior controvérsia prática do Git: **git-flow** (branches de vida longa, releases versionados) contra **trunk-based development** (branches curtíssimos, integração contínua na `main`). Este módulo não vende um lado como verdade — apresenta o debate com os autores na mesa e a evidência empírica (DORA/Accelerate) como **correlação**, porque saber *de que depende* a escolha é exatamente o que uma entrevista de pleno procura.

---

## § BASE — o fundamento

**Git é distribuído: cada clone é o repositório inteiro.** Não existe servidor obrigatório (módulo 02: `.git/` é tudo). Um **remote** é só um apelido pra outra cópia completa do banco de objetos (no GitHub, geralmente `origin`). "Sincronizar" é transferir objetos que o outro lado ainda não tem (módulo 01: por hash, eficiente). Três verbos: `git fetch` **baixa** commits novos e atualiza as refs remotas (`origin/main`) **sem tocar no seu working dir** — seguro, você inspeciona antes de integrar; `git push` **envia** seu branch; `git pull` = `fetch` + integra (merge por padrão). A diferença `fetch`/`pull` é a diferença entre "trazer pra olhar" e "trazer e já misturar".

**`pull --rebase`: por que o padrão AG.** `git pull` puro faz `fetch` + **merge**, e quando você tem trabalho local pendente isso gera um **merge commit de sincronização** ("Merge branch 'main' of origin…") a cada pull — lixo que polui o histórico sem informar nada. `pull --rebase` faz `fetch` + **rebase**: reaplica seus commits locais em cima do que veio, mantendo a linha **reta**. É seguro porque rebaseia só os **seus** commits ainda não publicados (a regra de ouro do módulo 03 é respeitada). `git config --global pull.rebase true` torna padrão.

**A controvérsia central — git-flow × trunk-based (incerteza declarada, e este é o ponto do módulo).** Não há consenso sobre como um time deve organizar branches. Os dois pólos:

- **git-flow** — **Vincent Driessen**, *"A successful Git branching model"* (nvie.com, **2010**). Um modelo com branches de **vida longa**: `develop`, `feature/*`, `release/*`, `hotfix/*`, `master`. Desenhado para software com **releases versionados explícitos** (o app que você empacota e distribui em versões). Virou padrão de fato por anos.
- **A própria retratação do autor (2020).** Driessen **adicionou uma nota no topo do post original** dizendo, em essência: o modelo foi pensado em 2010 para software com versionamento explícito; para times que fazem **entrega contínua** (web/SaaS, deploy o dia todo), git-flow costuma ser **complexo demais**, e um fluxo mais simples (tipo GitHub flow / trunk-based) tende a ser mais adequado. **O autor do git-flow recomendando não usá-lo por padrão** é ouro de incerteza declarada: mostra que "a ferramenta certa" mudou com o contexto (entrega contínua), não que alguém estava "errado".
- **trunk-based development** — branches **curtíssimos** (horas a 1–2 dias), integrados na `main`/trunk pelo menos **diariamente**, atrás de *feature flags* quando incompleto. Referência canônica: trunkbaseddevelopment.com (Paul Hammant).

**A evidência — DORA/Accelerate (2018), e o cuidado de chamar de correlação.** **Forsgren, Humble & Kim**, em *Accelerate: The Science of Lean Software and DevOps* (2018), analisaram milhares de organizações (pesquisa DORA) e encontraram que práticas de **trunk-based development** — poucos branches ativos (menos de ~3), branches integrados ao trunk pelo menos uma vez ao dia, sem *code freezes* longos — **correlacionam** com alta performance de entrega de software (lead time, frequência de deploy, taxa de falha, tempo de recuperação). O rigor exige a palavra exata: é **correlação** medida em survey, com controles estatísticos, **não prova causal** de que trunk-based *causa* performance — pode haver fatores de time/cultura por trás dos dois. A leitura honesta: há **evidência empírica** favorecendo integração frequente, forte o bastante pra ser o default de quem faz entrega contínua, mas não uma lei que dispensa julgar o contexto (um app com releases versionados e clientes em versões diferentes pode legitimamente precisar de git-flow).

**A posição defensável (e o padrão AG).** Para os projetos AG — web/SaaS com deploy contínuo — o default é o lado trunk-based: **feature branches curtos**, `pull --rebase` pra sincronizar, **PR pra integrar**, sem `develop`/`release` de vida longa. Não porque git-flow é "errado", mas porque o contexto (entrega contínua) é o que a própria nota de 2020 do Driessen e a DORA apontam. Quem defende uma estratégia sem citar o contexto não entendeu o debate.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
 remotes (cópias do banco):        fetch  → baixa refs remotas, NÃO integra (seguro)
   origin/main ◀── git fetch       push   → envia seu branch
        │                          pull   → fetch + integra (--rebase p/ linha reta)
   feature/x ── PR ──▶ main (revisão + CI + merge pela interface, nunca direto)

 estratégias (o debate):
   git-flow  → develop/release/hotfix, releases versionados   (Driessen 2010; nota 2020: complexo p/ CD)
   trunk-based → branch curto, integra ≥ diário, feature flags (DORA 2018: correlaciona c/ performance)
```

**Conventional Commits × SemVer.** A spec **Conventional Commits v1.0.0** (conventionalcommits.org) padroniza a mensagem: `tipo(escopo): descrição imperativa`. Não é enfeite — o prefixo é **legível por máquina**, o que habilita changelog e versão automáticos, mapeando no **Semantic Versioning**:

| Prefixo | Significado | Efeito no SemVer |
|---|---|---|
| `feat:` | nova funcionalidade | bump **MINOR** (x.**Y**.z) |
| `fix:` | correção de bug | bump **PATCH** (x.y.**Z**) |
| `refactor:` | muda código sem mudar comportamento | — |
| `chore:` / `docs:` / `test:` / `perf:` | build/deps, docs, testes, performance | — |
| `BREAKING CHANGE:` (rodapé ou `!`) | quebra compatibilidade | bump **MAJOR** (**X**.y.z) |

A descrição diz o **porquê** (o diff já mostra o quê), e vale **um commit, uma responsabilidade** — separável com `git add -p` (módulo 02).

---

## § METODOLOGIA — o ciclo diário replicável

1. **Parta da main atualizada:** `git switch main && git pull --rebase`.
2. **Ramifique curto:** `git switch -c feat/exportar-pdf` — um branch por feature/bug, de vida curta (integre em 1–2 dias; branch que vive semanas diverge e dói pra mergear).
3. **Comite atômico e conventional:** `git commit -m "feat: exporta relatório do dashboard em PDF"` — um propósito por commit, mensagem dizendo o porquê.
4. **Sincronize antes de abrir o PR:** `git pull --rebase origin main` — resolve conflito cedo, histórico linear.
5. **Publique e abra PR:** `git push -u origin feat/exportar-pdf` → PR no GitHub. **Nunca merge direto na main** — o PR é onde a revisão acontece, o CI roda e a discussão fica registrada.
6. **Integre via merge pela interface**, depois delete o branch. Feito.

**`.gitignore` desde o primeiro commit.** O que **não** pertence ao repo: dependências (`node_modules/`), builds (`dist/`, `.next/`), segredos (`.env`, `.env.*`), lixo de IDE/OS. Criar o `.gitignore` **antes do primeiro commit** evita ter que limpar histórico depois. Cuidado crítico: `.gitignore` só afeta arquivos **ainda não rastreados** — se um `.env` já foi commitado, adicioná-lo ao ignore **não basta**; precisa `git rm --cached .env` e, se vazou segredo, **rotacionar a chave** (o segredo continua no histórico, recuperável por qualquer clone).

**Anti-padrões:**
- **Trabalhar direto na main** — sem branch, não há PR nem revisão.
- **Merge direto na main sem PR** — pula a revisão e o CI, a rede de proteção do time.
- **Branch de feature de vida longa** — diverge da main, vira um inferno de conflito (o que trunk-based/DORA justamente evita).
- **`git commit -m "fix"` no automático** — histórico "fix, update, wip" é inútil pra debug e onboarding; use Conventional Commits.
- **Defender git-flow ou trunk-based como dogma** — a escolha depende do contexto (releases versionados × entrega contínua).
- **`.env` no repo** — rotacione a chave, não só adicione ao `.gitignore`.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Num projeto AG (ou repo de teste com remote):

1. **Rode o ciclo completo:** `switch main && pull --rebase` → `switch -c feat/x` → 2 commits atômicos conventional → `pull --rebase origin main` → `push -u` → abra o PR. Observe o histórico **linear** no `git log --graph`.
2. **Force o contraste:** num branch de teste, faça `git pull` **sem** `--rebase` com trabalho local pendente e veja o "Merge branch…" de sync aparecer. Refaça com `--rebase` e confirme a linha reta.
3. **Argumente o debate:** escreva em `~/projetos/estudos/rascunhos/branching-strategy.md` **um parágrafo defendendo git-flow** (quando faz sentido — app versionado) e **um defendendo trunk-based** (entrega contínua, com a nota de 2020 do Driessen e a DORA). Se só consegue um, releia a §BASE.
4. **Conventional → SemVer:** escreva 5 mensagens de commit (um `feat`, um `fix`, um `refactor`, um `chore`, um com `BREAKING CHANGE:`) e anote qual parte do SemVer cada uma bumparia.
5. **`.gitignore` na prática:** simule um `.env` commitado por engano, remova com `git rm --cached .env`, adicione ao `.gitignore`, e escreva por que "rotacionar a chave" é obrigatório mesmo depois disso.

---

## Por que cai em entrevista

Fluxo é o que o entrevistador imagina você fazendo no time dele. "Como é seu fluxo de Git no dia a dia?" e "git-flow ou trunk-based?" são padrão. A resposta forte descreve o ciclo (branch → atômico → rebase → PR) e, no debate, **cita o contexto** em vez de dogma.

> **P:** "Descreve seu fluxo de Git no dia a dia."
>
> **R (30s):** "Cada mudança nasce numa feature branch, com commits atômicos no padrão Conventional Commits (feat/fix/refactor...). Sincronizo com `pull --rebase` pra manter o histórico linear sem merge commits de sync, abro PR pra revisão — nunca merge direto na main — e mantenho `.gitignore` desde o primeiro commit pra builds, deps e `.env` jamais entrarem. `fetch` baixa sem tocar no meu trabalho; `pull` é fetch + integra."

> **P:** "git-flow ou trunk-based? Qual é melhor?"
>
> **R (30s):** "Depende do contexto, e essa é a resposta honesta. git-flow, do Driessen em 2010, tem branches de vida longa (develop, release, hotfix) e foi pensado pra software com releases versionados explícitos. O próprio Driessen adicionou uma nota em 2020 dizendo que, pra times de entrega contínua, ele costuma ser complexo demais e um fluxo mais simples encaixa melhor. Trunk-based — branches curtos, integrados na main pelo menos diariamente — é o outro pólo, e a pesquisa DORA do *Accelerate* achou que ele **correlaciona** com alta performance de entrega, embora seja correlação de survey, não prova causal. Pra web/SaaS com deploy contínuo eu escolho o lado trunk-based; pra um app empacotado em versões, git-flow ainda faz sentido. O erro é tratar qualquer um dos dois como dogma."

## Checkpoint

- [ ] Explico Git como distribuído (cada clone é o repo inteiro) e a diferença `fetch`/`push`/`pull`
- [ ] Justifico `pull --rebase` (evita merge commits de sync) e por que é seguro aqui
- [ ] Descrevo o ciclo diário: branch curto → commit atômico conventional → rebase → PR → merge
- [ ] Apresento o debate git-flow × trunk-based com os autores (Driessen 2010 + nota 2020) e o contexto de cada um
- [ ] Cito a DORA/Accelerate como **correlação** (não causa) entre trunk-based e performance
- [ ] Ligo Conventional Commits ao SemVer (feat→MINOR, fix→PATCH, BREAKING→MAJOR) e sei o cuidado do `.env` (rotacionar chave)

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 5 "Distributed Git", seção "Contributing to a Project" (fluxos de contribuição) e cap. 6 "GitHub", seção "Contributing to a Project" (Pull Requests): a base do módulo
- **Pro Git** — cap. 2 "Git Basics", seção "Working with Remotes" (`fetch`/`push`/`pull`, remotes)
- **Driessen, V. (2010)** — *"A successful Git branching model"* (nvie.com): git-flow — **e a nota de reflexão de 2020 no topo do próprio post** (o autor recomendando simplicidade pra entrega contínua): o ouro da incerteza declarada
- **Forsgren, N., Humble, J., Kim, G. (2018)** — *Accelerate: The Science of Lean Software and DevOps* (pesquisa DORA), cap. sobre práticas técnicas: trunk-based **correlaciona** com performance (correlação, não causa)
- **Conventional Commits** — spec v1.0.0 (conventionalcommits.org): o formato e o mapeamento pro SemVer
- **trunkbaseddevelopment.com** (Paul Hammant) — a referência canônica de trunk-based
- Módulos-irmãos `03-branches-merge-rebase` (o debate merge×rebase que este escala pra estratégias) e `02-staging` (`git add -p` pro commit atômico)
