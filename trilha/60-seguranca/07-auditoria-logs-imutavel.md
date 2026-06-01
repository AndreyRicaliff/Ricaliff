# 07 — Auditoria e Logs Imutáveis

## O que é

**Audit log** é o registro de quem fez o quê e quando em um sistema — especialmente operações sensíveis como acesso a dados, mudanças de configuração, login/logout, alterações financeiras. A propriedade fundamental: **o log não pode ser modificado ou deletado após inserção**.

Um log que pode ser editado não serve como evidência. Se o banco tiver UPDATE em audit_log, qualquer atacante com acesso ao banco pode apagar o rastro. Se o DBA com más intenções tiver acesso, pode remover evidências de auditoria interna.

O **Café com AG** tem implementação real disso: `cag_log` com trigger que bloqueia UPDATE e DELETE. Isso é o caso de estudo desta trilha.

---

### Por que log imutável importa

**Contexto legal:** em investigação de incidente, o audit log é a prova. No caso de **JPMorgan breach (2014)** — 76 milhões de contas comprometidas — o fato de que o ataque ficou sem detecção por meses foi evidenciado pelos logs. Sem logs de acesso adequados, teria sido impossível determinar a extensão.

**Contexto regulatório:** LGPD art. 37 exige registro das operações de tratamento de dados pessoais. SOC 2, ISO 27001, PCI-DSS exigem audit trail tamper-proof. Para a AG processar dados de RH (PULSAR-RH), isso não é opcional.

**Contexto operacional:** quando algo der errado (bug, fraude, comportamento inesperado), o audit log é o que permite entender o que aconteceu.

---

### Técnica 1: Trigger de bloqueio (PostgreSQL)

A implementação do `cag_log` do Café com AG:

```sql
-- Criar tabela de audit log
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,      -- 'login', 'view_recording', 'export_report', etc.
  entity_type TEXT,               -- 'recording', 'user', 'report'
  entity_id   TEXT,               -- ID do objeto afetado
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB               -- dados extras sem PII desnecessário
);

-- Trigger que bloqueia UPDATE e DELETE
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable: % on % is not allowed',
    TG_OP, TG_TABLE_NAME;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Testar:
INSERT INTO audit_log (user_id, action, entity_type, entity_id)
VALUES ('uuid-aqui', 'login', 'session', 'sess-123');
-- Funciona

UPDATE audit_log SET action = 'modified' WHERE id = 1;
-- ERROR: Audit log is immutable: UPDATE on audit_log is not allowed

DELETE FROM audit_log WHERE id = 1;
-- ERROR: Audit log is immutable: DELETE on audit_log is not allowed
```

**Limitação:** essa proteção só funciona dentro do Postgres com as permissões corretas. Um superusuário Postgres pode dropar o trigger e fazer UPDATE. Mitigação: garantir que a aplicação não usa superusuário; usar role de banco com só INSERT+SELECT em audit_log.

---

### Técnica 2: Hash chain (ledger simples)

Cada linha do log inclui o hash da linha anterior — qualquer adulteração quebra a cadeia.

```sql
-- Schema com hash chain:
CREATE TABLE audit_log_hashed (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id      UUID,
  action       TEXT NOT NULL,
  payload      JSONB,
  previous_hash TEXT,             -- hash da linha anterior
  this_hash    TEXT               -- SHA256 desta linha (id + created_at + action + payload + previous_hash)
);
```

```ts
import crypto from 'crypto'

async function insertAuditEntry(
  entry: { userId: string; action: string; payload: Record<string, unknown> }
) {
  // Pegar hash da última linha
  const last = await prisma.$queryRaw<Array<{ this_hash: string }>>`
    SELECT this_hash FROM audit_log_hashed ORDER BY id DESC LIMIT 1
  `
  const previousHash = last[0]?.this_hash ?? 'GENESIS'

  // Calcular hash desta linha
  const content = JSON.stringify({
    userId: entry.userId,
    action: entry.action,
    payload: entry.payload,
    previousHash,
    timestamp: new Date().toISOString(),
  })
  const thisHash = crypto.createHash('sha256').update(content).digest('hex')

  await prisma.$executeRaw`
    INSERT INTO audit_log_hashed (user_id, action, payload, previous_hash, this_hash)
    VALUES (${entry.userId}, ${entry.action}, ${entry.payload}, ${previousHash}, ${thisHash})
  `
}
```

