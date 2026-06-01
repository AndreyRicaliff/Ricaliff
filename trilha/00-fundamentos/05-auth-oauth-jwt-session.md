# 05 — Auth: OAuth, JWT e Session

## O que é

**Autenticação** responde "quem é você?". **Autorização** responde "o que você pode fazer?". São problemas diferentes e confundi-los é onde começa a maioria dos bugs de segurança.

**Session cookie** é o padrão clássico: servidor cria uma sessão em memória/banco, manda um `session_id` num cookie `httpOnly`. A cada request, o browser envia o cookie, o servidor busca a sessão e sabe quem é.

```
Browser → POST /login (email + senha)
Server  → cria sessão no Redis, seta cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict
Browser → GET /profile (cookie: session_id=abc123)
Server  → busca sessão abc123 no Redis → retorna dados do usuário
```

**JWT** (JSON Web Token) é um token autocontido: header.payload.signature, assinado com uma chave secreta. O servidor não precisa guardar estado — valida a assinatura e lê o payload.

```ts
// payload decodificado (não criptografado — apenas assinado)
{
  "sub": "user_123",
  "email": "ricalfiff@agconsultorialtda.com",
  "role": "admin",
  "exp": 1748822400  // expira em timestamp Unix
}
```

**OAuth 2.0** é um protocolo de delegação: permite que um app acesse recursos de outro serviço em nome do usuário, sem que o usuário entregue a senha. O fluxo **Authorization Code + PKCE** é o correto para apps web:

```
1. App redireciona para google.com/auth?client_id=X&redirect_uri=Y&scope=email&code_challenge=Z
2. Usuário autoriza no Google
3. Google redireciona para Y com um code temporário
4. App troca o code por access_token + id_token (server-side ou PKCE para SPA)
5. App valida o id_token, extrai email, verifica hd=agconsultorialtda.com
6. App cria sessão própria (não usa o access_token do Google como sessão)
```

---

## Por que cai em entrevista

Auth é onde vazamentos de dado acontecem. Senior/pleno é esperado que saiba tomar decisões aqui sem pesquisar. Variações reais:

- "Qual a diferença entre autenticação e autorização?"
- "Por que guardar JWT no localStorage é problema?"
- "Como funciona OAuth? O que é o Authorization Code Flow?"
- "Quando faz sentido usar JWT vs session cookie?"
- "O que é um refresh token e por que existe?"
- "Como você invalidaria um JWT antes de expirar?"
- "O que é PKCE e por que usar em SPAs?"

---

## Trade-offs (quando usar X vs Y)

### Session Cookie vs JWT

| | Session Cookie | JWT |
|---|---|---|
| Estado no servidor | sim (Redis/DB) | não (stateless) |
| Invalidação imediata | sim — apaga a sessão | difícil — token é válido até `exp` |
| XSS risco | baixo — cookie HttpOnly não é acessível por JS | alto se guardado em localStorage |
| CSRF risco | precisa de proteção (SameSite resolve) | não (não é cookie) |
| Escala horizontal | precisa de Redis compartilhado | nativo — qualquer servidor valida |
| Tamanho | pequeno (apenas ID) | maior — payload cresce com claims |
| Quando usar | apps tradicionais, admin, onde invalidação importa | microserviços stateless, tokens curtos (15min) |

**Regra de bolso:** monolito ou app com logout real → session cookie. Microserviços internos onde os tokens expiram rápido → JWT. Nunca JWT em localStorage — use cookie HttpOnly.

### Onde guardar tokens no browser

| Local | XSS vulnerável? | CSRF vulnerável? | Correto para |
|---|---|---|---|
| `localStorage` | sim — JS lê diretamente | não | nada com JWT de auth |
| Cookie `httpOnly` | não — JS não acessa | sim (precisa SameSite) | session ID, refresh token |
| Cookie `httpOnly; SameSite=Strict` | não | não (para navegação normal) | padrão recomendado |
| Memória da app (variável JS) | sim | não | access token de vida curta (15min) |

### Refresh token

Access token tem vida curta (15 min). Refresh token tem vida longa (30 dias), fica em cookie httpOnly, e serve para pedir novo access token sem o usuário fazer login de novo. Só vale um uso (rotation): ao usar, o servidor invalida o atual e emite um novo.

---

## Exercício aplicado (projeto AG real)

O padrão AG usa Google OAuth com `hd=agconsultorialtda.com`. Está implementado no Café com AG (single-file) e no PULSAR-RH. O exercício é ler o fluxo e desenhar em texto.

### Passo a passo

1. **Encontrar o fluxo de auth no Café com AG (implementação mais simples):**
   ```bash
   find ~/projetos/cafe_com_ag -name "*.html" -o -name "*.js" | head -10
   ```
   ```bash
   grep -n "oauth\|hd\|google\|token\|login\|auth" \
     ~/projetos/cafe_com_ag/*.html 2>/dev/null | head -30
   ```

