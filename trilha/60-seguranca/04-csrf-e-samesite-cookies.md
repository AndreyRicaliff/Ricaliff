# 04 — CSRF e SameSite Cookies

## O que é

**Cross-Site Request Forgery (CSRF)** é quando um site malicioso faz o browser da vítima enviar uma request autenticada para outro site sem que a vítima saiba. O browser inclui cookies automaticamente em todas as requests para o domínio — se a sessão está em cookie, o atacante usa isso.

O ataque clássico:

```html
<!-- Site do atacante: evil.com -->
<!-- Vítima está logada em bank.com com sessão em cookie -->

<img src="https://bank.com/transfer?to=attacker&amount=5000">
<!-- O browser faz GET para bank.com automaticamente ao carregar a página -->
<!-- Inclui o cookie de sessão de bank.com — o banco executa a transferência -->

<!-- Para POST, o atacante usa formulário auto-submit: -->
<form id="f" action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker">
  <input name="amount" value="5000">
</form>
<script>document.getElementById('f').submit()</script>
```

A vítima visita `evil.com` e sem clicar em nada a request é enviada com a autenticação dela.

---

### Por que isso é possível

O browser envia cookies para `bank.com` em QUALQUER request para esse domínio — independente de qual site iniciou a request. Esse comportamento é design histórico do HTTP. CSRF existe porque:

1. Sessão autenticada está em cookie
2. Cookie é enviado automaticamente pelo browser
3. O servidor não consegue distinguir request legítima de request forjada apenas pelo cookie

---

### Solução 1: SameSite Cookie Attribute

`SameSite` instrui o browser a **não enviar o cookie** em requests cross-site.

```
Set-Cookie: session=abc123; SameSite=Strict; HttpOnly; Secure
```

| Valor | Comportamento | Caso de uso |
|---|---|---|
| `Strict` | Cookie nunca enviado em requests cross-site — nem navegação simples | Apps bancários, admin panels — máxima proteção |
| `Lax` | Cookie enviado em navegação de nível superior (clicar link, digitar URL), não em sub-resources (imagens, iframes, fetch) | Default atual dos browsers; adequado para maioria dos apps |
| `None` | Enviado em todas as requests cross-site — precisa de `Secure` | Para cookies de terceiros (analytics, widgets) — evitar quando possível |

`SameSite=Lax` é o default nos browsers modernos (Chrome desde 2020) — mas não é o default quando você configura manualmente o `Set-Cookie`. Se você não especifica, comportamento varia por browser.

**Regra AG:** qualquer cookie de sessão deve ter `SameSite=Lax` no mínimo, `Strict` em rotas críticas.

---

### Solução 2: CSRF Token

Para casos onde SameSite não é suficiente (legado, terceiros, `SameSite=None`):

```
1. Servidor gera token aleatório criptograficamente seguro por sessão
2. Token é incluído em todo formulário como campo hidden
3. Token é enviado no header em requests AJAX (X-CSRF-Token ou similar)
4. Servidor valida o token em toda request de escrita (POST/PUT/DELETE/PATCH)
5. Atacante não tem acesso ao token (Same-Origin Policy impede ler o DOM do outro domínio)
```

```ts
// Express com csurf (ou equivalente):
import csrf from 'csurf'
const csrfProtection = csrf({ cookie: true })

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() })
})

app.post('/submit', csrfProtection, (req, res) => {
  // csurf valida o token automaticamente — lança erro se inválido
  res.json({ success: true })
})
```

```html
<!-- Template com token: -->
<form method="POST" action="/submit">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- demais campos -->
</form>
```

**Double-submit pattern** (sem estado no servidor):

```
1. Servidor gera token aleatório
2. Token enviado como cookie E como campo de formulário (ou header)
3. No request: server compara o cookie com o campo/header
4. Se iguais: legítimo (atacante não pode escrever cookie para outro domínio)
```

---

### Por que JWT em header também ajuda

Se você usa JWT em `Authorization: Bearer <token>` em vez de cookie:

```
- Browser não envia headers Authorization automaticamente em requests cross-site
- Atacante precisaria de JavaScript no mesmo domínio para ler o token
- Same-Origin Policy bloqueia JS de evil.com ler storage de app.com
- Logo: JWT em header = CSRF não se aplica por design
```

**Atenção:** se você guarda o JWT em cookie (para SSR ou simplicidade), volta a ser vulnerável a CSRF e precisa de SameSite.

| Armazenamento de JWT | CSRF vulnerability | XSS vulnerability |
|---|---|---|
| `localStorage` | Não vulnerável | Vulnerável (JS pode ler) |
| `sessionStorage` | Não vulnerável | Vulnerável (JS pode ler) |
| Cookie `HttpOnly` | Vulnerável (precisa SameSite) | Não vulnerável (JS não lê) |
| Cookie `HttpOnly` + `SameSite=Strict` | Não vulnerável | Não vulnerável | 

Para a AG (apps internos com Google OAuth): o token de sessão provavelmente está em cookie ou localStorage. Se em cookie, adicionar `SameSite=Strict`.

---

## Por que cai em entrevista

CSRF é diferenciador — poucos candidatos júnior sabem explicar o mecanismo com precisão. Os que sabem se destacam. A pergunta costuma ser:

