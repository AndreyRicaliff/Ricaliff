# 06 — Ferramentas Cirúrgicas

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento — `stash` e `cherry-pick` como objetos do banco, e **`bisect` como busca binária O(log n)** / delta debugging), §Estruturação (quando cada ferramenta) e §Metodologia (o protocolo de caça ao commit culpado) — além da prática, P/R e checkpoint. O `bisect` já apareceu no `00-fundamentos/06`; aqui **aprofundamos a teoria por trás** (por que é O(log n), o elo com o delta debugging de Zeller e com o método de refutação do `05-raciocinio`) e abrimos o que `stash`/`cherry-pick`/`tag` realmente são no banco de objetos.

## O que é

Quatro comandos que resolvem problemas pontuais com precisão cirúrgica: guardar trabalho sem commitar (`stash`), transplantar um commit específico (`cherry-pick`), **caçar em qual commit um bug nasceu** por busca binária (`bisect`) e marcar versões (`tag`). O elo que este módulo cria — e que o `00-fundamentos/06` só tangenciou — é que nenhum deles é mágica: `stash` são commits escondidos, `cherry-pick` é reaplicação de patch (o mesmo mecanismo do rebase, módulo 03), `tag` é um objeto no banco (módulo 01), e `bisect` é **método científico empacotado** — a busca binária da causa, prima direta do que o `05-raciocinio/02` chama de refutação que corta o espaço pela metade. Entender a teoria transforma "sei o comando" em "sei quando e por que".

---

## § BASE — o fundamento

**`stash` são commits disfarçados.** `git stash` parece "guardar num limbo", mas por baixo ele **cria objetos commit** de verdade: um commit com o estado do working directory e (normalmente) outro com o do index, pendurados numa ref especial (`refs/stash`) que funciona como pilha. Por isso um stash sobrevive a `checkout`, aparece no `git log --graph refs/stash`, e pode ser recuperado mesmo depois de um `stash drop` (via reflog do stash, enquanto não coletado). Consequência prática: reaplicar um stash pode **conflitar** exatamente como um merge (módulo 04) — porque é uma fusão de trabalho. `pop` aplica e remove da pilha; `apply` aplica e **mantém** (use quando quer o mesmo stash em vários branches). `stash -u` inclui untracked.

**`cherry-pick` é reaplicação de patch — o mesmo motor do rebase.** `git cherry-pick <sha>` pega **um** commit de qualquer lugar e cria uma **cópia** dele no branch atual, com **hash novo** (módulo 01: pai diferente → hash diferente). Mecanicamente é idêntico ao rebase: computa o diff do commit contra o pai dele e **reaplica** esse diff aqui. Por isso pode conflitar, tem `--continue`/`--abort`, e por isso `A..B` pega um intervalo. É a ferramenta de "esse fix foi commitado na branch errada" ou "quero só *este* commit da feature na main, sem o resto". Cuidado: cherry-pick indiscriminado **duplica** commits (o mesmo diff com dois SHAs em branches diferentes), o que confunde merges futuros — use com intenção, não como hábito.

**`bisect` é busca binária — O(log n), não O(n).** O cenário: "funcionava há 200 commits, hoje está quebrado, não sei qual commit causou". A abordagem ingênua testa commit por commit: **O(n)** — 200 testes no pior caso. O `bisect` explora que o histórico é **monotônico** quanto ao bug (uma vez introduzido, permanece): existe um ponto de virada entre um `good` conhecido e um `bad` conhecido. Isso é a precondição da **busca binária** — e o Git faz exatamente isso: dá checkout no commit do **meio** do intervalo, você testa e responde `good`/`bad`, e **cada resposta descarta metade** do que resta. O número de testes é **⌈log₂(n)⌉**: 200 commits → ~8 testes; 1000 → ~10; um milhão → ~20. É a mesma economia da busca binária num array ordenado, aplicada ao DAG.

