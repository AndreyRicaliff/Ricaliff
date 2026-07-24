# 07 — Auditoria e Logs Imutáveis

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**Audit log** é o registro de **quem fez o quê e quando** — em especial nas operações sensíveis: acesso a dado, mudança de config, login/logout, alteração financeira. A propriedade que o define não é "existir": é ser **imutável** — não pode ser modificado nem deletado após a inserção. Um log editável não serve como evidência: qualquer atacante com acesso ao banco apaga o rastro; um DBA mal-intencionado remove a prova da própria auditoria. O **Café com AG** tem a implementação real: `cag_log` com trigger que bloqueia UPDATE e DELETE — o caso de estudo desta trilha.

---

## § BASE — o fundamento

**O princípio tem 50 anos e nome: compromise recording.** No mesmo paper de 1975 (módulo 01), Saltzer & Schroeder listam, além dos 8 princípios de projeto, duas "quase-regras" pragmáticas — e a segunda é exatamente esta: **compromise recording**. A ideia é honesta sobre os limites da prevenção: "às vezes registrar de forma confiável que um comprometimento aconteceu é mais barato e mais útil do que mecanismos elaborados para preveni-lo por completo". O audit log é a materialização dessa regra. Ele aceita que você não vai barrar todo ataque — mas garante que, quando um passar, existirá **evidência íntegra** do que aconteceu.

**A propriedade de segurança que o log entrega: não-repúdio.** Além da tríade CIA (confidencialidade, integridade, disponibilidade), a segurança clássica reconhece o **não-repúdio** — a impossibilidade de o autor de uma ação negar tê-la praticado. Um audit log íntegro é o mecanismo de não-repúdio do sistema: ele liga *ator → ação → tempo* de forma que ninguém possa depois dizer "não fui eu" ou "isso não aconteceu". Para isso valer, o log precisa de duas propriedades técnicas: ser **append-only** (WORM — *write once, read many*) e ser **tamper-evident** (qualquer adulteração é detectável).

**A técnica que torna a adulteração detectável tem origem acadêmica: o hash chain.** Encadear registros pelo hash do anterior não foi inventado pelo blockchain — vem de **Stuart Haber e W. Scott Stornetta**, no artigo *How to Time-Stamp a Digital Document* (**Journal of Cryptology, 1991**). A construção: cada registro carrega o **hash do registro anterior**, formando uma corrente. Formalmente:

```
h₀ = SHA256("GENESIS")
hₙ = SHA256( registroₙ ‖ hₙ₋₁ )      (‖ = concatenação)
```

A propriedade que isso dá: alterar o registro *k* muda `h_k`, que quebra o `previous_hash` de *k+1*, que quebra *k+2*... — **uma adulteração em qualquer ponto invalida toda a cadeia a partir dali**. É a propriedade da função de hash criptográfica (resistência a segunda-preimagem) transformada em prova de integridade sequencial. Um auditor externo verifica a cadeia inteira **sem precisar de acesso privilegiado ao banco** — só recalculando os hashes. Custo: a verificação é **O(n)** no tamanho do log (recalcula tudo).

**O que a lei e as normas exigem.** Não-repúdio não é luxo: a **LGPD, art. 37**, obriga o controlador a **manter registro das operações de tratamento** de dados pessoais. Normas de compliance formalizam o mesmo: **PCI-DSS Requisito 10** (rastrear e monitorar todo acesso a dado de cartão), **ISO/IEC 27001 controle A.12.4** (logging e monitoramento), **SOC 2** (trilha de auditoria à prova de adulteração). No OWASP 2021 a ausência disso é **A09 — Security Logging and Monitoring Failures**; segundo o relatório, é uma categoria difícil de testar automaticamente e por isso subiu no ranking pela *community survey*. Para a AG tratar dado de RH (PULSAR-RH), audit trail não é opcional — é o art. 37.

