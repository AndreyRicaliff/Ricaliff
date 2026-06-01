# 08 — Design de Sistema: Meet Hub do Zero

## O que é

Este módulo é um exercício de system design entrevista usando o Meet Hub como caso. O objetivo: simular uma whiteboard interview de posição pleno+. Você construiu o Meet Hub — agora precisa projetá-lo do zero como se nunca tivesse existido, documentando cada decisão com trade-offs.

Entrevistadores não procuram a resposta "certa" — procuram o **processo**: como você decompõe o problema, quais trade-offs você nomeia, quais números você usa para justificar decisões.

---

## Requisitos Funcionais

(Definidos antes de qualquer decisão técnica — a ordem importa em entrevista)

1. Bot entra em reuniões Google Meet automaticamente e captura vídeo/áudio
2. Após a reunião, o sistema transcreve o conteúdo
3. Transcrições ficam disponíveis para busca e visualização
4. Gravações ficam armazenadas por 180 dias (LGPD)
5. Sistema envia notificação quando transcrição está pronta
6. Dashboard mostra reuniões recentes, status de processamento, resumos

---

## Requisitos Não-Funcionais

7. Suportar 6 reuniões simultâneas (escala atual); 20 como alvo de 12 meses
8. Transcrição deve estar disponível em <10 minutos após fim da reunião
9. 99.5% de uptime (downtime tolerado: ~22h/ano)
10. Retenção: 180 dias para gravações e transcrições (LGPD art. 15)
11. Acesso restrito ao domínio `@agconsultorialtda.com`
12. Custo de infra: orçamento atual ~R$150/mês; máximo ~R$300/mês com 20 bots

---

## Estimativa Back-of-Envelope

"Back-of-envelope" é estimar escala em números antes de decidir arquitetura. Mostra ao entrevistador que você pensa em magnitude.

```
Volume de dados:
- 6 reuniões/dia × 1h média = 6h de vídeo/dia
- Vídeo: ~100MB/h (720p gravação de tela) = 600MB/dia
- Transcrição de texto: ~100KB/h = 600KB/dia (desprezível)
- Retenção 180 dias: 600MB × 180 = ~108GB de vídeo total
  → Google Drive (incluído no Workspace): zero custo adicional
  → Alternativa: S3 a $0.023/GB = ~$2.5/mês para 108GB ✓

Tráfego de API:
- 6 bots ativos → 6 WebSocket connections ou polling
- ~100 acessos de usuário/dia ao dashboard (empresa pequena)
- ~100 requests/hora = ~1.7 req/s peak → 1 instância Express aguenta facilmente

Banco de dados:
- ~1 reunião criada/h → 24 rows/dia em recordings
- Transcriptions: texto puro, ~100KB/reunião
- 180 dias: 24 × 180 = 4.320 rows de recordings → pequeno
- Storage total do banco: <1GB → qualquer Postgres aguenta

Workers:
- 6 transcrições paralelas × ~30s cada = carga moderada de I/O
- Cada worker: await Gemini API (externo) → CPU quase zero; I/O bound
- 1 worker com concorrência 6 é suficiente
```

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  [React Web App] → HTTPS → [Express API + Nginx]                 │
│  [Bot (Puppeteer)] → API calls                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  [Express API] — stateless, pode escalar horizontal              │
│    ├── Auth: Google OAuth → valida hd = agconsultorialtda.com    │
│    ├── REST: /meetings, /recordings, /transcriptions             │
│    ├── WebSocket: status updates em tempo real                   │
│    └── Enfileira jobs → [Redis Bull Queue]                       │
└──────────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────┐
│                      ASYNC PROCESSING                            │
│  [Transcription Worker] — consumes Bull queue                    │
│    ├── Download: Google Drive → temp storage                     │
│    ├── Transcribe: Gemini Flash API                              │
│    ├── Save: PostgreSQL + atualiza status                        │
│    └── Notify: emite evento WebSocket / envia email              │
└──────────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  [PostgreSQL] — fonte de verdade (CP, ACID)                      │
│  [Redis] — Bull queue + cache + sessão (AP)                      │
│  [Google Drive] — storage de arquivos de vídeo                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Decisões Críticas com Trade-offs

