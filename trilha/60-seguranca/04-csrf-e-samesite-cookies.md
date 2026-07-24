# 04 — CSRF e SameSite Cookies

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**Cross-Site Request Forgery (CSRF)** é quando um site malicioso faz o browser da vítima enviar uma request **autenticada** para outro site sem que ela saiba. O browser anexa cookies automaticamente a toda request para o domínio — se a sessão vive em cookie, o atacante usa isso. XSS rouba a credencial; CSRF não precisa roubá-la, ele **usa a que o browser já anexa sozinho**.

```html
<!-- evil.com; vítima logada em bank.com com sessão em cookie -->
<img src="https://bank.com/transfer?to=attacker&amount=5000">  <!-- GET dispara ao carregar -->
<form id="f" action="https://bank.com/transfer" method="POST">   <!-- POST via auto-submit -->
  <input name="to" value="attacker"><input name="amount" value="5000">
</form><script>document.getElementById('f').submit()</script>
```

A vítima só visita `evil.com` — e a request sai com a autenticação dela.

---

## § BASE — o fundamento

**A fraqueza tem nome e número: CWE-352** — *Cross-Site Request Forgery*. Mas o nome que *explica* CSRF é mais antigo e mais fundo: é o problema do **confused deputy** (delegado confuso), descrito por **Norm Hardy em 1988** (*The Confused Deputy*, ACM SIGOPS Operating Systems Review). A ideia: um programa com autoridade legítima é **enganado por um terceiro** a usar essa autoridade em benefício do atacante. No CSRF, o *deputy* é o **browser da vítima** — ele carrega a autoridade dela (o cookie de sessão) e é induzido, por uma página do atacante, a exercê-la contra o servidor. O servidor recebe uma request perfeitamente autenticada e não tem como saber que a *intenção* não veio do usuário.

**A causa mecânica: ambient authority.** O cookie é uma **credencial ambiente** — o browser o anexa a *toda* request para o domínio, independentemente de qual site originou a request. Esse é o comportamento histórico do HTTP, anterior à noção de origem como fronteira de segurança. CSRF existe pela conjunção de três fatos:
1. a sessão autenticada está em cookie;
2. o cookie é enviado **automaticamente** pelo browser;
3. o servidor não distingue request legítima de forjada olhando só o cookie.

**A precondição que quase ninguém cita: métodos que mudam estado por GET.** O `<img src="https://bank.com/transfer?...">` só funciona porque o endpoint de transferência aceitou um **GET com efeito colateral**. A **RFC 7231, §4.2.1 (Safe Methods)** é explícita: GET e HEAD são *safe* — não devem ter efeito de estado no servidor. Um endpoint que transfere dinheiro por GET viola a spec e abre o vetor CSRF mais barato que existe. Respeitar a semântica dos métodos (mutação só em POST/PUT/PATCH/DELETE) já elimina a forma mais simples do ataque.

**A defesa moderna está na spec do cookie: `SameSite`.** O atributo `SameSite` é definido na **RFC 6265bis** (*Cookies: HTTP State Management Mechanism*, a revisão em andamento da RFC 6265), seção 5.2, com três valores — `Strict`, `Lax`, `None`. Ele instrui o browser a **não anexar o cookie** em requests *cross-site*, cortando o passo (2) da causa. Ponto de precisão: o comportamento **`Lax` por padrão** (quando o atributo é omitido) é **política de browser**, adotada pelo Chrome 80 em fevereiro de 2020 e seguida pelos demais — a spec recomenda, mas o default efetivo veio da implementação. Ou seja: em browser moderno o default é `Lax`; num cliente antigo ou não-browser, o comportamento sem atributo é indefinido — por isso a AG **sempre declara** o `SameSite` explicitamente.

**A defesa que protege o token é a Same-Origin Policy.** O padrão do CSRF token (abaixo) só funciona porque a SOP impede o JavaScript de `evil.com` de **ler** o DOM ou a response de `app.com`. O atacante consegue *disparar* a request, mas não consegue *ler* o token embutido na página — e sem o token, o servidor rejeita. CSRF é, no fundo, uma assimetria: o atacante escreve, mas não lê.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As defesas se empilham; cada uma corta um passo da causa:

```
CAUSA (3 passos)                    DEFESA QUE CORTA                        CAMADA
1. sessão em cookie                 → JWT em Authorization header            elimina o vetor
2. cookie anexado automaticamente   → SameSite=Strict/Lax (RFC 6265bis)      1ª linha
3. servidor não distingue intenção  → CSRF token (SOP protege o token)       fallback / legado
   + endpoint muda estado por GET   → respeitar RFC 7231 (mutação ≠ GET)     higiene de base
```

**SameSite — os três valores:**

| Valor | Comportamento | Caso de uso |
|---|---|---|
| `Strict` | nunca enviado cross-site — nem em navegação simples | banco, admin — máxima proteção |
| `Lax` | enviado em navegação top-level (clicar link, digitar URL), não em sub-resource (img, iframe, fetch) | default dos browsers modernos; adequado à maioria |
| `None` | enviado em todas as cross-site — **exige** `Secure` | cookie de terceiro (analytics, widget) — evitar |

