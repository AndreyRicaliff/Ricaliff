# 03 — HTTP, REST e Status Codes

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — o que é HTTP de verdade,
> statelessness, a anatomia da mensagem e as garantias de segurança/idempotência dos métodos),
> §Estruturação (as classes de status, verbos e o espectro REST↔RPC) e §Metodologia (como
> escolher status/método e diagnosticar) — além da prática, P/R e checkpoint. Teoria por extenso.

## O que é

HTTP é o protocolo de transferência de texto do mundo web. Cada transação tem um **verbo** (o que fazer), uma **URL** (onde), **headers** (metadados) e opcionalmente um **body** (o quê). O servidor responde com um **status code** (o resultado) e um body.

```
GET /users/42          → busca o usuário 42
POST /users            → cria um novo usuário
PUT /users/42          → substitui completamente o usuário 42
PATCH /users/42        → altera campos específicos
DELETE /users/42       → remove o usuário 42
```

**REST** (Representational State Transfer) é um conjunto de restrições arquiteturais que usa HTTP de forma previsível: recursos nomeados por substantivos, verbos HTTP como ações, estado no cliente (stateless). Não é um protocolo — é um **estilo**.

---

## § BASE — o fundamento

**O que é HTTP, materialmente.** HTTP é um protocolo **request/response** de texto que roda **sobre TCP** (que roda sobre IP). "De texto" no HTTP/1.1 é literal: o cliente abre uma conexão TCP com o servidor (porta 80, ou 443 com TLS por cima) e escreve texto ASCII. O servidor lê, processa, escreve texto de volta. Uma requisição crua é exatamente isto:

```
GET /users/42 HTTP/1.1\r\n
Host: api.exemplo.com\r\n
Accept: application/json\r\n
Authorization: Bearer eyJ...\r\n
\r\n
```

A **request line** (`método caminho versão`), depois **headers** (um por linha, `Nome: valor`), depois uma **linha em branco** (`\r\n\r\n`) que marca o fim dos headers, depois o **body** opcional. A resposta tem a mesma forma, começando pela **status line** (`HTTP/1.1 200 OK`). Entender que é só texto com uma estrutura fixa desmistifica tudo: `curl -v`, um proxy, o DevTools — todos mostram esse mesmo texto.

**Statelessness — a restrição que define o resto.** HTTP é **stateless**: cada requisição é independente e carrega tudo que o servidor precisa pra atendê-la. O servidor **não lembra** da requisição anterior. Isso não é limitação — é decisão de design (é uma das restrições REST de Roy Fielding). O ganho é **escala horizontal**: se nenhum request depende de estado guardado num servidor específico, qualquer um dos N servidores atrás do load balancer pode atender qualquer request. O custo: identidade e sessão precisam viajar em **todo** request (é exatamente por isso que existem cookies e tokens — módulo 05). "Stateless" não quer dizer "sem estado no mundo" (o banco tem estado); quer dizer "sem estado de conversa retido entre requests no servidor de aplicação".

**A evolução do transporte (por que a semântica sobrevive à sintaxe).** HTTP/1.1 (1997) é texto, uma requisição por conexão de cada vez (com *keep-alive* pra reusar a conexão TCP, mas sofrendo *head-of-line blocking*). HTTP/2 (2015) mudou a **sintaxe** pra binária com *frames* e *multiplexing* — várias requisições paralelas na mesma conexão TCP, com compressão de headers (HPACK). HTTP/3 (2022) trocou o transporte de TCP pra **QUIC** (sobre UDP), matando o head-of-line blocking do TCP e acelerando o handshake. O ponto pedagógico: **a semântica não mudou** — método, status, headers, idempotência são os mesmos em /1.1, /2 e /3. A **RFC 9110** ("HTTP Semantics") define esse contrato semântico separado da sintaxe de cada versão. Você aprende a semântica uma vez.

**Métodos: segurança e idempotência são propriedades da especificação, não convenção sua.** A spec (RFC 9110, §9.2) classifica os métodos:

