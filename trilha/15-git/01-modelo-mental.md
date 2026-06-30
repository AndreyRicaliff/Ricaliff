# 01 — O Modelo Mental do Git

## O que é
Git não guarda diffs. Guarda **snapshots** — fotos completas do projeto a cada commit — num banco de dados de objetos endereçado por conteúdo. "Endereçado por conteúdo" significa que o nome de cada objeto é o **hash SHA-1** (40 hex) do seu próprio conteúdo. Mude um byte, muda o hash, vira outro objeto. É essa propriedade que torna o Git praticamente à prova de corrupção silenciosa: se o conteúdo bater com o hash, ele não foi adulterado.

Existem **quatro tipos de objeto**:

- **blob** — o conteúdo de um arquivo (só os bytes; o nome do arquivo não está aqui).
- **tree** — um diretório: lista de nomes → (modo, hash do blob/tree). É a tree que liga nome de arquivo ao conteúdo.
- **commit** — aponta para **uma** tree (o snapshot raiz), para **zero ou mais commits-pai**, e carrega autor, data e mensagem.
- **tag** — tag anotada, aponta para um objeto (geralmente um commit) com metadados próprios.

```text
commit  ──tree──▶ tree ──▶ blob "hello"
  │                  └────▶ tree (subdir) ──▶ blob
  └─parent─▶ commit anterior
```

Como cada commit referencia seu pai, os commits formam um **DAG** (grafo acíclico dirigido): cada nó aponta pra trás, para de onde veio. A "história" é esse grafo. Branches e tags são só **ponteiros** para nós dele.

```bash
git cat-file -t HEAD        # tipo do objeto que HEAD aponta -> commit
git cat-file -p HEAD        # conteúdo: mostra tree, parent, author, message
git cat-file -p HEAD^{tree} # lista a tree raiz do commit (nomes -> hashes)
git hash-object arquivo.txt # calcula o SHA-1 que esse conteúdo teria como blob
```

## Por que snapshot e não diff
Sistemas antigos (SVN, CVS) guardam uma cadeia de diffs: para reconstruir um arquivo, aplicam delta sobre delta. Git guarda o **estado inteiro** a cada commit. Parece desperdício, mas:

- Arquivos **idênticos** entre commits compartilham o **mesmo blob** (mesmo conteúdo = mesmo hash = um objeto só). Não há duplicação.
- O diff que você vê em `git diff` é **calculado na hora**, comparando duas trees — não é o que está armazenado.
- No disco, o Git ainda comprime com **packfiles** (delta interno), mas isso é otimização de storage, invisível ao modelo. Conceitualmente: snapshots.

Isso explica por que operações de história (log, branch, checkout entre commits) são rápidas: é só seguir ponteiros e ler objetos já prontos, sem reconstruir cadeia de deltas.

## SHA-1 e imutabilidade
Um commit é imutável: seu hash deriva do conteúdo, que inclui o hash do pai. Se você "edita" um commit antigo (rebase, amend), o conteúdo muda → hash novo → é um **commit diferente**, e todos os descendentes precisam ser regerados também (hashes em cascata). Isso é literalmente o que "reescrever história" significa (módulo 03). Você nunca edita um commit; você cria um novo e move o ponteiro.

**Em entrevista:** "Git é um grafo de snapshots imutáveis endereçados por conteúdo. Cada commit aponta para uma tree (o snapshot) e para seus pais; o nome de tudo é o SHA-1 do conteúdo, então nada muda sem mudar de identidade. Branch é só um ponteiro para um commit do grafo."
