# 82 — Robustez e Confiabilidade

Como sistemas ficam de pé quando as dependências não estão. Robustez não é ausência de bug — é ter decidido de antemão o que acontece quando a rede trava, a credencial expira, dois processos colidem e o dado chega sujo. A trilha vai do tratamento de erro sistêmico às armas de resiliência (retry, idempotência, timeout, degradação) e fecha na prova: observabilidade pra enxergar a falha e teste de falha pra exercitá-la de propósito.

**Ordem sugerida** (cada módulo assume os anteriores):

1. `01-error-handling-sistemico` — erro com contexto, fail-fast vs fail-safe, never swallow
2. `02-retry-backoff-circuit-breaker` — repetir só o transiente, backoff com jitter, breaker
3. `03-idempotencia` — at-least-once, chave natural vs chave de idempotência, upsert
4. `04-timeouts-cancelamento` — todo I/O com prazo, AbortController, orçamento em cascata
5. `05-graceful-degradation` — fail-closed vs fail-open, feature flag, fallback declarado
6. `06-observabilidade` — logs estruturados, RED, percentis, correlation id
7. `07-concorrencia-locks` — race condition, constraint vs otimista vs pessimista
8. `08-teste-de-falha` — chaos caseiro, injetar a falha, a hierarquia da confiança

**Pré-requisitos:** JS async sólido (promises, async/await), noção de banco e transação (trilha 30), e os casos de sync ERP da AG aparecem em quase todo módulo como exemplo real.

**Fio condutor:** o modo de falha errado quase sempre é "ninguém pensou nesse caso" — robustez é decidir a falha de propósito e prová-la exercitando, nunca declará-la no try/catch. Conecta direto com `05-raciocinio` (evidência antes de afirmar) e `12-testes/01` (o que cada nível de teste prova).
