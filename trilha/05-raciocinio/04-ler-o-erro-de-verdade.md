# 04 — Ler o Erro de Verdade

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

A maioria dos bugs "difíceis" são erros que **ninguém leu**. O stack trace é a mensagem mais precisa que um sistema te dá de graça — ele responde três perguntas de uma vez: **o que** falhou (a mensagem literal), **onde** (o frame), **por qual caminho** (a pilha) — e o reflexo júnior é pular direto pro Google/IA com uma *paráfrase*, jogando fora a informação exata e ficando com a aproximação. Ler o erro de verdade é a habilidade de maior retorno por minuto no debugging inteiro: cinco segundos de leitura atenta cortam camadas de busca que uma hora de chute não corta. Este módulo é sobre parar de traduzir o erro pra depois e começar a **lê-lo como dado**.

---

## § BASE — o fundamento

**O que é um stack trace, estruturalmente.** Quando uma função chama outra, o runtime empilha um **frame** (quem chamou, com quais argumentos, em que linha). A pilha de chamadas é essa torre de frames. Quando uma exceção estoura, ela é lançada no topo e **desenrola a pilha** (stack unwinding) procurando quem a trate; o stack trace é o retrato dessa torre no instante da falha. Ele não é ruído — é a **rota exata** que o programa percorreu até quebrar, do `main` até a linha que explodiu. Por isso a informação é insubstituível: nenhuma busca no Google reconstrói o *teu* caminho.

**Onde mora a mensagem real (a pegadinha de direção).** A convenção de leitura muda por runtime, e ler na direção errada é o erro nº 1:
- **Python:** leia **de baixo pra cima**. O traceback começa com "most recent call last" e a **última linha** é o tipo + mensagem do erro real; as linhas acima são o caminho, do mais antigo ao mais recente.
- **Node/JS/Java:** **inverte** — a mensagem vem na **primeira** linha e o frame do topo (`at ...`) é onde o erro foi lançado; desce pra origem.

Em qualquer runtime a regra que vale sempre: **ache a mensagem original e o primeiro frame que é código SEU.** Frames de `node_modules`/stdlib dizem por onde o erro *passou*, não de quem é a culpa — a culpa quase sempre está no primeiro frame do teu código na pilha.

**Erros encadeados — desça até a raiz.** Runtimes modernos encadeiam exceções: `Error.cause` (JavaScript, ES2022), `raise ... from ...` (Python), `caused by` (Java). O erro de cima é o **embrulho**; o de baixo é a **causa raiz**. `FunctionsHttpError: non-2xx` embrulhando `column "cc_id" does not exist` — o embrulho te diz "deu ruim no HTTP", a raiz te diz *exatamente* o quê. Ler só o embrulho é ler o índice em vez do capítulo.

**A mensagem literal é dado, não decoração.** Cada camada da pilha de rede falha com uma **assinatura própria**, e reconhecê-la corta ~80% do espaço de busca *antes* da primeira hipótese:

| Camada | Assinatura típica | O que significa |
|---|---|---|
| DNS | `ENOTFOUND`, `EAI_AGAIN` | o nome não resolve — host errado ou DNS fora |
| TCP | `ECONNREFUSED`, `ETIMEDOUT` | chegou na máquina mas ninguém atende na porta / rota morta |
| TLS | `CERT_HAS_EXPIRED`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | conexão abriu, o certificado é o problema |
| HTTP | `401`, `403`, `404`, `429`, `500` | falou HTTP — auth, rota, rate-limit ou erro do servidor |
| Aplicação | exceção sua (`TypeError`, SQL error) | passou por tudo; a lógica é o problema |

`ECONNREFUSED 127.0.0.1:5432` diz três coisas numa linha: camada TCP, host local, porta do Postgres — **o banco não está de pé ou você apontou pro lugar errado**; nem adianta olhar SQL, o problema é anterior. A camada te diz *onde não procurar*, que é metade do trabalho.

