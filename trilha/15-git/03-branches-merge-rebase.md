# 03 — Branches, Merge e Rebase

## O que é
Um **branch é só um ponteiro** para um commit — literalmente um arquivo de 41 bytes em `.git/refs/heads/` contendo um SHA. Por isso criar branch é instantâneo e barato: não copia nada, só escreve um hash novo. Quando você commita, o ponteiro do branch atual **avança** sozinho para o novo commit.

**HEAD** é o ponteiro que diz "onde você está agora". Normalmente HEAD aponta para um branch (ex: `refs/heads/main`), e o branch aponta para um commit. Por isso `git commit` sabe qual branch mover. Quando HEAD aponta direto para um commit (sem branch), você está em **detached HEAD** — pode olhar e commitar, mas os commits ficam órfãos se você sair sem criar branch.

```bash
git branch feature        # cria ponteiro 'feature' no commit atual (não muda HEAD)
git switch feature        # move HEAD para feature (forma moderna do checkout)
git switch -c feature     # cria E entra no branch
cat .git/HEAD             # ref: refs/heads/feature  <- HEAD aponta pro branch
```

## Fast-forward vs merge commit
Juntar branches tem dois cenários. Suponha que você ramificou `feature` de `main` e `main` **não andou** desde então:

```text
main        A───B
                 \
feature           C───D     git switch main; git merge feature
```

`main` só precisa "alcançar" `feature`. O Git faz **fast-forward**: avança o ponteiro de `main` para `D`. Nenhum commit novo é criado — a história fica linear.

Agora se `main` **andou** também (commit `E`), os históricos divergiram:

```text
main        A───B───────E
                 \
feature           C───D       merge cria um commit M com DOIS pais (E e D)
```

Aqui o Git cria um **merge commit** `M` com dois pais. Ele preserva o fato de que houve dois ramos paralelos. Use `git merge --no-ff` para **forçar** um merge commit mesmo quando fast-forward seria possível — útil pra marcar no histórico "aqui entrou a feature X".

## Rebase: reescreve história
`rebase` resolve a divergência de outro jeito: em vez de um merge commit, ele **reaplica seus commits** em cima da nova base, um por um, criando **commits novos** (hashes novos — lembra do módulo 01: mudou o pai, mudou o hash).

```text
antes:  A───B───E (main)
             \
              C───D (feature)

git switch feature; git rebase main

depois: A───B───E (main)
                 \
                  C'───D' (feature)   <- C' e D' são commits NOVOS, história linear
```

Resultado: história **linear**, como se você tivesse partido de `E` desde o começo. Mais limpa de ler. O custo: como `C` e `D` viraram `C'` e `D'` (commits diferentes), você **reescreveu história**.

## Quando usar cada um
- **Merge** preserva a verdade histórica (houve dois ramos). Não-destrutivo, hashes intactos.
- **Rebase** produz história linear, fácil de ler com `git log`. Destrutivo: gera hashes novos.

**A regra de ouro do rebase:** nunca faça rebase de commits que **já foram pushados e outras pessoas têm**. Você reescreveria commits que existem na máquina dos colegas, criando divergência e forçando `push --force`. Rebase é para **limpar seu branch local** antes de abrir o PR. Merge é para integrar na `main` compartilhada. (Veja o fluxo prático no módulo 07.)

**Em entrevista:** "Branch é um ponteiro pra um commit; HEAD aponta pra onde estou. Merge junta dois ramos preservando ambos — fast-forward se a base não andou, senão um merge commit de dois pais. Rebase reaplica meus commits em cima de outra base, gerando hashes novos e história linear — por isso só rebaseio commits locais que ninguém mais tem."