**O caso real.** No breach do **JPMorgan Chase (2014)**, dados de ~76 milhões de domicílios e ~7 milhões de pequenas empresas foram comprometidos — número divulgado pelo próprio banco em **registro 8-K junto à SEC** (out/2014). O ponto para este módulo: foi a existência de logs de acesso que permitiu **determinar a extensão** do comprometimento após a descoberta. Sem trilha adequada, seria impossível saber o que o atacante tocou — e "não sabemos o alcance" é o pior cenário num incidente.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Duas técnicas de imutabilidade, em níveis de garantia crescentes:

```
NÍVEL   TÉCNICA                        PROTEGE CONTRA                    CUSTO
1       append-only + trigger          SQL direto (UPDATE/DELETE)        ~zero; superusuário contorna
        (BEFORE UPDATE OR DELETE)
2       + role restrito (só INSERT)    a própria aplicação alterar       gestão de role no banco
3       + hash chain (Haber-Stornetta) adulteração por QUALQUER via,     verificação O(n); complexidade
                                        prova p/ auditor externo
```

**Técnica 1 — Trigger de bloqueio (a do `cag_log`):**

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,       -- 'login', 'view_recording', 'export_report'
  entity_type TEXT, entity_id TEXT,
  ip_address  INET, user_agent TEXT,
  metadata    JSONB                -- extras SEM PII desnecessário
);

CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable: % on % is not allowed', TG_OP, TG_TABLE_NAME;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
-- UPDATE/DELETE → ERROR; só INSERT passa.
```

**Limitação (dita na cara):** o trigger só vale dentro do Postgres com as permissões certas — um **superusuário** dropa o trigger e altera. Mitigação: a aplicação **não** usa superusuário; a role dela tem só `INSERT + SELECT` em `audit_log` (é o Nível 2, defense in depth).

**Técnica 2 — Hash chain (quando o requisito é prova para auditor externo):**

```ts
import crypto from 'crypto'
async function insertAuditEntry(e: { userId: string; action: string; payload: object }) {
  const last = await prisma.$queryRaw<{ this_hash: string }[]>`
    SELECT this_hash FROM audit_log_hashed ORDER BY id DESC LIMIT 1`
  const previousHash = last[0]?.this_hash ?? 'GENESIS'
  const content = JSON.stringify({ ...e, previousHash, ts: new Date().toISOString() })
  const thisHash = crypto.createHash('sha256').update(content).digest('hex')  // hₙ = SHA256(registroₙ‖hₙ₋₁)
  await prisma.$executeRaw`INSERT INTO audit_log_hashed
    (user_id, action, payload, previous_hash, this_hash)
    VALUES (${e.userId}, ${e.action}, ${e.payload}, ${previousHash}, ${thisHash})`
}
// Verificação: recalcular a cadeia do GENESIS ao topo; qualquer hash que não bate = adulteração (O(n)).
```

**Quando usar hash chain:** requisito de provar a um auditor externo que o log não foi tocado. Para uso interno da AG, trigger + role restrito já basta.

**O que logar / o que NUNCA logar:**

```ts
interface AuditEvent {
  timestamp: Date; userId: string    // ID — nunca nome/email direto
  action: string                     // 'view_report', 'export_data', 'change_permission'
  entityType: string; entityId: string; ipAddress: string
  success: boolean; reason?: string  // em falha: por quê
}
```

**Sempre logar:** login/logout/falha de auth; acesso a dado sensível; export/download; mudança de permissão/role; criação/exclusão de conta; mudança de config de segurança; **pedido de exclusão LGPD** (art. 18). **Nunca logar:** senha (nem hash); token de sessão; PII direto (email/CPF/nome — usar `user_id`); payload completo com PII; dado financeiro em claro. O log tem acesso mais amplo que o dado original — não replique PII nele.

**Trade-off das arquiteturas:**

| Abordagem | Vantagem | Custo |
|---|---|---|
| Trigger de bloqueio | simples, zero overhead no app | só barra SQL direto; superusuário contorna |
| Hash chain | prova criptográfica de integridade | verificação O(n); complexidade |
| Ledger DB (QLDB, immudb) | imutabilidade nativa do banco | outra infra; vendor lock |
| WORM storage (S3 Object Lock) | imutabilidade por política de storage | não é banco — consulta é cara |
| Tabela + role só-INSERT | defense in depth sem overhead | gestão de roles no banco |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. DEFINIR o que é evento auditável.** Não logue tudo — logue as ações sensíveis (a lista acima). Ruído demais esconde o sinal e vira PII a mais para proteger.

**2. MODELAR o evento sem PII.** `user_id` (não nome), ação em vocabulário de negócio (`view_employee_report`, não `GET /api/reports/123`), entidade, IP, sucesso/falha. Nada de senha/token/PII.

**3. TORNAR append-only (Nível 1 + 2).** Trigger que bloqueia UPDATE/DELETE **e** role de aplicação com só `INSERT + SELECT`. As duas juntas — uma cobre o furo da outra.

**4. ELEVAR a tamper-evident se o requisito pedir (Nível 3).** Hash chain (Haber-Stornetta) quando um auditor externo precisa provar integridade sem acesso ao banco.

**5. TESTAR a imutabilidade.** Rodar `UPDATE`/`DELETE` no log e confirmar que **falha**. "É imutável" só existe depois de observado o erro — regra da casa.

**Anti-padrões:**
- **App com superusuário:** anula o trigger (o superusuário dropa). Role dedicada só-INSERT.
- **PII no audit log:** o log é mais acessível que o dado original — logar email ali multiplica a exposição. `user_id` sempre.
- **Logar `GET /api/x/123` em vez da ação de negócio:** na investigação você quer "quem exportou o relatório do colaborador Y", não uma rota. Vocabulário de negócio.
- **Hash chain "por garantia" sem necessidade:** verificação O(n) e complexidade que você não precisa se o requisito é interno. Trigger + role primeiro.

## Diagrama da arquitetura do `cag_log`

```
[Ação do usuário] → [App Node/Express]
        ├─→ [operação principal] → [tabela principal]
        └─→ [INSERT em cag_log] → [PostgreSQL trigger]
                                        ├─ INSERT: OK → [row imutável para sempre]
                                        └─ UPDATE/DELETE: EXCEPTION
   Audit query: SELECT action, user_id, created_at FROM cag_log
                WHERE entity_id = 'X' ORDER BY created_at DESC   -- quem viu o quê?
