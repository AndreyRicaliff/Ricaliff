# Syllabus — Fundamentos

> **Disciplina:** o que roda por baixo de todo código JS/web — tipos, memória, o event loop e o contrato HTTP.
> **Carga horária alvo: 35h** — aulas 3h · bibliografia 14h · labs 13h · projeto de conclusão 5h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Prever se uma atribuição copia valor ou compartilha referência, e explicar o vazamento/mutação que cada caso causa.
2. Ordenar na cabeça a execução de um trecho com `setTimeout`, `Promise` e `queueMicrotask` — e justificar por que microtask vence macrotask.
3. Escolher o status HTTP certo (2xx/4xx/5xx) e o método certo para uma operação, sem chutar.
4. Explicar quando usar SQL vs NoSQL pelo modelo de dado, e o que um JWT prova (e o que NÃO prova) frente a uma sessão.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 tipos-memoria-valor-referencia | *You Don't Know JS* (Kyle Simpson) — livros "Types & Grammar" (coerção) e "Scope & Closures" + MDN "JavaScript data types and data structures" e "Memory management" | 3h |
| 02 async-event-loop-promises | *You Don't Know JS* — "Async & Performance" + MDN "The event loop" e "Using promises" + talk de Jake Archibald "In The Loop" (JSConf 2018) | 3h |
| 03 http-rest-status-codes | MDN HTTP — "HTTP request methods", "HTTP response status codes" e "HTTP conditional requests" (idempotência/segurança dos métodos) | 2h |
| 04 sql-vs-nosql-quando-cada | *Designing Data-Intensive Applications* (Kleppmann) — cap. 2 "Data Models and Query Languages" | 2.5h |
| 05 auth-oauth-jwt-session | RFC 6749 (OAuth 2.0) — seções "Protocol Endpoints" e "Authorization Code Grant" + OWASP "Session Management Cheat Sheet" + jwt.io "Introduction to JSON Web Tokens" | 2.5h |
| 06 git-fluxo-rebase-merge | *Pro Git* (Chacon & Straub, 2ª ed, git-scm.com) — cap. 3 "Git Branching": seções "Basic Branching and Merging" e "Rebasing" | 1h |

Regra de leitura: **com o console/DevTools aberto** — cada conceito que aparecer, reproduza num `.js` seu antes de aceitar. Leitura sem rodar não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `mini-promise` (6h):** implemente `MyPromise` do zero em JS puro, sem libs: construtor com `resolve`/`reject`, `then` encadeável, resolução assíncrona agendada em microtask (`queueMicrotask`), estados pending→fulfilled/rejected imutáveis.
*Pronto quando:* uma suíte vitest cobre encadeamento (`.then().then()`), resolução com outra promise, e ordem de execução (o `.then` roda DEPOIS do código síncrono seguinte) — tudo passando.

**Lab 2 — `event-loop-tracer` (4h):** dado um conjunto de 10 snippets misturando `console.log` síncrono, `setTimeout(…,0)`, `Promise.resolve().then` e `queueMicrotask`, escreva PRIMEIRO a ordem prevista num `.md`, depois um runner que executa e imprime a ordem real.
*Pronto quando:* você acerta a previsão dos 10 snippets ANTES de rodar, e o README explica a regra macrotask × microtask que governa cada um.

**Lab 3 — `closure-lab` (3h):** implemente do zero, usando closures, três utilitários: `once(fn)` (executa 1×), `memoize(fn)` (cacheia por argumento) e um `contador()` com estado privado (nenhum acesso externo à variável interna).
*Pronto quando:* testes provam que o estado é inacessível de fora (só muda pela API pública) e que `memoize` não recomputa para o mesmo argumento.

## Critério de formatura

- [ ] 6/6 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde o conceito aparece num app AG ou nos próprios labs)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
