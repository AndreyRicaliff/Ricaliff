# 01 — HTTP por Dentro

## O que é

HTTP é um protocolo de **request/response** sobre TCP: o cliente abre conexão, manda uma requisição de texto, o servidor responde, fim. Sem estado entre uma requisição e outra (isso é o módulo 02). Entender o que viaja no fio é o que separa quem "usa fetch" de quem entende API.

**O ciclo:**

```text
cliente                          servidor
  |  --- TCP connect (porta 443) --->  |
  |  --- HTTP request (texto) ------>  |
  |                                    |  processa
  |  <-- HTTP response (texto) ------  |
  |  (conexão reusada p/ próximo req)  |
```

## Anatomia de uma requisição

Uma requisição HTTP crua é texto: **request line + headers + linha em branco + body opcional.**

```http
POST /api/users HTTP/1.1
Host: api.exemplo.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...
Content-Length: 38

{"name":"Ana","email":"ana@x.com"}
```

A resposta tem a mesma forma: **status line + headers + body.**

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/42

{"id":42,"name":"Ana","email":"ana@x.com"}
```

## Métodos (verbos)

O método declara a **intenção** sobre o recurso. O servidor não é obrigado a respeitar, mas APIs bem feitas respeitam.

| Método | Intenção | Tem body? | Safe | Idempotente |
|---|---|---|---|---|
| `GET` | ler recurso | não | sim | sim |
| `POST` | criar / ação | sim | não | **não** |
| `PUT` | substituir inteiro | sim | não | sim |
| `PATCH` | atualizar parcial | sim | não | não* |
| `DELETE` | remover | não | não | sim |

`HEAD` (= GET sem body) e `OPTIONS` (descobrir métodos/CORS) completam o time. *Safe* = não modifica estado. *Idempotente* = repetir N vezes tem o mesmo efeito de 1 vez (detalhado no módulo 02).

## Status codes

A classe (primeiro dígito) já conta a história. Decore as classes; depois os principais.

```text
2xx  deu certo
3xx  redireciona / use cache
4xx  erro do CLIENTE (você mandou errado)
5xx  erro do SERVIDOR (ele falhou)
```

**Os que você usa toda semana:**

```text
200 OK              resposta padrão de sucesso com body
201 Created         criou recurso (POST) — manda header Location
204 No Content      sucesso sem body (DELETE, PUT sem retorno)
301 Moved Perm.     recurso mudou de URL pra sempre
304 Not Modified    cache do cliente ainda vale (ETag/If-None-Match)
400 Bad Request     payload malformado / validação falhou
401 Unauthorized    não autenticado (sem token ou token inválido)
403 Forbidden       autenticado, mas SEM permissão
404 Not Found       recurso não existe
409 Conflict        conflito de estado (ex: email duplicado)
422 Unprocessable   sintaxe ok, semântica inválida
429 Too Many Req.   rate limit estourado — veja Retry-After
500 Internal Error  bug no servidor
502 Bad Gateway     proxy recebeu resposta inválida do upstream
503 Service Unavail. servidor fora do ar / sobrecarregado
```

**Em entrevista:** "401 é *não sei quem você é* (autenticação falhou); 403 é *sei quem você é, mas você não pode* (autorização falhou). 401 pede credencial, 403 não adianta repetir."

## Headers que importam

Headers são metadados `Chave: Valor`. Os essenciais:

```text
Content-Type      formato do body — application/json, text/html...
Content-Length    tamanho do body em bytes
Authorization     credencial — Bearer <token>, Basic <base64>
Accept            formato que o CLIENTE aceita de volta
Cache-Control     política de cache — no-store, max-age=3600
ETag              versão do recurso, p/ cache condicional (304)
Location          URL do recurso criado (201) ou destino (3xx)
Retry-After       segundos pra tentar de novo (429, 503)
```

## Body

Só `POST`, `PUT`, `PATCH` carregam body relevante. O `Content-Type` diz como parsear: `application/json` (90% das APIs), `application/x-www-form-urlencoded` (forms), `multipart/form-data` (upload de arquivo). **GET com body é tabu** — proxies e caches ignoram.

**Em entrevista:** "HTTP é stateless e baseado em request/response: texto com request line, headers e body. O método declara intenção, o status code declara o resultado em classes 2xx/3xx/4xx/5xx, e os headers carregam os metadados de auth, cache e formato."
