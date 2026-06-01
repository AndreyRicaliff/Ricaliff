# 06 — Graceful Shutdown e SIGTERM

## O que é

Quando o sistema quer parar seu processo (deploy, escalonamento, restart), ele manda **SIGTERM**. O processo tem um tempo (configurável, padrão ~30s) para terminar de forma limpa antes de receber **SIGKILL**, que encerra forçado sem chance de resposta.

**SIGTERM vs SIGKILL:**
- `SIGTERM` — sinal educado: "por favor, termine". O processo pode capturar e responder.
- `SIGKILL` — força bruta: "termina agora". Não pode ser capturado. Conexões de banco ficam abertas, jobs em processamento são perdidos, requests em voo retornam erro.

**Graceful shutdown:** capturar SIGTERM, parar de aceitar novas requisições, esperar as em voo terminarem, fechar conexões com banco e fila, sair com código 0.

```typescript
import { server } from './server'
import { prisma } from './db'
import { worker } from './queues/transcriptionWorker'

async function shutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown`)

  // 1. Parar de aceitar novas conexões HTTP
  server.close(async () => {
    console.log('HTTP server closed')

    // 2. Fechar worker de fila (aguarda job em andamento terminar)
    await worker.close()
    console.log('Bull worker closed')

    // 3. Fechar conexão com banco
    await prisma.$disconnect()
    console.log('Database disconnected')

    process.exit(0)
  })

  // Forçar saída se demorar mais que 30s
  setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit')
    process.exit(1)
  }, 30_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))   // Ctrl+C no dev
```

**Docker stop timeout:** `docker stop` manda SIGTERM e espera 10s (padrão). Após 10s, SIGKILL. Se seu graceful shutdown leva 15s, Docker mata forçado mesmo com SIGTERM. Configurar `stop_grace_period`:

```yaml
# docker-compose.yml
services:
  api:
    image: meet-hub-api
    stop_grace_period: 30s  # tempo para graceful shutdown
```

**Jobs Bull em voo:** `worker.close()` aguarda o job atual terminar antes de fechar. Se o job é longo (transcrição de 2 min), o worker vai esperar os 2 min. Isso é correto — melhor esperar que matar o job no meio e ter que reprocessar (e lidar com idempotência).

**`process.exit()` é violência:** chamar `process.exit()` diretamente fecha tudo abruptamente — equivalente a SIGKILL por dentro. Use `process.exit(0)` **somente** ao final do graceful shutdown, depois de fechar tudo.

**unhandledRejection e uncaughtException:**

```typescript
// Capturar erros não tratados — pelo menos logar antes de morrer
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'Unhandled promise rejection')
  // NÃO chamar process.exit aqui por padrão — deixar o processo tentar continuar
  // a menos que seja erro catastrófico
})

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception — process will exit')
  // Após uncaughtException, o estado do processo é incerto — exit é correto
  process.exit(1)
})
```

**Armadilha comum de júnior:** não implementar graceful shutdown e perguntar por que o Docker leva 10s para parar (está esperando o SIGKILL). Ou implementar sem timeout, e o processo fica preso esperando um job que nunca vai terminar.

---

## Por que cai em entrevista

Graceful shutdown é pergunta diferenciadora em entrevistas de backend com produto em produção. Variações:

- "O que acontece quando você faz `docker stop`?"
- "O que é SIGTERM e como você responderia a ele?"
- "Como você garantiria que requests em voo não perdem dados no deploy?"
- "Por que `process.exit()` direto é problemático?"

---

## Trade-offs

| Decisão | Abordagem | Por quê |
|---|---|---|
| Timeout de graceful shutdown | 25–30s | Dar tempo suficiente, mas garantir que SIGKILL não chega antes |
| Jobs longos no shutdown | Aguardar (worker.close()) | Melhor reprocessar do que corromper dados parcialmente |
| Requests HTTP em voo | server.close() espera conexões ativas | HTTP/1.1 keep-alive pode segurar conexões — adicionar `Connection: close` em resposta |
| Docker stop_grace_period | Maior que o timeout interno | SIGKILL não pode chegar antes do graceful shutdown terminar |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver se o Meet Hub api tem SIGTERM handler
grep -rn "SIGTERM\|process.on\|graceful" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null

# Ver o arquivo principal (ponto de entrada)
find ~/projetos/meet-hub/apps/api/src -name "index.ts" -o -name "server.ts" -o -name "app.ts" | head -5

# Ver docker-compose para stop_grace_period
grep -rn "stop_grace_period\|SIGTERM" ~/projetos/meet-hub/docker-compose.yml 2>/dev/null
```

