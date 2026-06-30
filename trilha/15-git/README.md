# Trilha 15 — Git a Fundo

> Foco: entender o Git como um **grafo de snapshots imutáveis** — não decorar comandos, mas saber o que cada um faz com os objetos por baixo.

A maioria dos devs usa Git como uma caixa preta de `add/commit/push`. Esta trilha desmonta a caixa: você vai entender por que `git` quase nunca perde dados, por que rebase "reescreve história", e por que branch é a operação mais barata que existe. Quando você sabe o modelo de objetos, todo comando vira óbvio.

## Módulos

1. [O Modelo Mental do Git](01-modelo-mental.md) — blob, tree, commit, SHA-1 e o DAG; por que snapshot e não diff.
2. [Os Três Estados](02-staging.md) — working directory, staging area (index) e repositório; `add`, `status`, `diff`.
3. [Branches, Merge e Rebase](03-branches-merge-rebase.md) — branch é um ponteiro; HEAD; fast-forward vs merge commit; rebase reescreve história.
4. [Resolver Conflitos](04-conflitos.md) — anatomia do conflito, marcadores, estratégia, rerere, abortar.
5. [Desfazer Qualquer Coisa](05-desfazer.md) — `reset` (soft/mixed/hard), `restore`, `revert` e o `reflog` como rede de segurança.
6. [Ferramentas Cirúrgicas](06-ferramentas-cirurgicas.md) — `stash`, `cherry-pick`, `bisect` (busca binária de bug), `tag`.
7. [Fluxo Profissional](07-fluxo-profissional.md) — feature branch, conventional commits, `pull --rebase`, PR, `.gitignore`, remotes.

## Como estudar

Leia na ordem. Os módulos 1 e 2 são a fundação — sem eles, o resto é decoreba. Tenha um repo de teste aberto (`git init /tmp/lab`) e rode cada comando enquanto lê.
