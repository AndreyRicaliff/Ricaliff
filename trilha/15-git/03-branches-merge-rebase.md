# 03 — Branches, Merge e Rebase

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — branch como ref de 41 bytes, o **merge de 3 vias** e a base de merge, por que rebase reescreve SHA), §Estruturação (a tabela merge×rebase e a controvérsia declarada) e §Metodologia (o fluxo local rebase / integração merge) — além da prática, P/R e checkpoint. Que branch é ponteiro e que rebase muda SHA já foi visto no `00-fundamentos/06`; aqui **aprofundamos o algoritmo** (como o merge decide, o que é a base de merge) e tratamos merge-vs-rebase como o **debate real** que é, não como regra fechada.

## O que é

Um **branch é só um ponteiro** para um commit — literalmente um arquivo de ~41 bytes em `.git/refs/heads/` contendo um SHA (módulo 01: ref é entrada no grafo de objetos). Criar branch é instantâneo porque não copia nada. **Merge** e **rebase** são duas respostas à mesma pergunta — "como junto duas linhas de trabalho que divergiram?" — e a escolha entre elas não é técnica só: é sobre **que história você quer contar**. Este módulo abre o algoritmo por baixo (por que um merge às vezes é automático e às vezes conflita, o que é a "base") e encara o debate merge×rebase com honestidade, porque a resposta "depende" é a resposta certa — e saber *de que* depende é o que separa júnior de pleno.

---

## § BASE — o fundamento

**Branch e HEAD, mecanicamente.** `.git/refs/heads/main` é um texto com um SHA. `HEAD` é outro ponteiro — normalmente **simbólico**: `.git/HEAD` contém `ref: refs/heads/main`, ou seja, "estou na branch main, que aponta pro commit X". Comitar faz duas coisas: cria o objeto commit (pai = commit atual) e **reescreve a ref da branch atual** pro novo SHA. É por isso que a branch "anda sozinha" quando você comita — o `commit` move o ponteiro pra onde `HEAD` aponta. Quando `HEAD` aponta **direto** pra um commit (não via branch), você está em **detached HEAD**: pode olhar e comitar, mas sem uma branch apontando pros novos commits, eles ficam órfãos ao você sair (recuperáveis pelo reflog, módulo 05).

**Fast-forward: quando não há o que decidir.** Se você ramificou `feature` de `main` e `main` **não andou**, integrar é trivial: `main` só precisa "alcançar" `feature`. O Git faz **fast-forward** — avança o ponteiro de `main` pro commit de `feature`. Nenhum commit novo, história linear, porque **não houve divergência**: uma linha é ancestral da outra.

**Merge de 3 vias: quando os dois lados andaram.** Se `main` também avançou (as histórias divergiram), o Git não pode fast-forward. Ele faz um **merge de três vias**, e o "três" é o segredo que quase ninguém aprende: o Git acha o **ancestral comum mais recente** das duas pontas — a **base de merge** (*merge base*), que é o *lowest common ancestor* no DAG — e compara **três** versões de cada arquivo: a base, o seu lado (ours), o outro lado (theirs). A regra é: *se só um lado mudou em relação à base, aceita a mudança automaticamente; se os dois mudaram a mesma região de forma diferente, é conflito* (módulo 04). Por isso a maioria dos merges é automática — mudanças em arquivos ou regiões distintas não competem. O resultado é um **merge commit** com **dois pais**, que registra "aqui dois ramos voltaram a ser um". `git merge --no-ff` força esse commit mesmo quando fast-forward seria possível — útil pra marcar no histórico "aqui entrou a feature X".

**Rebase: reaplica, logo reescreve.** Rebase resolve a divergência de outro jeito: em vez de um merge commit, ele pega seus commits e os **reaplica**, um a um, sobre a nova base. Reaplicar = criar commits **novos**: o pai mudou (a base é outra) → o hash muda (módulo 01: hash cobre pai+conteúdo) → é outro objeto, mesmo com diff e mensagem idênticos. `C─D` viram `C'─D'`; os originais ficam órfãos. O resultado é uma história **linear**, como se você tivesse partido da base atualizada desde o início — mais fácil de ler no `git log`. O custo é exatamente a reescrita: **você trocou os SHAs**.