```

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
# 1. Achar a implementação do cag_log
find ~/projetos/cafe_com_ag -name "*.sql" -o -name "*.prisma" | head -20
grep -rn "cag_log\|audit_log\|audit" ~/projetos/cafe_com_ag/ \
  --include="*.sql" --include="*.ts" --exclude-dir=node_modules
# 2. Testar a imutabilidade (se tiver banco local): UPDATE cag_log ... → esperar ERROR
# 3. Quais projetos AG NÃO têm audit log?
for p in meet-hub PULSAR-RH cliente-oficina-backend; do echo "=== $p ==="; \
  grep -rn "audit\|log_event\|track" ~/projetos/$p/prisma/ ~/projetos/$p/apps/api/src/ \
    --include="*.prisma" --include="*.ts" 2>/dev/null | head -5; done
```

```markdown
## DECISIONS.md — 2026-06-XX — [audit] mapeamento de audit logs AG
**Café com AG — cag_log:** trigger bloqueia UPDATE/DELETE? [sim/não]; role restrito? o que loga?
**Projetos sem audit log:** meet-hub / PULSAR-RH / cliente-oficina-backend [status]
**Recomendação:** PULSAR-RH é prioridade — dado de RH sensível (NR-1) exige registro de acesso
  por compliance (LGPD art. 37). Implementar audit_log com trigger + role só-INSERT.
```

## Por que cai em entrevista

