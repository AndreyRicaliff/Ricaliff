# 05 — RLS: Row Level Security

## O que é

RLS é um mecanismo do Postgres que restringe quais linhas um usuário pode ver ou modificar — a restrição fica no banco, não na aplicação. Quando habilitado, o Postgres adiciona automaticamente um filtro invisível em cada query.

```sql
-- Sem RLS: qualquer usuário com acesso à tabela vê tudo
SELECT * FROM survey_responses;  -- retorna todas as linhas de todas as empresas

-- Com RLS habilitado + policy:
SELECT * FROM survey_responses;  -- retorna só as linhas da empresa do usuário atual
```

**Como funciona no nível técnico:**

O Postgres expõe a função `current_setting()` e variáveis de sessão (via `SET`). O Supabase injeta o JWT do usuário e expõe helpers como `auth.uid()` e `auth.jwt()`. A policy usa essas funções para filtrar.

```sql
-- Habilitar RLS na tabela
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT: cada empresa vê só seus dados
CREATE POLICY "companies see own responses"
  ON survey_responses
  FOR SELECT
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
```

**USING vs WITH CHECK:**

- `USING` — filtro para SELECT, UPDATE, DELETE. Determina quais linhas são visíveis/operáveis.
- `WITH CHECK` — filtro para INSERT e UPDATE. Determina se a linha resultante é permitida.

```sql
-- Usuário só vê respostas da própria empresa (USING)
-- E só pode inserir respostas para a própria empresa (WITH CHECK)
CREATE POLICY "company_isolation"
  ON survey_responses
  FOR ALL
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
  WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
```

---

## Multi-tenancy via RLS vs middleware

**Via RLS (Postgres-side):**
- Isolamento na camada de dados — impossível vazar dado de outro tenant por bug de aplicação.
- Funciona para qualquer cliente que acesse o banco (Prisma, SQL direto, Edge Functions).
- Auditável: `\d+ tabela` mostra as policies.

**Via middleware (application-side):**
- `WHERE company_id = req.user.companyId` em toda query.
- Frágil: um `findMany` sem o WHERE deixa dados de todos os tenants expostos.
- Depende de toda query ser escrita corretamente — bug de copiar/colar vira brecha.

O Supabase recomenda RLS + service_role só em funções privilegiadas (funções de admin, batch jobs). A regra: se o usuário chama diretamente, RLS. Se é processo interno com contexto de sistema, service_role com WHERE explícito.

---

## Performance impact de RLS

RLS adiciona uma condição extra em cada query. O impacto depende de:

1. A expressão da policy — se usa `auth.uid()` (indexável) vs função pesada.
2. Se a coluna usada na policy está indexada (`company_id` deve ter índice).
3. Se o `security_barrier` está ativo (impede vazamento de dado via side channel, mas bloqueia algumas otimizações).

```sql
-- Verificar se a policy usa a coluna indexada
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM surveys LIMIT 10;
-- Se aparecer Filter: (company_id = '...') mas sem Index Cond, o índice não está sendo usado
-- Criar: CREATE INDEX idx_surveys_company_id ON surveys (company_id);
```

`security_barrier` (default OFF nas policies de usuário) impede que o planner "empurre" condições da query para dentro da policy — protege contra funções com side effects como `current_setting`. Para a maioria dos casos no Supabase não é necessário.

---

## Por que cai em entrevista

- "Como você implementaria multi-tenancy seguro no Postgres?"
- "O que é RLS? Qual a diferença para filtrar no código da aplicação?"
- "O que é USING vs WITH CHECK numa policy?"
- "Como você testaria se uma policy está funcionando corretamente?"
- "Qual o risco de multi-tenancy só com WHERE na aplicação?"

---

## Trade-offs

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| RLS | isolamento garantido pelo banco; funciona em qualquer camada | performance overhead em tables muito grandes; debugging mais difícil |
| WHERE na aplicação | simples, fácil de debugar | um bug de query expõe dados de outros tenants |
| Schema separado por tenant | isolamento total; sem RLS | operacionalmente caro (migrations multiplicadas por N tenants) |
| Banco separado por tenant | isolamento físico | custo alto; impossível para SaaS com muitos clientes pequenos |