**A regra de ouro (e por que ela existe).** *Nunca faça rebase de commits que outras pessoas já têm.* A razão sai direto do modelo de objetos: se um colega baseou trabalho nos SHAs antigos e você os reescreve, existem agora **duas histórias divergentes** com os "mesmos" commits sob identidades diferentes — e reconciliar isso força `push --force` e um retrabalho feio. A doc do `git-rebase(1)` dedica uma seção inteira a isso ("RECOVERING FROM UPSTREAM REBASE") justamente porque é o erro que mais dói. Rebase é pra **limpar seu branch local** antes do PR; merge é pra **integrar** no que é compartilhado.

**A controvérsia declarada — merge × rebase não tem vencedor universal.** O próprio *Pro Git* (cap. 3, seção "Rebasing", subseção *"Rebase vs. Merge"*) apresenta os **dois campos** sem coroar um: um lado sustenta que o histórico é um **registro do que de fato aconteceu** — merges e tudo — e reescrevê-lo com rebase é falsificar o diário; o outro sustenta que o histórico é uma **história que você conta pro próximo leitor**, e deve ser editado pra ficar limpo e linear. Não é bug vs. correto; é **filosofia de time**. A posição prática defensável (e a do padrão AG, módulo 07): rebase no **seu** trabalho local ainda não publicado, merge pra integrar o que já é de todos. Se alguém te vender "rebase sempre" ou "merge sempre" como verdade absoluta, é sinal de que não leu os dois lados.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
fast-forward (base não andou):        merge de 3 vias (ambos andaram):        rebase:
 A─B (main)                            A─B───────E (main)                     A─B─E (main)
      \                                    \         \                             \
       C─D (feature)   →  main avança        C─D────→ M (2 pais: E,D)               C'─D' (feature)
       main = D                            base de merge = B                  história linear, SHAs novos
