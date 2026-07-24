# 05 — Desfazer Qualquer Coisa

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — por que quase nada se perde, `reset` como operação sobre as **três árvores**, `revert` como commit inverso), §Estruturação (o mapa reset/restore/revert/reflog) e §Metodologia (o protocolo de "desfazer com precisão" e o resgate por reflog) — além da prática, P/R e checkpoint. As três árvores vêm do módulo `02` e o `reset` foi tabelado no `00-fundamentos/06`; aqui **aprofundamos o mecanismo** (cada `reset` como um subconjunto das três árvores, a pegadinha de reverter um merge, a janela do reflog).

## O que é

Quase nada se perde de verdade no Git — porque commits são **objetos imutáveis** (módulo 01) que continuam no banco mesmo quando nenhuma branch aponta pra eles, até o garbage collector passar semanas depois. "Desfazer", então, é quase sempre **mover ponteiros**, não apagar dados. A perícia está em saber **qual das três áreas** (módulo 02) você quer afetar e **se o commit é público** (se outros já o têm). Este módulo transforma o pânico de "perdi tudo" em um procedimento: identificar o alvo (branch? arquivo? working dir?), escolher a ferramenta certa (`reset`/`restore`/`revert`), e — quando algo "sumiu" — resgatar pelo `reflog`. Entender que o dado quase sempre ainda está lá é o que troca o medo por método.

---

## § BASE — o fundamento

**Por que quase nada se perde.** Um `reset --hard` que "some" com commits **não apaga objeto nenhum** — ele só move a ref da branch pra trás. Os commits ficam **órfãos** (inalcançáveis por nome), mas continuam no `.git/objects`, e o `git gc` só os coleta depois de expirarem (default ~90 dias para commits alcançáveis via reflog, ~2 semanas para objetos soltos totalmente inalcançáveis). Enquanto isso, o **reflog** guarda o SHA de cada lugar por onde `HEAD` (e cada branch) passou. Ou seja: perder trabalho commitado é perder um *ponteiro*, e o reflog é o backup dos ponteiros. É o corolário prático do módulo 01 — objeto é dado, ref é post-it.

**`reset` = uma operação sobre as três árvores.** É aqui que "decoreba de flags" vira entendimento. `git reset <commit>` move a ref da branch atual pra `<commit>`; as flags decidem **até qual das três árvores** (módulo 02) a mudança propaga:

| Flag | HEAD (ref) | Index | Working dir | Efeito |
|---|---|---|---|---|
| `--soft` | move | intacto | intacto | mudanças viram "to be committed" |
| `--mixed` (default) | move | move | intacto | mudanças viram "not staged" |
| `--hard` | move | move | move | **descarta** mudanças do disco |

Leia a tabela como uma **onda que avança**: `--soft` para no HEAD; `--mixed` alcança HEAD+index; `--hard` alcança as três. Por isso `--soft HEAD~1` é o "refaz o último commit" (desfaz o commit, tudo continua staged, você comita de novo limpo) e `--hard` é o único que **destrói working directory** — é o comando que dá medo, com razão. A seção **NOTES/DISCUSSION** do `git-reset(1)` traz as tabelas de transição de estado completas; ler aquilo uma vez fecha o assunto.

**`restore` ≠ `reset`: arquivo, não branch.** `reset` é sobre a **branch** (move o ponteiro). `restore` é sobre **arquivos específicos**, sem mover ponteiro nenhum — é a forma moderna e menos ambígua do antigo `checkout -- arquivo`. `git restore x` descarta a edição do working (volta pra versão do index); `git restore --staged x` tira do stage mantendo a edição; `git restore --source=HEAD~2 x` traz a versão de 2 commits atrás. Separar os dois verbos (`switch` pra branch, `restore` pra arquivo) foi justamente pra acabar com a sobrecarga do `checkout`, que fazia as duas coisas e confundia.

**`revert` = desfazer em público, sem reescrever história.** `reset` reescreve história (move a branch pra trás) — **péssimo em branch compartilhada**, porque some com commits que outros já têm (cria a divergência do módulo 03). `git revert <commit>` faz o oposto: **não** mexe em nada existente; cria um **commit novo** que aplica o **inverso** do diff do alvo. A história é preservada, ninguém fica dessincronizado, e o registro fica honesto ("aqui desfizemos X"). Regra que sai direto da regra de ouro do rebase: **branch local e privada → `reset`; branch já pushada/compartilhada/main → `revert`.**