- **Seguro (*safe*)**: não deve causar efeito de estado no servidor. `GET`, `HEAD`, `OPTIONS` são safe — um crawler pode chamá-los à vontade. Por isso **`GET` nunca deve mudar dado**: caches, prefetch de browser e bots assumem que GET é inócuo.
- **Idempotente**: chamar N vezes deixa o servidor no mesmo estado que chamar 1 vez. `GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS` são idempotentes. `PUT /users/42 {…}` dez vezes = mesmo estado final. `DELETE /users/42` de novo retorna 404, mas o **estado** (usuário não existe) é o mesmo.
- **NÃO idempotente**: `POST`. Dois POSTs criam dois recursos. Por isso o cliente **não pode** fazer retry cego de um POST que deu timeout — pode duplicar. A solução da indústria é a **idempotency key**: um header com um id único que o servidor usa pra deduplicar retries.

Idempotência importa porque **redes falham no meio**: se um `PUT`/`DELETE` der timeout, o cliente reenvia com segurança; com `POST`, precisa de proteção extra.

**REST não é "API com JSON" — é um conjunto de restrições.** Roy Fielding definiu REST na tese de doutorado dele (2000). As restrições que importam no dia a dia: **client-server** (separação de responsabilidade), **stateless** (acima), **cacheable** (respostas se declaram cacheáveis ou não — GET com `Cache-Control`/`ETag`), **interface uniforme** (recursos identificados por URL, manipulados por representações via verbos padronizados), e **layered system** (proxies/CDNs no meio, transparentes). O erro comum é achar que qualquer HTTP+JSON é REST — não é. `POST /getUser` é HTTP+JSON, mas é **RPC** (verbo no path, ignora a semântica de métodos e status).

**Como o browser protege origens: CORS.** O browser impõe a **same-origin policy** — JS de `a.com` não pode ler resposta de `b.com` por padrão. **CORS** (Cross-Origin Resource Sharing) é o mecanismo pelo qual `b.com` **autoriza** `a.com`, via headers `Access-Control-Allow-*`. Pra requests "não-simples" (método não-GET/POST, ou headers customizados como `Authorization`), o browser manda antes um **preflight** `OPTIONS`, perguntando "posso?"; só depois manda o request real. CORS é **proteção do browser** — não existe em chamada servidor-a-servidor (`curl`, backend→backend nunca sofrem CORS). Confundir isso faz o júnior "consertar CORS" no lugar errado.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

**Anatomia da transação:**
```
CLIENTE                                            SERVIDOR
  │  request line:  MÉTODO  /caminho  HTTP/versão      │
  │  headers:       Host, Accept, Authorization, …     │
  │  (linha em branco)                                 │
  │  body:          {…}  (opcional)          ─────────▶│  processa
  │                                                    │  (stateless: usa só o
  │                                                    │   que veio no request)
  │◀───────────  status line: HTTP/versão  CÓDIGO  ────│
  │              headers: Content-Type, Location, …    │
  │              body: {…}                             │
```

**As 5 classes de status code** (o primeiro dígito conta a história):

| Classe | Significado | Exemplos que caem |
|---|---|---|
| **1xx** informativo | "continue" | 100 Continue, 101 Switching Protocols |
| **2xx** sucesso | deu certo | 200 OK · 201 Created · 204 No Content |
| **3xx** redirecionamento | vá a outro lugar / use cache | 301 Moved · 304 Not Modified |
| **4xx** erro do cliente | você errou o request | 400 · 401 · 403 · 404 · 409 · 422 · 429 |
| **5xx** erro do servidor | o servidor falhou | 500 · 502 · 503 |

**Os que mais caem, com o gatilho:**

| Código | Nome | Use quando |
|---|---|---|
| 200 | OK | leitura ou update bem-sucedido com body |
| 201 | Created | recurso criado — devolver `Location` com a URL dele |
| 204 | No Content | sucesso sem body (DELETE, PUT sem retorno) |
| 301 | Moved Permanently | redirect permanente (indexadores atualizam a URL) |
| 304 | Not Modified | cache válido — cliente usa a cópia local (via ETag/Last-Modified) |
| 400 | Bad Request | request malformada, JSON inválido, campo obrigatório faltando (**formato**) |
| 401 | Unauthorized | não autenticado — token ausente/expirado (rótulo enganoso: é *unauthenticated*) |
| 403 | Forbidden | autenticado, mas sem permissão pro recurso |
| 404 | Not Found | recurso não existe |
| 409 | Conflict | estado conflitante — email duplicado, criar algo que já existe |
| 422 | Unprocessable Entity | request bem formada, mas regra de negócio violada (**semântica**) |
| 429 | Too Many Requests | rate limit — devolver `Retry-After` |
| 500 | Internal Server Error | exceção não tratada no servidor |
| 502 / 503 | Bad Gateway / Unavailable | upstream fora / sobrecarga — `Retry-After` no 503 |