### D1: Por que fila assíncrona para transcrição?

**Opção descartada: síncrona (bot aguarda transcrição)**
- Transcrição leva 1–5 minutos
- Bot ficaria com request HTTP aberta por minutos → timeout
- Sem retry em falha do Gemini

**Decisão: Bull queue + worker assíncrono**
- Bot envia job → retorna 200 imediatamente
- Worker processa de forma independente
- Retry automático com backoff exponencial se Gemini falhar
- Concorrência configurável (6 workers em paralelo para 6 bots)

**Custo:** mais complexidade, mais infra (Redis obrigatório), debugging mais difícil

---

### D2: Google Drive como storage vs S3

**Opção Google Drive:**
- Já incluso no Google Workspace ($0 adicional)
- API OAuth2 com refresh token — já implementado
- Limite de quota: 15GB por conta (Workspace: ilimitado em planos pagos)
- Sem CDN nativo — URL de download por requisição autenticada

**Opção S3:**
- $0.023/GB/mês para os ~108GB = ~$2.5/mês
- CDN via CloudFront nativo
- Gestão de lifecycle policies (deleção automática após 180d)
- Uma dep extra (AWS SDK)

**Decisão: Google Drive**
- Custo zero (Workspace já pago)
- Política de retenção 180d: job de deleção programado compensa a ausência de lifecycle nativo
- Se o projeto escalar para terabytes: reavaliar para S3 com lifecycle

---

### D3: PostgreSQL single instance vs Supabase

**Opção Postgres self-hosted:**
- Controle total
- Custo de operação: backup manual, update manual, monitoring manual
- Em DigitalOcean: ~$15/mês para managed Postgres

**Opção Supabase:**
- Backup automático, updates, monitoring incluídos
- RLS nativo (multitenancy do PULSAR-RH roda nele)
- Realtime subscription para WebSocket via Supabase Realtime
- SDK com type-safety automático
- Custo: free tier ou $25/mês Pro

**Decisão: Supabase**
- Elimina overhead operacional de um dev só
- Free tier suficiente para a escala atual
- RLS + Realtime são features únicas que o Postgres self-hosted não dá grátis

---

### D4: Autenticação

**Opção escolhida: Google OAuth com validação de hd**

```ts
// Validação obrigatória — sem ela, qualquer conta Google acessa:
if (payload.hd !== 'agconsultorialtda.com') {
  throw new UnauthorizedError('Access restricted to AG Consultoria domain')
}
```

**Por que não auth própria:**
- Time de 1 dev — não há ROI em construir e manter auth própria
- Toda a equipe já está no Workspace — zero atrito de login
- Elimina gestão de senha, recuperação de conta, 2FA próprio

---

### D5: Notificação quando transcrição fica pronta

**Opção WebSocket (implementada):**
- Dashboard atualiza em tempo real quando status muda
- Worker emite evento → servidor publica via socket.io ou Supabase Realtime
- Custo: conexão persistente por usuário ativo

**Opção polling (mais simples):**
- Frontend faz GET /api/recordings a cada 30s
- Sem infra extra, sem WebSocket
- Latência de 0 a 30s para o usuário ver atualização
- Para 6 usuários × 2 req/min = 12 req/min — insignificante

**Decisão: polling para MVP, Supabase Realtime quando justificado**
- Polling de 30s tem latência aceitável (transcrição leva minutos de qualquer forma)
- Supabase Realtime é drop-in quando quiser — sem refactor de arquitetura

---

### D6: Retenção LGPD — deleção automática de 180 dias

