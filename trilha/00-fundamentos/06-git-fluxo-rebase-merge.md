# 06 — Git: Fluxo, Rebase, Merge e Ferramentas

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — git como filesystem
> endereçável por conteúdo, os 4 objetos, o DAG de Merkle, as três árvores), §Estruturação (o
> modelo de objetos, merge × rebase, reset × revert) e §Metodologia (o fluxo replicável e o
> bisect como busca binária) — além da prática, P/R e checkpoint. Teoria por extenso.

## O que é

Git rastreia **snapshots** do projeto, não diffs. Cada commit aponta para o commit anterior, formando um grafo acíclico dirigido (**DAG**). Branches são apenas **ponteiros** para commits — mover uma branch é barato e instantâneo.

```bash
git log --oneline --graph --all
# * a1b2c3d (HEAD -> feat/nova-rota) feat(api): add recording endpoint
# * f4e5d6c fix(bot): resolve crash on headless mode
# | * 9g8h7i6 (main) chore(deps): bump prisma to 5.10
# |/
# * 3j2k1l0 feat(auth): restrict login to Workspace domain
```

**Merge** une dois branches criando um commit de merge (dois pais). Preserva o histórico exato; o grafo fica não-linear. **Rebase** reaplica commits de uma branch por cima de outra, **reescrevendo os SHAs** — o histórico fica linear, como se o trabalho tivesse sido feito depois do commit base.

---

## § BASE — o fundamento

**Git é um filesystem endereçável por conteúdo.** Antes de ser uma ferramenta de branches, git é um **banco de objetos key-value** onde a *chave é o hash do conteúdo*. Você dá um conteúdo; git calcula o SHA (SHA-1 historicamente, migrando pra SHA-256) daquele conteúdo e o guarda em `.git/objects/` sob esse hash. Consequência profunda: **conteúdo idêntico tem sempre a mesma chave**, e **qualquer alteração de um byte muda o hash**. É isso que torna o histórico *tamper-evident* (à prova de adulteração) — você não muda um commit antigo sem que o hash dele, e o de todos os descendentes, mude junto. Linus Torvalds escreveu o git em 2005, em poucas semanas, quando o kernel Linux perdeu acesso à ferramenta proprietária que usava; o design endereçável-por-conteúdo veio da obsessão com integridade (ninguém pode corromper o histórico sem ser detectado).

**Os quatro tipos de objeto.** Todo o git se constrói sobre quatro objetos, todos guardados pelo hash do próprio conteúdo:

- **blob** — o conteúdo de **um arquivo** (só os bytes; sem nome, sem data). Dois arquivos com o mesmo conteúdo são um blob só.
- **tree** — um **diretório**: uma lista de nomes → (hash de blob ou de outra tree) + permissões. É o que dá nome e estrutura aos blobs.
- **commit** — um **snapshot**: aponta pra uma tree (o estado inteiro do projeto naquele momento), pra o(s) commit(s) **pai**, mais autor, data e mensagem.
- **tag** (anotada) — um ponteiro nomeado e assinável pra um commit específico.

Repare: um commit **não guarda diff**. Ele guarda o hash da árvore inteira. O diff que você vê (`git show`) é **calculado na hora**, comparando a árvore do commit com a do pai. "Git guarda snapshots, não diferenças" é literalmente isso.

**Por que o histórico é um Merkle DAG.** Um commit contém o hash do seu pai. O pai contém o hash do avô. Como o hash de um commit inclui o hash do pai (que inclui o do avô...), o hash de qualquer commit **depende de toda a história até ele** — é uma **Merkle chain**. É "DAG" (grafo acíclico dirigido) porque merges dão a um commit **dois pais** (deixa de ser uma linha reta), mas nunca há ciclos (um commit nunca é ancestral de si mesmo). Isso explica de uma vez: por que reescrever um commit antigo muda todos os SHAs seguintes; por que `git fsck` detecta corrupção; e por que puxar/empurrar é eficiente (git só transfere objetos cujos hashes o outro lado ainda não tem).

