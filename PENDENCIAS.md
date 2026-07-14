# PENDÊNCIAS — Ricaliff

Itens acordados e não resolvidos. Resolver = apagar a linha no mesmo commit do fix.
A `/revisao` lê este arquivo no início e promove 🔴 direto pro relatório.

## 🔴 Segurança / privacidade

- **2026-07-14 · Histórico público ainda contém nome real de cliente** — 4 mensagens de
  commit alcançáveis da main (SHAs `247e846`, `c6cba12`, `0654de1`, `41241bc`) e um 5º
  (`daf8407`, com raiz de CNPJ). A árvore está limpa; limpar o histórico exige
  `git filter-repo` + force push na main pública (proibido sem decisão explícita do
  Ricaliff — política DECISIONS 2026-07-06 preferiu repo novo na última vez). Decidir:
  reescrever de novo, repo novo, ou aceitar (identificadores só em mensagem de commit
  antiga, sem mapa codinome→real na árvore atual).
- **2026-07-14 · Rotacionar SERVICE_ROLE_KEY do cliente-oficina** — a chave marcada como
  exposta na retrospectiva segue com task `todo` desde maio (seed `b-t02`). Ação fora
  deste repo (painel Supabase do projeto do cliente + infra Windows dele). URGENTE.

## 🟡 Arquitetura / dívida técnica

- **2026-07-14 · ES modules nativos** — gatilho de modularização do DECISIONS atingido
  (app.js ~2.9k linhas, 7 views). Proposta da auditoria: ~9 módulos (sync/gamificação,
  dash, tasks, agenda, growth, trilha, quest-board, pomodoro/standup, util) +
  `styles.css` extraído do index.html (67% do arquivo é CSS). Preserva zero-build.
- **2026-07-14 · Trio CRUD-modal quintuplicado** — open/save/del copiado 5× (task, proj,
  evento, sessão, estudo), ~150 linhas dedupáveis num helper de formulário por schema.
- **2026-07-14 · Conteúdo mutável hardcoded no app.js** — DOMAINS, SUGGESTIONS, MODULES
  e ST_PREREQS pertencem a `data/*.json` (padrão data-driven já adotado no resto).
- **2026-07-14 · Log 83% chore(sync)** — commits de dado enterram os de engenharia no
  portfólio. Melhor saída avaliada: repo de dados separado (preserva contribution graph
  e limpa o log). Requer mudar o fetch do app + destino do push do ag-hub-sync.ps1.

## 🟢 Menores

- **2026-07-14 · Google Fonts via CDN** — resto das libs vendorado; fontes ainda externas.
- **2026-07-14 · Wallpaper P3 com drift infinito (80s)** — divergência DELIBERADA do
  `padrao-atrativo` ("repouso não anima"): identidade > regra aqui; respeita
  reduced-motion. Registrado pra não reaparecer em revisão como achado novo.
- **2026-07-14 · apps/enem-estudos sem build no deploy** — `/apps/enem-estudos/` serve o
  index cru do Vite (sem dist). Nenhum link aponta pra lá; é referência histórica.
  Se um dia quiser servir: buildar e commitar dist ou excluir do deploy.
