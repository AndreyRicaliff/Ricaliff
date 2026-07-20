# 32 — Engenharia de Dados

Como dado sai do mundo real (ERP, formulário, API de terceiro) e vira número confiável num dashboard — sem duplicar, sem divergir, sem vazar e sem derrubar produção no caminho.

**Ordem sugerida:**

1. `01-pipeline-etl-elt` — a anatomia de um pipeline: extract, janela incremental, batch vs streaming
2. `02-idempotencia-reprocessamento` — rodar duas vezes sem estragar nada
3. `03-modelagem-analitica` — fatos, dimensões e a métrica definida num lugar só
4. `04-qualidade-de-dados` — dado sujo do mundo real: validar no boundary, quarentena vs fail-closed
5. `05-caching-invalidacao` — camadas de cache e por que o usuário vê número velho
6. `06-backup-recovery` — RPO/RTO, PITR e o restore drill que prova que o backup existe
7. `07-migrations-zero-downtime` — expand/contract: mudar schema com o app no ar
8. `08-privacidade-por-design` — minimização, unlinkability e anonimato por construção

**Pré-requisitos:** trilha `30-banco` (SQL, índices, RLS) e noção de deploy da `70-devops`.

**Fio condutor:** todo módulo treina o raciocínio, não só a técnica — hipótese antes de fix, evidência antes de "pronto", trade-off explícito, "não sei" como resposta válida.
