# 02 — Os Três Estados: Working Directory, Index e Repositório

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — o **index** como estrutura de dados de verdade, não uma metáfora), §Estruturação (as três árvores e onde cada comando as move) e §Metodologia (staging cirúrgico com `add -p`) — além da prática, P/R e checkpoint. As "três árvores" já foram nomeadas no `00-fundamentos/06`; aqui **aprofundamos o meio**: o que o index *é* por dentro, por que ele existe e por que ele guarda **três versões** de um arquivo durante um conflito (o gancho pro módulo 04).

## O que é

Todo arquivo transita por três áreas — **working directory**, **staging area (index)** e **repositório** — e entender isso elimina 90% da confusão com `add`, `status` e `diff`. O `00-fundamentos/06` apresentou as três árvores como estados (`working → add → index → commit → HEAD`). O que quase ninguém sabe, e que este módulo abre, é que o index **não é uma ideia abstrata**: é um arquivo binário (`.git/index`) com formato documentado, e é justamente a existência dele que torna `git status` rápido e commits atômicos possíveis. Quem trata o index como "aquela coisa entre add e commit" nunca entende `reset`, conflito ou `add -p`. Quem entende o index entende os três.

---

## § BASE — o fundamento

**O index é uma estrutura de dados, não uma metáfora.** `.git/index` é um arquivo binário (formato descrito na doc técnica *gitformat-index*) que contém uma **lista ordenada de entradas**, uma por caminho rastreado. Cada entrada carrega: o caminho, o **hash do blob** daquela versão, o modo (permissões), e — o detalhe que quase todo tutorial omite — uma cópia dos metadados do `stat()` do arquivo no disco: tamanho, mtime, ctime, inode, dispositivo. O index é literalmente a **proposta do próximo commit**: a lista de "que blob de que arquivo vai entrar". `git write-tree` transforma o index numa tree; `git commit` empacota essa tree num commit. Ou seja: o commit não nasce do working directory — nasce do **index**.

**Por que o index existe (a área de montagem).** SVN e CVS não têm essa camada: `commit` pega o que está no disco e pronto. O Git inseriu um passo intermediário de propósito, e a razão é editorial: **você monta o próximo snapshot peça por peça, escolhendo o que entra.** Você pode ter mexido em cinco coisas no working directory e comitar só duas — porque o `add` copia *aquele estado, naquele instante* pro index. Editou depois do `add`? A edição nova fica no working, não no index, e o arquivo aparece nas **duas** listas ao mesmo tempo (staged com a versão antiga, modified com a nova). Isso não é bug; é a área de montagem funcionando. É o que viabiliza a regra de ouro do commit atômico — **uma responsabilidade por commit** — mesmo quando você programou de forma bagunçada.

**Por que `git status` é rápido — o stat cache.** Comparar working directory com o index poderia significar reler e re-hashear todos os arquivos do projeto a cada `status`. Não significa, graças ao `stat()` guardado em cada entrada: o Git compara **mtime/tamanho/inode** do arquivo no disco com o que o index memorizou; se batem, ele assume "não mudou" e **nem abre o arquivo**. Só quando o stat difere é que ele lê e re-hasheia pra confirmar. É por isso que `git status` num repo de milhares de arquivos volta em milissegundos — o index é um **cache de estado**, não só uma lista de intenção. (Em repos gigantes existem extensões como *untracked cache* e *fsmonitor* que estendem essa ideia; o princípio é o mesmo.)

**O detalhe que liga tudo ao módulo 04: o index guarda TRÊS versões durante um conflito.** Fora de conflito, cada caminho tem **uma** entrada no index, no "stage 0". Durante um merge conflitado, o Git registra o mesmo caminho em **três estágios**:

- **stage 1** = versão do **ancestral comum** (a base do merge);
- **stage 2** = versão **ours** (o seu lado, `HEAD`);
- **stage 3** = versão **theirs** (o lado que você traz, `MERGE_HEAD`).