**A pegadinha de reverter um merge.** Reverter um commit normal é trivial (um pai, um inverso). Reverter um **merge commit** não é: ele tem dois pais, e o Git precisa saber **qual linha** você quer manter como "mainline" — daí `git revert -m 1 <merge>` (mantém o primeiro pai). Pior: reverter um merge **não desfaz a fusão do histórico**, só o *conteúdo*; se depois você tentar re-mergear o mesmo branch, o Git acha que já foi integrado e **não traz as mudanças de volta** — você precisaria "reverter o revert". A doc do Git tem uma nota inteira sobre isso ("How to revert a faulty merge"). Moral: prefira desfazer **antes** de mergear; reverter merge é operação com efeito colateral que morde meses depois.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
                         alvo                     reescreve história?     seguro em main?
 git reset --soft/mixed/hard   → a BRANCH          sim (move ref p/ trás)    ✗ (só local)
 git restore [--staged]        → ARQUIVOS          não (não move ref)        ~ (não toca commit)
 git revert <sha>              → cria COMMIT novo   não (adiciona inverso)    ✓
 git reflog + reset/switch     → RESGATE            —                         rede de segurança
```

**A pergunta que roteia a ferramenta:**
1. Quero mexer em **arquivo** (não no histórico)? → `restore`.
2. Quero desfazer **commit** e ele é **local**? → `reset` (escolha a flag pela árvore que quer afetar).
3. Quero desfazer **commit** e ele é **público**? → `revert` (nunca `reset` em compartilhado).
4. **Sumiu algo?** → `reflog`, ache o SHA, `reset --hard <sha>` ou `switch -c resgate <sha>`.

`ORIG_HEAD` é um atalho relacionado: antes de operações "grandes" (`reset`, `merge`, `rebase`), o Git salva a posição anterior de `HEAD` em `ORIG_HEAD` — `git reset --hard ORIG_HEAD` desfaz o último reset/merge sem nem consultar o reflog.

---

## § METODOLOGIA — o passo-a-passo replicável

**Desfazer com precisão:**
1. **Nomeie o alvo em voz alta:** "quero mexer no arquivo X" vs "quero desfazer o commit" vs "quero desfazer algo que já pushei". A resposta escolhe a ferramenta antes de você digitar.
2. **Commit local demais/cedo demais:** `git reset --soft HEAD~1`, ajuste, recomite. Nada perdido — só re-empacotado.
3. **Edição ruim num arquivo, sem commit:** `git restore x` (ou `--staged` se já deu `add`).
4. **Commit já público que precisa sair:** `git revert <sha>` — commit inverso, história intacta.
5. **`--hard` só com consciência:** é o único que apaga working dir. Antes de um `--hard`, o `ORIG_HEAD`/reflog te cobre, mas trate como faca.

**Resgate por reflog (o fluxo de pânico):**
1. `git reflog` — lista os movimentos de `HEAD` com SHAs (`HEAD@{0}`, `HEAD@{1}`…).
2. Ache a linha **de antes** do estrago (o `reset`/`rebase` que sumiu com o trabalho).
3. `git reset --hard HEAD@{n}` pra voltar, **ou** `git switch -c recuperado <sha>` pra ressuscitar num branch novo sem mexer no atual.
4. Lembre: o reflog é **local** (não vai pro remoto) e **expira**; pra resgate imediato é sua rede, mas não é backup de longo prazo.

**Anti-padrões:**
- **`reset --hard` pra "desfazer" em branch compartilhada** — reescreve história pública; use `revert`.
- **`reset --hard` sem saber que ele apaga o working dir** — leia a tabela das três árvores antes.
- **Reverter um merge sem entender o efeito** — `-m` obrigatório e o "revert do revert" te espera.
- **Achar que perdeu tudo e não checar o reflog** — 95% das "perdas" estão a um `git reflog` de distância.
- **Depender do reflog como backup** — ele expira e é local; não substitui push/remoto.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Reproduza o *recovery-drill* do syllabus — "perca" trabalho de três jeitos e resgate cada um:

1. **`reset --hard`:** comite algo, `git reset --hard HEAD~1` (sumiu). Rode `git reflog`, ache o SHA, `git reset --hard <sha>` — de volta. Nomeie o caminho: **reflog**.
2. **Branch deletada:** crie `feat/x`, comite, `git switch main`, `git branch -D feat/x` (sumiu). `git reflog` ainda tem o SHA da ponta; `git switch -c feat/x <sha>` — ressuscitada.
3. **`commit --amend`:** comite "versão A", `git commit --amend` pra "versão B". O commit A virou órfão; ache-o no `git reflog` e recupere. Nomeie: o amend criou commit **novo** (módulo 01), o antigo não sumiu.
4. **Mapa das três árvores na prática:** faça um `--soft`, veja `git status` (staged); refaça, `--mixed`, veja (not staged); refaça num commit descartável, `--hard`, veja (foi-se) — e recupere pelo reflog.
5. **`ORIG_HEAD`:** faça um `git reset --hard HEAD~2` e desfaça com `git reset --hard ORIG_HEAD`. Note que nem precisou do reflog.
6. **Escreva** em `~/projetos/estudos/rascunhos/git-desfazer.md`: para cada um dos 3 resgates, qual ferramenta e por quê.

---

## Por que cai em entrevista

"Como você desfaz o último commit sem perder as alterações?" e "`reset --hard` vs `revert`?" são perguntas de bolso. A resposta forte liga cada `reset` às três árvores e escolhe `reset` vs `revert` pelo critério **público/privado** — e o diferencial é mencionar o reflog como rede.

> **P:** "Como você desfaz coisas no Git — `reset`, `restore`, `revert` — e o que fazer se apagar um commit sem querer?"
>
> **R (30s):** "Desfazer é mover ponteiros, não apagar. `reset` move o branch — `--soft` preserva index e working, `--mixed` limpa o index, `--hard` apaga tudo do disco. `restore` mexe em arquivos sem mover branch. Em branch compartilhada uso `revert`, que cria um commit inverso sem reescrever história. E se eu apagar commits sem querer, o `reflog` guarda todos os SHAs por onde HEAD passou — recupero de lá."

> **P:** "Por que `reset` é perigoso na main e `revert` não? E tem alguma armadilha em reverter um merge?"
>
> **R (30s):** "`reset` move a branch pra trás, ou seja, **reescreve** o histórico — na main isso some com commits que os outros já têm e cria divergência. `revert` não mexe em nada existente: cria um commit novo que aplica o inverso do alvo, então o histórico fica intacto e ninguém dessincroniza — por isso é o certo em branch pública. A armadilha do merge: reverter um merge exige `-m` pra dizer qual pai é a mainline, e ele desfaz só o **conteúdo**, não o registro da fusão — se eu tentar re-mergear o mesmo branch depois, o Git acha que já entrou e não traz nada; eu teria que 'reverter o revert'. Por isso prefiro desfazer antes de mergear."

## Checkpoint

- [ ] Explico por que quase nada se perde (objeto imutável + reflog guarda os SHAs)
- [ ] Ligo `--soft`/`--mixed`/`--hard` às três árvores (quantas cada um afeta)
- [ ] Diferencio `reset` (branch) de `restore` (arquivo) de `revert` (commit inverso)
- [ ] Escolho `reset` vs `revert` pelo critério **local/privado** vs **público**
- [ ] Sei a pegadinha de reverter um merge (`-m` e o "revert do revert")
- [ ] Já recuperei um commit "perdido" via `reflog` e conheço `ORIG_HEAD`

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 7 "Git Tools", seção "Reset Demystified": `reset` como operação sobre as três árvores — a §BASE deste módulo
- **Pro Git** — cap. 2 "Git Basics", seção "Undoing Things": `--amend`, `restore`/`checkout`, desfazer o básico
- **git-scm docs** — `git-reset(1)`, seção "NOTES"/"DISCUSSION": as tabelas de transição working/index/HEAD (ouro)
- **git-scm docs** — `git-revert(1)` e a nota "How to revert a faulty merge" (o `-m` e o "revert do revert")
- **git-scm docs** — `git-reflog(1)`: a rede de segurança e a janela de expiração
- Módulos-irmãos `01-modelo-mental` (objeto imutável, órfãos) e `02-staging` (as três árvores que o `reset` percorre)