**A teoria por trás: delta debugging e refutação.** O `bisect` é a versão empacotada do **delta debugging** de **Andreas Zeller** (*Why Programs Fail*): dado um intervalo entre um estado bom e um ruim, bissecte sistematicamente até isolar a **mudança mínima** que causa a falha. E é o mesmo princípio do `05-raciocinio/02` (hipótese e refutação): cada teste `good`/`bad` é uma pergunta de sim/não que **refuta metade das hipóteses** ("o bug está na metade de cima" vs "na de baixo") — refutação corta o espaço de busca pela metade, e é por isso que informa tanto. Precondição que quase todo mundo erra: os limites `good`/`bad` iniciais **têm que estar corretos** — se você marca como `good` um commit que já tinha o bug, o `bisect` conclui o commit errado com toda a confiança. Garbage in, garbage out também vale pra busca binária.

**`tag` é um ponteiro fixo — e, se anotada, um objeto de verdade.** Tag marca um commit e **não anda** (ao contrário da branch, que avança ao comitar). Dois tipos: *lightweight* é só um apelido (uma ref) pra um commit; **anotada** (`-a`) é um **objeto tag** no banco (módulo 01: o quarto tipo de objeto), com autor, data, mensagem e assinável por GPG. Pra release use anotada — é auditável, tem proveniência. Tags **não** vão no `push` normal: `git push origin v1.0.0` (uma) ou `--tags` (todas).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
 problema                         ferramenta        o que é por baixo
 ────────                         ──────────        ─────────────────
 "preciso trocar de branch já,    git stash         commits numa pilha (refs/stash)
  sem commitar o meio-caminho"
 "esse commit foi no branch       git cherry-pick   reaplicação de patch (motor do rebase),
  errado / quero só este"                            hash novo
 "funcionava, quebrou, qual       git bisect        BUSCA BINÁRIA O(log n) do commit culpado
  commit?"                                           (delta debugging / refutação)
 "marcar a versão 1.0.0"          git tag -a        objeto tag no banco (auditável)