```
Set-Cookie: session=abc123; SameSite=Strict; HttpOnly; Secure
```

**Regra AG:** cookie de sessão tem `SameSite=Lax` no mínimo, `Strict` em rotas críticas — sempre explícito.

**CSRF token (para legado, terceiros, `SameSite=None`):**

```ts
import csrf from 'csurf'
const csrfProtection = csrf({ cookie: true })
app.get('/form', csrfProtection, (req, res) => res.render('form', { csrfToken: req.csrfToken() }))
app.post('/submit', csrfProtection, (req, res) => res.json({ success: true }))  // valida automático
```

O fluxo: servidor gera token aleatório por sessão → embute no form (`<input type=hidden>`) ou no header (`X-CSRF-Token`) → valida em toda escrita (POST/PUT/DELETE/PATCH). O atacante não lê o token (SOP). Variante sem estado no servidor: **double-submit** — token vai como cookie *e* como campo; o servidor compara os dois (o atacante não consegue escrever cookie para outro domínio).

**JWT em header dispensa CSRF por design:**

```
Authorization: Bearer <token>  → o browser NÃO anexa headers custom em cross-site automático.
Form e <img> nunca incluem Authorization → atacante não forja a request com credencial.
```

**Mas o armazenamento troca um risco por outro:**

| Armazenamento do JWT | CSRF | XSS |
|---|---|---|
| `localStorage` / `sessionStorage` | não vulnerável | vulnerável (JS lê) |
| Cookie `HttpOnly` | vulnerável (precisa SameSite) | não vulnerável (JS não lê) |
| Cookie `HttpOnly` + `SameSite=Strict` | não vulnerável | não vulnerável |

O par ideal é a última linha. Para a AG (apps internos com Google OAuth): se o token de sessão está em cookie, adicionar `SameSite=Strict`.

**Trade-off das proteções:**

| Proteção | Vantagem | Custo |
|---|---|---|
| `SameSite=Strict` | zero CSRF sem estado extra | quebra link externo p/ página autenticada (chega sem cookie) |
| `SameSite=Lax` | boa proteção, UX normal | não cobre fetch cross-site com `credentials: 'include'` |
| CSRF token | funciona em qualquer browser, mesmo legado | estado no servidor ou double-submit; complexidade |
| JWT em header | CSRF grátis; stateless | token em localStorage é vulnerável a XSS |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LOCALIZAR onde a sessão vive.** Cookie ou header? Se cookie, CSRF se aplica e SameSite é obrigatório. Se `Authorization: Bearer`, CSRF não se aplica — o risco vira XSS.

**2. AUDITAR a semântica dos métodos.** Nenhum endpoint muda estado por GET (RFC 7231). `git grep` por rotas `app.get` que fazem `INSERT/UPDATE/DELETE` — cada uma é um vetor CSRF trivial.

**3. DECLARAR SameSite explicitamente.** `Lax` no mínimo, `Strict` em rota crítica. Nunca depender do default implícito do browser. Junto: `HttpOnly` (corta XSS de leitura) e `Secure` (só em prod HTTPS).

**4. ADICIONAR CSRF token onde SameSite não basta.** Fluxo com terceiros, `SameSite=None`, ou navegador legado no público-alvo. Preferir double-submit se não quiser estado no servidor.

**5. VERIFICAR com request cross-origin.** Uma página de teste em outra origem disparando POST para o endpoint: com a defesa correta, o servidor rejeita (cookie não anexado ou token ausente).

**Anti-padrões:**
- **Mutação por GET:** o vetor mais barato de todos, e viola a RFC 7231. Mutação só em POST/PUT/PATCH/DELETE.
- **Confiar no default implícito do SameSite:** varia por browser e não existe fora de browser. Declare sempre.
- **JWT em localStorage "porque é simples":** troca CSRF por XSS — e XSS é mais comum. Se puder, cookie `HttpOnly` + `SameSite`.
- **Achar que "API só-JSON" é imune:** forms HTML só mandam `urlencoded`/`multipart`, mas `fetch` cross-site com `credentials:'include'` manda JSON — SameSite continua necessário.