**Branch é um arquivo de 41 bytes.** Uma branch **não é** uma cópia do código — é um **ponteiro** pra um commit. Literalmente: `.git/refs/heads/main` é um arquivo de texto contendo um SHA. Criar branch é escrever esse arquivo (instantâneo, barato); trocar de branch move o `HEAD`. **HEAD** é o ponteiro pra "onde eu estou agora" (normalmente aponta pra uma branch, que aponta pra um commit). Commitar avança o ponteiro da branch atual pro novo commit. Entender que branch = ponteiro mata o medo: você não "perde" trabalho ao trocar de branch — os commits continuam no banco de objetos, alcançáveis pelo hash.

**As três árvores (o que staging realmente é).** Git trabalha com três "árvores" (estados):

1. **HEAD** — o último commit (o snapshot já registrado).
2. **Index / Staging Area** — a **proposta do próximo commit**. `git add` copia o estado do arquivo do working directory pro index. É por isso que existe o passo intermediário: você monta o próximo snapshot peça por peça, escolhendo o que entra.
3. **Working Directory** — os arquivos que você edita agora.

`git status` é essencialmente "diff entre essas três árvores": *staged* = index difere de HEAD; *modified* = working difere do index. `git add` move working→index; `git commit` transforma o index num novo commit; `git checkout`/`restore` move HEAD/index→working. Quase todo comando git é uma operação entre essas três árvores — depois que você vê assim, `reset --soft/--mixed/--hard` deixa de ser decoreba.

**Por que rebase reescreve SHAs (e por isso é perigoso em branch compartilhada).** Rebase pega seus commits e os **reaplica** sobre uma nova base. Reaplicar = criar commits **novos** (o pai mudou → o hash muda → é outro objeto, mesmo com o mesmo diff e mensagem). Os commits antigos ficam órfãos. Se **ninguém mais** tinha aqueles commits, tudo bem (histórico local, mais limpo). Mas se um colega já baseou trabalho nos SHAs antigos, você acabou de criar uma história paralela divergente — daí a regra de ouro: **nunca rebase o que outros já têm.**

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

**O modelo de objetos:**
```
refs/heads/main ─▶ commit  (SHA = hash de: tree + pai + autor + msg)
                     │  parent ─▶ commit anterior ─▶ … (Merkle chain)
                     └─ tree (diretório raiz)
                          ├─ blob   (arquivo A — só conteúdo)
                          ├─ blob   (arquivo B)
                          └─ tree   (subdiretório)
                                └─ blob (arquivo C)
HEAD ─▶ (normalmente) a branch atual ─▶ commit atual
```

**As três árvores:** `working dir` ──`git add`──▶ `index (staging)` ──`git commit`──▶ `HEAD (repo)`.

**Merge vs Rebase:**

| | Merge | Rebase |
|---|---|---|
| Histórico | não-linear, preserva o que aconteceu | linear, mais legível |
| SHAs | originais preservados | **reescritos** |
| Seguro em branch compartilhada | sim | **não** — reescreve história que outros têm |
| Quando usar | integrar feature em main (via PR) | atualizar feature com main antes do PR |
| Regra de ouro | — | nunca rebase o que outras pessoas usam |

**Reset vs Revert:**

| Comando | O que faz | Seguro em main? |
|---|---|---|
| `git reset --soft HEAD~1` | desfaz o commit, mantém mudanças **staged** (no index) | só local |
| `git reset --mixed HEAD~1` | desfaz o commit, mantém mudanças **unstaged** (no working) — default | só local |
| `git reset --hard HEAD~1` | desfaz o commit e **descarta as mudanças** | só local — cuidado |
| `git revert <sha>` | cria um **novo** commit que desfaz o alvo | **seguro em main** — não reescreve história |

Repare como os três `reset` mapeiam exatamente nas três árvores: `--soft` mexe só no HEAD; `--mixed` mexe em HEAD + index; `--hard` mexe em HEAD + index + working.