```

| Ferramenta | Reaplica trabalho? | Pode conflitar? | Muda SHA? |
|---|---|---|---|
| `stash pop`/`apply` | sim (fusão) | sim | — |
| `cherry-pick` | sim (patch) | sim | **sim** (cópia nova) |
| `bisect` | não (só faz checkout) | não | não |
| `tag` | não | não | não |

`bisect` é o único de "diagnóstico" (não altera história, só navega); os outros movem trabalho.

---

## § METODOLOGIA — caçar o commit culpado com `bisect`

1. **`git bisect start`.**
2. **Marque as pontas — com honestidade:** `git bisect bad` (o commit atual tem o bug) e `git bisect good <sha-ou-tag>` (um commit que você *sabe* que era bom — teste antes se não tiver certeza; ponta errada = resultado errado).
3. **O Git dá checkout no meio.** Teste o app naquele estado e classifique: `git bisect good` ou `git bisect bad`.
4. **Repita ~log₂(n) vezes** até o Git anunciar `<sha> is the first bad commit`.
5. **`git bisect reset`** volta ao branch original.
6. **Automatize se houver teste:** `git bisect run npm test` — o script retorna 0 (good) ou ≠0 (bad) e o Git bissecta sozinho, sem você no loop. É o delta debugging automatizado.

**Protocolo de `stash`:** `git stash` (guarda tracked) / `-u` (inclui untracked) → troca de contexto → `git stash pop` (reaplica e remove) ou `apply` (mantém). `git stash list` mostra a pilha; conflito ao reaplicar → resolve como no módulo 04.

**Anti-padrões:**
- **`bisect` com ponta `good` errada** — conclui o commit errado com confiança total; valide o `good` inicial.
- **`cherry-pick` como hábito** — duplica commits (mesmo diff, SHAs diferentes) e confunde merges futuros; prefira mergear/rebasear a branch quando quer *tudo*.
- **Testar bug por bug em vez de `bisect`** — O(n) quando O(log n) estava disponível; 200 commits testados à mão é desperdício puro.
- **Tag lightweight pra release** — sem autor/data/mensagem, não é auditável; use `-a`.
- **Esquecer que tag não vai no `push` normal** — o release "sumiu" do remoto porque faltou `--tags`.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Reproduza o *git-timetravel* do syllabus:

1. **Plante o bug:** um script que cria um repo com ~12 commits e insere um "bug" (uma linha quebrada) em **um** commit do meio.
2. **Cace com `bisect`:** `git bisect start`, `bad` no HEAD, `good` no primeiro commit. Classifique cada checkout do meio e confirme que o Git isola o commit exato em **~log₂(12) ≈ 4** passos.
3. **Prove a precondição:** repita marcando de propósito um `good` **depois** do bug — observe o `bisect` apontar o commit **errado**. Escreva no `BISECT.md` por que os limites iniciais precisam estar corretos pro resultado valer.
4. **Automatize:** escreva um teste que falha só na presença do bug e rode `git bisect run <seu-teste>` — o Git resolve sozinho.
5. **`stash`:** no meio de uma edição, `git stash`, troque de branch, volte, `git stash pop`. Depois provoque um conflito no `pop` e resolva.
6. **`cherry-pick`:** comite um fix numa branch "errada", `cherry-pick` o SHA pra outra, e compare: mesmo diff, **SHAs diferentes** (prova de que é reaplicação, módulo 01).

---

## Por que cai em entrevista

"Como você acha em qual commit um bug entrou?" é quase certa, e `bisect` é a resposta que impressiona — desde que você saiba *por que* é O(log n). As satélites: "como guarda trabalho sem commitar?" (`stash`), "como leva um commit pra outro branch?" (`cherry-pick`).

> **P:** "Pra que servem `stash`, `cherry-pick`, `bisect` e `tag`?"
>
> **R (30s):** "`stash` guarda o working dir numa pilha pra eu trocar de contexto sem commitar. `cherry-pick` copia um commit específico pra cá. `bisect` acha o commit que introduziu um bug por busca binária — log₂(n) testes em vez de n, e dá pra automatizar com `bisect run`. `tag` marca uma versão fixa; pra release uso tag anotada e empurro com `push --tags`."

> **P:** "Por que `git bisect` é tão mais rápido que testar commit por commit, e o que pode fazer ele errar?"
>
> **R (30s):** "Porque ele faz busca binária em vez de linear. O bug, uma vez introduzido, permanece — então o histórico é monotônico entre um `good` e um `bad`, e a cada teste eu descubro em qual metade ele está e descarto a outra. Isso é O(log n): 1000 commits saem em ~10 testes em vez de 1000. É o delta debugging do Zeller, e é o mesmo princípio de refutação que corta o espaço de busca pela metade a cada pergunta sim/não. O que faz errar é a precondição: se eu marco como `good` um commit que já tinha o bug, a busca binária conclui o commit errado com toda a confiança — os limites iniciais têm que estar corretos, senão é lixo entra, lixo sai. E se tenho um teste automatizado, `git bisect run` roda tudo sozinho."

## Checkpoint

- [ ] Sei que `stash` são commits numa pilha (`refs/stash`) e por que o `pop` pode conflitar
- [ ] Explico `cherry-pick` como reaplicação de patch (mesmo motor do rebase) e por que gera SHA novo
- [ ] Explico por que `bisect` é O(log n) e liguei ao delta debugging (Zeller) e à refutação (`05-raciocinio`)
- [ ] Sei a precondição do `bisect` (limites `good`/`bad` corretos) e o que acontece se errar
- [ ] Uso `git bisect run` com teste automatizado
- [ ] Diferencio tag anotada (objeto auditável) de lightweight, e lembro do `push --tags`

## Recursos

- **Pro Git** (Chacon & Straub, 2ª ed) — cap. 7 "Git Tools", seção "Debugging with Git" (Binary Search / `bisect`): a §BASE deste módulo
- **Pro Git** — cap. 7, seções "Stashing and Cleaning" e "Rewriting History" (`cherry-pick`)
- **Pro Git** — cap. 2 "Git Basics", seção "Tagging": anotada × lightweight e `push --tags`
- **Zeller, A.** — *Why Programs Fail: A Guide to Systematic Debugging*: delta debugging, a teoria por trás do `bisect`
- **git-scm docs** — `git-bisect(1)` (incluindo `bisect run`) e `git-stash(1)`
- Módulos-irmãos `01-modelo-mental` (por que cherry-pick/tag são objetos) e `05-raciocinio/02-hipotese-e-refutacao` (refutação como busca binária da causa)