**Por que o cérebro pula a leitura.** Kahneman de novo (módulo 01): diante da pergunta difícil "o que este erro específico está me dizendo?", o Sistema 1 faz **substituição de atributo** — troca por uma pergunta mais fácil, "o que os outros fizeram com um erro parecido?", e sai pro Google. A substituição *sente-se* como progresso, mas você trocou o dado exato (teu stack) por aproximações de estranhos. Ler o erro é resistir a essa troca automática.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O erro se propaga em camadas, e você lê **de fora pra dentro** até chegar na raiz:

```
FunctionsHttpError: Edge Function returned non-2xx   ← embrulho (o front vê isso)
   └─ HTTP 500 no corpo da resposta                   ← camada: falou HTTP, erro do servidor
        └─ PostgrestError: column "cc_id" does not…   ← camada: SQL — a CAUSA RAIZ
             ↑ aqui é onde você corrige
```

Duas leis de navegação:

1. **A camada primeiro, a linha depois.** Antes de "qual linha do meu código", pergunte "qual camada falhou" — a assinatura do erro responde isso em segundos e elimina camadas inteiras. Um `403` não se resolve lendo SQL; um `ECONNREFUSED` não se resolve lendo lógica de negócio.
2. **A raiz vence o embrulho.** Sempre desça a cadeia de `cause` até o erro que não embrulha mais ninguém. O último é o único que aponta pra correção; os de cima só dizem "por onde passou".

O inimigo estrutural dessa navegação é o **`catch` que destrói a cadeia**. Um `catch` que engole ou reembrulha sem `cause` **apaga a raiz** e te deixa só com o embrulho genérico — é o mecanismo que transforma um bug de 5 minutos num de 5 horas. Preservar a cadeia é uma decisão que você toma no código *antes* do bug existir (é por isso que este módulo conversa com o 50-backend/logging).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LER a mensagem literal em voz alta** — a original, não a paráfrase. Se você não consegue repetir a mensagem exata, você não a leu.

**2. NOMEAR a camada** pela assinatura (DNS/TCP/TLS/HTTP/app). Isso elimina camadas inteiras do espaço de busca antes de qualquer hipótese.

**3. DESCER a cadeia de causas** até o erro raiz — ignore os embrulhos, corrija na raiz.

**4. ACHAR o primeiro frame do SEU código** na pilha, na direção certa do runtime (Python de baixo, Node de cima).

**5. REPRODUZIR com o menor comando** que dispara o erro — sem reprodução não há prova de fix (módulo 01).

**6. CORRIGIR** com a mensagem exata entre aspas na busca (não a paráfrase) e **RE-RODAR o mesmo comando** pra ver o output mudar.

**Anti-padrões:**
- **Parafrasear pro Google:** "deu erro de coluna" em vez de `column "cc_id" does not exist`. Você trocou o dado exato por uma aproximação — a substituição de atributo do Kahneman em ação.
- **`catch` vazio ou reembrulho sem causa:** destrói a raiz. É o crime que torna o resto do módulo impossível.
- **Ler na direção errada:** procurar a mensagem no topo do traceback Python (onde está o caminho, não a causa).
- **Corrigir o embrulho:** mexer no handler HTTP quando a raiz é um erro de SQL três níveis abaixo.

**O código que preserva vs destrói a evidência:**

```ts
// ❌ destrói a evidência — o embrulho vira o único erro que sobrevive
try { await syncPage(page) } catch { throw new Error('sync falhou') }

// ✅ preserva a cadeia (Error.cause, ES2022) — a raiz chega até quem lê
try { await syncPage(page) }
catch (err) { throw new Error(`sync falhou na página ${page}`, { cause: err }) }
```

Caso real AG: no pipeline DRE/DFC do **Pulsar Finance**, a chamada de edge function retornava só `FunctionsHttpError` — genérico. O corpo da resposta com o erro real (status e mensagem vindos do ERP-externo) **existia**, mas estava em `error.context`, que ninguém lia. Horas de chute foram economizadas no dia em que o handler passou a logar o corpo — a raiz sempre esteve lá, só não estava sendo lida.

**Aplicado — reproduzir antes de corrigir:**

