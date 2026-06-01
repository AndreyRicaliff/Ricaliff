# 05 — Observabilidade: Logs e Métricas

## O que é

Observabilidade é a capacidade de entender o que está acontecendo dentro do sistema a partir de dados externos. Os três pilares são logs, métricas e traces. Para um dev júnior em projeto AG do tamanho atual, logs bem estruturados já resolvem 80% dos problemas de produção.

**Log estruturado** é JSON no stdout — cada linha tem campos fixos que ferramentas conseguem parsear e filtrar. `console.log('erro no id ' + id)` é log não estruturado: você não consegue filtrar por `userId` ou `level` depois.

```ts
// Ruim: não estruturado
console.log('erro ao processar gravação ' + recordingId + ': ' + err.message)

// Bom: estruturado com pino
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

logger.error({ recordingId, userId, err: err.message }, 'falha ao processar gravação')
// Saída: {"level":50,"time":1717200000000,"recordingId":"abc","userId":"xyz","err":"timeout","msg":"falha ao processar gravação"}
```

**Correlação de requests:** quando uma requisição HTTP passa por múltiplos serviços ou funções assíncronas, você precisa de um `requestId` único para juntar todos os logs daquela operação.

```ts
// Middleware que gera requestId único por request
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID()
  req.log = logger.child({ requestId: req.requestId, userId: req.userId })
  next()
})

// No handler: log filho carrega o requestId
req.log.info({ meetUrl }, 'iniciando gravação')
```

**RED Method (métricas para serviços):**
- **Rate** — quantas requests por segundo
- **Errors** — taxa de erros
- **Duration** — latência (p50, p95, p99)

**USE Method (métricas para recursos):**
- **Utilization** — % de uso (CPU, memória)
- **Saturation** — fila de espera (requests pendentes)
- **Errors** — erros de hardware/infra

---

## Por que cai em entrevista

- "Como você investigaria um bug em produção sem acesso ao servidor?"
- "O que são logs estruturados e por que eles são melhores?"
- "O que você monitora numa aplicação web básica?"
- "Já usou alguma ferramenta de APM (Datadog, New Relic, Sentry)?"
- "Qual a diferença entre log e métrica?"

---

## Trade-offs (quando usar X vs Y)

| Ferramenta | O que faz | Custo | Quando vale para AG |
|---|---|---|---|
| `console.log` / `pino` para stdout | Logs no terminal/journalctl | Grátis | Agora — logs básicos estruturados |
| Sentry (error tracking) | Captura exceções com stack trace | Grátis até 5k erros/mês | PULSAR-RH quando tiver usuários reais |
| Grafana + Loki | Agregação e busca de logs | Grátis self-hosted | Quando o volume de log não cabe em `grep` |
| Datadog / New Relic (APM) | Traces distribuídos, dashboards | $15-40/host/mês | Não hoje — projetos AG ainda são pequenos |
| `journalctl` no host | Ler logs do systemd/docker direto | Grátis | Meet Hub em prod no DigitalOcean |

**Por que a AG ainda não tem APM:** custo mensal por host não se justifica com usuários contáveis. O MVP de observabilidade para AG hoje é: logs estruturados (pino) + Sentry no frontend para capturar erros JavaScript. Quando tiver 100+ usuários ativos, aí Grafana/Loki self-hosted faz sentido.

**Níveis de log (do menos para o mais severo):**
- `trace` — detalhe extremo (só em debug local)
- `debug` — fluxo de execução (dev/staging)
- `info` — eventos de negócio relevantes (default de prod)
- `warn` — algo inesperado mas não fatal
- `error` — erro tratado mas que precisa de atenção
- `fatal` — erro que derruba o processo

Em produção: `info` como nível mínimo. `debug` cria volume excessivo.

---

## Exercício aplicado (projeto AG real)

O Meet Hub usa `console.log` e `console.error` espalhados. Vamos propor uma estrutura de log melhor.

### Passo a passo

1. **Contar logs não estruturados no Meet Hub:**
   ```bash
   grep -rn "console\.log\|console\.error\|console\.warn" ~/projetos/meet-hub/apps/api/src/ --include="*.ts" | wc -l
   ```

2. **Verificar se já existe alguma lib de log:**
   ```bash
   grep -i "pino\|winston\|bunyan\|morgan" ~/projetos/meet-hub/apps/api/package.json
   ```
   Se não existir nenhuma, os logs são `console.log` puro — não estruturados.

