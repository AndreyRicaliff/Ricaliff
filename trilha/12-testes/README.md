# 12 — Testes

Trilha de testes automatizados: do primeiro `expect` até suíte rodando como gate de merge no CI. O fio condutor não é ferramenta — é critério: o que cada nível de teste PROVA, onde mock é legítimo, quando TDD rende e quando atrapalha, e por que teste flaky corrói uma suíte inteira.

**Ordem** (cada módulo assume os anteriores):

1. `01-piramide-de-testes` — o mapa: unit/integration/e2e e onde a pirâmide inverte em app CRUD
2. `02-primeiro-teste-vitest` — mão na massa: Vitest num projeto Vite, função pura, CI mínimo
3. `03-testar-logica-de-negocio` — extrair cálculo pra função pura; tabela de casos; property-based
4. `04-mocks-so-em-boundary` — onde mockar (Supabase/ERP/fetch/relógio) e por que mock interno é smell
5. `05-e2e-playwright` — login + CRUD no navegador real; trace viewer; quando e2e vale o custo
6. `06-tdd-quando-vale` — red-green-refactor com critério honesto de zona de aplicação
7. `07-regressao-e-ci` — a suíte como rede de refactor; GitHub Actions como gate; guerra ao flaky

**Pré-requisitos:** JS/TS básico (funções, async/await, módulos ES), npm, um projeto Vite/React pra praticar e conta no GitHub (Actions). Ajuda ter visto a trilha de segurança (`60-seguranca`) pelo formato dos módulos.

Prática deliberada: cada módulo tem passo-a-passo executável num projeto real e checkpoint mensurável — módulo sem checkbox marcado é módulo lido, não aprendido.
