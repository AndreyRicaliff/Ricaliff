# 03 — HTTP, REST e Status Codes

## O que é

HTTP é o protocolo de transferência de texto do mundo web. Cada transação tem um **verbo** (o que fazer), uma **URL** (onde), **headers** (metadados) e opcionalmente um **body** (o quê). O servidor responde com um **status code** (o resultado) e um body.

```
GET /users/42          → busca o usuário 42
POST /users            → cria um novo usuário
PUT /users/42          → substitui completamente o usuário 42
PATCH /users/42        → altera campos específicos
DELETE /users/42       → remove o usuário 42
```

**REST** (Representational State Transfer) é um conjunto de restrições arquiteturais que usa HTTP de forma previsível: recursos nomeados por substantivos, verbos HTTP como ações, estado no cliente (stateless). Não é um protocolo — é um estilo.

```ts
// REST: recurso + verbo HTTP
GET    /projects/5/members        // lista membros do projeto 5
POST   /projects/5/members        // adiciona membro ao projeto 5

// RPC (não REST): verbo no path
POST   /getProjectMembers         // RPC disfarçado de REST
POST   /addMemberToProject
```

---

## Por que cai em entrevista

É fundamento de toda API web. Quem não domina entrega bugs silenciosos (200 onde deveria ser 404, falta de idempotência, CORS mal configurado). Variações reais:

- "Qual a diferença entre 401 e 403?"
- "Quando usar POST vs PUT vs PATCH?"
- "O que significa um endpoint ser idempotente?"
- "Explica o que é um CORS preflight e por que acontece."
- "Qual status code para um recurso criado com sucesso?"
- "Quando você retornaria 422 ao invés de 400?"
- "O que acontece com o cache quando o servidor retorna 304?"

---

## Trade-offs (quando usar X vs Y)

### Verbos HTTP

| Verbo | Semântica | Idempotente? | Body? |
|---|---|---|---|
| `GET` | leitura, sem efeito | sim | não (request) |
| `POST` | criação, trigger de ação | **não** | sim |
| `PUT` | substituição completa | sim | sim |
| `PATCH` | atualização parcial | depende da impl. | sim |
| `DELETE` | remoção | sim | não |

**Idempotente** = chamar N vezes tem o mesmo efeito que chamar 1 vez. `DELETE /users/42` duas vezes: segunda retorna 404, mas o estado final é o mesmo.

### Status Codes que mais caem

| Código | Nome | Use quando |
|---|---|---|
| 200 | OK | Leitura ou update bem-sucedido com body de resposta |
| 201 | Created | Recurso criado — retornar `Location` header com URL do novo recurso |
| 204 | No Content | Sucesso sem body (DELETE, PUT sem retorno) |
| 301 | Moved Permanently | Redirect permanente (SEO: indexadores atualizam URL) |
| 304 | Not Modified | Cache válido — cliente usa versão local (ETag/Last-Modified) |
| 400 | Bad Request | Request malformada, JSON inválido, campo obrigatório faltando |
| 401 | Unauthorized | Não autenticado — token ausente ou expirado |
| 403 | Forbidden | Autenticado, mas sem permissão para aquele recurso |
| 404 | Not Found | Recurso não existe |
| 409 | Conflict | Estado conflitante — email duplicado, tentativa de criar recurso já existente |
| 422 | Unprocessable Entity | Request bem formada, mas regra de negócio violada (campo inválido semanticamente) |
| 429 | Too Many Requests | Rate limit atingido — retornar `Retry-After` header |
| 500 | Internal Server Error | Bug/exceção não tratada no servidor |
| 502 | Bad Gateway | Proxy/load balancer não conseguiu falar com o upstream |
| 503 | Service Unavailable | Servidor fora, sobrecarga ou manutenção — retornar `Retry-After` |

### REST vs RPC

| | REST | RPC (gRPC, tRPC, JSON-RPC) |
|---|---|---|
| Centrado em | Recursos (substantivos) | Ações (verbos) |
| Descobrimento | URL descritiva | Schema/contrato |
| Cache HTTP | Natural (GET é cacheável) | Difícil (tudo é POST em JSON-RPC) |
| Tipagem | Manual / OpenAPI | Gerada do schema (gRPC/tRPC) |
| Quando usar | APIs públicas, CRUD, integração ampla | Microserviços internos, streaming, type-safety end-to-end |

**Regra de bolso:** API pública ou com clientes desconhecidos → REST. Microserviços internos com TS de ponta a ponta → tRPC/gRPC economiza boilerplate.

### CORS preflight

