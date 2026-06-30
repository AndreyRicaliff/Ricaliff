# 05 — Desfazer Qualquer Coisa

## O que é
Quase nada se perde de verdade no Git — porque commits são imutáveis e ficam no banco de objetos mesmo quando nenhum branch aponta pra eles (até o garbage collector passar, semanas depois). "Desfazer" quase sempre é **mover ponteiros**, não apagar dados. A chave é saber **qual das três áreas** (módulo 02) você quer afetar.

## reset — move o branch para outro commit
`git reset <commit>` move o ponteiro do branch atual para `<commit>`. As três flags decidem o que acontece com o **index** e o **working directory**:

```text
                     repositório   index    working dir
git reset --soft     muda          intacto  intacto    -> tudo vira "to be committed"
git reset --mixed    muda          muda     intacto    -> tudo vira "not staged" (DEFAULT)
git reset --hard     muda          muda     muda       -> APAGA mudanças do disco
```

```bash
git reset --soft HEAD~1   # desfaz o último commit, mantém tudo staged (re-commitar limpo)
git reset --mixed HEAD~1  # desfaz o commit e o staging, mantém edições no disco
git reset --hard HEAD~1   # desfaz commit + staging + edições — destrutivo, sem dó
```

Caso mais comum: "commitei cedo demais, quero refazer a mensagem/conteúdo" → `--soft HEAD~1`, ajusta, commita de novo. **`--hard` é o único que destrói trabalho do working directory** — é o comando que dá medo, e com razão.

## restore — mexe em arquivos, não em commits
`reset` é sobre o branch; `restore` é sobre **arquivos específicos**, sem mover ponteiro. É a forma moderna e menos ambígua do antigo `checkout -- arquivo`:

```bash
git restore arquivo.js            # descarta edições do working dir (volta ao index)
git restore --staged arquivo.js   # tira do staging (unstage), mantém a edição
git restore --source=HEAD~2 x.js  # traz a versão de 2 commits atrás para o working dir
```

## revert — desfazer publicamente
`reset` reescreve história (move o branch pra trás) — péssimo em branch compartilhada, porque some com commits que outros já têm. `git revert <commit>` faz o oposto: cria um **commit novo** que aplica o **inverso** das mudanças daquele commit. A história é preservada e ninguém fica dessincronizado.

```bash
git revert HEAD        # cria um commit que desfaz o efeito do último commit
git revert <sha>       # desfaz um commit específico do meio da história
```

Regra: **branch local e privada → `reset`**. **Branch já pushada/compartilhada → `revert`**.

## reflog — a rede de segurança
Aqui está o porquê de "quase nada se perde". O **reflog** é um log local de **todo lugar onde HEAD (e cada branch) já esteve** — cada commit, checkout, reset, rebase, merge. Mesmo que um `reset --hard` tenha "sumido" com commits, eles continuam no banco e o reflog guarda o SHA.

```bash
git reflog                       # histórico de movimentos de HEAD, com SHAs
git reset --hard HEAD@{1}        # volta HEAD pra onde estava 1 movimento atrás
git switch -c recuperado <sha>   # ressuscita commits "perdidos" num branch novo
```

Fluxo de pânico clássico: fez `reset --hard` errado e perdeu commits → `git reflog`, acha o SHA de antes do reset, `git reset --hard <sha>` ou cria branch a partir dele. Os commits nunca foram apagados; só ficaram sem ponteiro. O reflog é **local** (não vai pro remoto) e expira (default ~90 dias), mas para resgate imediato é a sua rede.

**Em entrevista:** "Desfazer é mover ponteiros, não apagar. `reset` move o branch — `--soft` preserva index e working, `--mixed` limpa o index, `--hard` apaga tudo do disco. `restore` mexe em arquivos sem mover branch. Em branch compartilhada uso `revert`, que cria um commit inverso sem reescrever história. E se eu apagar commits sem querer, o `reflog` guarda todos os SHAs por onde HEAD passou — recupero de lá."
