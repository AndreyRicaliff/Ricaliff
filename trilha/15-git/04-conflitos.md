# 04 — Resolver Conflitos

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — o conflito como o **merge de 3 vias que empatou**, a base comum e o estilo `diff3`), §Estruturação (a anatomia dos marcadores e a inversão ours/theirs) e §Metodologia (resolver, verificar, abortar, `rerere`) — além da prática, P/R e checkpoint. O merge de 3 vias e os três estágios do index foram montados nos módulos `02` e `03`; aqui **aprofundamos o caso em que ele não decide sozinho** — por que empata, como o Git te mostra o empate e como não resolver errado.

## O que é

Conflito não é o Git "falhando" — é o Git **se recusando a adivinhar**. No merge de 3 vias (módulo 03), o Git compara a **base comum** com os dois lados; quando um lado só mudou, ele aceita; quando **os dois** mudaram a mesma região de formas diferentes, não há resposta correta derivável dos dados, e ele **pausa** pra você decidir. Este módulo abre o que acontece nesse pause: onde ficam as três versões (spoiler: nos estágios do index, módulo 02), o que os marcadores `<<<< ==== >>>>` realmente representam, por que `ours`/`theirs` **invertem** durante rebase, e por que "resolver" quase nunca é "escolher um lado". Conflito mal resolvido é uma das formas mais silenciosas de introduzir bug — você apaga a mudança do colega sem perceber.

---

## § BASE — o fundamento

**Conflito é o merge de 3 vias sem vencedor.** Recapitulando o módulo 03: o Git acha a **base de merge** (o ancestral comum, o LCA no DAG) e, arquivo por arquivo, região por região, olha três versões — base, **ours** (seu `HEAD`), **theirs** (o `MERGE_HEAD`). A regra de decisão é local: *região mudou só de um lado em relação à base → aceita; região mudou dos dois lados de forma diferente → conflito.* Repare no papel da **base**: sem ela, o Git só teria "duas versões diferentes" e teria que perguntar por tudo. Com a base, ele sabe **quem introduziu a mudança** e resolve sozinho a esmagadora maioria dos casos. O conflito é o resíduo irredutível: os dois editaram a mesma coisa, e só uma pessoa que entende a *intenção* pode combinar.

**Onde moram as três versões: os estágios do index.** Isto é o gancho do módulo 02, e é o que desmistifica tudo. Durante o conflito, o arquivo não está em um estágio só no index — está em **três**: stage 1 = base, stage 2 = ours, stage 3 = theirs (`git ls-files -u` mostra). O working directory recebe o arquivo com os **marcadores** injetados, mas a verdade estruturada está no index. Por isso o Git consegue te oferecer `--ours`, `--theirs` e o `mergetool` de 3 painéis: **as três versões existem, guardadas**. E por isso `git add` no arquivo resolvido significa "colapse os três estágios num stage 0" — você não está adicionando conteúdo, está **declarando o empate desfeito**.

**Os marcadores, e o estilo `diff3` que mostra a base.** O padrão do Git escreve dois lados:

```text
<<<<<<< HEAD
preco = valor * 1.10        (ours — o lado onde você está)
=======
preco = valor * 1.15        (theirs — o que você traz)
>>>>>>> feature/desconto
```

O problema do padrão de 2 lados: você vê o *quê* de cada um, mas não **de onde partiram**. Ligando o estilo `diff3` (`git config --global merge.conflictStyle diff3`, ou o mais novo `zdiff3`), o Git inclui a **base comum** no meio:

```text
<<<<<<< HEAD
preco = valor * 1.10
||||||| base comum
preco = valor
=======
preco = valor * 1.15
>>>>>>> feature/desconto
```

Agora dá pra ver que a base era `valor` puro, um lado somou 10% e o outro 15% — a resolução correta provavelmente **não** é escolher um lado, é entender a regra de negócio (talvez os dois descontos se combinem, talvez um esteja errado). Ver a base transforma "chute entre dois" em "decisão informada". É a diferença entre resolver e adivinhar.

