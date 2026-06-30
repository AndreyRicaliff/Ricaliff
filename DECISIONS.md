# DECISIONS — AG Hub

Registro de decisões técnicas datadas, em primeira pessoa. Material de defesa em entrevista.

> Regra (CLAUDE.md §ENSINAR EM CONTEXTO): toda mudança não-trivial vira entrada aqui no mesmo commit da feature.
>
> Decisões marcadas **[reconstruído]** vieram de evidência. Decisões com `[reconstruir com Ricalfiff]` precisam de sessão dedicada — não decorar, é fato observado sem motivação confirmada.

---

## 2026-05-15 — [stack] HTML + JS puro, sem framework

**Problema:** AG Hub é dashboard pessoal de gestão — projetos, tarefas, agenda, crescimento. Precisava de algo que eu mesmo conseguisse manter e iterar rápido, sem build pipeline.

**Opções consideradas:**
- A — React + Vite
  - Pró: componentização, estado gerenciado, ecossistema maduro
  - Contra: build step obrigatório, `node_modules`, deploy mais complexo, overhead para single-page com interatividade baixa
- B — HTML + JS puro com módulos nativos (`<script type="module">`)
  - Pró: zero build, abre direto no browser, deploy = push para GitHub, Vercel serve sem configuração
  - Contra: sem reatividade declarativa — manipulação de DOM manual, sem componentes reutilizáveis formais

**Decisão:** HTML + JS puro. Arquivo único `index.html` + `app.js`. Sem transpilação, sem bundler.

**Por quê:** AG Hub tem pouca interatividade — navegar entre seções, editar campos, exibir progresso. Não há estado compartilhado complexo nem rendering de lista de 10k itens. React seria custo de manutenção sem benefício proporcional. **[reconstruído]** — evidência: commit inicial `c631fb3` "AG Hub — gestão pessoal de tarefas, projetos e agenda", estrutura de arquivos sem `package.json` de build.

**Consequências:** Iteração muito rápida — edita `app.js`, abre o browser, vê a mudança. Deploy é automático via GitHub → Vercel. Dívida: se o hub crescer para mais de 5 seções complexas com estado compartilhado, vai virar espaguete sem componentização — momento de considerar framework.

**Como explicar em entrevista (30s):**
> "O AG Hub é meu dashboard pessoal. Escolhi HTML + JS puro porque a interatividade é baixa — navegar seções, editar campos, ver progresso. React adicionaria build step, bundler e complexidade de estado para um problema que não exige isso. A regra que sigo é: só adiciono framework quando a manipulação de DOM manual começa a gerar bugs difíceis de rastrear. Ainda não cheguei lá."

**Fonte da reconstrução:** Commit `c631fb3` + estrutura de arquivos + ausência de `package.json` de build.

---

## 2026-05-15 — [storage] localStorage como storage principal

**Problema:** O hub precisa persistir dados entre sessões: projetos, tarefas, agenda, XP. Qual mecanismo de persistência usar?

**Opções consideradas:**
- A — Supabase desde o início
  - Pró: dados acessíveis de qualquer dispositivo, backup automático
  - Contra: exige setup de schema, migrations, Auth, custo de manutenção maior; para uso pessoal de um usuário num dispositivo principal, é overhead
- B — localStorage
  - Pró: zero setup, zero latência, funciona offline, sem custo
  - Contra: dados isolados por browser, sem sync entre dispositivos, sem backup automático
- C — IndexedDB
  - Pró: mais robusto que localStorage (armazena objetos, sem limite de 5MB)
  - Contra: API verbosa, complexity desnecessária para volume de dados do hub

**Decisão:** localStorage. Com export/import JSON para backup manual.

**Por quê:** O hub é usado em um dispositivo principal. Não há requisito de multi-device. Export/import JSON resolve o backup sem Supabase. PROJECTS.md registra "localStorage → Supabase no futuro" como evolução planejada, não urgente. **[reconstruído]** — evidência: PROJECTS.md + commit `b83f90f` "add export/import JSON backup buttons".

**Consequências:** Funciona perfeitamente para uso atual. Dívida conhecida: se mudar de computador, precisa exportar/importar manualmente. Migração para Supabase é possível — o contrato de dados está nos objetos JSON, é só trocar o adapter de persistência.

