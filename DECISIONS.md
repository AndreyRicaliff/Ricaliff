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

---

## 2026-07-03 — [ui] Paridade P3 com o rice do OS via design tokens (não porte de código)

**Problema:** O hub tinha restyle P3 v1, mas o rice do desktop (Quickshell/QML) evoluiu — acento `#0099FF`, toggle persona↔pro (Win+T), wipes de 3 faixas, paralelogramos, springs com overshoot. Como levar a MESMA identidade pra web sem reescrever os componentes QML?

**Opções consideradas:**
- A — Extrair design tokens (cor/easing/duração/forma) e reimplementar em CSS/JS vanilla: fiel e leve, exige mapear valores um a um.
- B — Portar componentes literalmente (canvas, vídeos, springs físicos): fidelidade máxima, peso e complexidade absurdos num SPA single-file.
- C — Lib de animação (GSAP/Motion): springs reais, mas adiciona dependência num app zero-build.

**Decisão:** A. Tokens exatos no `:root`, TODOS os alphas de acento via `color-mix(in srgb, var(--primary) N%, transparent)`, tema pro como `:root[data-theme="pro"]` espelhando o `ThemeMode.qml`, wipe como keyframes com easing por segmento, OutBack via `cubic-bezier(.34,1.8,.44,1)`, paralelogramos via `clip-path`.

**Por quê:** o que faz "parecer P3" são os valores (cores, curvas, cortes), não a tecnologia. `color-mix` transformou o toggle de tema em 1 atributo no root — os ~20 `rgba()` hardcoded que sobraram do v1 eram o real bloqueador.

**Consequências:** tema alternável por botão/tecla T persistido em localStorage; wipe bloqueia navegação por 740ms (guard `p3WipeBusy`); `color-mix` exige browser 2023+ (ok, uso pessoal). Dívida: skew do wipe é keyframe CSS, não spring físico.

**Como explicar em entrevista (30s):**
> "Eu tinha uma identidade visual no desktop em QML e quis a mesma no meu app web. Em vez de portar código, extraí design tokens — hex, curvas de easing, durações, formas — e centralizei tudo em CSS custom properties, derivando estados com color-mix. O toggle de tema virou um atributo data-theme no root. O aprendizado: identidade visual portável é uma tabela de tokens, não componentes."

## 2026-07-06 — [privacidade] Publicação do repo com codinomes de cliente e histórico reescrito
**Problema:** Abrir o repo (portfólio) expunha identificadores de clientes reais e estado operacional — na árvore (registro de projetos, log de XP, módulos da trilha), no histórico (blobs + mensagens de commit) e até no site publicado, que servia o arquivo de estado dos projetos.
**Opções:** A) publicar como estava; B) `git filter-repo` + force push no mesmo repo; C) codinomes em TUDO + filter-repo + repo novo público (o antigo renomeado para arquivo privado).
**Decisão:** C.
**Por quê:** B deixaria os commits pré-rewrite alcançáveis pelos SHAs expostos nas páginas dos PRs antigos — sanitização de fachada. Anonimização parcial (só no log, mantendo nomes na trilha) seria reversível por correlação, então codinomes em tudo. Falar de cliente por codinome ("cliente do varejo", "cliente de oficina") é, inclusive, a prática correta em portfólio e entrevista.
**Consequências:** histórico público 100% reescrito (verificado por clone independente: zero ocorrências em todos os blobs e mensagens); estado operacional dos projetos vive fora do repo, em arquivo local privado; o script de sync de XP sanitiza descrições na escrita, fechando a regressão futura; repo antigo preservado privado como backup completo.
**Em entrevista (30s):** "Antes de abrir meu hub como portfólio, auditei árvore E histórico: secrets zero, mas havia identificadores de clientes em blobs antigos e mensagens de commit. Force push não bastava — os SHAs antigos continuam alcançáveis pelas páginas de PR — então reescrevi com filter-repo num repo novo e arquivei o original privado. E fechei a torneira: o pipeline que grava atividade no repo público sanitiza identificadores na escrita."

## 2026-07-09 — [trilha] Codinomes públicos + mapa local gitignorado
**Problema:** anonimização do repo público vazou pra dentro dos exercícios da trilha — paths inexistentes (`cliente-oficina-backend`) e identificadores inválidos dentro de código (`fetchFromERP-externo`, `erp-externo_id`). · **Opções:** A) des-anonimizar (viola política de repo público) · B) env vars nos 33 arquivos (refactor frágil) · C) codinome no conteúdo + mapa de tradução gitignorado. · **Decisão:** C — `trilha/.mapa-local.md` (gitignorado) + canônico em `~/.claude/clientes/_mapa-codinomes.md` (claude-config privado, sincroniza entre máquinas); identificadores de código renomeados pra formas neutras válidas (`fetchFromErp`, `ERP_URL`, `erp_products`). · **Por quê:** separa conteúdo público de tradução privada com custo mínimo. · **Consequências:** exercícios copy-paste voltam a funcionar; máquina nova precisa recriar o mapa (instrução no README da trilha). · **Em entrevista (30s):** "Repo de estudos público cita clientes por codinome; a tradução vive num arquivo gitignorado sincronizado via repo privado — material compartilhável sem expor cliente, exercícios executáveis."

