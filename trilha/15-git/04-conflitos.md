# 04 — Resolver Conflitos

## O que é
Conflito acontece quando duas linhas de desenvolvimento mudam **a mesma região do mesmo arquivo** de formas incompatíveis, e o Git não tem como decidir sozinho qual versão vale. Importante: o Git resolve a **maioria** das junções automaticamente (mudanças em arquivos ou regiões diferentes). Conflito só aparece na sobreposição real. Acontece em `merge`, `rebase`, `cherry-pick`, `stash pop` e `revert` — qualquer operação que combina trabalho.

Quando trava, o Git **pausa** a operação, marca os arquivos conflitados e edita o arquivo inserindo os dois lados, separados por marcadores:

```text
<<<<<<< HEAD
preço = valor * 1.10   (versão do seu lado atual — ours)
=======
preço = valor * 1.15   (versão do outro lado — theirs)
>>>>>>> feature/desconto
```

- `<<<<<<< HEAD` até `=======` → **ours** (o lado onde você está).
- `=======` até `>>>>>>>` → **theirs** (o que você está trazendo).

Atenção à inversão: **durante `rebase`, "ours" e "theirs" trocam de sentido** — porque o rebase reaplica seus commits *em cima* do outro lado, então "ours" passa a ser a base sobre a qual você reaplica. Por isso desconfie de resolver no automático durante rebase.

## A estratégia
Resolver não é "escolher um lado" no automático — é **decidir o código correto**, que pode ser uma combinação dos dois. Passo a passo:

```bash
git status            # lista "Unmerged paths" -> os arquivos a resolver
```

1. Abra cada arquivo conflitado. Para **cada** bloco `<<<< ==== >>>>`, edite deixando o código final correto e **apague os três marcadores**.
2. Confirme que não sobrou nenhum marcador: `git diff --check` acusa marcadores de conflito esquecidos.
3. Marque como resolvido e continue:

```bash
git add arquivo.js          # 'add' sinaliza ao Git que ESTE conflito está resolvido
git merge --continue        # ou: git rebase --continue / git cherry-pick --continue
```

Ferramentas que ajudam a inspecionar os três lados (base comum, ours, theirs):

```bash
git checkout --ours  arquivo   # aceita seu lado inteiro (atalho, use com cuidado)
git checkout --theirs arquivo  # aceita o outro lado inteiro
git mergetool                  # abre ferramenta visual de 3 vias configurada
```

## Abortar
Se travou de mais e quer voltar ao estado anterior, **limpo**, sem ter resolvido nada:

```bash
git merge --abort       # desfaz o merge, volta ao HEAD pré-merge
git rebase --abort      # idem para rebase
git cherry-pick --abort
```

Isso é seguro: restaura exatamente o estado de antes da operação. Sempre prefira abortar a "forçar" uma resolução que você não entendeu.

## rerere — resolva uma vez, reuse sempre
`rerere` = **reuse recorded resolution**. Em rebases longos ou branches de vida longa, você acaba resolvendo o **mesmo** conflito várias vezes. Com rerere ligado, o Git **grava** como você resolveu cada conflito e **reaplica automaticamente** se o mesmo conflito reaparecer.

```bash
git config --global rerere.enabled true
```

Depois disso é transparente: na próxima vez que o conflito idêntico surgir, o Git já o resolve do jeito que você resolveu antes e te avisa. Economiza horas em rebase de feature branch que ficou muito tempo atrás da main.

**Em entrevista:** "Conflito é sobreposição na mesma região; o Git pausa e marca os dois lados com `<<<< ==== >>>>` (ours/HEAD vs theirs). Eu edito pra deixar o código correto — que pode misturar os dois —, apago os marcadores, `git add` pra marcar resolvido e `--continue`. Se me perco, `--abort` volta ao estado anterior. Em rebase, ours/theirs ficam invertidos, então reviso com atenção."