Browsers mandam um `OPTIONS` antes de requests cross-origin com headers customizados ou métodos não-simples. O servidor deve responder com `Access-Control-Allow-*` corretos. Não existe em chamadas server-to-server — é proteção do browser.

---

## Exercício aplicado (projeto AG real)

O PULSAR-RH tem endpoints de API. Auditar se os status codes estão corretos é exercício direto de aplicar esse conhecimento.

### Passo a passo

1. **Listar rotas do PULSAR-RH:**
   ```bash
   grep -rn "router\.\(get\|post\|put\|patch\|delete\)" \
     ~/projetos/PULSAR-RH/src/ --include="*.ts" | head -40
   ```

2. **Encontrar retornos com status explícito:**
   ```bash
   grep -rn "res\.status\|res\.json\|res\.send" \
     ~/projetos/PULSAR-RH/src/ --include="*.ts" | head -40
   ```

3. **Para cada rota, verificar:**
   - Rota `POST` que cria recurso: retorna `201` com o objeto criado, ou `200`? (deveria ser `201`)
   - Rota `DELETE` bem-sucedida: retorna `204` sem body, ou `200` com mensagem? (`204` é mais correto)
   - Rota `GET` para id inexistente: retorna `404` ou `200` com body null/vazio? (`404` obrigatório)
   - Erro de validação de campo: retorna `400` ou `422`? (`422` para semântica, `400` para formato)

4. **Verificar o Meet Hub também (rotas de gravação):**
   ```bash
   grep -rn "res\.status\|\.json\|\.send" \
     ~/projetos/meet-hub/src/ --include="*.ts" | grep -v "test\|spec" | head -30
   ```

5. **Registrar no `DECISIONS.md` do projeto:**
   ```markdown
   ## 2026-06-XX — [api] padronizar status codes nos endpoints

   **Problema:** rotas POST retornando 200 em vez de 201; DELETE retornando 200 com body
   desnecessário; GET de recurso inexistente retornando 200 com null.
   **Decisão:** seguir semântica HTTP: 201 em criação, 204 em deleção sem body, 404 obrigatório
   quando recurso não existe.
   **Por quê:** clientes (incluindo browsers e fetch nativo) usam status code para decidir
   comportamento — 201 sinaliza "pode seguir o Location header", 404 sinaliza "pare de tentar".
   **Como explicar em entrevista (30s):**
   > "Auditei os endpoints e corrigi: POST passou a retornar 201 com Location do novo recurso,
   > DELETE passou a 204 sem body, e GET com id inválido voltou a retornar 404 em vez de 200
   > com null — que é bug disfarçado de sucesso."
   ```

6. **Commit:** `fix(api): correct HTTP status codes across resource endpoints`

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre 401 e 403?"
>
> **R (30s):**
> "401 é falta de autenticação: o servidor não sabe quem você é — token ausente, expirado ou inválido. A ação certa do cliente é fazer login e tentar de novo. 403 é falta de autorização: o servidor sabe quem você é, mas você não tem permissão para aquele recurso. Logar de novo não vai resolver — você simplesmente não tem acesso. No PULSAR-RH, por exemplo: acessar sem token é 401, acessar dados de outro tenant autenticado é 403."

> **P:** "O que significa um endpoint ser idempotente e por que isso importa?"
>
> **R (30s):**
> "Idempotente significa que chamar o endpoint N vezes produz o mesmo estado final que chamar uma vez. GET, PUT e DELETE são idempotentes por definição HTTP. POST não é — dois POSTs criam dois recursos. Isso importa porque redes são instáveis: se um DELETE ou PUT der timeout, o cliente pode tentar de novo com segurança. Com POST, o cliente não pode fazer retry cego — pode criar duplicatas. Por isso APIs bem desenhadas usam idempotency keys em POST quando retry é necessário."

---

## Checkpoint

- [ ] Consigo listar 5 status codes com seus significados exatos sem consultar
- [ ] Sei explicar a diferença entre 400, 401, 403, 404 e 422 com exemplos reais
- [ ] Auditei pelo menos 3 endpoints de um projeto AG e corrigi status codes errados
- [ ] Consigo explicar CORS preflight em 2 frases (o que é, por que existe)
- [ ] Recitei ambas as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — HTTP, REST e Status Codes dominados`.

---

## Recursos

- MDN — [HTTP Status Codes](https://developer.mozilla.org/docs/Web/HTTP/Status)
- MDN — [HTTP Methods](https://developer.mozilla.org/docs/Web/HTTP/Methods)
- MDN — [CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS)
- `~/.claude/CLAUDE.md` §CÓDIGO — regra de validação em boundary (endpoints são boundary)