## 2026-07-14 — [pipeline] Sanitização em duas camadas no produtor de XP
**Problema:** a lista de redação do `ag-hub-sync.ps1` só cobria formas compostas ("beto-motobike"); tokens soltos ("BETO", "lider") vazaram nome real de cliente no `sync.json` público — e o commit de fix ficou órfão numa branch. · **Opções:** A) só ampliar a regex da entrada · B) regex ampliada (word-boundary, case-insensitive, CNPJ) + re-sanitização do ARQUIVO INTEIRO a cada gravação · C) mover sync pra repo privado. · **Decisão:** B. · **Por quê:** a camada de entrada falha de novo no próximo termo esquecido; a camada full-file cura o passado e o futuro a cada run — defesa em profundidade com custo de uma regex a mais. C resolveria mas mataria o hub público como portfólio. · **Consequências:** falso positivo raro (a palavra "líder" solta vira "cliente-varejo") — aceito: em repo público, vazar é pior que redigir demais. Aviso no console quando a camada 2 corrige algo (indica furo na camada 1). · **Em entrevista (30s):** "Meu pipeline publica num repo público, então sanitização não pode depender de uma lista perfeita: valido na entrada e re-sanitizo o arquivo inteiro na saída. Quando a segunda camada pega algo, ela me avisa que a primeira tem um furo — o sistema me ensina onde ele falha."

## 2026-07-14 — [app] Pomodoro dirigido por deadline absoluto, não por frame
**Problema:** a conclusão do pomodoro vivia no loop de `requestAnimationFrame`; browser suspende rAF em aba oculta — e o estado natural de quem foca 25min é estar em OUTRA aba. A notificação nunca disparava. · **Opções:** A) setInterval 1s · B) tick de display (só com aba visível) + `setTimeout` armado no deadline exato + recompute no `visibilitychange` · C) Web Worker. · **Decisão:** B. · **Por quê:** o relógio já era wall-clock (`startedAt` persistido) — o defeito era só QUEM detecta o fim. setTimeout sofre throttle em background mas dispara; rAF não. C é peso desnecessário pra um timer. Bônus: mata o loop de 60fps que fazia JSON.parse por frame. · **Consequências:** conclusão pode atrasar até ~1min em background (throttle) — irrelevante pro caso de uso. · **Em entrevista (30s):** "Separei display de correção: a UI atualiza por tick só quando visível, mas a verdade do timer é um timestamp persistido e um timeout no deadline. rAF é pra animar, não pra agendar — em aba oculta ele simplesmente não roda."

## 2026-07-14 — [app] Backup v2 por prefixo de chave
**Problema:** o export cobria 5 das ~22 chaves de localStorage — restaurar num browser novo perdia trilha, streaks, conquistas, anotações e atributos. · **Opções:** A) ampliar a lista fixa · B) exportar por PREFIXO (`agh_`, `trilha`, `questBoard`...) com envelope versionado `{version:2, keys:{...}}`. · **Decisão:** B. · **Por quê:** lista fixa é o mesmo bug esperando a próxima feature; prefixo captura chaves futuras de graça. Import mantém compat com o formato v1. · **Consequências:** disciplina de nomenclatura vira contrato — chave nova fora dos prefixos NÃO entra no backup. · **Em entrevista (30s):** "O backup listava chaves na mão e drifted do app real. Troquei enumeração por convenção de prefixo com envelope versionado — o backup passou a acompanhar o app sem manutenção, e a versão no envelope me deixa migrar formato sem quebrar restore antigo."

## 2026-07-14 — [infra] Geradores padronizados em node com saída atômica
**Problema:** `bin/*.sh` dependiam de `python3`, que no Windows é um stub da Microsoft Store ("existe" no PATH, não roda); pior: o gerador sobrescrevia o JSON commitado ANTES de validar — falha corrompia o arquivo bom. · **Opções:** A) instalar Python de verdade · B) detectar runtime com fallback python→node · C) padronizar em node + escrever em `.tmp`, validar, `mv`. · **Decisão:** C. · **Por quê:** node é o único runtime que o toolchain já garante (serve, harness); dois caminhos de código (B) é o dobro de manutenção pra zero ganho; instalar Python (A) conserta uma máquina, não o script. Saída atômica é regra independente do runtime. · **Consequências:** ~50ms de startup do node por campo escapado (geração ~30s) — aceitável pra um build raro e disparado automaticamente. `ultimaAtividade` agora vem do git log real via mapa local gitignorado. · **Em entrevista (30s):** "Além de portar o runtime, corrigi o modo de falha: gerador nunca deve escrever no artefato bom antes de validar — temp, valida, move. A falha do python da Store me mostrou que o script confiava que a própria saída sempre nasceria válida."
