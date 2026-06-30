# 04 — Autenticação e Autorização

## O que é

Dois problemas distintos que a galera mistura:

- **Autenticação (authN):** *quem é você?* — provar identidade. Falha → `401`.
- **Autorização (authZ):** *o que você pode?* — checar permissão. Falha → `403`.

Toda chamada REST é stateless (módulo 02), então a credencial viaja em **toda** requisição, no header `Authorization`.

## Os esquemas, do mais simples ao mais sério

### API Key

String secreta por cliente, em header. Simples, comum em APIs server-to-server.

```http
GET /v1/data
X-API-Key: sk_live_8f3a9b...
```

Sem expiração nativa, sem escopo embutido — você controla tudo no servidor (lookup da key → cliente → permissões). Bom para B2B; ruim para usuário final (não dá pra logout, revogação é manual).

### Basic Auth

`usuario:senha` em base64 (**não** é criptografia — é só encoding reversível). Só use sobre HTTPS, e quase nunca em API moderna.

```http
Authorization: Basic YW5hOnNlbmhhMTIz
# base64("ana:senha123") — qualquer um decodifica
```

### Bearer Token

"Portador": quem tem o token, tem o acesso. O padrão moderno. O token costuma ser um **JWT**.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiJ9.SflKx...
```

## JWT por dentro

JWT (*JSON Web Token*) são **três blocos base64url separados por ponto**: `header.payload.signature`.

```text
eyJhbGci...  .  eyJzdWIi...  .  SflKxwRJ...
  HEADER          PAYLOAD        SIGNATURE
```

```json
// HEADER  — algoritmo e tipo
{"alg":"HS256","typ":"JWT"}

// PAYLOAD — claims (dados); sub=subject, exp=expiração (unix)
{"sub":"42","role":"admin","exp":1735689600}

// SIGNATURE — HMAC-SHA256(base64(header)+"."+base64(payload), SECRET)
```

**O ponto crucial:** o JWT é **assinado, não criptografado**. Qualquer um lê o payload (é só base64). A assinatura só garante que **não foi adulterado** — quem não tem o `SECRET` não consegue forjar um token válido. O servidor recalcula o HMAC e compara; se bater, confia nos claims sem ir ao banco (por isso "stateless").

**O que NÃO botar no JWT:**

```text
NUNCA: senha, cartão, CPF, token de outra API, qualquer segredo
       → o payload é PÚBLICO (base64, não cifrado)
EVITE: dados que mudam toda hora (o token tem vida própria até exp)
PONHA: sub (id do user), role/scopes, exp, iat — o mínimo pra autorizar
```

E mantenha `exp` curto (15min–1h): JWT **não dá pra revogar** antes de expirar (não há estado no servidor). Daí o refresh token.

## Refresh token

O *access token* (JWT) é curto e usado em toda chamada. O *refresh token* é longo, guardado seguro (cookie httpOnly), e **só** serve para pedir um novo access token quando ele expira — sem relogar.

```text
login        → access (15min) + refresh (30d)
access expira → POST /auth/refresh com refresh → novo access
refresh expira/roubado → revoga no servidor (esse fica em banco) → reloga
```

Assim você tem o melhor dos dois: chamadas stateless e rápidas (JWT) + capacidade de revogar (refresh é stateful, fica no banco).

## OAuth2 — authorization_code na intuição

OAuth2 resolve: *"deixar o App X agir em meu nome no Serviço Y sem dar minha senha do Y pro X"* (login com Google, etc). O fluxo `authorization_code`:

```text
1. App te redireciona pro Google: "esse app quer ler seu email"
2. Você loga NO GOOGLE (o app nunca vê sua senha) e autoriza
3. Google redireciona de volta ao app com um CODE de uso único
4. App troca o code (no backend, com seu client_secret) por um ACCESS TOKEN
5. App usa o token pra chamar a API do Google em seu nome
```

A sacada: a senha fica só com o Google; o app recebe um token com **escopo limitado** (só o que você autorizou) e **revogável**. O `code` intermediário existe pra que o token nunca trafegue pela URL do browser (vai pela troca server-to-server).

## 401 × 403

```text
401 Unauthorized  → "não sei quem você é": token ausente, inválido ou expirado
                    → ação do cliente: autenticar / refresh
403 Forbidden     → "sei quem você é, mas não pode": role/scope insuficiente
                    → ação do cliente: NADA, repetir não adianta
```

**Em entrevista:** "Autenticação é provar quem você é (falha = 401); autorização é checar o que você pode (falha = 403). JWT é header.payload.signature assinado, não criptografado — o payload é público, então nele só vai id, role e expiração, nunca segredo. Access token curto pra ser stateless, refresh token longo e revogável pra renovar sem relogar."