```bash
# 1. Reproduzir fora do app — a mesma request que o front faz:
curl -s -i -X POST "$URL/functions/v1/gerar-dre" \
  -H "Authorization: Bearer $ANON_KEY" -d '{"competencia":"2026-06"}'
# 2. Ler status + corpo LITERALMENTE (não parafrasear):
#    500 + {"error":"column \"cc_id\" does not exist"}
#    → camada: SQL. Não é auth, não é rede — nem gastar tempo lá.
# 3. Só agora buscar/corrigir — com a mensagem exata entre aspas
# 4. Re-rodar o MESMO curl e ler o output mudar → prova do fix
```

---

## Passo-a-passo aplicado (faça agora, ~20min)

Pegue o último stack trace que te travou (ou force um erro no teu projeto):

1. Sem olhar o código, **leia a mensagem literal em voz alta**. Consegue repetir a linha exata? Se não, releia — você tinha pulado.
2. **Nomeie a camada** pela assinatura. É DNS/TCP/TLS/HTTP/app? Que camadas isso já **elimina**?
3. Se houver `cause`/`caused by`/`from`, **desça até a raiz**. Escreva qual erro é o embrulho e qual é a causa.
4. Ache o **primeiro frame do teu código** na direção certa do runtime.
5. Reproduza com **um comando mínimo** (`curl`, um script de 3 linhas) e confira que ele dispara o mesmo erro literal.
6. Só então corrija — e re-rode o mesmo comando pra ler o output mudar.

## Por que cai em entrevista

Entrevistas de debugging ao vivo (comuns pra pleno) colocam um erro na tela e observam o **primeiro movimento**. Quem lê a mensagem em voz alta, nomeia a camada e localiza o primeiro frame próprio passa; quem alt-taba pro Google antes de ler o erro termina a entrevista mais cedo — porque acabou de mostrar que joga fora o dado mais preciso do sistema.

> **P:** "Aparece um erro que você nunca viu. Qual é o seu processo?"
>
> **R (30s):** "Primeiro leio a mensagem literal e o stack até o primeiro frame que é meu código — a mensagem me dá a camada: ECONNREFUSED é rede, 403 é permissão, exceção minha é lógica. Depois reproduzo com o menor comando possível, geralmente um curl, porque fix sem reprodução não tem prova. Só então pesquiso, com a mensagem exata entre aspas. E se o erro chegou genérico, minha primeira suspeita é um catch no caminho engolindo a causa — já perdi horas com um wrapper que escondia o corpo da resposta onde estava o erro verdadeiro."

> **P:** "O erro que chegou é genérico demais pra te dizer algo. E agora?"
>
> **R (30s):** "Genérico quase nunca é o erro real — é um embrulho. Minha primeira hipótese é que a causa raiz existe mas foi engolida por um catch no caminho que reembrulhou sem preservar a cause. Então eu vou no ponto de captura e faço ele logar o erro original inteiro: em JS, o Error.cause; muitas vezes o corpo da resposta com a mensagem verdadeira já está lá num campo tipo error.context que ninguém estava lendo. Aconteceu exatamente isso num pipeline financeiro nosso — o FunctionsHttpError era só a casca, o erro de SQL de verdade estava no corpo. Ler a raiz transformou horas de chute em cinco minutos."

## Checkpoint

- [ ] Sei em qual ponta fica a mensagem real em Python (embaixo) e em Node (em cima)
- [ ] Identifico a camada (DNS/TCP/TLS/HTTP/app) só pela assinatura do erro
- [ ] Desço a cadeia de `cause`/`caused by` até a raiz antes de corrigir
- [ ] Acho o primeiro frame de código meu num trace cheio de node_modules
- [ ] Uso `Error.cause` (ou log do corpo) em todo catch que reembrulha
- [ ] No último bug, reproduzi com um comando mínimo ANTES de mexer no código

## Recursos

- MDN — *JavaScript Reference: Error.cause* (o encadeamento de erros do ES2022)
- Node.js — documentação de erros: a tabela dos códigos `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT` e afins
- *Debugging: The 9 Indispensable Rules* — David J. Agans: "Read the Error Message" e "Understand the System"
- Julia Evans — zines de debugging (jvns.ca / wizardzines.com): mindset de ler o erro como dado
- Módulo `50-backend/07-logging-estruturado-pino.md` desta trilha — como logar pra conseguir ler a raiz depois
