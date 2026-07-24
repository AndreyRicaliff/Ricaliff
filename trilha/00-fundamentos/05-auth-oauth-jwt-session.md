# 05 — Auth: OAuth, JWT e Session

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — authN vs authZ, o que é
> uma "sessão" quando o HTTP é stateless, o que uma assinatura criptográfica prova, e o modelo
> de confiança do OAuth), §Estruturação (session × JWT, onde guardar token, os papéis do OAuth)
> e §Metodologia (como escolher e validar) — além da prática, P/R e checkpoint. Teoria por extenso.

## O que é

**Autenticação** responde "quem é você?". **Autorização** responde "o que você pode fazer?". São problemas diferentes — confundi-los é onde começa a maioria dos bugs de segurança.

**Session cookie** é o padrão clássico: o servidor cria uma sessão em memória/banco e manda um `session_id` num cookie `httpOnly`. A cada request, o browser envia o cookie, o servidor busca a sessão e sabe quem é.

**JWT** (JSON Web Token) é um token autocontido — `header.payload.signature`, assinado com uma chave. O servidor não guarda estado: valida a assinatura e lê o payload.

**OAuth 2.0** é um protocolo de **delegação**: permite que um app acesse recursos de outro serviço em nome do usuário, sem que o usuário entregue a senha. O fluxo **Authorization Code + PKCE** é o correto para apps web.

---

## § BASE — o fundamento

**AuthN vs AuthZ — por que a distinção é a base de tudo.** *Autenticação* (authN) prova **identidade** (você é quem diz ser — checagem de senha, token, biometria). *Autorização* (authZ) decide **permissão** (esse usuário, já identificado, pode fazer *esta* ação neste recurso?). São camadas independentes: você pode estar autenticado e mesmo assim não autorizado (é o par 401 vs 403 do módulo 03). Tratar as duas como uma coisa só é a raiz de vazamentos — "está logado, então pode ver tudo" é o bug de autorização mais comum.

**O que é uma "sessão", já que o HTTP é stateless.** Do módulo 03: o servidor **não lembra** do request anterior. Mas o usuário logou uma vez e quer continuar logado. Como o servidor sabe, no request seguinte, que é a mesma pessoa? A resposta é **re-provar a identidade em todo request** com uma credencial curta que viaja junto. Há duas estratégias, e toda a discussão auth gira em torno delas:

1. **Estado no servidor (session cookie):** ao logar, o servidor gera um `session_id` aleatório e guarda `session_id → dados do usuário` num store (Redis/DB). Manda o id num cookie. Cada request traz o cookie; o servidor **procura** o id no store e recupera quem é. O token é só uma **chave opaca** — todo o dado fica no servidor.

```
Browser → POST /login (email + senha)
Server  → cria sessão no store, seta cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict
Browser → GET /profile (cookie: session_id=abc123)
Server  → busca abc123 no store → sabe quem é
```

2. **Estado no token (JWT):** ao logar, o servidor cria um token **autocontido** que já carrega os dados (id, role, expiração) e **assina** com uma chave secreta. Não guarda nada. Cada request traz o token; o servidor **valida a assinatura** e lê o payload — sem consultar store.

**O que a assinatura de um JWT realmente prova (e o que NÃO prova).** Um JWT é `base64url(header).base64url(payload).assinatura`. Ponto crítico que derruba júnior: **base64url é codificação, não criptografia** — qualquer um decodifica o payload e lê tudo (nunca coloque segredo lá). O que dá segurança é a **assinatura**: um HMAC (com chave simétrica — HS256) ou uma assinatura assimétrica (RS256/ES256 — chave privada assina, pública verifica) sobre `header.payload`. A assinatura prova **integridade e autenticidade**: se alguém mudar um byte do payload (trocar `"role":"user"` por `"admin"`), a assinatura não bate e o token é rejeitado — porque o atacante não tem a chave pra re-assinar. **O que ela não prova:** confidencialidade (o payload é legível) nem que o token não foi *roubado* (quem tiver o token é tratado como o dono — é um *bearer token*). Daí duas regras: token curto (limita a janela de roubo) e sempre HTTPS (impede interceptação).