Implementar graceful shutdown no Meet Hub api se não existir:

```typescript
// src/index.ts — adicionar ao final do arquivo de startup

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Graceful shutdown started')

  const server = getHttpServer()  // referência ao servidor HTTP
  server.close(async () => {
    await transcriptionWorker.close()
    await prisma.$disconnect()
    logger.info('Graceful shutdown complete')
    process.exit(0)
  })

  setTimeout(() => {
    logger.error('Graceful shutdown timeout')
    process.exit(1)
  }, 25_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

```markdown
## 2026-06-XX — [ops] implementar graceful shutdown no Meet Hub api

**Problema:** processo não tinha SIGTERM handler. Docker stop esperava 10s e matava com SIGKILL — jobs de transcrição em voo eram perdidos e precisavam ser reprocessados.
**Solução:** SIGTERM handler que fecha HTTP server, aguarda worker Bull terminar job atual, desconecta Prisma.
**Timeout:** 25s interno + 30s no docker-compose — nunca vai esgotar em condições normais.
**Como explicar em entrevista (30s):**
> "O Meet Hub não tinha SIGTERM handler. No deploy, Docker mandava SIGTERM, esperava 10s, e matava com SIGKILL — qualquer transcrição em andamento era cortada no meio. Implementei o handler: fechar o servidor HTTP para novas conexões, chamar worker.close() que aguarda o job atual terminar, desconectar o Prisma, e sair com código 0. Adicionei timeout de 25s como segurança."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que acontece quando você faz `docker stop` num container sem graceful shutdown?"
>
> **R (30s):**
> "Docker manda SIGTERM e espera 10 segundos. Se o processo não terminou, Docker manda SIGKILL — encerra forçado. Sem handler de SIGTERM: requests HTTP em voo recebem connection reset, jobs Bull em processamento ficam como `stalled` e são reprocessados no próximo start (se o handler for idempotente). Conexões de banco ficam abertas no pool até timeout do Postgres. A solução é capturar SIGTERM, chamar `server.close()` para parar de aceitar novas conexões, `worker.close()` que aguarda o job atual, `prisma.$disconnect()`, e só então `process.exit(0)`. Configurar `stop_grace_period: 30s` no docker-compose para ter tempo suficiente."

> **P:** "Por que chamar `process.exit()` diretamente é problemático?"
>
> **R (30s):**
> "Porque fecha tudo abrupto — sem flushar buffers de log, sem fechar conexões de banco corretamente, sem aguardar jobs em andamento. É equivalente a SIGKILL por dentro. O resultado: log de erro do job que estava rodando some porque o buffer de log não foi flushado, conexão de banco fica aberta no pool do Postgres até timeout, job no Redis fica como `active` sem worker — trava até o `lockDuration` expirar. `process.exit(0)` é correto **ao final** do graceful shutdown, depois que tudo foi fechado. Nunca no meio de um handler como saída rápida."

---

## Checkpoint

- [ ] Sei explicar a diferença entre SIGTERM e SIGKILL
- [ ] Sei implementar graceful shutdown com server.close(), worker.close() e prisma.$disconnect()
- [ ] Verifiquei se o Meet Hub api tem SIGTERM handler
- [ ] Sei o que `stop_grace_period` faz no docker-compose
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Graceful Shutdown dominado`.

---

## Recursos

- Node.js Docs — [Process Signals](https://nodejs.org/api/process.html#signal-events)
- Docker Docs — [docker stop](https://docs.docker.com/engine/reference/commandline/stop/)
- BullMQ Docs — [Graceful Shutdown](https://docs.bullmq.io/patterns/graceful-shutdown)
- `~/projetos/meet-hub/apps/api/src/` — ponto de entrada real para implementação
