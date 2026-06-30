# 03 — Design de API que Não Dá Vergonha

## O que é

A diferença entre uma API que dá gosto de consumir e uma que dá ódio está em decisões de **consistência**: como você nomeia, pagina, filtra, versiona e reporta erro. Nada disso é HTTP — é convenção. Mas escolher mal trava integrações e gera ticket pra sempre.

## Nomeação de recursos

Regras que toda API boa segue:

```text
/users            substantivo no PLURAL (coleção)
/users/42         item da coleção pelo id
/users/42/posts   sub-recurso (posts DO usuário 42)
```

```text
EVITE:
  /user            (singular inconsistente)
  /getUserPosts    (verbo na URL — o método já é o verbo)
  /users/42/posts/2025/published  (hierarquia profunda demais — vire query)
  → use: /posts?author=42&year=2025&status=published
```

Use `kebab-case` ou nada de separador (`/cost-centers`, não `/costCenters`). Aninhe no máximo 1 nível; o resto vira filtro.

## Paginação: cursor × offset

Listas grandes **precisam** paginar. Há dois modelos:

```http
# OFFSET — simples, intuitivo
GET /users?limit=20&offset=40        → pula 40, pega 20
```

```http
# CURSOR — ponteiro opaco pro último item visto
GET /users?limit=20&cursor=eyJpZCI6NjB9
→ {"data":[...], "next_cursor":"eyJpZCI6ODB9"}
```

**Trade-off decisivo:** offset é fácil mas tem dois defeitos em dados que mudam — (1) **drift**: se inserem/deletam linhas durante a navegação, itens pulam ou repetem entre páginas; (2) **custo**: `OFFSET 100000` faz o banco varrer e descartar 100k linhas. Cursor (geralmente `WHERE id > último_id`) é estável sob escrita e usa índice — `O(log n)` em vez de `O(offset)`.

```text
offset  → admin/relatório, dataset pequeno e estável, precisa de "ir pra página 5"
cursor  → feed infinito, dataset grande, alta escrita, API pública séria
```

**Em entrevista:** "Offset é simples mas sofre drift e fica lento em offsets altos porque o banco varre e descarta; cursor usa um ponteiro (tipo `id > X`) que bate no índice e é estável mesmo com inserções concorrentes."

## Filtros e ordenação

Convenção via query string — previsível é melhor que esperto:

```http
GET /orders?status=paid&min_total=100&sort=-created_at&fields=id,total
```

```text
status=paid        filtro por igualdade
min_total=100      filtro por faixa (prefixo min_/max_ ou operador)
sort=-created_at   "-" = desc, sem prefixo = asc; vírgula p/ múltiplos
fields=id,total    sparse fieldset — devolve só essas colunas
```

## Versionamento

A API vai mudar de forma incompatível um dia. Versione **desde o início**.

```http
# Por URL — explícito, fácil de cachear, óbvio no log
GET /v1/users

# Por header — URL "limpa", mas invisível e mais difícil de testar no browser
GET /users
Accept: application/vnd.empresa.v1+json
```

**Trade-off:** URL (`/v1`) é o padrão pragmático — visível, cacheável, trivial de rotear. Header (content negotiation) é "mais correto" segundo puristas REST (a URI deveria ser estável), mas é invisível em logs/browser e quebra cache ingênuo. Para 95% dos casos: **/v1 na URL.**

## Formato de erro consistente

O maior pecado: cada rota erra de um jeito. Padronize **um envelope** e use sempre:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "email is not a valid address",
    "field": "email",
    "request_id": "req_8f3a"
  }
}
```

Regras: status HTTP correto (400/401/403/404/409/422/500), `code` estável e legível por máquina (cliente faz `switch`), `message` para humano, e `request_id` para casar com o log do servidor. **Nunca** devolva `200` com `{"error": "..."}` no body — o status code é a verdade.

## HATEOAS em um parágrafo

HATEOAS (*Hypermedia As The Engine Of Application State*) é o nível mais alto de REST: a resposta inclui **links** para as próximas ações possíveis, então o cliente navega pela API como navega um site, sem hardcodar URLs. Ex: `{"id":42,"_links":{"self":"/users/42","posts":"/users/42/posts"}}`. Na prática quase ninguém implementa full HATEOAS (o custo não paga), mas o conceito útil que sobra é **devolver URLs prontas** (next_cursor, Location) em vez de obrigar o cliente a montar string.

**Resumo:** plural nos recursos, cursor para listas grandes, query string consistente pra filtro/sort, `/v1` na URL, e um envelope de erro único com status code correto. Consistência > esperteza.
