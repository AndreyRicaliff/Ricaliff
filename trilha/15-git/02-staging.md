# 02 — Os Três Estados: Working Directory, Index e Repositório

## O que é
Todo arquivo no Git transita por **três áreas**. Entender isso elimina 90% da confusão com `add`, `status` e `diff`.

```text
 working directory  ──git add──▶  staging area (index)  ──git commit──▶  repository
   (seus arquivos)                  (o próximo snapshot)                 (snapshots gravados)
        ▲                                                                       │
        └──────────────────────── git checkout / restore ──────────────────────┘
```

- **Working directory** — os arquivos reais no disco, onde você edita. Pode ter mudanças bagunçadas, meio prontas.
- **Staging area (index)** — uma área intermediária que monta o **próximo commit**. É um arquivo (`.git/index`) que lista quais versões de quais arquivos vão entrar. Existe justamente para você **escolher** o que commitar, em vez de ser tudo ou nada.
- **Repositório** — o banco de objetos (`.git/objects`): os commits já gravados, imutáveis.

O `git add` copia o estado atual do arquivo **para o index** — tira um retrato naquele instante. Se você editar o arquivo **depois** do `add`, essa nova edição **não** está staged; o arquivo aparece nas duas listas ao mesmo tempo.

## status e diff
`git status` mostra a fronteira entre as áreas: "Changes to be committed" (index vs último commit) e "Changes not staged" (working vs index).

```bash
git status            # visão geral das três áreas
git status -s         # versão curta: XY arquivo (X=index, Y=working)
```

A confusão clássica é com `diff`, porque ele compara **áreas diferentes** dependendo da flag:

```bash
git diff              # working directory  vs  index   (o que você ainda NÃO deu add)
git diff --staged     # index  vs  último commit       (o que VAI no próximo commit)
git diff HEAD         # working directory  vs  último commit (tudo que mudou, staged ou não)
```

`--staged` e `--cached` são sinônimos. Regra mental: `git diff` sozinho = "o que falta adicionar"; `git diff --staged` = "o que já está pronto pra commitar".

## Staging seletivo
O index permite commits cirúrgicos. Você editou três coisas num arquivo mas só quer commitar uma:

```bash
git add -p arquivo.js   # modo interativo: aprova hunk por hunk (y/n/s para split)
git restore --staged x  # tira do index (unstage), mantém a edição no working dir
```

Isso é o que viabiliza **commits atômicos** (uma responsabilidade por commit, regra de ouro): você não precisa ter editado de forma organizada — organiza na hora do staging.

## .git é o repositório
Não existe servidor obrigatório. `git init` cria a pasta `.git/` e ali dentro fica **tudo**: objetos, index, refs (branches/tags), config. Apagou `.git/`, virou pasta comum. "Remoto" (GitHub) é só **outra cópia** do mesmo banco de objetos com quem você sincroniza (módulo 07) — Git é distribuído, cada clone é um repositório completo com história inteira.

**Em entrevista:** "São três áreas: working directory (disco), staging/index (monta o próximo commit) e o repositório (.git, snapshots gravados). `git add` move do working pro index; `git commit` grava o index como snapshot. `git diff` compara working com index; `git diff --staged` compara index com o último commit."