`git ls-files -u` mostra exatamente essas três entradas. É por isso que o Git consegue te oferecer `--ours`/`--theirs` e uma resolução de 3 vias: as três versões **estão no index**, esperando você reduzir tudo de volta a um stage 0. Quando você resolve e dá `git add` no arquivo, você está **colapsando os três estágios num só** — e é por isso que o `add`, num conflito, significa literalmente "marquei como resolvido" (módulo 04). Sem entender que o index guarda três versões, a resolução de conflito vira mágica.

**`.git` é o repositório inteiro — não existe servidor obrigatório.** `git init` cria a pasta `.git/` e ali dentro fica **tudo**: objetos, o index, as refs (branches/tags), a config. Apagou `.git/`, virou pasta comum. "Remoto" (GitHub) é só **outra cópia** do mesmo banco de objetos com quem você sincroniza (módulo 07) — Git é distribuído, cada clone é um repositório completo com a história inteira. O index, note, é **local e por-repositório**: ele nunca é sincronizado; é a sua bancada de trabalho particular.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
 working directory  ──git add──▶  index (.git/index)   ──git commit──▶  repositório (.git/objects)
   (seus arquivos)                 blob+modo+stat-cache               (snapshots imutáveis)
        ▲                          [stage 0 normal;                          │
        └───── git checkout /       stages 1/2/3 em conflito] ── HEAD ────────┘
               restore  ◀───────────────────────────────────────────────────┘