2. **Encontrar o fluxo no PULSAR-RH (implementação completa):**
   ```bash
   grep -rn "oauth\|hd\|google\|signIn\|session\|jwt\|token" \
     ~/projetos/PULSAR-RH/src/ --include="*.ts" --include="*.js" | grep -v "test\|spec" | head -30
   ```

3. **Escrever o diagrama em texto** (abrir `~/projetos/estudos/rascunhos/auth-diagram.md`):

   ```
   Diagrama: fluxo de auth AG

   [Browser]                    [App AG]                  [Google OAuth]
      │                            │                            │
      │── clica "Login Google" ──→│                            │
      │                            │── redirect para Google ──→│
      │                            │   (client_id, scope,      │
      │                            │    redirect_uri, hd=ag)   │
      │                            │                            │
      │←───────────────────────── redirect para Google ────────│
      │── usuário autoriza ────────────────────────────────────→│
      │←───────────────────── redirect + code ─────────────────│
      │── GET /callback?code=X ──→│                            │
      │                            │── troca code por tokens ──→│
      │                            │←── id_token + access ──────│
      │                            │                            │
      │                            │ valida id_token            │
      │                            │ verifica hd === 'agconsultorialtda.com'
      │                            │ bloqueia se hd diferente   │
      │                            │ cria sessão local          │
      │←── cookie session_id ──────│                            │
      │                            │                            │
      │── GET /dashboard ─────────→│                            │
      │                            │ lê session_id do cookie    │
      │                            │ busca sessão no Redis/DB   │
      │←── 200 dados do usuário ───│                            │
   ```

4. **Identificar: onde o `hd` é validado no código?**
   ```bash
   grep -rn "hd\b\|hosted_domain\|agconsultorialtda" \
     ~/projetos/PULSAR-RH/src/ ~/projetos/cafe_com_ag/ --include="*.ts" --include="*.js" --include="*.html" 2>/dev/null | head -20
   ```

5. **Registrar no `DECISIONS.md` do PULSAR-RH:**
   ```markdown
   ## 2026-06-XX — [auth] Google OAuth + hd restriction como padrão AG

   **Problema:** app multi-tenant precisa restringir acesso ao domínio corporativo.
   **Alternativas:** email/senha próprio (manutenção de hash, reset, etc.), Auth0/Clerk (custo).
   **Decisão:** Google OAuth com validação de `hd === 'agconsultorialtda.com'` no callback.
   **Por quê:** toda equipe AG está no Workspace — zero fricção. Sem senhas para gerenciar.
   Google cuida de MFA, brute force, phishing. Custo: $0 adicional.
   **Atenção:** validar `hd` no servidor, nunca só no cliente. Google retorna o `hd` no id_token
   — verificar após validar a assinatura do token, não antes.
   **Como explicar em entrevista (30s):**
   > "Usamos Google OAuth com Authorization Code Flow. No callback server-side, validamos a
   > assinatura do id_token e verificamos que o campo hd é agconsultorialtda.com — qualquer
   > outro domínio recebe 403. Não armazenamos senhas, não gerenciamos reset. O Google cuida
   > de tudo isso."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que guardar JWT no localStorage é um problema de segurança?"
>
> **R (30s):**
> "Porque localStorage é acessível por qualquer JavaScript rodando na página. Um ataque XSS — por exemplo, um script injetado via input não sanitizado — consegue ler o token e exfiltrá-lo para um servidor externo. Com o JWT, o atacante age como o usuário até o token expirar. Cookie httpOnly não tem esse problema: o browser envia automaticamente nas requests, mas nenhum JS consegue lê-lo. Por isso a recomendação é: access token curto (15 min) em memória ou header, refresh token em cookie httpOnly."

> **P:** "Como funciona o OAuth Authorization Code Flow? Por que existe o PKCE?"
>
> **R (30s):**
> "O app redireciona o usuário pro Google com um client_id e redirect_uri. O Google autentica, redireciona de volta com um code de uso único. O app troca esse code por tokens server-side. O code tem vida de segundos — mesmo que vaze na URL, é inútil sozinho. PKCE (Proof Key for Code Exchange) resolve o caso de SPAs e apps mobile que não podem guardar um client_secret: antes do redirect, o app gera um code_verifier e manda o hash (code_challenge). Ao trocar o code, manda o verifier original — só quem iniciou o fluxo consegue completar."

---

## Checkpoint

- [ ] Consigo explicar autenticação vs autorização com exemplos concretos
- [ ] Sei explicar por que JWT em localStorage é vulnerável e qual a alternativa
- [ ] Desenhei o diagrama de fluxo OAuth do PULSAR-RH ou Café com AG em texto
- [ ] Encontrei onde o `hd` é validado no código AG
- [ ] Recitei ambas as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Auth, OAuth e JWT dominados`.

---

## Recursos

- MDN — [HTTP Cookies](https://developer.mozilla.org/docs/Web/HTTP/Cookies)
- OAuth 2.0 — [Authorization Code + PKCE](https://oauth.net/2/pkce/)
- jwt.io — [JWT debugger e documentação](https://jwt.io/introduction)
- `~/projetos/PULSAR-RH/` e `~/projetos/cafe_com_ag/` — implementações reais AG para referência
