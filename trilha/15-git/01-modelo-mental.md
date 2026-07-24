# 01 — O Modelo Mental do Git

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — o banco de objetos endereçável por conteúdo, os bytes por baixo do que o `00-fundamentos/06` apresenta), §Estruturação (objetos soltos × packfiles, refs como entrada no grafo) e §Metodologia (as ferramentas de *plumbing* que abrem a caixa) — além da prática, P/R e checkpoint. O modelo blob/tree/commit e o **DAG de Merkle** já foram introduzidos no fundamento `00-fundamentos/06`; aqui **descemos um degrau**: os bytes exatos, o hash e a integridade — sem re-derivar o que aquele módulo já cobre.

## O que é

Git não guarda diffs — guarda **snapshots** num banco de objetos onde a **chave de cada objeto é o hash do próprio conteúdo**. O `00-fundamentos/06` já estabeleceu os quatro objetos (blob/tree/commit/tag) e por que o histórico é uma cadeia de Merkle. Este módulo responde à pergunta que aquele deixou em aberto: *como*, mecanicamente, um "conteúdo" vira uma chave — e por que essa única decisão de design (endereçar por conteúdo) é a fonte da integridade, da desduplicação e da velocidade do Git. Quem entende isso para de ter medo: "perder trabalho" no Git é quase sempre perder um *ponteiro*, não o objeto.

---

## § BASE — o fundamento

**Endereçável por conteúdo, ao pé da letra.** Um "banco endereçável por conteúdo" (*content-addressable store*) é um dicionário onde você não escolhe a chave — a chave **é** uma função do valor. No Git a função é o hash criptográfico. Para gravar um arquivo como blob, o Git não roda SHA sobre os bytes crus: ele monta primeiro um cabeçalho `blob <tamanho>\0` e concatena o conteúdo, e o **SHA é calculado sobre `cabeçalho + conteúdo`**. Por isso o hash de um arquivo vazio não é o hash da string vazia — é o hash de `"blob 0\0"`. Depois o objeto é comprimido com zlib e gravado em `.git/objects/aa/bbbb…` (os 2 primeiros hex viram diretório). É isso que `git hash-object` reproduz e `git cat-file` lê de volta.

**Três consequências que caem da definição, não de features:**

1. **Integridade / *tamper-evidence*.** Como a chave deriva do conteúdo, alterar um byte de um objeto muda o hash — o objeto adulterado deixa de ser encontrável pelo hash antigo, e `git fsck` detecta a inconsistência. Ninguém reescreve um commit antigo sem que o SHA dele **e o de todos os descendentes** mudem em cascata (a cadeia de Merkle do `00-fundamentos/06`). O histórico não é "protegido por senha"; é **verificável por construção**.
2. **Desduplicação global e automática.** Conteúdo idêntico → mesmo hash → **um objeto só**. Dez cópias do mesmo arquivo em dez commits são um blob. Renomear um arquivo de 1 GB sem mudar o conteúdo não cria blob novo. Não há política de dedup: é efeito colateral de a chave ser o conteúdo.
3. **Snapshot deixa de ser desperdício.** "Guardar o projeto inteiro a cada commit" só assusta quem imagina cópias físicas. Como arquivos inalterados compartilham o blob, um commit que muda 1 linha em 1 arquivo cria 1 blob novo, ~1 tree por diretório no caminho, e 1 commit — o resto é ponteiro reaproveitado.

**A linhagem da ideia.** O endereçamento por conteúdo não nasceu no Git. A árvore de hashes é de **Ralph Merkle** (*"A Digital Signature Based on a Conventional Encryption Function"*, CRYPTO 1987) — a estrutura em que o hash de um nó resume toda a subárvore abaixo dele. O **Monotone** (Graydon Hoare, ~2003) já era um VCS endereçável por conteúdo e influenciou diretamente o design do Git. O Git em si nasceu em **abril de 2005**, quando a licença de uso gratuito do BitKeeper foi revogada para o kernel Linux; Torvalds escreveu o núcleo em cerca de dez dias, com a integridade como obsessão de projeto — daí a escolha de conteúdo-como-chave em vez de números de revisão sequenciais (SVN/CVS).

