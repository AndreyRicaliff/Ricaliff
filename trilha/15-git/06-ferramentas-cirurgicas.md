# 06 — Ferramentas Cirúrgicas

## O que é
Quatro comandos que resolvem problemas pontuais com precisão: guardar trabalho sem commitar (`stash`), transplantar um commit específico (`cherry-pick`), caçar em qual commit um bug nasceu (`bisect`) e marcar versões (`tag`).

## stash — guardar o working dir sem commitar
Você está no meio de uma mudança e precisa trocar de branch **já** (um hotfix urgente), mas o que está no working dir não está pronto pra virar commit. `stash` salva working dir + index numa pilha e devolve a árvore limpa:

```bash
git stash                 # guarda mudanças (tracked) e limpa o working dir
git stash -u              # inclui arquivos untracked (novos, ainda sem add)
git stash list            # stash@{0}, stash@{1}... a pilha
git stash pop             # reaplica o topo E remove da pilha
git stash apply stash@{1} # reaplica um específico, MANTÉM na pilha
git stash drop stash@{0}  # descarta um stash
```

`pop` vs `apply`: `pop` aplica e remove; `apply` aplica e mantém (use quando quer o mesmo stash em vários branches). Reaplicar um stash pode gerar conflito — resolve igual ao módulo 04.

## cherry-pick — transplantar um commit
Pega **um commit específico** de qualquer lugar e cria uma **cópia dele** no branch atual (novo hash — é uma reaplicação, igual rebase). Útil quando um fix foi commitado na branch errada, ou quando você quer levar só **um** commit de uma feature pra `main` sem trazer o resto.

```bash
git cherry-pick <sha>           # aplica aquele commit aqui (novo commit)
git cherry-pick <sha1> <sha2>   # vários, na ordem dada
git cherry-pick A..B            # um intervalo (exclui A, inclui B)
git cherry-pick --abort         # se der conflito e você desistir
```

## bisect — busca binária do bug
O mais subestimado. "Funcionava há 200 commits, hoje está quebrado, e não sei qual commit causou." Em vez de testar 200, o `bisect` faz **busca binária**: ~log₂(200) ≈ **8 testes**. Você marca um commit `good` (sabidamente bom) e um `bad` (quebrado); o Git faz checkout no meio, você testa e responde good/bad, e ele afunila até o **commit exato** que introduziu a regressão.

```bash
git bisect start
git bisect bad                 # o commit atual está quebrado
git bisect good v1.2.0         # esta tag/commit estava boa
# Git faz checkout no meio. Teste o app e classifique:
git bisect good   # ou: git bisect bad
# ...repete ~8 vezes até:
# "abc123 is the first bad commit"
git bisect reset               # volta ao branch original quando terminar
```

Dá pra automatizar com um script que retorne 0 (good) ou ≠0 (bad):

```bash
git bisect run npm test        # roda o teste em cada passo, classifica sozinho
```

## tag — marcar versões
Tag é um ponteiro **fixo** para um commit (não anda como branch). Usada para marcar releases (`v1.0.0`). Dois tipos:

```bash
git tag v1.0.0                       # lightweight: só um apelido pro commit
git tag -a v1.0.0 -m "Release 1.0"   # anotada: objeto próprio com autor/data/msg (preferida)
git push origin v1.0.0               # tags NÃO vão no push normal — empurre explícito
git push origin --tags               # envia todas as tags
```

Use **tag anotada** (`-a`) para releases: ela é um objeto de verdade no banco, com autor, data e mensagem — auditável. Lightweight serve para marcador descartável local.

**Em entrevista:** "`stash` guarda o working dir numa pilha pra eu trocar de contexto sem commitar. `cherry-pick` copia um commit específico pra cá. `bisect` acha o commit que introduziu um bug por busca binária — log₂(n) testes em vez de n, e dá pra automatizar com `bisect run`. `tag` marca uma versão fixa; pra release uso tag anotada e empurro com `push --tags`."
