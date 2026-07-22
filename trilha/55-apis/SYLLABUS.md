# Syllabus — APIs

> **Disciplina:** HTTP por dentro e REST de verdade — método, status e contrato como semântica, não decoração.
> **Carga horária alvo: 40h** — aulas 3h · bibliografia 15h · labs 12h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Descrever a anatomia de uma requisição/resposta HTTP e escolher método + status pela semântica do RFC 9110, não por hábito.
2. Desenhar uma API REST coerente — recursos, paginação, versionamento, erros, negociação de conteúdo — e defender cada escolha.
3. Explicar o fluxo OAuth 2.0 Authorization Code (com PKCE) e a diferença autenticação × autorização.
4. Consumir uma API com robustez (fetch, CORS, tratamento de erro non-2xx) e saber quando REST não serve (GraphQL/SSE).

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 http-por-dentro | MDN — "An overview of HTTP" + "HTTP Messages"; RFC 9110 (HTTP Semantics) — § 3 "Resources" e § 6 "Message Abstraction" | 2h |
| 02 rest-de-verdade | MDN — "HTTP request methods" + "HTTP response status codes"; RFC 9110 — § 9 "Methods" (safe/idempotent) e § 15 "Status Codes" | 2h |
| 03 design-de-api | Stripe API reference (exemplo de API bem documentada: paginação por cursor, erros, versionamento); RFC 9110 — § 12 "Content Negotiation" + MDN "HTTP headers" | 2h |
| 04 auth-autenticacao-autorizacao | *OAuth 2.0 Simplified* (Aaron Parecki, oauth.com — gratuito online) — "The Authorization Code Flow" + PKCE; RFC 9110 — § 11 "HTTP Authentication" | 2.5h |
| 05 consumir-api-direito | MDN — "Using the Fetch API" + "CORS"; docs Supabase (client JS) como exemplo de SDK sobre REST — atenção ao erro non-2xx engolido | 2h |
| 06 construir-uma-api | RFC 9110 — § 15 "Status Codes" (405/409/412) + MDN "HTTP conditional requests" (ETag / If-None-Match); PostgREST/Supabase como exemplo de contrato gerado | 2h |
| 07 alem-do-rest | graphql.org/learn — "Introduction to GraphQL" (schema, resolvers, over/under-fetching); MDN — "Using server-sent events" (quando streaming > polling) | 2.5h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) nas edge functions / integrações AG. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `http-from-scratch` (4h):** servidor TCP cru (`node:net`) que parseia à mão a request line + headers de HTTP/1.1 e devolve uma resposta válida — sem framework.
*Pronto quando:* responde a `curl` com status line, headers e body corretos, atende GET e POST, e o `Content-Length` bate com o corpo enviado.

**Lab 2 — `rest-crud` (4h):** um recurso REST correto (métodos e status pela semântica do RFC 9110, com ETag/conditional requests) sobre um store em memória.
*Pronto quando:* método/status conferem com o RFC (404/405/409 nos casos certos), `If-None-Match` retorna 304, e a suíte de testes cobre cada verbo.

**Lab 3 — `oauth-flow-demo` (4h):** implementar o fluxo Authorization Code com PKCE no lado cliente contra um authorization server (mock ou sandbox real), sem client secret no browser.
*Pronto quando:* a troca code→token funciona com PKCE, o parâmetro `state` é validado contra CSRF, e o token não trafega nem fica na URL.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Hussein Nasser** | "http explained", "tcp", "rest api", "oauth", "cors" | módulos 01, 04, 05 |
| **ByteByteGo** | "rest api design", "oauth flow", "rest vs graphql", "api pagination" | módulos 03, 04, 07 |
| **Fireship** | "http in 100 seconds", "oauth explained", "graphql in 100 seconds" | visão-relâmpago dos módulos 01, 04, 07 |
| **Rocketseat** *(PT-BR)* | "api rest node", "consumindo api fetch" | módulos 02, 05, 06 — prática em português |

Ordem sugerida: vídeo-relâmpago (Fireship) ANTES da bibliografia pra fixar o mapa, protocolo a fundo (Hussein Nasser/ByteByteGo) DEPOIS do módulo pra defender cada status/método. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nas APIs AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, as obras (e os RFCs) não.*