```ts
// payload de JWT — apenas assinado, NÃO criptografado (qualquer um lê)
{ "sub": "user_123", "email": "voce@suaempresa.com", "role": "admin", "exp": 1748822400 }
```

**Por que existe refresh token.** Access token curto (≈15 min) é seguro mas incômodo — o usuário não vai relogar a cada 15 min. O **refresh token** (vida longa, guardado em cookie `httpOnly`) serve só pra pedir um novo access token quando o atual expira, sem novo login. Boas implementações fazem **rotation**: cada uso do refresh token o invalida e emite um novo — se um refresh token vazado for reusado, o servidor detecta (dois usos do mesmo token) e derruba a família inteira.

**O modelo de confiança do OAuth 2.0 — quatro papéis.** OAuth resolve: "como o app A acessa meus dados no serviço B **sem** eu dar minha senha do B pro A?". A resposta é delegação via um token com escopo limitado. Os quatro papéis (RFC 6749):

- **Resource Owner** — você (o dono dos dados).
- **Client** — o app que quer acesso (o hub, um app AG).
- **Authorization Server** — quem autentica e emite tokens (Google, no login social).
- **Resource Server** — quem guarda os dados protegidos (a API do Google).

O fluxo correto pra app web é o **Authorization Code**: o usuário autentica no Authorization Server (não no app!), que devolve um **code** de uso único e vida de segundos; o app troca esse code por tokens. O code fica curto e visível de propósito — mesmo que vaze na URL, é inútil sem o passo de troca.

```
1. App → redireciona pro Google: /auth?client_id=X&redirect_uri=Y&scope=email&code_challenge=Z
2. Usuário autoriza NO GOOGLE (o app nunca vê a senha)
3. Google → redireciona pra Y com ?code=... (uso único, ~segundos)
4. App → troca o code por id_token + access_token (server-side, ou com PKCE numa SPA)
5. App → valida a assinatura do id_token, lê o email, checa o domínio do Workspace (hd)
6. App → cria a PRÓPRIA sessão (não usa o access_token do Google como sessão)
```

**PKCE — por que SPAs e mobile precisam.** No fluxo clássico, o app troca o code usando um `client_secret` — mas uma SPA/app mobile **não pode guardar segredo** (o código roda no dispositivo do usuário). **PKCE** (Proof Key for Code Exchange) resolve com cripto em vez de segredo estático: antes do redirect, o app gera um `code_verifier` aleatório e manda o **hash** dele (`code_challenge`, SHA-256). Ao trocar o code, manda o `code_verifier` original; o Authorization Server confere `SHA256(verifier) == challenge`. Só quem **iniciou** o fluxo tem o verifier — um atacante que intercepte o code não consegue trocá-lo. Hoje PKCE é recomendado até pra apps com backend.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

**Session cookie vs JWT** (o eixo estado-no-servidor × estado-no-token):

| | Session Cookie | JWT |
|---|---|---|
| Estado no servidor | sim (Redis/DB) | não (stateless) |
| Invalidação imediata | **sim** — apaga a sessão | difícil — vale até `exp` |
| Risco XSS | baixo — cookie HttpOnly não é lido por JS | **alto** se guardado em localStorage |
| Risco CSRF | precisa proteção (SameSite resolve) | não (não é cookie) |
| Escala horizontal | precisa store compartilhado | nativo — qualquer servidor valida |
| Tamanho | pequeno (só o id) | maior — cresce com as claims |
| Quando usar | apps com logout real, admin | microserviços stateless, tokens curtos |

**Onde guardar token no browser** (a decisão que mais causa vazamento):

| Local | XSS? | CSRF? | Correto para |
|---|---|---|---|
| `localStorage` | **sim** — JS lê direto | não | nada com JWT de auth |
| Cookie `httpOnly` | não — JS não acessa | sim (precisa SameSite) | session id, refresh token |
| Cookie `httpOnly; SameSite=Strict` | não | não (navegação normal) | **padrão recomendado** |
| Memória da app (variável JS) | sim | não | access token de vida curta (15 min) |