**Conventional Commits** (`tipo(escopo): mensagem imperativa`): `feat` (funcionalidade), `fix` (bug), `refactor` (mudança interna sem alterar comportamento), `chore` (deps/config/CI), `docs`, `test`, `perf`. O prefixo comunica **intenção**, não só o que mudou — e vira changelog e histórico legível de graça.

```
feat(auth): restrict OAuth login to Workspace domain to prevent external access   ← diz o POR QUÊ
fix stuff / update / wip                                                          ← inútil
```

**Ferramentas essenciais:** `git stash`/`stash pop`/`stash list` (guardar trabalho sem commitar); `git log --oneline --graph --all` (o DAG); `git diff main...feat/x` (o que a branch adicionou); `git bisect` (busca binária de bug — abaixo).

---

## § METODOLOGIA — o passo-a-passo replicável

**Fluxo de trabalho num projeto AG:**

1. **Branch própria a partir de main** — nunca commite direto em main. `git switch -c feat/algo`.
2. **Commits atômicos e conventional** — cada commit é um passo que compila/funciona, com mensagem que diz o **porquê**. (É o método do módulo 00 aplicado ao git: cada delta parte de um estado que funcionava.)
3. **Antes de abrir PR, atualize com `git pull --rebase`** — traz a main por baixo do seu trabalho, histórico linear, sem "Merge branch 'main'" poluindo.
4. **Abra PR; integre via merge** — preserva quando a feature foi feita e passa pela revisão.
5. **Desfazer:** local e ninguém tem → `reset` é livre. Compartilhado ou main → **sempre `revert`** (novo commit, não reescreve).
6. **Force push em main/master: nunca.** Reescreve história que todos têm — avise mesmo se pedirem.

**Achar o commit que introduziu um bug — `git bisect` é busca binária O(log n):**

1. `git bisect start`.
2. `git bisect bad` (o commit atual tem o bug), `git bisect good <sha>` (um commit que você sabe que era bom).
3. Git faz **checkout automático no commit do meio** do intervalo. Você testa e responde `git bisect good`/`bad`.
4. Cada resposta **descarta metade** do histórico restante — 500 commits caem em ~9 passos (log₂500 ≈ 9).
5. `git bisect reset` ao terminar. Se há teste automatizado: `git bisect run npm test` roda tudo sozinho.

**Anti-padrões:**
- **`git add . && git commit -m "fix"`** às cegas — commit que não diz nada; histórico vira "fix, update, wip, final", inútil pra debug e onboarding.
- **Rebase em branch compartilhada** — reescreve SHAs que outros já têm, cria divergência.
- **`reset --hard` pra "desfazer"** em vez de `revert` em main — descarta trabalho e reescreve história pública.
- **Force push em main** — apaga história dos outros.
- **Commit gigante misturando N mudanças** — impossível reverter uma parte, impossível revisar; quebre em commits atômicos.
- **`git commit --no-verify` pra pular hook** — silencia a rede de proteção; só com autorização explícita.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Ler um commit real e recontar em prosa treina a habilidade que PR, code review e entrevista cobram.

1. **Veja o histórico de um projeto AG com passado rico:**
   ```bash
   git -C ~/projetos/PULSAR-RH log --oneline | head -20
   ```
2. **Escolha 1 commit substantivo (não "fix typo") e veja o resumo:**
   ```bash
   git -C ~/projetos/PULSAR-RH show <sha> --stat
   ```
   O `--stat` mostra arquivos e linhas mudadas sem o diff completo.
3. **Leia o diff inteiro:** `git -C ~/projetos/PULSAR-RH show <sha>`. Note que o git **calculou** esse diff comparando duas árvores — ele não estava guardado.
4. **Escreva 1 parágrafo** em `~/projetos/estudos/rascunhos/commit-story.md`: o que o código fazia antes, o que mudou, por que provavelmente mudou, e qual seria a mensagem de commit ideal.
5. **Exercite as três árvores + stash:** mude um arquivo, `git status` (working≠index), `git add` (agora staged), `git stash`, `git stash list`, `git stash pop` — observe o estado voltar.
6. **Faça um `git bisect` de treino** num repo local (mesmo forçando um "bug" numa linha) e confirme que ele isola o commit em ~log₂(n) passos.
7. **Registre no `DECISIONS.md`:** padrão de commits AG (conventional obrigatório), `pull --rebase` pra sync, merge via PR pra integrar, `revert` em main.