"Como você garantiria integridade de logs de auditoria?" é pergunta de pleno/sênior em empresa com compliance (fintech, saúde, RH, jurídico). A AG tem implementação real — isso é ouro.

> **P:** "Como você garantiria que logs de auditoria não pudessem ser adulterados?"
>
> **R (30s):**
> "A abordagem que implementamos no Café com AG é a mais simples e eficaz para começar: trigger PostgreSQL que lança exceção em qualquer UPDATE ou DELETE na tabela de audit log. A tabela aceita só INSERT. Complementando, a role de banco usada pela aplicação tem só permissão de INSERT e SELECT nessa tabela — nem o app consegue alterar. Se precisar de prova criptográfica para auditoria externa, adiciono hash chain: cada linha inclui o hash da anterior, verificável por qualquer auditor sem acesso ao banco."

> **P:** "O que você loga numa auditoria de acesso a dados sensíveis?"
>
> **R (30s):**
> "User ID, não dados pessoais do usuário — para não criar PII no próprio log. A ação em vocabulário de negócio: 'view_employee_report', não só 'GET /api/reports/123'. O ID do recurso acessado. Timestamp e IP. Sucesso ou falha. O que eu nunca loco: senha, token de sessão, CPF, dados de saúde em texto claro — o log é um dado de auditoria que vai ter acesso mais amplo que o dado original."

> **P:** "Por que um audit log importa se você já tem prevenção — firewall, RLS, auth? E por que a imutabilidade é a parte inegociável?"
>
> **R (30s):**
> "Porque prevenção nunca é completa — isso é o princípio de compromise recording, do Saltzer e Schroeder, de 1975: quando um ataque passa, registrar de forma confiável o que aconteceu costuma valer mais do que tentar prevenir tudo. O audit log é o mecanismo de não-repúdio do sistema: liga ator, ação e tempo. E a imutabilidade é inegociável porque um log que pode ser editado não é evidência — o próprio atacante apaga o rastro. Por isso trigger que bloqueia UPDATE e DELETE, role só-INSERT, e hash chain quando preciso provar integridade a um auditor externo. Foi o JPMorgan em 2014: foram os logs de acesso que permitiram medir a extensão do breach depois."

## Checkpoint

- [ ] Explico o audit log como compromise recording (Saltzer & Schroeder) e mecanismo de não-repúdio
- [ ] Escrevo a trigger PostgreSQL de bloqueio de UPDATE/DELETE sem consultar
- [ ] Explico o hash chain (Haber-Stornetta): `hₙ=SHA256(registroₙ‖hₙ₋₁)`, por que uma adulteração quebra a cadeia, e o custo O(n)
- [ ] Sei o que deve e o que NUNCA deve ser logado (user_id, não PII)
- [ ] Li a implementação do `cag_log` e sei ligar a exigência à LGPD art. 37
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- *The Protection of Information in Computer Systems* — Saltzer & Schroeder (1975): a regra pragmática de **compromise recording** (o fundamento do audit log)
- *How to Time-Stamp a Digital Document* — Haber & Stornetta (Journal of Cryptology, 1991): a origem do hash chain / encadeamento criptográfico de registros (o ancestral do blockchain)
- LGPD art. 37 — obrigação de registro das operações de tratamento; PCI-DSS Req. 10, ISO/IEC 27001 A.12.4, SOC 2 — o mesmo requisito nas normas de compliance
- OWASP Top 10 2021 — A09 *Security Logging and Monitoring Failures*
- PostgreSQL docs — *Trigger Functions* (`plpgsql`): a base do bloqueio de UPDATE/DELETE
- immudb — banco open-source com imutabilidade nativa (referência do conceito de ledger DB)
- JPMorgan Chase 2014 — registro 8-K junto à SEC (out/2014): ~76M domicílios; caso em que os logs mediram a extensão do breach
- Módulo-irmão `06-lgpd-na-pratica` — o registro da exclusão (art. 18) e das operações (art. 37) que caem neste log