**O espectro REST ↔ RPC** (não é binário — é maturidade):

| | REST | RPC (gRPC, tRPC, JSON-RPC) |
|---|---|---|
| Centrado em | recursos (substantivos) | ações (verbos) |
| Descoberta | URL descritiva | schema/contrato |
| Cache HTTP | natural (GET cacheável) | difícil (tudo POST) |
| Tipagem | manual / OpenAPI | gerada do schema (gRPC/tRPC) |
| Quando usar | APIs públicas, CRUD, integração ampla | microserviços internos, streaming, type-safety ponta-a-ponta |

O **Richardson Maturity Model** descreve os níveis: 0 (um endpoint, tudo POST — RPC puro) → 1 (recursos com URLs) → 2 (usa verbos + status HTTP corretamente — onde a maioria das "APIs REST" boas vive) → 3 (HATEOAS — respostas trazem links de próximas ações).

**Regra de bolso:** API pública ou clientes desconhecidos → REST. Microserviços internos com TS ponta-a-ponta → tRPC/gRPC economiza boilerplate.

---

## § METODOLOGIA — o passo-a-passo replicável

**Escolher o método e o status de um endpoint:**

1. **A operação muda estado?** Não → `GET` (safe). Sim → siga.
2. **Cria algo novo?** → `POST`, responda **201** + `Location`. É não-idempotente: se precisa de retry seguro, aceite `Idempotency-Key`.
3. **Substitui um recurso inteiro por id conhecido?** → `PUT` (idempotente). Só troca alguns campos? → `PATCH`.
4. **Remove?** → `DELETE`, responda **204** (sem body) — e **404** se já não existia (não minta 200).
5. **Deu erro: de quem é a culpa?** Cliente (4xx) ou servidor (5xx)? Refine: sem token → **401**; sem permissão → **403**; não existe → **404**; formato inválido → **400**; regra de negócio violada → **422**; conflito de estado → **409**; excedeu limite → **429**.
6. **A leitura pode ser cacheada?** Devolva `ETag`/`Cache-Control`; honre `If-None-Match` com **304**.

**Diagnosticar "a API respondeu errado":**
1. Olhe o **status real** no DevTools/Network ou `curl -v` — não confie na mensagem, confie no código.
2. **200 com corpo de erro** é bug: o cliente vê "sucesso". Status tem que refletir o resultado.
3. **CORS bloqueou?** Veja se há um `OPTIONS` (preflight) falhando *antes* do request real — o problema é no servidor autorizar a origem, não no seu fetch.
4. **Retry duplicou dado?** Provável POST sem idempotency key sendo repetido — a rede fez o cliente reenviar.

**Anti-padrões:**
- **`GET` que muda estado** (`GET /users/42/delete`) — bots e prefetch vão disparar sem querer. Mudança de estado nunca em GET.
- **200 pra tudo, erro no corpo** — quebra clientes que decidem por status (fetch, retries, monitoramento).
- **404 vira 200 com `null`** — "sucesso" que é ausência; o cliente não sabe parar de tentar.
- **POST com retry cego** — duplica recurso; use idempotency key.
- **Tratar CORS como bug do frontend** — CORS é config do servidor (headers `Access-Control-Allow-*`).

---

## Passo-a-passo aplicado (faça agora, ~30min)

O PULSAR-RH tem endpoints — auditar os status codes é aplicar a metodologia direto.

1. **Liste as rotas:**
   ```bash
   grep -rn "router\.\(get\|post\|put\|patch\|delete\)" ~/projetos/PULSAR-RH/src/ --include="*.ts" | head -40
   ```
2. **Ache os retornos com status:**
   ```bash
   grep -rn "res\.status\|res\.json\|res\.send" ~/projetos/PULSAR-RH/src/ --include="*.ts" | head -40
   ```
