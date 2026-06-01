# 04 — Deploy no Vercel e Edge Runtime

## O que é

Vercel é uma plataforma de deploy otimizada para frontend e funções serverless. O PULSAR-RH roda no Vercel hoje: arquivos estáticos servidos do CDN global, sem servidor para gerenciar. O `vercel.json` do projeto configura headers de segurança e URLs limpas — já tem configuração real pra estudar.

O Vercel tem dois runtimes para funções:

```
Node.js Runtime (padrão):
  - Executa funções como Node.js convencional
  - Acessa filesystem (só /tmp), variáveis de ambiente
  - Cold start: 100-500ms
  - Tempo máximo: 60s (plano grátis), 300s (Pro)
  - Ideal: lógica complexa, acesso a banco, bibliotecas grandes

Edge Runtime:
  - Executa funções no ponto de presença mais próximo do usuário
  - Só APIs Web (fetch, Response, Request) — sem Node.js APIs
  - Cold start: < 1ms (nenhum cold start real)
  - Tempo máximo: 5s (limite duro do Vercel)
  - Ideal: redirecionamentos, auth checks, A/B, manipulação de headers
  - Não acessa: banco de dados diretamente, bibliotecas Node.js nativas
```

```ts
// Edge Function: executa na borda, latência mínima
export const config = { runtime: 'edge' }

export default function handler(request: Request) {
  const country = request.headers.get('x-vercel-ip-country')
  if (country === 'CN') {
    return new Response('Não disponível', { status: 451 })
  }
  return new Response('OK')
}
```

**Preview Deploys:** cada branch e cada PR no Vercel ganha uma URL única (`branch-name.project.vercel.app`). Você testa a feature em produção real antes de mergear. O PULSAR-RH provavelmente já tem isso — todo push numa branch gera preview.

**ISR (Incremental Static Regeneration):** pages estáticas regeneradas em background após um tempo. Relevante para Next.js — não se aplica ao PULSAR-RH (HTML puro).

---

## Por que cai em entrevista

- "O que é Edge Function? Quando você usaria?"
- "Como você configura variáveis de ambiente no Vercel?"
- "O que é preview deploy?"
- "Quando o Vercel começa a ser caro?"
- "Como você faria rollback de um deploy no Vercel?"

---

## Trade-offs (quando usar X vs Y)

| Critério | Vercel ganha | Vercel perde |
|---|---|---|
| Deploy de frontend/JAMstack | Zero config, integração GitHub, CDN global | |
| Apps com estado (socket, queue, cron) | | Sem estado persistente entre requests; sem WebSocket |
| Funções com long-running jobs | | Timeout duro de 5-300s — Meet Hub bot precisaria de 15min |
| Custo em escala | | $20/mês pro, $400/mês enterprise; lambda paga por invocação pode explodir |
| Ops zero | Deploy e infraestrutura gerenciados | Sem controle: cold starts, região, configuração de rede |
| Equipe pequena / produto SaaS | Entrega rápida sem manter servidor | Vendor lock-in: reverter pra VPS requer reescrever deploy |

**Por que o Meet Hub NÃO está no Vercel:** o bot de gravação precisa de Docker socket, filesystem local, processo longo (15+ minutos), Redis persistente, Postgres sempre ativo. Vercel não suporta nada disso. Vercel é para frontend e APIs sem estado.

**Por que o PULSAR-RH ESTÁ no Vercel:** é HTML/JS estático com chamadas para Supabase. Não tem servidor próprio. Vercel serve os arquivos do CDN com zero configuração — ideal para isso.

---

## Exercício aplicado (projeto AG real)

Vamos auditar a configuração real do PULSAR-RH no Vercel e justificar as decisões.

### Passo a passo

1. **Ler e entender o `vercel.json` atual:**
   ```bash
   cat ~/projetos/PULSAR-RH/vercel.json
   ```
   O arquivo tem `cleanUrls: true` e headers de segurança. Explique cada header:
   - `X-Frame-Options: DENY` — impede que a página seja embarcada em iframe (proteção contra clickjacking)
   - `X-Content-Type-Options: nosniff` — impede que o browser "adivinhe" o tipo do arquivo
   - `Referrer-Policy` — controla quanto do URL atual é enviado como `Referer`
   - `Cache-Control: no-store` — força o browser a nunca cachear (útil em dashboard com dados sensíveis)

