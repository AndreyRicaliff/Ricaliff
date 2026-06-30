# 02 — REST de Verdade

## O que é

REST é um **estilo arquitetural** (Roy Fielding, 2000), não um protocolo. A ideia central: modelar tudo como **recursos** acessados por URIs, manipulados pelos verbos HTTP, com **representações** (JSON) trafegando entre cliente e servidor. "API REST" virou sinônimo de "JSON sobre HTTP", mas as restrições reais é que dão o valor.

## Recursos e URIs

Recurso é um **substantivo** (uma coisa do domínio). A URI o endereça. Verbo fica no método HTTP, **nunca na URL**.

```text
GET    /users          lista usuários
POST   /users          cria usuário
GET    /users/42       um usuário
PUT    /users/42       substitui usuário 42
DELETE /users/42       remove usuário 42
GET    /users/42/posts posts do usuário 42 (sub-recurso)
```

```text
RUIM:  /getUsers   /createUser   /users/42/delete   (verbo na URL)
BOM:   GET /users  POST /users   DELETE /users/42
```

## Statelessness

Cada requisição carrega **tudo** que o servidor precisa para processá-la — incluindo a autenticação. O servidor não guarda sessão entre chamadas. Isso é o que permite escalar horizontalmente: qualquer instância atende qualquer request, sem afinidade.

```text
NÃO-REST: login na req 1 cria sessão no servidor; req 2 depende dela
REST:     toda req manda Authorization: Bearer <token>; servidor não lembra nada
```

Consequência prática: o **token** (módulo 04) viaja em toda chamada. O estado vive no cliente ou no banco — nunca na memória do processo web.

## Safe e idempotente

São duas garantias diferentes, frequentemente confundidas.

- **Safe**: o método **não altera** estado no servidor. `GET`, `HEAD`, `OPTIONS`. Pode chamar à vontade, cachear, pré-buscar.
- **Idempotente**: chamar **N vezes** produz o mesmo **estado final** de chamar 1 vez. O *response* pode variar; o *efeito colateral* não.

```text
GET    /users/42   → idempotente e safe (só lê)
PUT    /users/42   → idempotente: mandar o mesmo body 3x deixa o recurso igual
DELETE /users/42   → idempotente: deletar 3x → recurso continua deletado
                     (2ª chamada pode dar 404, mas o ESTADO é o mesmo)
POST   /users      → NÃO idempotente: 3 chamadas criam 3 usuários
PATCH  /users/42   → geralmente não idempotente (depende da operação)
```

**Por que importa:** retry seguro. Se um `PUT`/`DELETE`/`GET` der timeout, o cliente pode repetir sem medo. `POST` repetido duplica — por isso APIs sérias usam **idempotency key** (header com UUID que o servidor deduplica). Ver módulo 04 da trilha 50-backend.

**Em entrevista:** "Idempotente = repetir tem o mesmo efeito de uma vez só. GET, PUT e DELETE são idempotentes; POST não. Isso define quais requests posso re-tentar com segurança após timeout."

## PUT × PATCH × POST

A confusão clássica. A diferença é **substituir vs. mesclar vs. criar**.

```http
PUT /users/42          → substitui o recurso INTEIRO
{"name":"Ana","email":"ana@x.com","age":30}
```

`PUT` é "aqui está a versão completa". Campos omitidos somem (viram null/default). Por isso é idempotente: o estado final é exatamente o body.

```http
PATCH /users/42        → atualiza SÓ os campos enviados
{"age":31}
```

`PATCH` é um delta. `name` e `email` ficam intactos. Não-idempotente em geral (ex: `PATCH {"saldo":"+10"}` soma a cada chamada).

```http
POST /users            → CRIA recurso novo, servidor decide o id
{"name":"Ana"}
→ 201 Created, Location: /users/43
```

```text
PUT    → "esse recurso agora é EXATAMENTE isso" (substitui, id conhecido)
PATCH  → "muda só esses campos" (merge parcial)
POST   → "crie algo novo" (não-idempotente, id gerado pelo servidor)
```

**Em entrevista:** "PUT substitui o recurso inteiro e é idempotente; PATCH aplica uma atualização parcial e geralmente não é; POST cria um recurso novo a cada chamada. Se eu mando PUT duas vezes o estado final é o mesmo; com POST eu crio dois."

## Representações

O recurso (a entidade) é abstrato; o que trafega é uma **representação** dele — normalmente JSON. O cliente negocia formato via `Accept`, o servidor declara via `Content-Type`. O mesmo recurso `/users/42` poderia ser servido como JSON, XML ou CSV — a URI identifica a coisa, não o formato.

```http
GET /users/42
Accept: application/json
→ Content-Type: application/json
  {"id":42,"name":"Ana"}
```

**Resumo das restrições REST que valem ouro:** recursos como substantivos, verbo no método, statelessness (token em toda req), uso correto de safe/idempotente, e representação negociável. Acertar isso já te coloca acima de 80% das "APIs REST" por aí.