```sql
-- Schema: coluna expires_at em recordings
CREATE TABLE recordings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '180 days',
  status      TEXT NOT NULL DEFAULT 'pending',
  drive_file_id TEXT,
  transcript  TEXT,
  deleted_at  TIMESTAMPTZ
);
```

```ts
// Job diário de purge (cron a cada 24h):
async function purgeExpiredRecordings() {
  const expired = await prisma.recording.findMany({
    where: { expires_at: { lt: new Date() }, deleted_at: null },
    select: { id: true, driveFileId: true }
  })

  for (const rec of expired) {
    if (rec.driveFileId) await deleteDriveFile(rec.driveFileId)
    await prisma.recording.update({
      where: { id: rec.id },
      data: { deleted_at: new Date(), transcript: null }
    })
  }

  console.log(`Purged ${expired.length} recordings expired by LGPD 180d policy`)
}
```

---

## Gargalos Identificados

| Gargalo | Quando aparece | Mitigação |
|---|---|---|
| Gemini API rate limit | >6 transcrições simultâneas | Throttle no worker: concorrência máxima configurável |
| Google Drive upload quota | >Xh de vídeo/dia | Monitorar quota; migrar para S3 se necessário |
| PostgreSQL conexões | >100 conexões simultâneas | PgBouncer (connection pooling) — Supabase inclui |
| Chrome RAM (bots) | >4 bots na mesma máquina | Máquina maior ou distribuição em múltiplos hosts |
| Transcrição de reunião muito longa | >2h → job leva >10min | Aumentar timeout do worker; dividir em chunks |

---

## Schema Simplificado

```sql
-- Tabelas principais:
CREATE TABLE meetings (
  id          UUID PRIMARY KEY,
  title       TEXT,
  google_meet_url TEXT,
  started_at  TIMESTAMPTZ,
  ended_at    TIMESTAMPTZ,
  status      TEXT  -- 'scheduled' | 'recording' | 'processing' | 'done'
);

CREATE TABLE recordings (
  id          UUID PRIMARY KEY,
  meeting_id  UUID REFERENCES meetings(id),
  drive_file_id TEXT,
  duration_seconds INTEGER,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '180 days',
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transcriptions (
  id          UUID PRIMARY KEY,
  recording_id UUID REFERENCES recordings(id),
  text        TEXT,
  language    TEXT DEFAULT 'pt-BR',
  model       TEXT,            -- 'gemini-flash-1.5' ou versão usada
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bot_sessions (
  id          UUID PRIMARY KEY,
  meeting_id  UUID REFERENCES meetings(id),
  status      TEXT  -- 'joining' | 'recording' | 'leaving' | 'done' | 'failed'
);
```

---

## Exercício: escrever como se fosse entrevista