**Para verificar integridade:**

```ts
async function verifyAuditChain(): Promise<boolean> {
  const entries = await prisma.$queryRaw<Array<{
    id: number; user_id: string; action: string;
    payload: Record<string, unknown>; previous_hash: string; this_hash: string;
    created_at: Date;
  }>>`SELECT * FROM audit_log_hashed ORDER BY id ASC`

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const expectedPreviousHash = i === 0 ? 'GENESIS' : entries[i - 1].this_hash

    if (entry.previous_hash !== expectedPreviousHash) {
      console.error(`Chain broken at entry ${entry.id}`)
      return false
    }

    // Recalcular hash
    const content = JSON.stringify({
      userId: entry.user_id,
      action: entry.action,
      payload: entry.payload,
      previousHash: entry.previous_hash,
      timestamp: entry.created_at.toISOString(),
    })
    const expectedHash = crypto.createHash('sha256').update(content).digest('hex')

    if (entry.this_hash !== expectedHash) {
      console.error(`Hash mismatch at entry ${entry.id}`)
      return false
    }
  }

  return true
}
```

**Quando usar hash chain:** quando o requisito é provar para um auditor externo que o log não foi adulterado. Para uso interno da AG, trigger de bloqueio é suficiente.

---

### O que logar (e o que NÃO logar)

**Logar:**

```ts
// Modelo de evento de audit log:
interface AuditEvent {
  timestamp: Date
  userId: string        // ID — nunca nome/email direto
  action: string        // 'login', 'view_report', 'export_data', 'change_permission'
  entityType: string    // 'recording', 'user', 'report'
  entityId: string      // ID do objeto afetado
  ipAddress: string
  success: boolean
  reason?: string       // em caso de falha: por que falhou
}

// Ações que devem sempre gerar audit event:
// - Login / logout / falha de autenticação
// - Acesso a dados sensíveis (visualização de relatório de RH)
// - Export/download de dados
// - Mudança de permissão ou role
// - Criação/exclusão de conta
// - Mudança em configuração de segurança
// - Pedido de exclusão de dados (LGPD)
```

**NÃO logar:**
- Senha (nem hasheada)
- Token de sessão completo
- Dados pessoais diretamente (email, CPF, nome) — usar user_id e consultar tabela de usuários se precisar investigar
- Payload completo de requests que contêm PII
- Dados financeiros em texto claro

---

### Diagrama da arquitetura do cag_log

```
[Ação do usuário]
       │
       ▼
[Aplicação (Express/Node)]
       │
       ├─→ [Operação principal] ─→ [Tabela principal (update/insert)]
       │
       └─→ [INSERT em cag_log]
               │
               ▼
         [PostgreSQL trigger]
               │
         ┌─────┴─────┐
         ▼           ▼
    [INSERT: OK]  [UPDATE/DELETE: EXCEPTION]
         │
         ▼
   [cag_log row: imutável para sempre]
         │
         ▼
   [Audit query: quem viu o quê?]
   SELECT action, user_id, created_at
   FROM cag_log
   WHERE entity_id = 'X'
   ORDER BY created_at DESC
```

---

## Por que cai em entrevista

"Como você garantiria integridade de logs de auditoria?" é pergunta de pleno/sênior em empresas que têm compliance (fintech, saúde, RH, jurídico). A AG já tem implementação real — isso é ouro em entrevista.

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| Trigger de bloqueio | Simples, zero overhead no app | Só protege contra SQL direto; superusuário contorna |
| Hash chain | Prova criptográfica de integridade | Verificação é O(n) — cara para logs longos; complexidade |
| Ledger DB (QLDB, immudb) | Imutabilidade garantida pelo banco | Outra infra; custo; vendor lock |
| Write-only storage (S3 com Object Lock) | Imutabilidade por política de storage | Não é banco de dados — consulta é caro |
| Tabela separada + role restrito | Defense in depth sem overhead | Precisa de gestão de roles no banco |