3. **Identificar o que falta nos logs atuais:**
   ```bash
   grep -n "console\.error" ~/projetos/meet-hub/apps/api/src/services/queue.ts | head -10
   ```
   Os erros têm `recordingId`? Têm `userId`? Têm timestamp? Sem esses campos, um erro às 2h da manhã é inrastreável.

4. **Propor estrutura de log para o Meet Hub** (escreva no papel ou como comentário):
   ```ts
   // O que cada log de job processado deveria ter:
   logger.info({
     jobId: job.id,
     recordingId,
     userId,
     meetUrl,
     duration: Date.now() - startTime,
     stage: 'transcription_started'
   }, 'job processando')

   // O que cada erro deveria ter:
   logger.error({
     jobId: job.id,
     recordingId,
     userId,
     stage: 'bot_container_start',
     err: error.message,
     stack: error.stack
   }, 'falha ao iniciar container do bot')
   ```

5. **Ver como os logs aparecem em produção hoje:**
   ```bash
   ssh meet-hub "docker compose -f /opt/meet-hub/docker-compose.yml logs api --tail=50" 2>/dev/null
   # ou, se não tiver acesso direto ao servidor:
   echo "verificar via painel DigitalOcean ou após ssh meet-hub"
   ```

6. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [infra] Proposta de log estruturado com pino

   **Problema:** logs atuais são console.log não estruturado. Erro em produção sem recordingId é inrastreável.
   **Opções:**
   - Continuar com console.log — zero esforço, zero observabilidade
   - Adicionar pino — log estruturado em JSON, campos obrigatórios (requestId, recordingId, userId)
   **Decisão:** adicionar pino como próximo item de infra. Campos mínimos: level, timestamp, requestId, userId, context.
   **Quando vale APM pago:** quando houver 100+ usuários ativos — hoje não.
   **Como explicar em entrevista (30s):**
   > "O Meet Hub usava console.log não estruturado. Quando um job de bot falha em produção, você vê 'erro: timeout' sem saber de qual usuário ou qual gravação. Propus adicionar pino para log estruturado em JSON com campos obrigatórios: requestId, userId, recordingId, stage. Com isso você filtra todos os logs de um recording específico em segundos com grep ou jq."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você investigaria um bug em produção no Meet Hub sem acesso ao servidor?"
>
> **R (30s):**
> "Primeiro acesso os logs — com log estruturado, filtro por `recordingId` ou `userId` do usuário afetado. Se os logs tiverem campos consistentes, reconstruo o que aconteceu: qual stage falhou, qual erro saiu, qual foi o contexto. Sem log estruturado, você fica com 'erro: something went wrong' sem contexto.
>
> Se tiver Sentry, o erro veio com stack trace e contexto do request. Se não tiver, o próximo passo é reproduzir localmente com os dados do usuário. É por isso que log estruturado com campos obrigatórios é o primeiro investimento de observabilidade que faço num projeto."

> **P:** "O que você monitora numa aplicação web pequena?"
>
> **R (30s):**
> "RED method para serviços: taxa de requests, taxa de erros e latência (p95). USE method para infra: CPU, memória e I/O do servidor. Com isso você sabe quando a aplicação está lenta antes do usuário reclamar, e quando o servidor está saturando antes de cair.
>
> Para a escala atual dos projetos AG, monitoro: logs de erro (pino + Sentry), uptime do servidor (UptimeRobot gratuito), e espaço em disco (alerta quando chega em 80%). APM pago como Datadog espero para quando tiver 100+ usuários ativos — o ROI não compensa antes disso."

---

## Checkpoint

- [ ] Sei a diferença entre log estruturado e não estruturado com exemplo real
- [ ] Contei quantos `console.log` não estruturados existem no Meet Hub
- [ ] Sei quais campos são obrigatórios num log de erro (level, timestamp, requestId, contexto)
- [ ] Entendo RED e USE method e consigo citar o que medir em cada
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Observabilidade e Logs dominado`.

---

## Recursos

- pino — [Getting started](https://getpino.io/#/docs/getting-started)
- Brendan Gregg — [USE Method](https://www.brendangregg.com/usemethod.html) (5 min)
- Tom Wilkie — [RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/) (5 min)
- Código real: `~/projetos/meet-hub/apps/api/src/services/queue.ts` — logs atuais em console.error
