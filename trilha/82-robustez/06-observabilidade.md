# 06 — Observabilidade

## O que é

Observabilidade é conseguir responder **"por que isso aconteceu?"** sobre um sistema em produção sem precisar reproduzir o problema. Não é ter logs — é ter os logs certos, correlacionáveis, que respondem perguntas que você não sabia que ia fazer. A régua honesta: às 3h da manhã, com o serviço lento e o cliente ligando, o que você tem já basta pra achar a causa? Se a resposta é "eu ia ter que adicionar log e esperar acontecer de novo", você não tem observabilidade — tem esperança.

Os três pilares:

**Logs — o evento discreto.** "Aconteceu X, com estes dados, neste instante." O pulo do gato é **log estruturado**: JSON com campos, não frase em prosa. `{"level":"error","event":"sync_falhou","tenant":"varejo","erp_id":4821,"ms":8300}` é filtrável, agregável, alertável. `console.log("deu erro no sync do varejo")` é impossível de consultar. Frase é pra humano ler uma vez; campo é pra máquina cruzar mil vezes.

**Métricas — o número agregado ao longo do tempo.** Quantos requests, quantos erros, quão lento. O padrão **RED** para todo serviço: **R**ate (requests/s), **E**rrors (taxa de falha), **D**uration (latência, sempre em percentis — p50, p95, p99 — nunca média, que esconde o cliente que espera 8s). Média é a mentira estatística favorita de sistema: "latência média 200ms" com p99 de 9s significa que 1% dos usuários está tendo uma experiência terrível e a média enterrou isso.

**Traces — a jornada de UM request por todas as camadas.** Onde os 8s foram gastos: 200ms no seu código, 7.8s esperando o ERP. Sem trace, você chuta a camada; com trace, você vê. O elo que costura tudo é o **correlation id** (request id): um identificador gerado na borda e propagado por cada log, cada chamada, cada camada. Sem ele, você tem mil logs soltos; com ele, você `grep` o id e lê a história inteira de um request específico.

### Passo-a-passo: log estruturado com contexto

```ts
const log = (level: string, event: string, ctx: object) =>
  console.log(JSON.stringify({ level, event, ts: new Date().toISOString(), ...ctx }));

const reqId = crypto.randomUUID();               // gerado na borda
log('info', 'sync_inicio', { reqId, tenant });
try {
  const n = await sincronizar(tenant);
  log('info', 'sync_ok', { reqId, tenant, registros: n });
} catch (e) {
  log('error', 'sync_falhou', { reqId, tenant, erro: e.message }); // contexto, não só "erro"
  throw e;
}
```

O `reqId` em toda linha é o que transforma logs isolados em narrativa. Quando o cliente reclama, você pega o id daquela sessão e reconstrói exatamente o que aconteceu — sem adivinhar.

### Níveis com critério

`error` = algo quebrou e precisa de ação humana. `warn` = degradou mas seguiu (fez fallback do módulo 05). `info` = marco de negócio (sync começou/terminou). `debug` = detalhe que fica desligado em produção. O crime comum é logar tudo como `info` ou tudo como `error` — aí o nível não filtra nada e o alerta vira ruído que ninguém lê. Nível é semântica, não decoração.

## Por que cai em entrevista

Observabilidade separa quem opera de quem só escreve. "Como você debugaria um problema que só acontece em produção?" — a resposta madura é sobre logs estruturados, correlation id e percentis, não "colocaria um console.log e esperaria". E "por que percentil e não média?" é um filtro rápido de maturidade em métricas.

> **P:** "Um cliente diz que o app 'às vezes fica lento'. Você não reproduz. Como investiga?"
>
> **R (30s):** "Primeiro olho a métrica de latência em percentil, não média — p99 alto com p50 normal confirma que é intermitente e mostra o tamanho do problema. Aí uso trace ou correlation id: pego um request lento real e vejo em qual camada o tempo foi — quase sempre é espera de I/O externo, não o meu código. Se eu não tiver isso instrumentado, o problema não é o bug, é a cegueira: log estruturado com request id e latência por camada é o que eu adiciono primeiro, porque 'não consigo ver' é pior que 'está lento'."

## Checkpoint

- [ ] Explico os 3 pilares (logs, métricas, traces) e o que cada um responde
- [ ] Sei por que log estruturado (JSON) vence log em prosa
- [ ] Implementei correlation id propagado em todas as linhas de um fluxo
- [ ] Explico RED e por que latência é percentil, nunca média
- [ ] Uso níveis de log com critério (error/warn/info/debug) e sei por que importa

## Recursos

- [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- "The RED Method" — Tom Wilkie (Grafana/Weaveworks)
- [OpenTelemetry — conceitos](https://opentelemetry.io/docs/concepts/) — padrão aberto de traces/métricas
- [pino](https://github.com/pinojs/pino) — logger estruturado rápido pra Node