2. **Verificar se o PULSAR-RH usa preview deploys:**
   ```bash
   git -C ~/projetos/PULSAR-RH remote -v
   ```
   Se o remote é GitHub, Vercel provavelmente já está integrado. Verifique no dashboard do Vercel se existem deploys de branch.

3. **Justificar por que o PULSAR-RH não precisa de Edge Functions:**
   O PULSAR-RH é HTML estático + JavaScript que chama o Supabase diretamente do browser. Não tem server-side — não tem funções. Edge Functions fariam sentido se houvesse lógica server-side como validação de sessão antes de servir a página.

4. **Calcular quando o Vercel começa a ser caro para o PULSAR-RH:**
   - Plano grátis: 100 GB de bandwidth, 100 deploys/dia
   - Com 100 clientes ativos, cada um carregando ~500 KB de assets = 50 MB/sessão
   - 100 clientes × 10 sessões/dia × 50 MB = 50 GB/dia — chega no limite em 2 dias
   - Conclusão: quando o PULSAR-RH tiver escala real, o plano Pro ($20/mês) é necessário

5. **Comparar com AG Hub:**
   ```bash
   cat ~/projetos/ag-hub/index.html | head -5  # é HTML single-file?
   ```
   AG Hub é HTML single-file. Vercel também faria sentido aqui — zero config, CDN, preview deploys.

6. **Registrar em `~/projetos/PULSAR-RH/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [infra] Vercel para PULSAR-RH — justificativa e limites

   **Por que Vercel:** produto é HTML+JS estático com Supabase como backend. Sem servidor pra gerenciar, CDN global, preview deploy por branch.
   **Limite do plano grátis:** 100 GB bandwidth. Com escala real de clientes, migrar para Pro ($20/mês).
   **O que NÃO vai para Vercel:** Meet Hub (Docker, long-running, Redis, WebSocket). Para esse tipo de workload: VPS (DigitalOcean/Hetzner).
   **Como explicar em entrevista (30s):**
   > "O PULSAR-RH está no Vercel porque é HTML estático com Supabase como backend — zero servidor pra gerenciar, CDN global, preview deploy automático por branch. O Meet Hub não poderia ir pro Vercel porque precisa de Docker, Redis persistente e jobs de 15 minutos — o Vercel tem timeout duro de 300s e sem estado entre requests."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você escolheria Vercel em vez de um VPS?"
>
> **R (30s):**
> "Para frontend e APIs sem estado: Vercel. Você tem CDN global, preview deploy por branch, zero config de nginx, SSL automático. No PULSAR-RH uso Vercel porque é HTML estático com Supabase — não tem servidor pra manter.
>
> Para APIs com estado ou workloads longos: VPS. O Meet Hub precisa de Docker, Redis persistente, bot que roda por 15 minutos — Vercel tem timeout duro e sem estado entre requests. Para isso, DigitalOcean ou Hetzner com docker-compose."

> **P:** "O que é Edge Function e quando você usaria?"
>
> **R (30s):**
> "Edge Function executa no ponto de presença Vercel mais próximo do usuário — latência de 1ms vs. 100ms de uma função serverless normal. Mas tem restrições: só Web APIs, sem Node.js nativo, timeout de 5 segundos.
>
> Uso quando a lógica é simples e latência importa: verificar auth token antes de servir a página, redirecionar por geo-localização, manipular headers. Não uso quando preciso de banco, biblioteca Node.js ou processamento longo."

---

## Checkpoint

- [ ] Sei a diferença entre Edge Runtime e Node.js Runtime com trade-offs
- [ ] Li e entendi cada header do `vercel.json` do PULSAR-RH
- [ ] Consigo justificar por que o Meet Hub não vai para Vercel
- [ ] Sei o que é preview deploy e como ele ajuda no workflow de PR
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Deploy Vercel e Edge dominado`.

---

## Recursos

- Vercel docs — [Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- Vercel docs — [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- Vercel docs — [Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- Código real: `~/projetos/PULSAR-RH/vercel.json` — configuração em produção com headers de segurança