---

## Por que cai em entrevista

Git é ferramenta diária. Entrevistadores testam se você navega o histórico com intenção ou usa `git add . && commit -m "fix"` às cegas. Variações:

- "Diferença entre merge e rebase?"
- "`git reset --hard` vs `git revert` — quando cada?"
- "Como desfazer o último commit sem perder as alterações?"
- "O que é um conflito de merge e como resolve?"
- "Como achar em qual commit um bug entrou?"
- "Por que force push em main é proibido?"

> **P:** "Qual a diferença entre `git merge` e `git rebase`? Quando você usa cada?"
>
> **R (30s):**
> "Merge une dois branches criando um commit com dois pais — o histórico fica não-linear mas preserva exatamente o que aconteceu e quando. Rebase reaplica meus commits por cima de outro branch, reescrevendo os SHAs — o histórico fica linear, mais fácil de ler. Uso rebase para manter minha feature branch atualizada com main antes de abrir PR. Uso merge para integrar a feature branch em main via PR — aí quero preservar quando a feature foi feita. A regra que nunca quebro: nunca rebase em branch que outras pessoas estão usando — estou reescrevendo história que elas já têm local."

> **P:** "Como você encontraria em qual commit um bug foi introduzido numa base com 500 commits?"
>
> **R (30s):**
> "Usaria `git bisect`. Digo pro Git qual commit tem o bug (`git bisect bad`) e qual era bom (`git bisect good <sha>`) — o Git faz uma busca binária no histórico, dando checkout no commit do meio. Eu testo, digo se é bom ou ruim, e repito. Em ~9 passos ele isola o commit culpado num histórico de 500. É exatamente busca binária O(log n) aplicada a commits. Se o projeto tem testes automatizados, dá para fazer `git bisect run npm test` e o processo roda sozinho."

> **P:** "Git guarda diffs entre versões? Por que rebase muda os SHAs dos commits?"
>
> **R (30s):**
> "Não guarda diffs — guarda snapshots. Cada commit aponta pro hash da árvore inteira do projeto e pro hash do commit pai; o diff que eu vejo é calculado na hora comparando as árvores. Como o hash do commit inclui o hash do pai, ele depende de toda a história até ali — é uma cadeia de Merkle. Rebase troca a base, então o pai muda; se o pai muda, o hash do commit muda, e o de todos os descendentes junto. Por isso rebase cria commits novos e nunca deve ser feito em história que outros já têm — eu criaria uma linha divergente da deles."

## Checkpoint

- [ ] Explico que git guarda snapshots (não diffs) e o que são blob/tree/commit
- [ ] Explico por que reescrever um commit muda todos os SHAs seguintes (Merkle chain)
- [ ] Descrevo as três árvores (working/index/HEAD) e ligo os três `reset` a elas
- [ ] Explico merge vs rebase com exemplo de quando usar cada, e a regra de ouro do rebase
- [ ] Li o diff de 1 commit real de um projeto AG e escrevi o parágrafo descrevendo o que fez
- [ ] Executei um `git bisect` ≥1 vez e sei por que é O(log n)
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Git fluxo e ferramentas dominados`.

---

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed, git-scm.com) — cap. 3 "Git Branching": seções "Basic Branching and Merging" e "Rebasing"
- **Pro Git** — cap. 10 "Git Internals": seções "Git Objects" (blob/tree/commit) e "Git References" (branch/HEAD como ponteiros) — a §BASE deste módulo mora aqui
- **Pro Git** — cap. 7, seção "Reset Demystified" (as três árvores e o que cada `reset` faz)
- **Conventional Commits** — a especificação v1.0.0 (os prefixos e o formato)
- **git-scm docs** — `git bisect` (a busca binária) e `git stash`
- `~/projetos/PULSAR-RH/` — histórico git real de projeto AG em produção