**Os papéis e o fluxo OAuth:**
```
Resource Owner (você) ──autoriza──▶ Authorization Server (Google)
        │                                    │ emite code → tokens
        ▼                                    ▼
     Client (app AG) ──apresenta token──▶ Resource Server (API Google)
```

**Regra de bolso:** monolito ou app com logout real → session cookie. Microserviços internos com tokens curtos → JWT. **Nunca** JWT em localStorage — use cookie `httpOnly`.

---

## § METODOLOGIA — o passo-a-passo replicável

**Desenhar auth pra um app novo:**

1. **Separe authN de authZ desde o começo.** Uma camada prova identidade; outra, independente, checa permissão em cada recurso. Não deduza permissão da identidade ("logou = pode tudo").
2. **Escolha session vs JWT pelo eixo invalidação × escala.** Precisa de logout que corta na hora (admin, dado sensível)? → sessão server-side. É frota stateless de microserviços com tokens de minutos? → JWT.
3. **Delegue o login (OAuth) quando puder.** Não gerencie senha se o público já tem Google Workspace — Google cuida de MFA, brute force, phishing. Menos superfície, custo zero.
4. **Valide TUDO no servidor, depois da assinatura.** Cheque a assinatura do id_token **primeiro**; só então confie nas claims (email, `hd`/domínio, `exp`). Validar no cliente é decorativo — o cliente é controlado pelo atacante.
5. **Guarde token no lugar certo.** Access token curto em memória; refresh/session em cookie `httpOnly; Secure; SameSite`. Nunca em localStorage.
6. **Force HTTPS e expiração curta.** Bearer token + HTTP = roubo trivial. `exp` curto + refresh com rotation limita o estrago de um vazamento.

**Anti-padrões:**
- **JWT em localStorage** — um XSS lê o token e age como o usuário até `exp`. Cookie `httpOnly` fecha essa porta.
- **Confiar no payload sem verificar a assinatura** — o payload é editável; sem checar a assinatura, `role:"admin"` forjado passa.
- **Aceitar `alg: none`** — ataque clássico: o token diz "sem assinatura" e uma lib mal configurada aceita. Fixe o algoritmo esperado no servidor.
- **Validar o domínio (`hd`) só no cliente** — trivial de burlar. Valide no callback server-side.
- **Usar o access_token do provedor OAuth como sua sessão** — ele é pra chamar a API do provedor, não pra ser a identidade do seu app; crie sessão própria.
- **Achar que base64 do JWT é segredo** — é legível por qualquer um; nunca ponha dado sensível no payload.

---

## Passo-a-passo aplicado (faça agora, ~30min)

O padrão do hub usa Google OAuth com restrição ao domínio do Workspace (`hd`). Está no Café com AG (single-file) e no PULSAR-RH. O exercício é ler o fluxo e desenhá-lo.

1. **Ache o fluxo no Café com AG (mais simples):**
   ```bash
   grep -n "oauth\|hd\|google\|token\|login\|auth" ~/projetos/cafe_com_ag/*.html 2>/dev/null | head -30
   ```
2. **Ache no PULSAR-RH (completo):**
   ```bash
   grep -rn "oauth\|hd\|google\|signIn\|session\|jwt\|token" ~/projetos/PULSAR-RH/src/ --include="*.ts" | grep -v "test\|spec" | head -30
   ```
3. **Desenhe o diagrama** em `~/projetos/estudos/rascunhos/auth-diagram.md` (Browser → App → Google → callback → valida id_token → checa `hd` → cria sessão → cookie). Marque **onde a assinatura é validada** e **onde o `hd` é checado**.
4. **Encontre a validação do domínio no código:**
   ```bash
   grep -rn "hd\b\|hosted_domain" ~/projetos/PULSAR-RH/src/ ~/projetos/cafe_com_ag/ --include="*.ts" --include="*.js" --include="*.html" 2>/dev/null | head -20
   ```
   Confirme: o `hd` é checado **no servidor**, **depois** de validar a assinatura? Se for só no cliente, é bug — anote.