**A inversão de `ours`/`theirs` no rebase — a pegadinha que gera bug.** No merge, `ours` = seu branch, intuitivo. No **rebase**, inverte: o rebase reaplica seus commits *em cima* do outro branch, então, do ponto de vista de cada replay, "ours" passa a ser a **base sobre a qual você reaplica** (o upstream, ex.: a `main`) e "theirs" são **os seus próprios commits** sendo reaplicados. Ou seja: durante `git rebase main`, `git checkout --ours` pega a `main`, não o seu trabalho. Resolver no piloto automático ("aceito ours, é meu") durante rebase é como você **descarta a própria mudança** sem perceber. A regra: em rebase, leia a base (diff3) e desconfie de qualquer atalho `--ours/--theirs`.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
merge de 3 vias                     index durante o conflito          working directory
─────────────                        ──────────────────                ─────────────────
   base (LCA)                         stage 1 = base                    arquivo com marcadores:
    /     \                           stage 2 = ours  (HEAD)             <<<<<<< HEAD  … ours
  ours   theirs                       stage 3 = theirs(MERGE_HEAD)       ||||||| base   (diff3)
    \     /                                                              ======= … theirs
   RESOLUÇÃO ← só humano decide       git add → colapsa p/ stage 0       >>>>>>> outro-lado