**A pegadinha do SHA-1 (incerteza declarada).** O Git usou SHA-1 desde 2005. Em fevereiro de 2017, **Stevens, Bursztein, Karpman, Albertini e Markov** publicaram *"The first collision for full SHA-1"* (o ataque **SHAttered**): dois PDFs distintos com o mesmo SHA-1, em cerca de **2⁶³ operações** — ordens de magnitude abaixo do 2⁸⁰ de uma colisão por força bruta ideal. Por que o Git **não** desmoronou naquele dia? Porque o Git usa o hash para **nomear e verificar integridade**, não como assinatura de segurança; forjar um objeto malicioso exige uma colisão *e* que a vítima aceite o blob venenoso. Ainda assim, a resposta foi levada a sério: o Git adotou uma variante de **SHA-1 com detecção de colisão** (sha1dc, de Stevens & Shumow) e **especificou um formato de objeto em SHA-256**. A migração é real mas ainda amadurecendo em interoperabilidade — trate "Git é SHA-256 hoje" como **em transição**, não como fato consumado.

**Packfiles: onde o snapshot vira delta (e por que isso não contradiz nada).** No disco e na rede, objetos soltos são empacotados em *packfiles* com **compressão delta** — o Git guarda um objeto como "diferença contra outro parecido" para poupar espaço. Isso parece contradizer "snapshots, não diffs", mas não contradiz: o **modelo conceitual** é snapshot (todo commit aponta pra árvore inteira); o delta é **otimização de armazenamento**, invisível a quem usa `git log`/`checkout`. É a distinção entre *o que o Git é* (grafo de snapshots imutáveis) e *como ele guarda* (packs comprimidos). Confundir os dois é o erro clássico da entrevista.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
.git/objects/
  ├─ objetos SOLTOS (loose):  aa/bbbb…   ← 1 arquivo zlib por objeto (recém-criados)
  └─ pack/*.pack + *.idx:      objetos empacotados + delta (git gc / push / clone)

   refs (ponteiros)                      objetos (conteúdo)
   ─────────────────                     ──────────────────
   refs/heads/main ─┐
   refs/tags/v1.0  ─┼──▶  commit ──tree──▶ tree ──▶ blob   (endereçados por hash)
   HEAD ────────────┘        │ parent           └─▶ tree ─▶ blob
                             ▼
                          commit anterior … (cadeia de Merkle → 00-fundamentos/06)
```

Duas camadas que não se misturam:

- **Objetos** = o conteúdo imutável, endereçado por hash. Nunca mudam; só nascem e (eventualmente) são coletados pelo `gc` quando ninguém aponta pra eles.
- **Refs** = ponteiros *mutáveis* (nomes humanos) que apontam pra dentro do grafo de objetos. `main`, `v1.0`, `HEAD` são refs. Mover uma branch é reescrever ~41 bytes de uma ref — não toca em objeto nenhum.

Essa separação é a chave mental do módulo 03 (branch é ponteiro), 05 (desfazer = mover ponteiro) e do reflog (histórico dos ponteiros). Objeto é onde o trabalho *mora*; ref é só um post-it apontando pra ele.

---

## § METODOLOGIA — abrindo a caixa com *plumbing*

Os comandos de baixo nível ("plumbing") existem para inspecionar o banco de objetos direto. Roteiro replicável:

1. **Ver o tipo e o conteúdo de qualquer objeto:** `git cat-file -t <hash>` (tipo) e `git cat-file -p <hash>` (conteúdo formatado). `git cat-file -p HEAD` mostra a tree, o(s) parent(s), autor e mensagem — o commit *é* isso.
2. **Calcular o hash de um conteúdo sem gravar:** `git hash-object arquivo` (com `-w` grava no banco). Confirma que a chave é função do conteúdo.
3. **Descer a árvore:** `git cat-file -p HEAD^{tree}` lista `modo nome → hash`; siga o hash de um subdiretório e repita — você está andando no grafo à mão.
4. **Ver soltos × empacotados:** `git count-objects -v` (quantos loose, quanto em pack); `git gc` empacota; `git verify-pack -v .git/objects/pack/*.idx` mostra as cadeias de delta.
5. **Provar imutabilidade:** `git hash-object` do mesmo conteúdo duas vezes dá o mesmo hash; um byte a mais dá outro.

**Anti-padrões:**
- **"Git guarda diffs."** Não; guarda snapshots e *calcula* o diff comparando duas trees. O delta existe só no packfile (storage).
- **"Rebase/amend edita o commit."** Não edita nada — cria objeto **novo** (pai/conteúdo diferentes → hash diferente) e move a ref. O antigo vira órfão até o `gc`.
- **Temer trocar de branch "pra não perder trabalho".** Trabalho commitado é objeto no banco, alcançável pelo hash (e pelo reflog, módulo 05). Ponteiro não é dado.
- **Achar que SHA-1 quebrado = Git inseguro.** Integridade ≠ assinatura; e há mitigação (sha1dc) + transição SHA-256.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Num repo de teste (`git init /tmp/lab-objetos && cd /tmp/lab-objetos`):

1. Crie e comite um arquivo: `echo hello > a.txt && git add a.txt && git commit -m "feat: primeiro arquivo"`.
2. **Ache o blob à mão:** `git cat-file -p HEAD^{tree}` — anote o hash de `a.txt`. Rode `git cat-file -p <hash-do-blob>`: deve imprimir `hello`.
3. **Prove o cabeçalho:** `printf 'blob 6\0hello\n' | sha1sum` e compare com `git hash-object a.txt`. Devem bater — o Git hasheia `cabeçalho+conteúdo`, não só o conteúdo.
4. **Prove a desduplicação:** `cp a.txt b.txt && git add b.txt && git commit -m "chore: copia"`. Rode `git cat-file -p HEAD^{tree}` — `a.txt` e `b.txt` apontam pro **mesmo** hash de blob.
5. **Prove o snapshot:** `git cat-file -p HEAD | head -3` mostra `tree` e `parent`. O commit não tem diff dentro — só o hash da árvore inteira.
6. **Loose → pack:** `git count-objects -v` (veja `count:`), depois `git gc`, depois `git count-objects -v` de novo (agora `in-pack:`). Mesmo modelo, storage diferente.
7. **Escreva 1 parágrafo** em `~/projetos/estudos/rascunhos/git-objetos.md`: com suas palavras, por que "endereçável por conteúdo" implica integridade E desduplicação de uma vez só.

---

## Por que cai em entrevista

"Explica o Git pra mim" separa quem decorou `add/commit/push` de quem entende o modelo. A resposta forte começa pelo banco de objetos, não pela lista de comandos — e sustenta as perguntas-satélite (por que rebase muda SHA, por que branch é barato, por que quase nada se perde).

> **P:** "O que é o Git, em uma frase — e o que é uma branch nesse modelo?"
>
> **R (30s):** "Git é um grafo de snapshots imutáveis endereçados por conteúdo. Cada commit aponta para uma tree (o snapshot) e para seus pais; o nome de tudo é o SHA-1 do conteúdo, então nada muda sem mudar de identidade. Branch é só um ponteiro para um commit do grafo."

> **P:** "SHA-1 já foi quebrado (SHAttered, 2017). Isso torna o Git inseguro?"
>
> **R (30s):** "Não imediatamente, e a razão é o papel do hash: no Git ele **nomeia e verifica integridade**, não é uma assinatura de segurança. O SHAttered achou uma colisão em ~2⁶³ operações, mas explorar isso exigiria forjar uma colisão *e* fazer a vítima aceitar o objeto venenoso. Ainda assim a comunidade agiu: adotou SHA-1 com detecção de colisão (sha1dc) e especificou um formato de objeto em SHA-256, cuja transição está em andamento. Resumindo: integridade não é o mesmo que resistência a assinatura forjada, e havia mitigação — mas eu não afirmaria que 'o Git já é SHA-256 hoje', porque a migração ainda amadurece."

## Checkpoint

- [ ] Explico "endereçável por conteúdo" e sei que o hash cobre `cabeçalho+conteúdo` (não só os bytes)
- [ ] Derivo integridade E desduplicação da mesma definição, sem apelar a "features"
- [ ] Explico por que snapshot não é desperdício (blobs compartilhados) e por que packfile com delta não contradiz o modelo
- [ ] Sei o que foi o SHAttered (2017) e por que o Git não caiu naquele dia (integridade ≠ assinatura; sha1dc; transição SHA-256 como *em andamento*)
- [ ] Já usei `cat-file`/`hash-object` pra andar no grafo de objetos à mão
- [ ] Ligo o modelo de objetos ao `00-fundamentos/06` (Merkle DAG) sem re-derivá-lo

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed, git-scm.com/book) — cap. 10 "Git Internals", seções "Git Objects" e "Git References": a §BASE deste módulo mora aqui (o banco de objetos e as refs)
- **Pro Git** — cap. 10 "Git Internals", seção "Packfiles": a compressão delta como storage, não como modelo
- **Pro Git** — cap. 1 "Getting Started", seção "What is Git?": snapshots × diffs, a decisão de projeto
- **Merkle, R. C. (1987)** — *"A Digital Signature Based on a Conventional Encryption Function"*, CRYPTO '87: a árvore de hashes (a estrutura por trás do DAG do Git)
- **Stevens, M. et al. (2017)** — *"The first collision for full SHA-1"* (shattered.io): a colisão prática e o que ela significa (e não significa) para o Git
- Fundamento-irmão `00-fundamentos/06-git-fluxo-rebase-merge` — os quatro objetos, a cadeia de Merkle e as três árvores (base que este módulo aprofunda)
- `git-scm docs` — `git-cat-file`, `git-hash-object`, `git-count-objects` (as ferramentas de plumbing do passo-a-passo)