---

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
cd ~/projetos/meet-hub
# 1. Onde os cookies de sessão são configurados
grep -rn "cookie\|session\|SameSite\|httpOnly\|secure" apps/api/src/ --include="*.ts" | grep -v "//\|node_modules"
# 2. Config de express-session / cookie-parser / helmet
grep -rn "express-session\|cookie-parser\|helmet" apps/api/ --include="*.ts" --include="*.json"
# 3. Onde o JWT é armazenado no frontend
grep -rn "localStorage\|sessionStorage\|cookie" apps/web/src/ --include="*.ts" --include="*.tsx"
# 4. Endpoints que mudam estado por GET (vetor CSRF trivial — RFC 7231)
grep -rn "app\.get\|router\.get" apps/api/src/ --include="*.ts" -A3 | grep -i "insert\|update\|delete\|create"
```

Para cada cookie: tem `SameSite`? qual valor? `HttpOnly`? `Secure`? É sessão de auth (então `Strict` é o ideal)?

```markdown
## DECISIONS.md — 2026-06-XX — [security] cookie audit Meet Hub
| Cookie | HttpOnly | SameSite | Secure | Ação |
|---|---|---|---|---|
| session | ? | ? | ? | ? |
| [jwt]   | ? | ? | ? | ? |
**Endpoints que mutam por GET:** [listar — corrigir p/ POST/PATCH]
**Próximos passos:** helmet() em todos os projetos AG; SameSite=Lax mínimo em sessão.
**Em entrevista (30s):**
> "Auditei os cookies do Meet Hub. Cookie de sessão sem SameSite explícito — comportamento
> variava por browser. Adicionei SameSite=Lax (app interno) + HttpOnly. Rotas de admin usam
> JWT em Bearer header — CSRF não se aplica por design."
```

## Por que cai em entrevista

CSRF é **diferenciador** — poucos júnior explicam o mecanismo com precisão; quem sabe se destaca. Perguntas típicas: "o que é CSRF e como proteger uma API REST?", "diferença entre CSRF token e SameSite?", "se minha API aceita só JSON, preciso de proteção CSRF?". (Resposta da última: mais resistente, mas não imune — `fetch` cross-site com `credentials:'include'` manda JSON; SameSite continua importando.)

> **P:** "O que é CSRF e como SameSite resolve isso?"
>
> **R (30s):**
> "CSRF é quando um site malicioso força o browser da vítima a fazer uma request autenticada para outro site. Funciona porque o browser envia cookies automaticamente para o domínio — o atacante explora isso. SameSite no cookie instrui o browser a só enviar o cookie quando a request parte do mesmo site. Com `SameSite=Strict`, o cookie não é enviado em nenhuma request cross-site. Com `Lax`, é enviado em navegação direta mas não em sub-resources ou fetch com credentials. Para a maioria dos apps, `Lax` é suficiente e é o default atual dos browsers modernos."

> **P:** "Se minha API usa JWT em Authorization header, preciso me preocupar com CSRF?"
>
> **R (30s):**
> "Não, se o JWT está em `Authorization: Bearer` header. O browser não envia headers customizados em requests cross-site automáticas — form e tag de imagem nunca incluem Authorization. Então o atacante não tem como forjar a request com credenciais. O risco vira XSS: se o JWT está em localStorage, JavaScript malicioso pode lê-lo. Por isso o par ideal é JWT em cookie `HttpOnly` (protege de XSS) com `SameSite=Strict` (protege de CSRF)."

> **P:** "Por que CSRF é chamado de 'confused deputy' e o que isso te diz sobre a defesa?"
>
> **R (30s):**
> "Porque o browser é um delegado que carrega a autoridade da vítima — o cookie de sessão — e é enganado por uma página de terceiro a usar essa autoridade contra o servidor. É o problema do confused deputy, do Norm Hardy, de 1988: quem age tem a permissão, mas a intenção veio de outro. Isso me diz que a defesa não é 'validar o cookie' — o cookie é válido — é reamarrar a autoridade à intenção do usuário: SameSite (o browser só anexa se a navegação partiu do meu site) ou um token que o atacante não consegue ler por causa da Same-Origin Policy. E respeitar a RFC 7231, nunca mutar estado por GET, que é o que deixa um `<img>` disparar a ação."

## Checkpoint

- [ ] Explico o mecanismo do CSRF via confused deputy / ambient authority, sem consultar
- [ ] Sei que é CWE-352 e que `SameSite` é definido na RFC 6265bis §5.2
- [ ] Sei a diferença entre `Strict`, `Lax` e `None` e por que declaro sempre explícito
- [ ] Explico por que mutar estado por GET (contra a RFC 7231) é o vetor CSRF mais barato
- [ ] Entendo por que JWT em `Authorization` header elimina CSRF, e o risco que ele adiciona (XSS)
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- CWE-352 (MITRE) — *Cross-Site Request Forgery*: a definição canônica
- *The Confused Deputy* — Norm Hardy (ACM SIGOPS OSR, 1988): o modelo mental que explica CSRF (e por que a defesa é reamarrar autoridade à intenção)
- RFC 6265bis — *Cookies: HTTP State Management Mechanism*, §5.2: o atributo `SameSite` (Strict/Lax/None)
- RFC 7231, §4.2.1 — *Safe Methods*: por que GET não pode ter efeito de estado (a precondição do CSRF via `<img>`)
- OWASP *CSRF Prevention Cheat Sheet* — SameSite, synchronizer token, double-submit
- MDN — *Set-Cookie / SameSite* (comportamento por valor, por seção)
- Módulo-irmão `02-xss` — a defesa complementar: `HttpOnly` cobre XSS, `SameSite` cobre CSRF; o token ideal precisa dos dois