5. **Registre no `DECISIONS.md`:** problema (restringir ao domínio corporativo), alternativas (senha própria, Auth0/Clerk), decisão (Google OAuth + `hd` server-side), por quê (zero senha, Google cuida de MFA/brute force), atenção (validar `hd` após a assinatura, nunca só no cliente).

---

## Por que cai em entrevista

Auth é onde vazamentos acontecem — espera-se que pleno decida aqui sem pesquisar. Variações:

- "Diferença entre autenticação e autorização?"
- "Por que JWT no localStorage é problema?"
- "Como funciona o Authorization Code Flow?"
- "Quando JWT vs session cookie?"
- "O que é refresh token e por que existe?"
- "Como invalidar um JWT antes de expirar?"
- "O que é PKCE e por que usar em SPAs?"

> **P:** "Por que guardar JWT no localStorage é um problema de segurança?"
>
> **R (30s):**
> "Porque localStorage é acessível por qualquer JavaScript rodando na página. Um ataque XSS — por exemplo, um script injetado via input não sanitizado — consegue ler o token e exfiltrá-lo para um servidor externo. Com o JWT, o atacante age como o usuário até o token expirar. Cookie httpOnly não tem esse problema: o browser envia automaticamente nas requests, mas nenhum JS consegue lê-lo. Por isso a recomendação é: access token curto (15 min) em memória ou header, refresh token em cookie httpOnly."

> **P:** "Como funciona o OAuth Authorization Code Flow? Por que existe o PKCE?"
>
> **R (30s):**
> "O app redireciona o usuário pro Google com um client_id e redirect_uri. O Google autentica, redireciona de volta com um code de uso único. O app troca esse code por tokens server-side. O code tem vida de segundos — mesmo que vaze na URL, é inútil sozinho. PKCE (Proof Key for Code Exchange) resolve o caso de SPAs e apps mobile que não podem guardar um client_secret: antes do redirect, o app gera um code_verifier e manda o hash (code_challenge). Ao trocar o code, manda o verifier original — só quem iniciou o fluxo consegue completar."

> **P:** "O que a assinatura de um JWT prova? O payload é criptografado?"
>
> **R (30s):**
> "O payload não é criptografado — é só base64url, qualquer um decodifica e lê. Por isso nunca ponho segredo lá. O que dá segurança é a assinatura: um HMAC ou assinatura assimétrica sobre header e payload. Ela prova integridade e autenticidade — se alguém mexer no payload pra virar admin, a assinatura não bate e o servidor rejeita, porque o atacante não tem a chave pra re-assinar. O que ela não garante é confidencialidade nem que o token não foi roubado — é um bearer token, quem tem é tratado como dono. Daí token curto e sempre HTTPS."

## Checkpoint

- [ ] Explico authN vs authZ com exemplo concreto (e ligo ao par 401/403)
- [ ] Explico o que é "sessão" com HTTP stateless e as duas estratégias (server-side vs token)
- [ ] Explico o que a assinatura de um JWT prova e o que NÃO prova (e por que base64 não é segredo)
- [ ] Sei por que JWT em localStorage é vulnerável e qual a alternativa
- [ ] Desenhei o fluxo OAuth (4 papéis) e sei onde valido assinatura e `hd` — no servidor
- [ ] Encontrei onde o `hd` é validado no código AG
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Auth, OAuth e JWT dominados`.

---

## Recursos

- **RFC 6749** — "The OAuth 2.0 Authorization Framework": seções "Protocol Endpoints" e "Authorization Code Grant" (os papéis e o fluxo)
- **RFC 7519** — "JSON Web Token (JWT)" (estrutura header/payload/signature) e **RFC 7636** — "PKCE" (o code_verifier/code_challenge)
- **OWASP** — "Session Management Cheat Sheet" e "JSON Web Token for Java Cheat Sheet" (armadilhas: `alg:none`, storage, expiração)
- **MDN** — "Using HTTP cookies" (atributos `HttpOnly`, `Secure`, `SameSite`)
- **jwt.io** — "Introduction to JSON Web Tokens" (o mapa conceitual + debugger)
- `~/projetos/PULSAR-RH/` e `~/projetos/cafe_com_ag/` — implementações reais AG para referência