**Como explicar em entrevista (30s):**
> "O AG Hub usa localStorage porque é tool pessoal de um dispositivo. Adicionei botões de export/import JSON como solução de backup sem servidor. É uma decisão consciente de MVP — não de negligência. O caminho para Supabase está planejado, mas o trigger é precisar de sync entre dispositivos ou de histórico de longo prazo. Por enquanto, localStorage com export manual serve e mantém zero custo operacional."

**Fonte da reconstrução:** PROJECTS.md + commit `b83f90f`.

---

## 2026-05-15 — [deploy] Vercel em vez de GitHub Pages ou servidor próprio

**Problema:** Onde hospedar o AG Hub para acessar de qualquer lugar?

**Opções consideradas:**
- A — GitHub Pages
  - Pró: gratuito, integrado ao repo
  - Contra: sem suporte a headers customizados (Cache-Control, X-Frame-Options), sem redirecionamentos, deploy mais lento
- B — DigitalOcean / servidor próprio
  - Pró: controle total
  - Contra: custo mensal, manutenção de servidor, overkill para site estático
- C — Vercel
  - Pró: deploy automático a cada push, CDN global, headers HTTP customizáveis via `vercel.json`, `cleanUrls`, `trailingSlash` — zero config para site estático
  - Contra: vendor lock-in, mas migrar site estático é trivial

**Decisão:** Vercel. Auto-deploy via GitHub. URL: `ag-hub-tan.vercel.app`.

**Por quê:** Para site estático, Vercel é melhor que GitHub Pages porque permite controle de headers HTTP — importante para segurança (X-Frame-Options, Cache-Control em admin panels) e UX (clean URLs). Zero custo no plano hobby. **[reconstruído]** — evidência: commit `3eb0e14` "add vercel gitignore" + PROJECTS.md.

**Consequências:** Push para `main` → live em segundos. Sem CI configurado — o próprio Vercel detecta mudanças. Se precisar de server-side rendering no futuro, Vercel já suporta.

**Como explicar em entrevista (30s):**
> "Escolhi Vercel sobre GitHub Pages para o AG Hub porque Vercel permite headers HTTP customizados via `vercel.json`. Para um painel admin, isso importa — posso setar `no-cache` nos HTMLs que mudam com frequência e `immutable` nos assets estáticos. GitHub Pages não permite isso. O auto-deploy a cada push elimina qualquer atrito de publicação."

**Fonte da reconstrução:** Commit `3eb0e14` + PROJECTS.md.

---

## 2026-05-25 — [produto] Gamificação (XP, níveis, conquistas) integrada ao workflow Claude

**Problema:** O hub é ferramenta de gestão pessoal. Como fazer com que registrar trabalho real (bugs corrigidos, features entregues, estudos) gere feedback de progresso visível, sem ser manual e chato?

**Opções consideradas:**
- A — Progresso manual: Ricalfiff atualiza XP manualmente
  - Pró: simples
  - Contra: nunca vai acontecer — fricção mata o hábito
- B — Gamificação automática via hook no workflow Claude
  - Pró: XP acontece como efeito colateral do trabalho — sem esforço adicional; o sistema registra o que já foi feito
  - Contra: exige integração entre Claude Code e o hub (script shell + `sync.json`)

**Decisão:** Sistema de XP com níveis, quests e achievements. `~/.claude/scripts/ag-hub-sync.sh` chamado automaticamente ao final de operações relevantes (feat, bugfix, deploy, test, etc). Hub lê `data/sync.json` para atualizar o estado.

**Por quê:** Gamificação funciona quando é automática — o momento de registro coincide com o momento do trabalho. Criar fricção (abrir o hub, clicar, digitar) garante que o sistema vai ser abandonado em uma semana. O hook no workflow Claude resolve isso. **[reconstruído]** — evidência: commit `e41ac2d` "feat(gamification): player card, XP system, quests, achievements, sync.json" + CLAUDE.md §AG-HUB SYNC.

**Consequências:** Cada feature entregue, bug corrigido ou deploy feito gera XP automaticamente. O hub exibe o progresso agregado. Quests e achievements são critério de motivação extrínseca para terminar o que foi começado.

**Como explicar em entrevista (30s):**
> "No AG Hub implementei gamificação com XP e conquistas, mas o diferencial foi a automação: o XP é registrado como efeito colateral do trabalho, via script shell chamado pelo workflow do Claude Code. Não preciso abrir o hub e clicar em nada — quando faço deploy de uma feature, o sistema já contabilizou. Aprendi que gamificação morre quando exige ação manual separada do trabalho real."

