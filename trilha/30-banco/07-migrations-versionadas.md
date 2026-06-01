# 07 — Migrations versionadas

## O que é

Migration é um arquivo versionado que descreve uma mudança de schema — um `ALTER TABLE`, um `CREATE INDEX`, uma coluna nova. Versionada significa que cada migration tem um ID único, é aplicada uma vez e nunca modificada depois do deploy.

O contrato: **o estado do banco é a soma das migrations aplicadas, em ordem**. Qualquer banco (dev, staging, prod) que aplica todas as migrations chega ao mesmo schema.

**Com Prisma:**

```bash
# Fluxo padrão
npx prisma migrate dev --name add_question_type   # cria migration a partir do diff schema.prisma
npx prisma migrate deploy                          # aplica migrations pendentes (CI/produção)
npx prisma migrate status                          # quais migrations estão aplicadas / pendentes
npx prisma migrate diff                            # mostra o SQL que seria gerado sem criar o arquivo
```

**Com SQL puro (Supabase):**

```bash
supabase migration new add_question_type           # cria arquivo vazio em supabase/migrations/
supabase db push                                   # aplica no banco local
supabase db push --linked                          # aplica no projeto Supabase vinculado (prod)
```

---

## Por que migration não é lugar de seed

**Seed** é dado inicial (categorias padrão, usuário admin, planos de produto). **Migration** é estrutura de banco.

Misturar os dois quebra o contrato de migrations:

```sql
-- ERRADO — migration com seed embutido
ALTER TABLE subscription_plans ADD COLUMN trial_days int DEFAULT 14;

INSERT INTO subscription_plans (name, price) VALUES
  ('Starter', 99.00),
  ('Pro', 299.00);
-- Se os planos mudarem, você cria migration nova que conflita com essa
```

```sql
-- CORRETO — migration só muda estrutura
ALTER TABLE subscription_plans ADD COLUMN trial_days int DEFAULT 14;

-- Seed fica em script separado: seed.sql ou prisma/seed.ts
-- Executado uma vez no setup, nunca dentro de migrate
```

**Por quê importa:** migrations são executadas em produção automaticamente no deploy. Seed de dado de negócio num deploy automático é bug esperando para acontecer — o dado pode duplicar, conflitar com dados reais ou ter sido deletado pelo usuário.

---

## Rollback estratégias

O Postgres não tem rollback automático de schema em falha parcial de migration — o Prisma e Supabase envolvem cada migration num `BEGIN/COMMIT`, mas se a migration aplicou e depois você quer desfazer, você precisa de uma migration de rollback.

**Estratégia de rollback em produção:**

```sql
-- Migration: 20240615_add_question_type.sql
ALTER TABLE questions ADD COLUMN type varchar(50) NOT NULL DEFAULT 'text';
CREATE INDEX idx_questions_type ON questions (type);

-- Se precisar reverter (rollback migration): criar nova migration
-- 20240616_rollback_question_type.sql
DROP INDEX IF EXISTS idx_questions_type;
ALTER TABLE questions DROP COLUMN type;
```

**Regra prática:** toda migration destrutiva deve ter um "plano B" escrito antes do deploy. Se o `DROP COLUMN` der errado, o que você faz? Restoration de backup? Migration de restore? Isso deve estar decidido antes do `git push`.

---

## Migration destrutiva: como proteger

Operações irreversíveis ou de alto risco:

| Operação | Risco | Proteção |
|---|---|---|
| `DROP COLUMN` | dado sumido para sempre | backup antes; garantir que nenhuma query usa a coluna |
| `DROP TABLE` | idem | idem |
| `ALTER COLUMN TYPE` | conversão pode falhar ou perder precisão | testar com `USING`, validar em staging com dado real |
| `NOT NULL` sem DEFAULT | falha se existir linha com NULL | adicionar DEFAULT primeiro, depois NOT NULL em migration separada |
| `RENAME` (coluna/tabela) | quebra queries que usam o nome antigo | deploy em fases: adicionar coluna nova, migrar código, remover coluna antiga |
| Index sem `CONCURRENTLY` | trava escrita na tabela durante criação | sempre `CREATE INDEX CONCURRENTLY` em produção |

**Padrão para adicionar NOT NULL em produção sem downtime:**

```sql
-- Passo 1 (migration): adicionar com DEFAULT para linhas existentes
ALTER TABLE surveys ADD COLUMN archived_at timestamptz;

-- Passo 2 (migration separada, depois do código deployado):
-- Backfill (se necessário):
UPDATE surveys SET archived_at = updated_at WHERE archived_at IS NULL AND status = 'archived';

-- Passo 3 (migration separada):
ALTER TABLE surveys ALTER COLUMN archived_at SET NOT NULL;
-- Só depois que TODAS as linhas têm valor
```