- "O que é CSRF e como você protege uma API REST?"
- "Qual a diferença entre CSRF token e SameSite?"
- "Se minha API aceita só JSON, preciso de proteção CSRF?"

Resposta para a última: APIs REST que aceitam só `Content-Type: application/json` são naturalmente mais resistentes (forms HTML só enviam `application/x-www-form-urlencoded` ou `multipart/form-data`). Mas `fetch` cross-site com `credentials: 'include'` pode enviar JSON — então SameSite continua importante.

---

## Trade-offs

| Proteção | Vantagem | Custo |
|---|---|---|
| `SameSite=Strict` | Zero CSRF sem estado extra | Quebra links externos para página autenticada (usuário chega sem cookie) |
| `SameSite=Lax` | Boa proteção com UX normal | Não cobre requests AJAX cross-site com `credentials: 'include'` |
| CSRF Token | Funciona em qualquer browser, mesmo legado | Estado no servidor ou double-submit; complexidade |
| JWT em header (Bearer) | CSRF grátis; stateless | Token em localStorage é vulnerável a XSS |
| CORS restrito + SameSite=Lax | Defense in depth | Não é bala de prata — CORS é para browser, não para curl/Postman |

---

## Exercício aplicado (projeto AG real)

```bash
# Meet Hub tem Express com rotas autenticadas — revisar os cookies de sessão

cd ~/projetos/meet-hub

# 1. Encontrar onde cookies de sessão são configurados
grep -rn "cookie\|session\|SameSite\|httpOnly\|secure" \
  apps/api/src/ --include="*.ts" | grep -v "//\|node_modules"

# 2. Verificar o express-session config ou cookie-parser
grep -rn "express-session\|cookie-parser\|helmet" \
  apps/api/ --include="*.ts" --include="*.json"

# 3. Verificar onde JWT é armazenado no frontend
grep -rn "localStorage\|sessionStorage\|cookie" \
  apps/web/src/ --include="*.ts" --include="*.tsx"

# 4. Para cada cookie encontrado, classificar:
#    - Tem SameSite? Qual valor?
#    - Tem HttpOnly? (protege de XSS)
#    - Tem Secure? (só HTTPS — obrigatório em prod)
#    - É cookie de sessão de auth? Se sim, SameSite=Strict é o ideal

# 5. Em desenvolvimento local (HTTP), Secure=false é ok
#    Em produção (HTTPS), Secure deve ser true
```

Tabela de classificação esperada ao final:

```markdown
## DECISIONS.md — 2026-06-XX — [security] cookie audit Meet Hub

| Cookie | HttpOnly | SameSite | Secure | Ação |
|---|---|---|---|---|
| session | ? | ? | ? | ? |
| [jwt] | ? | ? | ? | ? |

**Conclusões:**
- [listar o que está ok e o que precisa de fix]
**Próximos passos:**
- Adicionar helmet() em todos os projetos AG com Express
- Garantir SameSite=Lax no mínimo em cookies de sessão

**Como explicar em entrevista (30s):**
> "Auditei os cookies do Meet Hub. Encontrei cookie de sessão sem SameSite explícito — comportamento variava por browser. Adicionei SameSite=Lax (adequado para app interno) e HttpOnly para proteção adicional contra XSS. Para rotas de admin adotamos JWT em Bearer header — CSRF não se aplica por design."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que é CSRF e como SameSite resolve isso?"
>
> **R (30s):**
> "CSRF é quando um site malicioso força o browser da vítima a fazer uma request autenticada para outro site. Funciona porque o browser envia cookies automaticamente para o domínio — o atacante explora isso. SameSite no cookie instrui o browser a só enviar o cookie quando a request parte do mesmo site. Com `SameSite=Strict`, o cookie não é enviado em nenhuma request cross-site. Com `Lax`, é enviado em navegação direta mas não em sub-resources ou fetch com credentials. Para a maioria dos apps, `Lax` é suficiente e é o default atual dos browsers modernos."

> **P:** "Se minha API usa JWT em Authorization header, preciso me preocupar com CSRF?"
>
> **R (30s):**
> "Não, se o JWT está em `Authorization: Bearer` header. O browser não envia headers customizados em requests cross-site automáticas — form e tag de imagem nunca incluem Authorization. Então o atacante não tem como forjar a request com credenciais. O risco vira XSS: se o JWT está em localStorage, JavaScript malicioso pode lê-lo. Por isso o par ideal é JWT em cookie `HttpOnly` (protege de XSS) com `SameSite=Strict` (protege de CSRF)."

---

## Checkpoint

- [ ] Consigo explicar o mecanismo do CSRF sem consultar (por que o browser envia cookies automaticamente)
- [ ] Sei a diferença entre `SameSite=Strict`, `Lax` e `None` e quando usar cada um
- [ ] Auditei os cookies do Meet Hub e documentei o resultado
- [ ] Entendo por que JWT em `Authorization` header elimina CSRF por design
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN — SameSite cookies](https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [web.dev — SameSite cookies explained](https://web.dev/samesite-cookies-explained/) — explicação visual do comportamento por valor
- [helmet.js](https://helmetjs.github.io/) — inclui configuração de cookies seguros para Express