**Fonte da reconstrução:** Commit `e41ac2d` + CLAUDE.md §AG-HUB SYNC + `project_autonomous_mode.md`.

---

## 2026-05-25 — [integração] Shell script para sync com hub em vez de Node ou webhook

**Problema:** O Claude Code precisa comunicar eventos (feat entregue, bug corrigido) para o AG Hub. Como fazer essa ponte?

**Opções consideradas:**
- A — Webhook HTTP: Claude chama endpoint do hub
  - Pró: desacoplado, hub pode estar em qualquer lugar
  - Contra: hub é estático (sem servidor), então precisaria de endpoint separado (Supabase Edge Function) — overkill para registrar XP local
- B — Script Node
  - Pró: tipado, testável
  - Contra: exige `node_modules`, mais pesado para operação de "escrever linha num JSON"
- C — Shell script (`ag-hub-sync.sh`) que edita `data/sync.json` diretamente
  - Pró: zero dependência extra, roda em qualquer shell, Vercel não serve o `data/` mas o hub lê localmente via localStorage seed
  - Contra: sem tipagem, sem teste formal

**Decisão:** Shell script em `~/.claude/scripts/ag-hub-sync.sh`. Edita `sync.json` que o hub consome.

**Por quê:** A operação é simples: ler um JSON, incrementar um campo, escrever de volta. Shell é a ferramenta mais leve para isso. Não tem sentido usar Node com runtime para operação que `jq` resolve em 2 linhas. **[reconstruído]** — evidência: CLAUDE.md §AG-HUB SYNC documenta o padrão de chamada.

**Consequências:** Integração funciona sem servidor. Dívida: se o hub migrar para Supabase, o script precisa usar `curl` para chamar API em vez de editar arquivo local.

**Como explicar em entrevista (30s):**
> "Para integrar o Claude Code com o AG Hub usei shell script em vez de Node porque a operação é trivial — ler JSON, incrementar campo, escrever. Shell é a ferramenta certa para isso: zero dependência, roda em qualquer ambiente Unix, sem runtime. Se a operação fosse mais complexa — parsing, validação de schema, múltiplas requisições — aí Node faria sentido."

**Fonte da reconstrução:** CLAUDE.md §AG-HUB SYNC.

---

## 2026-06-30 — [estrutura] Consolidar projetos de estudo em monorepo "Ricaliff"

**Problema:** Estudo espalhado em 3 repos (`estudos` trilha, `enem-estudos` app React, `ifpb` app TS) + o hub `ag-hub`. Sem lugar único; faltava conteúdo de IA/ML, git, APIs e escala.

**Opções consideradas:**
- A — Linkar repos no PROJECTS.md (referência): mais limpo, mas mantém N repos e não cumpre "um projeto só".
- B — Monorepo absorvendo tudo + rename do hub para Ricaliff: fonte única, à custa de misturar stacks (vanilla SPA + React).
- C — Descartar os apps e guardar só material textual: perde aplicações reais.

**Decisão:** B. `ag-hub` → `Ricaliff` (pasta + repo GitHub + infra de paths). `enem-estudos` e `ifpb` viram `apps/`. Trilha vira fonte canônica in-repo (matei a cópia cross-repo do `build-trilha.sh`). 4 trilhas novas (git, IA/ML, APIs, escala = 29 módulos). Repos antigos só removidos localmente (backup permanece no GitHub).

**Por quê:** Ricaliff quer UM lugar para evoluir. Monorepo dá fonte única; manter os repos originais no GitHub é backup grátis e reversível. Desacoplar a trilha do repo `estudos` removeu uma dependência cross-repo (shotgun surgery) e permitiu apagar o `estudos` sem quebrar o build.

**Consequências:** Hub agora é o currículo pessoal. `build-trilha.sh` com paths auto-derivados (imune a rename futuro). Dívida: apps React/TS convivem com SPA vanilla no mesmo repo — sem build unificado (cada app mantém o seu). Vercel segue por `projectId`; renomear o projeto no painel é cosmético e ficou pendente.

**Como explicar em entrevista (30s):**
> "Consolidei meus estudos espalhados num monorepo com fonte única. Removi uma dependência cross-repo que acoplava o build do hub a outro repositório, o que me deixou apagar o repo legado sem quebrar nada. Mantive os repositórios originais como backup imutável e só removi as cópias locais — reversível por design."