Para a AG: trigger de bloqueio + role de banco com apenas INSERT+SELECT é o ponto de partida correto. Hash chain quando houver requisito de auditoria externa formal.

---

## Exercício aplicado (projeto AG real)

```bash
# 1. Encontrar a implementação do cag_log no Café com AG
find ~/projetos/cafe_com_ag -name "*.sql" -o -name "*.prisma" | head -20
find ~/projetos/cafe_com_ag -type f | grep -v node_modules | grep -v .git

# 2. Ler a definição da tabela e do trigger
# (ajustar path conforme o projeto real)
grep -rn "cag_log\|audit_log\|audit" ~/projetos/cafe_com_ag/ \
  --include="*.sql" --include="*.ts" --include="*.js" \
  --exclude-dir=node_modules

# 3. Testar a imutabilidade manualmente (se tiver acesso ao banco local)
# psql <connection-string>
# UPDATE cag_log SET action = 'test' WHERE id = 1;
# Esperado: ERROR

# 4. Verificar quais projetos AG NÃO têm audit log
for project in meet-hub PULSAR-RH cliente-oficina-backend; do
  echo "=== $project ==="
  grep -rn "audit\|audit_log\|log_event\|track" \
    ~/projetos/$project/prisma/ ~/projetos/$project/apps/api/src/ \
    --include="*.prisma" --include="*.ts" 2>/dev/null | head -5
done
```

```markdown
## DECISIONS.md — 2026-06-XX — [audit] mapeamento de audit logs AG

**Café com AG — cag_log:**
- [descrever o que encontrou na implementação]
- Trigger impede UPDATE/DELETE: [sim/não]
- O que é logado: [listar campos e ações]

**Projetos sem audit log:**
- meet-hub: [sim/não] — ações sensíveis: [listar]
- PULSAR-RH: [sim/não] — dados de RH exigem audit trail por compliance
- cliente-oficina-backend: [sim/não]

**Recomendação:**
PULSAR-RH é prioridade — dados de RH com categoria especial (NR-1) precisam de
registro de quem acessou. Implementar audit_log com trigger + role restrito.

**Diagrama da cadeia:**
[desenhar baseado no que encontrou no cag_log]
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você garantiria que logs de auditoria não pudessem ser adulterados?"
>
> **R (30s):**
> "A abordagem que implementamos no Café com AG é a mais simples e eficaz para começar: trigger PostgreSQL que lança exceção em qualquer UPDATE ou DELETE na tabela de audit log. A tabela aceita só INSERT. Complementando, a role de banco usada pela aplicação tem só permissão de INSERT e SELECT nessa tabela — nem o app consegue alterar. Se precisar de prova criptográfica para auditoria externa, adiciono hash chain: cada linha inclui o hash da anterior, verificável por qualquer auditor sem acesso ao banco."

> **P:** "O que você loga numa auditoria de acesso a dados sensíveis?"
>
> **R (30s):**
> "User ID, não dados pessoais do usuário — para não criar PII no próprio log. A ação em vocabulário de negócio: 'view_employee_report', não só 'GET /api/reports/123'. O ID do recurso acessado. Timestamp e IP. Sucesso ou falha. O que eu nunca loco: senha, token de sessão, CPF, dados de saúde em texto claro — o log é um dado de auditoria que vai ter acesso mais amplo que o dado original."

---

## Checkpoint

- [ ] Sei escrever a trigger PostgreSQL de bloqueio de UPDATE/DELETE sem consultar
- [ ] Entendo o mecanismo de hash chain e quando vale a complexidade extra
- [ ] Li a implementação do cag_log no Café com AG e documentei o que faz
- [ ] Sei o que deve e o que não deve ser logado num audit trail
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [PostgreSQL — Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [immudb](https://immudb.io/) — banco open-source com imutabilidade nativa (referência para o conceito de ledger DB)
- JPMorgan breach 2014: pesquisar "JPMorgan Chase data breach 2014 SEC filing" para o case de audit trail insuficiente