Para PULSAR-RH (SaaS multi-tenant, dado sensível de RH): RLS é a escolha certa.

---

## Exercício aplicado (projeto AG real)

O PULSAR-RH tem policies de RLS que garantem isolamento multi-tenant. O exercício é ler as policies existentes e entender o que cada uma protege.

**Passo 1 — listar as policies no Supabase SQL Editor:**

```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Passo 2 — buscar policies nos arquivos de migration:**

```bash
grep -rn "CREATE POLICY\|ENABLE ROW LEVEL" \
  ~/projetos/PULSAR-RH/supabase/migrations/ \
  --include="*.sql" | head -40
```

**Passo 3 — para cada policy encontrada, responder:**

1. Para qual tabela?
2. Qual operação (`SELECT`, `INSERT`, `ALL`)?
3. O que a expressão `USING` garante em prosa?
4. Tem `WITH CHECK`? O que ele garante?
5. Se um usuário de empresa A tentar acessar dados de empresa B, o que acontece exatamente?

**Exemplo de explicação esperada:**

```
Policy: "employees_company_isolation" em surveys
  CMD: ALL
  USING: company_id = (auth.jwt() ->> 'company_id')::uuid
  Prosa: um usuário autenticado via Supabase Auth só vê/edita pesquisas onde
         o company_id da linha bate com o company_id dentro do seu JWT.
         Se tentar SELECT em survey de outra empresa, retorna 0 linhas (não erro).
         Se tentar INSERT com company_id errado, WITH CHECK bloqueia com permission denied.
```

**Passo 4 — testar como role diferente:**

```sql
-- No Supabase SQL Editor, simular usuário de empresa específica
SET LOCAL "request.jwt.claims" TO '{"company_id": "uuid-da-empresa-a"}';
SET LOCAL role TO authenticated;

SELECT COUNT(*) FROM surveys;
-- Deve retornar só as surveys da empresa A
```

**Registrar em `PULSAR-RH/DECISIONS.md`:**

```markdown
## 2026-06-XX — [security] auditoria de policies RLS PULSAR-RH

**Policies revisadas:** surveys, survey_responses, employees, questions
**Achado:** todas usam company_id do JWT — isolamento correto.
**Verificar:** WITH CHECK está presente em INSERT/UPDATE? Cobrir também DELETE?
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Como você implementaria multi-tenancy seguro num SaaS com dados de RH?"

**R (30s):**
"Com RLS no Postgres. Cada tabela relevante tem `ENABLE ROW LEVEL SECURITY` e uma policy que compara o `company_id` da linha com o `company_id` do JWT do usuário autenticado. O banco filtra automaticamente — não importa se o cliente esquecer o WHERE, os dados de outro tenant não aparecem. Para operações de sistema (batch jobs, reports admin), uso service_role com bypass de RLS e WHERE explícito. O diferencial do RLS sobre filtrar na aplicação é que o isolamento fica no banco — é impossível vazar dado de outro tenant por bug de código."

**P:** "Qual a diferença entre USING e WITH CHECK numa policy de RLS?"

**R (30s):**
"`USING` define quais linhas existem para o usuário: filtra SELECT, decide quais linhas podem ser atualizadas ou deletadas. Se a linha não satisfaz o USING, para o usuário ela simplesmente não existe — SELECT retorna vazio, não erro. `WITH CHECK` valida a linha resultante em INSERT e UPDATE: se você tentar inserir uma linha que não satisfaria o USING — como inserir com um company_id diferente do seu — o banco bloqueia com permission denied. Sem WITH CHECK, um usuário poderia inserir linha de outro tenant e depois nunca mais vê-la."

---

## Checkpoint

- [ ] Sei habilitar RLS numa tabela e criar uma policy básica sem consultar
- [ ] Entendo a diferença entre USING e WITH CHECK com exemplo concreto
- [ ] Consigo explicar por que RLS é mais seguro que WHERE na aplicação
- [ ] Li e expliquei em prosa pelo menos 2 policies do PULSAR-RH
- [ ] Sei simular um usuário diferente no SQL Editor para testar policies

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — RLS dominado`.

---

## Recursos

- Postgres docs — [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Supabase docs — [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Supabase docs — [Auth helpers in RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#authenticated-and-unauthenticated-roles)