3. **Para cada rota, aplique os passos 1–6:** POST que cria → é 201 ou 200? DELETE ok → 204 ou 200 com body? GET de id inexistente → 404 ou 200 com null? Erro de validação → 400 (formato) ou 422 (regra)?
4. **Reproduza com `curl -v`** um endpoint pra ver a request/response cruas (a "base" na tela).
5. **Registre no `DECISIONS.md`:** problema (status errados), decisão (seguir a semântica), por quê (clientes decidem por status), resposta de 30s.
6. **Commit:** `fix(api): correct HTTP status codes across resource endpoints`.

---

## Por que cai em entrevista

É fundamento de toda API web. Quem não domina entrega bugs silenciosos (200 onde era 404, falta de idempotência, CORS mal configurado). Variações:

- "Diferença entre 401 e 403?"
- "POST vs PUT vs PATCH — quando cada?"
- "O que é um endpoint idempotente?"
- "Explica CORS preflight e por que acontece."
- "Qual status pra recurso criado com sucesso?"
- "Quando 422 em vez de 400?"
- "O que acontece com o cache num 304?"

> **P:** "Qual a diferença entre 401 e 403?"
>
> **R (30s):**
> "401 é falta de autenticação: o servidor não sabe quem você é — token ausente, expirado ou inválido. A ação certa do cliente é fazer login e tentar de novo. 403 é falta de autorização: o servidor sabe quem você é, mas você não tem permissão para aquele recurso. Logar de novo não vai resolver — você simplesmente não tem acesso. No PULSAR-RH, por exemplo: acessar sem token é 401, acessar dados de outro tenant autenticado é 403."

> **P:** "O que significa um endpoint ser idempotente e por que isso importa?"
>
> **R (30s):**
> "Idempotente significa que chamar o endpoint N vezes produz o mesmo estado final que chamar uma vez. GET, PUT e DELETE são idempotentes por definição HTTP. POST não é — dois POSTs criam dois recursos. Isso importa porque redes são instáveis: se um DELETE ou PUT der timeout, o cliente pode tentar de novo com segurança. Com POST, o cliente não pode fazer retry cego — pode criar duplicatas. Por isso APIs bem desenhadas usam idempotency keys em POST quando retry é necessário."

> **P:** "Por que HTTP é stateless, e o que isso te obriga a fazer?"
>
> **R (30s):**
> "Stateless significa que cada request é independente — o servidor não guarda memória da conversa anterior. Isso foi decisão de design pra escalar horizontalmente: qualquer servidor atrás do load balancer atende qualquer request, porque nenhum depende de estado local. O custo é que identidade tem que viajar em todo request — é exatamente por isso que existem cookies de sessão e tokens. 'Stateless' não quer dizer sem estado nenhum: o banco tem estado. Quer dizer sem estado de sessão retido no servidor de aplicação."

## Checkpoint

- [ ] Descrevo a anatomia de uma request HTTP crua (request line, headers, body) e leio um `curl -v`
- [ ] Explico statelessness e o que ela obriga (identidade em todo request)
- [ ] Listo 6 status codes com o gatilho exato e distingo 400/401/403/404/422
- [ ] Explico safe × idempotente e por que POST precisa de idempotency key pra retry
- [ ] Explico CORS preflight em 2 frases (o que é, por que só no browser)
- [ ] Auditei ≥3 endpoints de um projeto AG e corrigi status errados
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — HTTP, REST e Status Codes dominados`.

---

## Recursos

- **MDN HTTP** — "HTTP request methods", "HTTP response status codes" e "HTTP conditional requests" (ETag/If-None-Match/304, idempotência e segurança dos métodos)
- **MDN** — "Cross-Origin Resource Sharing (CORS)" (o preflight `OPTIONS` e os headers `Access-Control-Allow-*`)
- **RFC 9110 — "HTTP Semantics"** — a fonte normativa: métodos (§9), semântica de status (§15), *safe* e *idempotent* (§9.2)
- **Roy Fielding** — "Architectural Styles and the Design of Network-based Software Architectures" (2000), cap. 5 (a definição original de REST e suas restrições)
- **Martin Fowler** — "Richardson Maturity Model" (os níveis 0→3 de REST)
- `~/.claude/CLAUDE.md` §CÓDIGO — validação em boundary (endpoint é boundary)
