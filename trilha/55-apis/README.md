# 55 — APIs a Fundo

Trilha para entender HTTP, REST, autenticação e o consumo/construção de APIs **de verdade** — não só "usar o fetch". Cada módulo é conceito → exemplo → nuance, com um trecho **Em entrevista** pronto pra recitar.

## Módulos

| # | Módulo | O que você sai sabendo |
|---|---|---|
| 01 | [HTTP por Dentro](01-http-por-dentro.md) | Request/response cru, métodos, status codes 2xx–5xx, headers, o ciclo cliente↔servidor |
| 02 | [REST de Verdade](02-rest-de-verdade.md) | Recursos e URIs, statelessness, safe × idempotente, por que PUT ≠ PATCH ≠ POST |
| 03 | [Design de API que Não Dá Vergonha](03-design-de-api.md) | Nomeação, paginação cursor × offset, filtros, versionamento, erro consistente, HATEOAS |
| 04 | [Autenticação e Autorização](04-auth-autenticacao-autorizacao.md) | API key, Basic, Bearer, JWT por dentro, OAuth2 authorization_code, refresh token, 401 × 403 |
| 05 | [Consumir API Direito](05-consumir-api-direito.md) | fetch com erro, timeout/AbortController, retry com backoff + jitter, 429/Retry-After, Promise.all |
| 06 | [Construir uma API](06-construir-uma-api.md) | Rota/handler/middleware Express, validação na boundary, status corretos, erro central, CORS |
| 07 | [Além do REST](07-alem-do-rest.md) | GraphQL, webhooks, gRPC/protobuf — e quando escolher cada um |

## Como estudar

Na ordem. 01 e 02 são a base conceitual (o protocolo e o estilo); 03–04 são design e segurança; 05–06 são as duas pontas da prática (consumir e construir); 07 abre o leque.

## As perguntas que essa trilha responde

- Qual a diferença entre 401 e 403? (04)
- O que é idempotência e quais métodos são idempotentes? (02)
- PUT × PATCH × POST? (02)
- Cursor ou offset pra paginar? (03)
- O que vai (e o que nunca vai) dentro de um JWT? (04)
- Por que fetch não dá erro num 500? Como retentar direito? (05)
- O que é CORS e por que ele "me bloqueia"? (06)
- GraphQL/webhook/gRPC: quando cada um? (07)