```bash
# Simular a entrevista em voz alta por 20 minutos:
# 1. Ler os requisitos em voz alta (2 min)
# 2. Fazer estimativa back-of-envelope em voz alta (3 min)
# 3. Desenhar o diagrama no papel/quadro (5 min)
# 4. Explicar cada decisão crítica em ordem de impacto (10 min)
# 5. Nomear os gargalos e como mitigaria cada um (2 min)

# Verificar o que está implementado no Meet Hub real:
cd ~/projetos/meet-hub

# Banco: estrutura real vs design acima
cat prisma/schema.prisma | grep -A 10 "model Recording\|model Meeting\|model Transcript"

# Fila: configuração real vs design
grep -rn "new Queue\|Bull" apps/api/src/ --include="*.ts" | grep -v "node_modules"

# Auth: validação de hd real vs design
grep -rn "hd\|agconsultorialtda" apps/api/src/ --include="*.ts" | grep -v "node_modules"

# Retenção: job de purge existe?
grep -rn "expires_at\|purge\|delete.*expires\|180" apps/api/src/ --include="*.ts" | grep -v "node_modules"
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] system design audit Meet Hub

**Comparação design do zero vs implementação real:**

| Componente | Design ideal | Real | Gap |
|---|---|---|---|
| Fila de transcrição | Bull + Redis | [verificar] | [delta] |
| Auth | Google OAuth + hd check | [verificar] | [delta] |
| Storage | Google Drive | [verificar] | [delta] |
| Retenção LGPD | expires_at + job diário | [verificar] | [delta] |
| Notificação | Polling ou Realtime | [verificar] | [delta] |

**Desvios justificados:**
[listar o que existe mas é diferente do design, com motivo]

**Gaps a endereçar:**
[listar o que está faltando com prioridade]

**Defesa em entrevista:**
"Projetei e construí o Meet Hub para substituir Google Workspace Meeting Standard
($240/mês) por ~R$100/mês. As principais decisões foram: fila assíncrona para
transcrição (evita timeout HTTP e dá retry grátis), Google Drive como storage
(zero custo adicional sobre o Workspace já pago), Supabase para zero overhead
operacional de banco, e Google OAuth restrito ao domínio da empresa.
O sistema roda 6 bots simultâneos em produção desde abril de 2026."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Me projete um sistema de gravação e transcrição de reuniões para uma equipe de 20 pessoas."
>
> **R (resumo estruturado para 20 minutos de whiteboard):**
> "Vou começar pelos requisitos não-funcionais porque eles guiam a arquitetura. 20 usuários, reuniões de ~1h, retenção de 180 dias por compliance... [faz estimativa em voz alta]... ~100GB de vídeo total, ~2 req/s de pico — isso é pequeno, não precisa de escala horizontal ainda.
>
> Arquitetura: bot captura vídeo → enfileira job → worker transcreve assíncrono. Por que fila: transcrição leva minutos, não dá para fazer síncrono. Retry automático se a API de transcrição falhar.
>
> Storage: avaliei S3 vs Google Drive. Como a empresa usa Workspace, Drive é zero custo adicional. Aceito a complexidade de não ter lifecycle automático — resolvo com job diário de deleção.
>
> Banco: Postgres via Supabase. Single instance é suficiente para esse volume. Supabase elimina overhead operacional de backup e update.
>
> Os gargalos que eu monitoraria: quota da API de transcrição, RAM dos bots Chrome (300MB por instância), e conexões de banco. Quando algum deles estiver saturado, endereço especificamente — não escalo horizontalmente por precaução."

> **P:** "Como você garantiria a retenção de 180 dias exigida pelo LGPD nesse sistema?"
>
> **R (30s):**
> "Coluna `expires_at` em `recordings` calculada no insert como `now() + 180 days`. Job diário que busca registros com `expires_at < now()`, deleta o arquivo do storage (Drive ou S3), e faz soft delete no banco — `deleted_at = now()`, `transcript = null`. O registro fica como tombstone sem dado pessoal, o que preserva integridade referencial e permite auditar que a deleção aconteceu. Registro da deleção no audit log: user_id='system', action='lgpd_purge', entity_id=recording_id."

---

## Checkpoint

- [ ] Consigo fazer a estimativa back-of-envelope do Meet Hub sem consultar (vídeo, banco, tráfego)
- [ ] Sei defender cada uma das 6 decisões críticas com trade-off explícito em voz alta
- [ ] Comparei o design ideal com a implementação real e documentei os gaps
- [ ] Consigo conduzir o exercício completo em 20 minutos sem travar
- [ ] Recitei o resumo de defesa da entrevista em voz alta em menos de 90 segundos

---

## Recursos

- Martin Kleppmann — *Designing Data-Intensive Applications* — o livro de referência para system design com profundidade
- [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) — guia com casos e templates
- [Excalidraw](https://excalidraw.com/) — desenhar diagramas de arquitetura para entrevista
- [ByteByteGo](https://bytebytego.com/) — newsletter + vídeos de system design visual
