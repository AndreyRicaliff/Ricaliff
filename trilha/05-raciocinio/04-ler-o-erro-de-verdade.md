# 04 — Ler o Erro de Verdade

## O que é

A maioria dos bugs "difíceis" são erros que ninguém leu. O stack trace responde três perguntas — **o que** falhou (a mensagem literal), **onde** (o frame), **por qual caminho** (a pilha) — e o reflexo júnior é pular direto pro Google/IA com uma paráfrase, jogando fora a informação mais precisa que o sistema dá de graça.

**Anatomia:** em Python, leia de baixo pra cima — a última linha é o tipo + mensagem do erro real, e o traceback acima ("most recent call last") mostra o caminho. Em Node inverte: a mensagem vem na primeira linha e o frame do topo é onde o erro foi lançado. Em qualquer runtime a regra prática é a mesma: **ache a mensagem original e o primeiro frame que é código SEU** — frames de `node_modules` dizem por onde o erro passou, não de quem é a culpa. Com erros encadeados (`caused by`, `Error.cause`), desça a cadeia até o erro raiz: o de cima é embrulho.

**A mensagem literal é dado, não decoração.** `ECONNREFUSED 127.0.0.1:5432` diz: camada TCP, host local, porta do Postgres — o banco não está de pé OU você apontou pro lugar errado; nem adianta olhar SQL. Cada camada falha com assinatura própria: DNS (`ENOTFOUND`), TCP (`ECONNREFUSED`/`ETIMEDOUT`), TLS (`CERT_*`), HTTP (status 4xx/5xx), aplicação (exceção sua). Identificar a camada corta 80% do espaço de busca antes da primeira hipótese.

### Erro genérico vs erro com contexto

O crime que torna tudo isso impossível: `catch` que engole ou reembrulha sem causa.

```ts
// ❌ destrói a evidência
try { await syncPage(page) } catch { throw new Error('sync falhou') }

// ✅ preserva a cadeia (Error.cause, ES2022)
try { await syncPage(page) }
catch (err) { throw new Error(`sync falhou na página ${page}`, { cause: err }) }
```

Caso real AG: no pipeline DRE/DFC do **Pulsar Finance**, a chamada de edge function retornava só `FunctionsHttpError` — genérico. O corpo da resposta com o erro real (status e mensagem vindos do ERP-externo) existia, mas estava em `error.context`, que ninguém lia. Horas de chute foram economizadas no dia em que o handler passou a logar o corpo.

### Reproduzir antes de corrigir

Fix sem reprodução é aposta: você não vai conseguir provar que ele funcionou (módulo 01). Reduza o erro ao menor comando que o dispara:

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

## Por que cai em entrevista

Entrevistas de debugging ao vivo (comuns para pleno) colocam um erro na tela e observam o primeiro movimento. Quem lê a mensagem em voz alta, nomeia a camada e localiza o primeiro frame próprio passa; quem alt-taba pro Google antes de ler o erro termina a entrevista mais cedo.

> **P:** "Aparece um erro que você nunca viu. Qual é o seu processo?"
>
> **R (30s):** "Primeiro leio a mensagem literal e o stack até o primeiro frame que é meu código — a mensagem me dá a camada: ECONNREFUSED é rede, 403 é permissão, exceção minha é lógica. Depois reproduzo com o menor comando possível, geralmente um curl, porque fix sem reprodução não tem prova. Só então pesquiso, com a mensagem exata entre aspas. E se o erro chegou genérico, minha primeira suspeita é um catch no caminho engolindo a causa — já perdi horas com um wrapper que escondia o corpo da resposta onde estava o erro verdadeiro."

## Checkpoint

- [ ] Sei em qual ponta fica a mensagem real em Python e em Node
- [ ] Identifico a camada (DNS/TCP/TLS/HTTP/app) só pela assinatura do erro
- [ ] Acho o primeiro frame de código meu num trace cheio de node_modules
- [ ] Uso `Error.cause` (ou log do corpo) em todo catch que reembrulha
- [ ] No último bug, reproduzi com um comando mínimo ANTES de mexer no código

## Recursos

- [MDN — Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [Node.js — documentação de erros](https://nodejs.org/api/errors.html) — tabela dos códigos ECONNREFUSED, ENOTFOUND etc.
- [jvns.ca](https://jvns.ca/) — posts de debugging da Julia Evans
- Módulo `50-backend/07-logging-estruturado-pino.md` desta trilha — como logar pra conseguir ler depois
