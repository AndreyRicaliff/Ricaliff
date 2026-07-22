# Syllabus — Engenharia de Dados

> **Disciplina:** mover dados de um lado para o outro sem duplicar, sem perder e sem corromper — pipelines que aguentam ser re-executados e bancos que sobrevivem a um `DELETE` errado.
> **Carga horária alvo: 45h** — aulas 4h · bibliografia 20h · labs 14h · projeto de conclusão 7h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Desenhar um pipeline ETL/ELT idempotente — re-executar o mesmo lote produz exatamente o mesmo estado final.
2. Escolher entre schema-on-write e schema-on-read e garantir compatibilidade para frente/para trás quando o formato evolui.
3. Tratar cache e tabelas-resumo como dados derivados — saber invalidar sem servir número velho.
4. Executar uma migration de schema com zero downtime pelo padrão expand → migrate → contract.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 pipeline-etl-elt | *Designing Data-Intensive Applications* (Kleppmann) — cap. 10 "Batch Processing" (dataflow, filosofia Unix, saída como entrada) | 3h |
| 02 idempotencia-reprocessamento | Kleppmann — cap. 11 "Stream Processing" (§ "Fault Tolerance": exactly-once, idempotência, dedup) | 3h |
| 03 modelagem-analitica | Kleppmann — cap. 3 "Storage and Retrieval" (§ "Transaction Processing or Analytics?" e esquema estrela/floco) | 2.5h |
| 04 qualidade-de-dados | Kleppmann — cap. 4 "Encoding and Evolution" (schema como contrato; compat. para frente/para trás) + Postgres docs cap. "Constraints" | 2.5h |
| 05 caching-invalidacao | Kleppmann — cap. 11 "Stream Processing" (§ "Databases and Streams": CDC, materialized views como cache derivado) | 2.5h |
| 06 backup-recovery | Postgres docs — cap. "Backup and Restore" + "Continuous Archiving and Point-in-Time Recovery (PITR)" | 2h |
| 07 migrations-zero-downtime | Kleppmann — cap. 4 "Encoding and Evolution" (§ rolling upgrades) aplicado ao padrão expand/contract + Postgres docs "ALTER TABLE" (locks) | 2.5h |
| 08 privacidade-por-design | Kleppmann — cap. 12 "The Future of Data Systems" (§ "Doing the Right Thing": privacidade, minimização, retenção) | 2h |

Regra de leitura: **com um pipeline AG aberto** (sync de ERP-externo, tabela-resumo, backup) — cada conceito, aponte onde ele aparece ou falha no seu fluxo real. Ler sobre idempotência sem re-rodar um lote não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `mini-etl` (6h):** pipeline puro que extrai de uma API mock (JSON paginado), transforma e carrega num Postgres/SQLite via UPSERT por chave natural. Re-executar o mesmo lote não cria duplicata nem muda contagem.
*Pronto quando:* rodar o pipeline 3× sobre a mesma fonte deixa o estado final idêntico a 1×, provado por um teste que compara hash das tabelas; e um registro alterado na fonte atualiza a linha certa sem tocar as outras.

**Lab 2 — `expand-contract` (4h):** demonstração de rename de coluna sem downtime. Um "leitor" e um "escritor" ficam rodando em loop enquanto você executa a sequência expand (nova coluna + backfill + escrita dupla) → migrate → contract (drop da antiga).
*Pronto quando:* leitor e escritor não registram nenhum erro durante toda a migração, e um log mostra as três fases com a app de pé o tempo inteiro.

**Lab 3 — `pitr-drill` (4h):** ensaio de recuperação. Configura archiving numa instância Postgres local, insere dados marcados por timestamp, simula um `DELETE` acidental e restaura para o instante anterior ao erro.
*Pronto quando:* a restauração recupera exatamente as linhas apagadas sem trazer de volta o que foi inserido depois do ponto-alvo, com o comando de recovery documentado no README.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta num pipeline AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — um pipeline idempotente com plano de backup/PITR e uma migration de schema documentada

*Bibliografia sem link direto: procurar pelo título — DDIA e os docs do Postgres mudam de URL, o conteúdo não.*