---

## Por que cai em entrevista

- "Como você faz rollback de uma migration em produção?"
- "O que você colocaria dentro de uma migration? O que não colocaria?"
- "Qual o risco de adicionar NOT NULL sem DEFAULT numa coluna existente?"
- "Como você criaria um índice em tabela de produção sem downtime?"
- "O que é `prisma migrate diff`?"

---

## Trade-offs

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| Prisma migrate | schema derivado do Prisma schema; type-safety automática | só funciona com Prisma; geração automática pode gerar SQL inesperado |
| Flyway/Liquibase | agnóstico de linguagem; controle total do SQL | mais verboso; sem geração automática de diff |
| SQL manual (Supabase) | controle total; funciona com qualquer cliente | sem geração de diff automática; mais disciplina necessária |

Para projetos AG: Prisma migrate em projetos com Node/Prisma. SQL manual no Supabase para PULSAR-RH e OFICINA (que usam Supabase como camada de banco sem Prisma como ORM principal).

---

## Exercício aplicado (projeto AG real)

No PULSAR-RH, as migrations ficam em `supabase/migrations/`. Classificar 3 migrations recentes.

**Passo 1 — listar as migrations mais recentes:**

```bash
ls -lt ~/projetos/PULSAR-RH/supabase/migrations/ | head -10
```

**Passo 2 — para cada migration, classificar:**

```
SEGURA se:
- Só ADD COLUMN com DEFAULT ou nullable
- CREATE TABLE nova
- CREATE INDEX CONCURRENTLY
- Qualquer operação aditiva

DESTRUTIVA se:
- DROP COLUMN / DROP TABLE
- ALTER COLUMN TYPE
- NOT NULL sem verificar se há NULLs
- RENAME sem estratégia de compatibilidade
- CREATE INDEX sem CONCURRENTLY (trava escrita)
```

**Passo 3 — para cada migration destrutiva encontrada, responder:**

1. Essa migration foi deployada com backup prévio?
2. Tem migration de rollback documentada?
3. O código foi deployado antes ou depois da migration?

**Passo 4 — registrar achados em `PULSAR-RH/DECISIONS.md`:**

```markdown
## 2026-06-XX — [reliability] auditoria de migrations PULSAR-RH

**Migrations revisadas:** [listar arquivos e datas]
**Seguras:** X de Y
**Destrutivas sem plano de rollback:** [listar]
**Ação:** documentar plano de rollback para as destrutivas identificadas.
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Você precisa adicionar uma coluna NOT NULL numa tabela de produção com 1 milhão de linhas. Como faz?"

**R (30s):**
"Em três migrations separadas, deployadas em ciclos diferentes. Primeiro: `ADD COLUMN` com `DEFAULT` ou nullable — esse é instantâneo no Postgres moderno (metadados, sem rewrite). Segundo: backfill das linhas existentes em lote se necessário, e deployment do código que já usa a coluna nova. Terceiro: `ALTER COLUMN SET NOT NULL` depois de garantir que não existe linha com NULL. Se fizer tudo numa migration só — `ADD COLUMN NOT NULL` sem DEFAULT — o Postgres precisa validar todas as linhas e bloqueia escrita enquanto faz isso, ou simplesmente falha se houver NULL existente."

**P:** "O que você NUNCA coloca dentro de uma migration?"

**R (30s):**
"Seed de dado de negócio. Migration muda estrutura, não insere dados de produto. Dado de negócio num migration automático pode duplicar, conflitar com dado real ou ter sido deletado pelo usuário. O outro caso: `CREATE INDEX` sem `CONCURRENTLY` em tabela de produção com escrita concorrente — trava a tabela inteira durante a criação. E lógica condicional baseada em dado (`IF EXISTS SELECT ...`) — migrations devem ser determinísticas, não depender do estado atual dos dados."

---

## Checkpoint

- [ ] Sei a diferença entre migration e seed com exemplo concreto
- [ ] Entendo por que adicionar NOT NULL direto em coluna existente é perigoso
- [ ] Sei criar índice em produção sem downtime (`CONCURRENTLY`)
- [ ] Classifiquei pelo menos 3 migrations do PULSAR-RH como segura ou destrutiva
- [ ] Consigo explicar o fluxo de rollback de uma migration destrutiva

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Migrations versionadas dominadas`.

---

## Recursos

- Prisma docs — [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- Supabase docs — [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- Postgres docs — [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) — especialmente as notas de lock level por operação