```

| Contexto | `ours` (`HEAD`/`--ours`) | `theirs` (`--theirs`) |
|---|---|---|
| `merge` | seu branch atual | o branch que você traz |
| **`rebase`** | **a base/upstream** (ex.: main) | **seus commits** reaplicados |
| `cherry-pick` | seu branch atual | o commit sendo transplantado |

Operações que geram conflito (todas combinam trabalho): `merge`, `rebase`, `cherry-pick`, `stash pop`, `revert`. Todas param, marcam os arquivos, e todas têm `--continue` / `--abort`.

---

## § METODOLOGIA — o passo-a-passo replicável

1. **Ligue o `diff3` de uma vez por todas:** `git config --global merge.conflictStyle zdiff3`. Resolver sem ver a base é resolver no escuro.
2. **Liste os conflitos:** `git status` → "Unmerged paths". Ataque um arquivo por vez.
3. **Para cada bloco `<<<< ||||| ==== >>>>`:** leia a **base** no meio, entenda o que cada lado quis fazer, escreva o código final correto (que pode **combinar** os dois) e **apague os quatro marcadores**.
4. **Prove que não sobrou marcador:** `git diff --check` acusa marcador de conflito esquecido (um `<<<<<<<` commitado por engano é bug clássico).
5. **Marque resolvido e continue:** `git add arquivo` (colapsa os estágios) → `git merge --continue` (ou `rebase --continue` / `cherry-pick --continue`).
6. **Na dúvida, aborte — é seguro:** `git merge --abort` / `git rebase --abort` restaura **exatamente** o estado pré-operação. Sempre prefira abortar a "forçar" uma resolução que você não entendeu.

Ferramentas de apoio: `git checkout --ours/--theirs arquivo` (aceita um lado inteiro — **cuidado com a inversão no rebase**); `git mergetool` (abre a ferramenta visual de 3 vias configurada). E o `rerere`.

**`rerere` — resolva uma vez, reuse sempre.** *reuse recorded resolution.* Em rebases longos ou branches de vida longa, o **mesmo** conflito reaparece. Com `git config --global rerere.enabled true`, o Git **grava** como você resolveu cada conflito e **reaplica automaticamente** quando ele reaparece idêntico, avisando você. Economiza horas num branch que ficou muito atrás da main.

**Anti-padrões:**
- **Resolver no automático em rebase** — sem lembrar da inversão, `--ours` descarta seu próprio trabalho.
- **Escolher um lado sem ler a base** — o `diff3` existe pra isso; sem a base, você chuta entre duas versões e pode apagar a mudança certa.
- **Commitar um marcador esquecido** — rode `git diff --check` antes de `add`.
- **"Forçar" uma resolução que não entendeu** em vez de `--abort` — você fecha o conflito e abre um bug.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Reproduza o *conflict-gym* do syllabus:

1. **Fabrique um conflito garantido:** duas branches que mudam **a mesma linha** de um arquivo de formas diferentes. Ligue `zdiff3` antes.
2. **Provoque o merge:** `git merge outra-branch`. No pause, rode `git ls-files -u` e **anote os três estágios** (1=base, 2=ours, 3=theirs) — prove que as três versões estão no index.
3. **Leia a base:** abra o arquivo e localize o bloco `||||||| base`. Escreva no rascunho o que cada lado fez *em relação à base* — não "A vs B", mas "a partir de X, um fez +Y e o outro +Z".
4. **Resolva combinando** (não escolhendo): deixe o código correto, apague os marcadores, `git diff --check`, `git add`, `git merge --continue`.
5. **Repita via rebase numa cópia limpa** e **conscientemente confirme a inversão:** durante `git rebase`, rode `git checkout --ours arquivo` e observe que veio a **base/upstream**, não o seu trabalho. Aborte e resolva à mão.
6. **Compare:** as duas resoluções (merge e rebase) devem produzir a **mesma árvore final** com **históricos diferentes** (gancho do módulo 03).

---

## Por que cai em entrevista

"O que é um conflito e como você resolve?" testa se você entende o merge de 3 vias ou se só apaga `<<<<`. A resposta forte menciona a base comum, que resolver pode ser combinar, e — o diferencial de pleno — a inversão ours/theirs no rebase.

> **P:** "O que é um conflito de merge e como você resolve? E em rebase, muda algo?"
>
> **R (30s):** "Conflito é sobreposição na mesma região; o Git pausa e marca os dois lados com `<<<< ==== >>>>` (ours/HEAD vs theirs). Eu edito pra deixar o código correto — que pode misturar os dois —, apago os marcadores, `git add` pra marcar resolvido e `--continue`. Se me perco, `--abort` volta ao estado anterior. Em rebase, ours/theirs ficam invertidos, então reviso com atenção."

> **P:** "Por que o Git resolve a maioria dos merges sozinho e só te chama em alguns? E como você evita resolver errado?"
>
> **R (30s):** "Porque ele faz um merge de três vias: acha a base comum das duas pontas e, região por região, se só um lado mudou em relação à base, ele aceita sozinho; só chama quando os dois mudaram a mesma região. Pra não resolver errado eu ligo o estilo `diff3`/`zdiff3`, que mostra a base **junto** com os dois lados — aí eu não escolho entre A e B no escuro, eu vejo que a base era X, um fez +Y e o outro +Z, e decido pela intenção. E confirmo que não sobrou nenhum marcador com `git diff --check` antes do `add`. Resolver conflito sem ver a base é como debugar sem ler o log."

## Checkpoint

- [ ] Explico conflito como o merge de 3 vias que empatou, e o papel da **base comum**
- [ ] Sei que as 3 versões ficam nos estágios do index (1/2/3) e por que `git add` "resolve"
- [ ] Uso `diff3`/`zdiff3` e sei por que ver a base muda a qualidade da resolução
- [ ] Explico a **inversão** ours/theirs no rebase e por que ela causa bug
- [ ] Uso `git diff --check` antes de `add` e sei que `--abort` é sempre seguro
- [ ] Sei o que `rerere` faz e quando liga

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 3 "Git Branching", seção "Basic Merging": anatomia do conflito e a resolução básica
- **Pro Git** — cap. 7 "Git Tools", seção "Advanced Merging": merge de 3 vias, `diff3`, `checkout --ours/--theirs`, `mergetool` e `rerere` — a §BASE deste módulo
- **git-scm docs** — `git-merge(1)`, seção "HOW CONFLICTS ARE PRESENTED": os marcadores e o estilo `diff3`
- **git-scm docs** — `git-rerere(1)`: gravar e reusar resoluções
- Fundamento-irmão `00-fundamentos/06-git-fluxo-rebase-merge` — as três árvores e o modelo de objetos que sustentam os três estágios do conflito
- Módulos-irmãos `02-staging` (os três estágios do index) e `03-branches-merge-rebase` (o merge de 3 vias e a inversão no rebase)