```

`git status` é, em uma frase, o **diff entre essas três árvores**:

| Comando | Compara | Responde |
|---|---|---|
| `git status` | as três áreas | visão geral (staged / not staged / untracked) |
| `git diff` | working **vs** index | "o que eu ainda NÃO dei `add`" |
| `git diff --staged` (=`--cached`) | index **vs** HEAD | "o que VAI no próximo commit" |
| `git diff HEAD` | working **vs** HEAD | "tudo que mudou desde o último commit" |

Regra mental: `git diff` sozinho = *o que falta adicionar*; `git diff --staged` = *o que já está pronto pra commitar*. Essa mesma tabela de três árvores é o que faz `reset --soft/--mixed/--hard` deixar de ser decoreba no módulo 05 — cada `reset` mexe em quantas das três árvores.

---

## § METODOLOGIA — staging cirúrgico

O index existe pra você **editar o próximo commit**. Roteiro:

1. **Veja a fronteira antes de mexer:** `git status -s` (formato `XY nome`, `X`=index, `Y`=working) mostra de relance o que está de cada lado.
2. **Adicione por pedaço, não o arquivo todo:** `git add -p arquivo` entra no modo interativo e te oferece cada *hunk* — `y` (inclui), `n` (pula), `s` (divide o hunk em menores), `e` (edita o hunk à mão). É assim que você separa "duas mudanças no mesmo arquivo" em dois commits.
3. **Reveja o que está staged antes de comitar:** `git diff --staged` — leia o commit *antes* de escrevê-lo. É a última chance barata de tirar um `console.log` ou um segredo.
4. **Tire do stage sem perder a edição:** `git restore --staged arquivo` desfaz o `add` (volta a entrada do index pra versão de HEAD) mantendo sua edição no working.
5. **Comite:** `git commit` grava o index como tree e a embrulha num commit.

**Anti-padrões:**
- **`git add . && git commit -m "wip"` no automático** — descarta o único benefício do index (a curadoria) e produz commits que misturam N responsabilidades, impossíveis de reverter em parte ou revisar (módulo 07).
- **Comitar sem `git diff --staged`** — você comita o que *acha* que staged, não o que staged; entra o segredo, o arquivo de teste, o `.env`.
- **Confundir `git diff` com `git diff --staged`** — são áreas diferentes; ver "nada" no primeiro não quer dizer que o commit está vazio (pode estar tudo staged).
- **"Resolver conflito" editando fora do entendimento dos 3 stages** — sem saber que o index guarda base/ours/theirs, você aceita um lado inteiro sem perceber que perdeu a mudança do outro (módulo 04).

---

## Passo-a-passo aplicado (faça agora, ~25min)

Num repo de teste:

1. **Veja o arquivo em dois lados ao mesmo tempo:** edite um arquivo, `git add`, edite **de novo**, `git status -s`. Ele aparece com `M` no index *e* no working — prove pra si mesmo que `add` tirou um retrato do instante.
2. **Inspecione o index cru:** `git ls-files -s` mostra `modo hash stage caminho` — o hash é o do blob que vai no commit. Compare com `git cat-file -p <hash>`.
3. **Prove o stat cache:** rode `git status` (rápido); depois `touch arquivo` sem mudar conteúdo e `git status` de novo — o Git detecta o stat diferente, re-hasheia e conclui "sem mudança real". Você forçou o caminho lento.
4. **Staging seletivo:** faça duas mudanças distintas num mesmo arquivo, `git add -p`, aceite só um hunk (`y`/`n`), `git diff --staged` pra confirmar que só um entrou, comite. Você acabou de fazer um commit atômico de código bagunçado.
5. **Veja os três stages de um conflito (prévia do módulo 04):** num repo com duas branches que mudam a mesma linha, `git merge` a outra, e no meio do conflito rode `git ls-files -u` — anote os três estágios (1=base, 2=ours, 3=theirs). `git merge --abort` pra sair limpo.
6. **Escreva 1 parágrafo** em `~/projetos/estudos/rascunhos/git-index.md`: por que a existência do index é o que torna "commit atômico" possível mesmo quando você programou de forma desorganizada.

---

## Por que cai em entrevista

Perguntas sobre staging medem se você entende o *fluxo* de dados do Git, não se decorou comandos. A resposta forte nomeia as três áreas e o que cada comando move entre elas — e a pergunta-satélite quase sempre puxa pro conflito (por que `add` "resolve") ou pra performance (por que `status` é rápido).

> **P:** "Explica as três áreas do Git e o que `add`, `commit` e os `diff` fazem entre elas."
>
> **R (30s):** "São três áreas: working directory (disco), staging/index (monta o próximo commit) e o repositório (.git, snapshots gravados). `git add` move do working pro index; `git commit` grava o index como snapshot. `git diff` compara working com index; `git diff --staged` compara index com o último commit."

> **P:** "Durante um conflito de merge, o que o `git add` no arquivo conflitado significa? Por que ele 'resolve'?"
>
> **R (30s):** "Porque o index, durante o conflito, guarda **três versões** do arquivo em estágios separados: stage 1 é a base comum, stage 2 é o meu lado (ours), stage 3 é o lado que trago (theirs) — dá pra ver com `git ls-files -u`. Enquanto existirem os três estágios, o caminho está 'unmerged'. Quando eu edito pro código correto e dou `git add`, colapso os três num único stage 0 — ou seja, `add` não está adicionando conteúdo novo, está sinalizando ao Git que aquele conflito virou uma versão só, resolvida. Por isso o passo seguinte é `--continue`, e não um novo commit manual."

## Checkpoint

- [ ] Nomeio as três áreas e digo qual comando move entre quais (`add` working→index, `commit` index→HEAD)
- [ ] Sei que o index é um arquivo binário com blob+modo+**stat cache**, e explico por que isso torna `status` rápido
- [ ] Explico por que o index existe (curadoria do próximo commit → commit atômico)
- [ ] Sei que o index guarda **3 versões** num conflito (base/ours/theirs) e liguei isso a por que `add` "resolve"
- [ ] Uso `git diff` vs `git diff --staged` sabendo que comparam áreas diferentes
- [ ] Já fiz um commit atômico com `git add -p` a partir de código bagunçado

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 2 "Git Basics", seção "Recording Changes to the Repository": working tree / staging area / HEAD e o ciclo `add`→`commit`
- **Pro Git** — cap. 7 "Git Tools", seção "Reset Demystified": as três árvores tratadas como estados (a base do módulo 05)
- **Pro Git** — cap. 2, seção "Interactive Staging" (`git add -p`): o staging cirúrgico
- **git-scm technical docs** — *gitformat-index*: o formato binário do index (entradas, stat cache, estágios de conflito) — a §BASE deste módulo
- **git-scm docs** — `git-ls-files` (as flags `-s` e `-u` que expõem o index e os três estágios)
- Fundamento-irmão `00-fundamentos/06-git-fluxo-rebase-merge` — as três árvores no contexto do modelo de objetos
- Módulo-irmão `04-conflitos` — onde os três estágios do index viram resolução de 3 vias
