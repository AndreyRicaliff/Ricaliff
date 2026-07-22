# Syllabus — Git

> **Disciplina:** parar de "decorar comandos" e operar o Git pelo modelo mental — grafo de commits, staging, e recuperação sem medo.
> **Carga horária alvo: 30h** — aulas 3h · bibliografia 12h · labs 11h · projeto de conclusão 4h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar o que é um commit (snapshot + pai) e desenhar o DAG de um repositório qualquer olhando o `git log --graph`.
2. Escolher entre merge e rebase pelo efeito no histórico, e resolver um conflito entendendo o que cada lado mudou.
3. Desfazer com precisão: reset (soft/mixed/hard), revert, restore — sabendo qual perde trabalho e qual não.
4. Recuperar commits "perdidos" via reflog e operar as ferramentas cirúrgicas (stash, cherry-pick, bisect) com segurança.

## Aprofundamento por módulo (bibliografia obrigatória)

> Fonte única e gratuita: *Pro Git* (Scott Chacon & Ben Straub, 2ª ed) — leitura online em git-scm.com/book.

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 modelo-mental | *Pro Git* — cap. 1 "Getting Started" (What is Git?) + cap. 10 "Git Internals": "Git Objects" (blob/tree/commit) | 2h |
| 02 staging | *Pro Git* — cap. 2 "Git Basics": "Recording Changes to the Repository" (working tree / staging area / HEAD) | 1.5h |
| 03 branches-merge-rebase | *Pro Git* — cap. 3 "Git Branching": "Basic Branching and Merging" e "Rebasing" | 2h |
| 04 conflitos | *Pro Git* — cap. 3 "Basic Merging" (resolução de conflito) + cap. 7 "Advanced Merging" | 2h |
| 05 desfazer | *Pro Git* — cap. 2 "Undoing Things" + cap. 7 "Reset Demystified" | 2h |
| 06 ferramentas-cirurgicas | *Pro Git* — cap. 7 "Git Tools": "Stashing and Cleaning", "Rewriting History" (cherry-pick), "Debugging with Git" (bisect) + "Reflog" | 1.5h |
| 07 fluxo-profissional | *Pro Git* — cap. 5 "Distributed Git": "Contributing to a Project" + cap. 6 "GitHub" (Pull Requests) | 1h |

Regra de leitura: **com um repo de teste aberto** — cada comando que ler, rode e confira o efeito no `git log --graph` e no `git status`. Leitura sem rodar não conta hora.

## Labs (mini-apps isolados, do zero)

> Aqui o "mini-app" é um **cenário reproduzível**: um script (PowerShell ou bash) que constrói o repositório do zero, para que o exercício seja repetível e não dependa de um repo real.

**Lab 1 — `git-timetravel` (4h):** um script que cria um repo com 12 commits, plantando um bug em UM commit do meio; depois use `git bisect` para achá-lo.
*Pronto quando:* o bisect aponta o commit exato, e o `BISECT.md` explica por que os limites `good`/`bad` iniciais precisavam estar corretos para o resultado valer.

**Lab 2 — `conflict-gym` (4h):** um script que gera duas branches divergentes garantidamente conflitantes nas mesmas linhas. Resolva o mesmo conflito de duas formas: via `merge` e (numa cópia limpa) via `rebase`.
*Pronto quando:* as duas resoluções produzem a MESMA árvore final (mesmo conteúdo) mas históricos diferentes, e você desenha os dois DAGs mostrando a diferença.

**Lab 3 — `recovery-drill` (3h):** "perca" commits de propósito de três jeitos (`reset --hard`, branch deletada, `commit --amend`) e recupere cada um.
*Pronto quando:* todo commit "perdido" é recuperado e você nomeia corretamente o caminho de cada resgate (reflog vs `ORIG_HEAD` vs cherry-pick).

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com um repo de teste aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Curso em Vídeo / Gustavo Guanabara** *(PT-BR)* | "curso de Git e GitHub" (commit, branch, merge) | módulos 01, 02, 03, 07 — base do zero em português |
| **Fabio Akita** *(PT-BR)* | "como o Git funciona por dentro", "Git internals" | módulos 01, 05 — o modelo mental em português |
| **freeCodeCamp.org** | "Git and GitHub full course", "git branching and merging" | módulos 03, 04 |
| **ThePrimeagen** | "git rebase", "git reflog recovery", "how I use git" | módulos 03, 05, 06 |

Ordem sugerida: curso-base (Guanabara) ANTES pra criar o mapa; vídeo profundo (Akita/ThePrimeagen) DEPOIS do módulo pra consolidar. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (o comando que você passou a usar diferente)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