```

| | Merge | Rebase |
|---|---|---|
| Histórico | não-linear, **preserva o que aconteceu** | linear, **conta uma história limpa** |
| SHAs | originais intactos | **reescritos** (commits novos) |
| Commit extra | sim (merge commit, salvo fast-forward) | não |
| Seguro em branch compartilhada | **sim** | **não** — reescreve história que outros têm |
| Quando usar | integrar feature na main (via PR) | atualizar seu branch local com a main antes do PR |
| Base do debate | "história = registro fiel" | "história = narrativa legível" |

A escolha depende de **quem já tem os commits** (regra de ouro) e de **que história o time valoriza** (a controvérsia). Merge base = ancestral comum; é o que o merge de 3 vias usa como referência e o que `git merge-base main feature` te mostra.

---

## § METODOLOGIA — o fluxo replicável

1. **Crie e entre no branch:** `git switch -c feat/x` (forma moderna; `checkout -b` é o antigo). Prefira `switch` — é menos ambíguo que `checkout`, que faz coisas demais.
2. **Trabalhe e comite atômico** no seu branch (módulo 02: `add -p`).
3. **Antes do PR, atualize com rebase:** `git switch feat/x && git rebase main` — traz seu trabalho pra cima da main atual, história linear, sem "Merge branch 'main'" poluindo o PR. Como esses commits ainda são **seus e locais**, a regra de ouro permite.
4. **Resolva conflitos de rebase com cuidado** — durante rebase, *ours/theirs invertem* (módulo 04).
5. **Integre via merge (pelo PR):** na main, o merge preserva quando a feature entrou e passa pela revisão. Não rebase a main.
6. **Nunca `push --force` em branch compartilhada / main** — é reescrever história pública.

**Anti-padrões:**
- **Rebase de commits já pushados que outros têm** — cria divergência; o erro que a doc do `git-rebase` inteira alerta.
- **`merge` da main dentro da feature toda hora** — enche o branch de merge commits de sync; pra *atualizar* seu branch local, rebase é mais limpo (integrar é outra coisa).
- **Trabalhar direto na main** — sem branch, não há PR nem revisão (módulo 07).
- **Achar que fast-forward "é um merge de verdade"** — fast-forward só move o ponteiro; use `--no-ff` quando quiser o registro explícito da feature.
- **Sair de detached HEAD sem criar branch** — os commits ficam órfãos (recuperáveis, mas por que passar o susto).

---

## Passo-a-passo aplicado (faça agora, ~30min)

Num repo de teste, reproduza os três cenários e **desenhe cada DAG** com `git log --oneline --graph --all`:

1. **Fast-forward:** ramifique `feat`, comite 2×, volte pra `main` (que não andou), `git merge feat`. Note "Fast-forward" e a linha reta.
2. **Merge de 3 vias:** repita, mas antes comite 1× na `main` também. Agora `git merge feat` cria um **merge commit** — veja os dois pais em `git log --graph`. Rode `git merge-base main feat` e confirme que é o commit de onde os dois divergiram.
3. **Rebase:** no mesmo cenário divergente, numa cópia limpa, `git switch feat && git rebase main`. Compare os SHAs de antes e depois (`git reflog` mostra os originais) — prove que `C─D` viraram `C'─D'`.
4. **Mesma árvore, histórias diferentes:** confirme que o *conteúdo final* do merge e do rebase é igual (`git diff` entre as duas pontas dá vazio) mas o **DAG é diferente**. Esse é o cerne da controvérsia.
5. **Argumente os dois lados:** escreva em `~/projetos/estudos/rascunhos/merge-vs-rebase.md` um parágrafo defendendo merge e outro defendendo rebase — sem dizer qual é "certo". Se você só consegue defender um, ainda não entendeu o debate.

---

## Por que cai em entrevista

"Merge ou rebase?" é pergunta-armadilha: quem responde com uma regra absoluta ("rebase sempre") mostra que decorou um lado; quem explica o trade-off e a regra de ouro mostra que entende o modelo. Variações: "por que rebase muda os SHAs?", "o que é fast-forward?", "quando você NÃO faria rebase?".

> **P:** "Qual a diferença entre merge e rebase, e o que é uma branch nesse meio?"
>
> **R (30s):** "Branch é um ponteiro pra um commit; HEAD aponta pra onde estou. Merge junta dois ramos preservando ambos — fast-forward se a base não andou, senão um merge commit de dois pais. Rebase reaplica meus commits em cima de outra base, gerando hashes novos e história linear — por isso só rebaseio commits locais que ninguém mais tem."

> **P:** "Então rebase é melhor porque a história fica mais limpa?"
>
> **R (30s):** "Não trataria como 'melhor' — é um trade-off que o próprio Pro Git apresenta como debate. Um lado diz que o histórico deve ser o registro fiel do que aconteceu, merges e tudo, e rebase falsifica isso; o outro diz que o histórico é uma narrativa pro próximo leitor e deve ser editado pra ficar linear. Minha regra prática resolve na maioria dos casos: rebase só no meu trabalho local ainda não publicado, pra atualizar com a main antes do PR; e merge pra integrar na main, que é compartilhada. A linha que eu nunca cruzo é rebasear commit que outra pessoa já tem — aí eu criaria uma história divergente da dela e forçaria um `push --force`."

## Checkpoint

- [ ] Explico branch e HEAD como ponteiros e o que `commit` faz com a ref da branch
- [ ] Diferencio fast-forward de merge de 3 vias, e sei o que é a **base de merge** (ancestral comum)
- [ ] Explico por que rebase reescreve SHA a partir do modelo de objetos (pai muda → hash muda)
- [ ] Enuncio a regra de ouro do rebase **e** por que ela existe (histórias divergentes)
- [ ] Consigo defender **os dois lados** do debate merge×rebase sem chamar um de "certo"
- [ ] Já reproduzi merge e rebase e provei "mesma árvore, DAG diferente"

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 3 "Git Branching", seções "Basic Branching and Merging" e "Rebasing" (incluindo *"The Perils of Rebasing"* e *"Rebase vs. Merge"*): o coração deste módulo, com o debate declarado
- **Pro Git** — cap. 3, seção "Branches in a Nutshell": branch e HEAD como ponteiros, com os diagramas do DAG
- **git-scm docs** — `git-rebase(1)`, seções "NOTES" e "RECOVERING FROM UPSTREAM REBASE": por que não rebasear história publicada (ouro)
- **git-scm docs** — `git-merge-base(1)`: a base de merge (lowest common ancestor) que o merge de 3 vias usa
- Fundamento-irmão `00-fundamentos/06-git-fluxo-rebase-merge` — a tabela merge×rebase no contexto do fluxo geral
- Módulos-irmãos `04-conflitos` (o que fazer quando o merge de 3 vias trava) e `07-fluxo-profissional` (o debate escala pra git-flow × trunk-based)
