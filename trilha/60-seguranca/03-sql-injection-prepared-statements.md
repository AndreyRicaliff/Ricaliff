# 03 — SQL Injection e Prepared Statements

## O que é

**SQL Injection** é quando input de usuário é interpretado como parte da query SQL em vez de ser tratado como dado. É o ataque mais antigo e mais documentado da história da web — e ainda está em #1 do OWASP 2017 (desceu para A03 em 2021 por ter sido parcialmente absorvido por ORMs).

O caso mais famoso: **Equifax breach (2017)**. Dados pessoais de 147 milhões de americanos — SSN, data de nascimento, endereços — foram exfiltrados. Causa raiz: Apache Struts com CVE aberto (componente vulnerável), mas o acesso aos dados foi facilitado por queries sem prepared statements em sistemas internos. Custo: US$ 700 milhões em acordos.

---

### O ataque clássico

```sql
-- Código vulnerável (concatenação de string):
const query = `SELECT * FROM users WHERE email = '${userInput}'`

-- Input normal: usuario@email.com
-- Query resultante: SELECT * FROM users WHERE email = 'usuario@email.com'

-- Input malicioso: ' OR '1'='1
-- Query resultante: SELECT * FROM users WHERE email = '' OR '1'='1'
-- Resultado: retorna TODOS os usuários — bypass de autenticação

-- Input destrutivo: '; DROP TABLE users; --
-- Query resultante: SELECT * FROM users WHERE email = ''; DROP TABLE users; --
-- Resultado: apaga a tabela inteira
```

O problema não é o input "malicioso" — é que o banco não consegue distinguir entre código SQL e dado quando chegam concatenados como string.

---

### Prepared Statements: a solução correta

```sql
-- Prepared statement: o placeholder ? ou $1 é SEMPRE dado, nunca código
-- A estrutura SQL é compilada ANTES dos dados chegarem

-- Node.js com pg (driver nativo):
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [userInput]
)
// userInput nunca é interpolado na query — é enviado separado como parâmetro
// Se userInput = "' OR '1'='1", o banco procura literalmente esse email
```

O mecanismo: o banco compila a query `SELECT * FROM users WHERE email = $1` em um plano de execução. Depois os parâmetros são enviados separadamente. O banco sabe que `$1` é sempre dado — nunca pode ser código SQL.

---

### Como Prisma protege (e onde falha)

**Prisma protege por padrão** em toda query via sua API:

```ts
// SEGURO — Prisma parameteriza automaticamente:
const user = await prisma.user.findUnique({
  where: { email: userInput }  // userInput é passado como parâmetro, não interpolado
})

// SEGURO — mesmo com strings dinâmicas de filtro:
const users = await prisma.user.findMany({
  where: {
    name: { contains: userInput }  // Prisma usa LIKE com parâmetro, não concatenação
  }
})
```

**Onde Prisma falha: `$queryRaw` com template string incorreta**

```ts
// VULNERÁVEL — template string interpola diretamente na query:
const users = await prisma.$queryRaw`SELECT * FROM users WHERE role = ${userRole}`
// ↑ ESTE é seguro — Prisma intercepta tagged templates e parameteriza

// VULNERÁVEL — Prisma.sql com concatenação manual:
const column = req.query.orderBy  // input do usuário!
const query = `SELECT * FROM users ORDER BY ${column}` // NUNCA FAZER
const users = await prisma.$queryRawUnsafe(query)
// $queryRawUnsafe bypassa toda proteção do Prisma
```

A regra: `$queryRaw` com tagged template (backtick direto) é seguro. `$queryRawUnsafe` com string construída nunca é seguro com input de usuário. Nomes de colunas e tabelas **não podem ser parametrizados** — se precisar de coluna dinâmica, usar allowlist:

```ts
const ALLOWED_SORT_COLUMNS = ['name', 'created_at', 'email'] as const
type SortColumn = typeof ALLOWED_SORT_COLUMNS[number]

function isSortColumn(val: string): val is SortColumn {
  return ALLOWED_SORT_COLUMNS.includes(val as SortColumn)
}

const sortBy = req.query.sortBy as string
if (!isSortColumn(sortBy)) throw new Error('Invalid sort column')

// Agora é seguro usar sortBy — é um dos valores permitidos
const users = await prisma.$queryRaw`
  SELECT * FROM users ORDER BY ${Prisma.raw(sortBy)}
`
```

---

### Além de SQL: outras formas de injection

O mesmo princípio se aplica:

| Tipo | Exemplo | Mitigação |
|---|---|---|
| NoSQL Injection (MongoDB) | `{ $where: userInput }` | Nunca usar `$where` com input |
| Command Injection | `exec('ls ' + userInput)` | `execFile(['ls', userInput])` — separa comando de args |
| LDAP Injection | Query LDAP com input não escapado | Bibliotecas LDAP com escaping nativo |
| Template Injection | `eval(template.render(userInput))` | Nunca usar `eval` com dado externo |

O padrão é sempre o mesmo: **separe código de dado**. O dado nunca deve ser interpretado como estrutura de comando.

---

## Por que cai em entrevista

SQL injection é pergunta obrigatória em qualquer entrevista backend. O que diferencia candidatos:
- Júnior que só usa ORM: "Prisma protege automaticamente" — parcialmente correto
- Pleno que entende o mecanismo: sabe QUANDO o ORM não protege e por quê
- Sênior: sabe que nomes de colunas e tabelas nunca podem ser parametrizados, usa allowlist

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| ORM (Prisma) sempre | Proteção automática, legibilidade | Queries complexas ficam verbosas; hide-and-seek com SQL gerado |
| Prepared statements diretos (pg) | Controle total do SQL | Mais verboso; sem type safety automático |
| `$queryRawUnsafe` com allowlist | Flexibilidade para queries dinâmicas | Complexidade de validação; erro humano possível |
| Query builder (Knex) | Meio-termo: composição segura | Mais uma dep; curva de aprendizado |

Para a AG: Prisma é a decisão correta. `$queryRaw` tagged template para raw queries. `$queryRawUnsafe` só se validado com allowlist estrita — e comentar por quê.

---

## Exercício aplicado (projeto AG real)

```bash
# 1. Caçar uso de queryRaw nos projetos AG
# (potencial vulnerabilidade se com interpolação de input)
cd ~/projetos
grep -rn "\$queryRaw\|\$executeRaw\|\$queryRawUnsafe" \
  --include="*.ts" --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=dist

# 2. Para cada match, verificar:
#    - É tagged template (seguro) ou string construída (risco)?
#    - O conteúdo interpolado vem de req.query/req.body/req.params?

# 3. Caçar SQL raw em outros drivers (caso tenha código legado)
grep -rn "pool\.query\|db\.query\|connection\.query" \
  --include="*.ts" --include="*.js" \
  --exclude-dir=node_modules

# 4. Verificar se há ordem dinâmica sem allowlist
grep -rn "ORDER BY.*req\.\|ORDER BY.*query\." \
  --include="*.ts" --include="*.js" \
  --exclude-dir=node_modules

# 5. Verificar CLIENTE OFICINA especificamente (integração Firebird legado)
cd ~/projetos/cliente-oficina-backend
grep -rn "query\|execute\|sql" src/ --include="*.ts" | grep -v "//\|node_modules"
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] SQL injection audit

**Contexto:** Auditoria preventiva de SQL injection nos projetos AG.
**Escopo:** meet-hub, PULSAR-RH, cliente-oficina-backend
**Método:** grep por $queryRaw, $queryRawUnsafe, pool.query em todos os projetos

**Resultados:**
- Prisma standard API: 100% dos projetos — sem risco
- $queryRaw tagged template: [N ocorrências] — analisar interpolações
- $queryRawUnsafe: [N ocorrências] — verificar se input do usuário chega
- Queries dinâmicas sem allowlist: [N ocorrências] — corrigir

**Ações:**
- [listar o que foi encontrado e como foi tratado]
- Colunas dinâmicas: adicionar allowlist + type guard

**Como explicar em entrevista (30s):**
> "Auditei SQL injection no portfólio. A maioria usa Prisma, que parameteriza por padrão — sem risco. Em dois lugares havia $queryRawUnsafe com coluna vinda de query param, o que era vulnerável. Corrigi com allowlist tipada: defini as colunas permitidas como union type e validei antes de usar."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como Prisma protege contra SQL injection? Existe algum caso onde ele não protege?"
>
> **R (30s):**
> "Prisma usa prepared statements por baixo — toda query via a API padrão é parameterizada automaticamente: o dado nunca é interpolado na string SQL. O caso onde ele não protege é quando você usa `$queryRawUnsafe` com uma string que você mesmo constrói. Também tem um ponto de atenção em nomes de tabela e coluna dinâmicos: esses não podem ser parametrizados em SQL — o banco não aceita. A solução é allowlist: definir os valores permitidos como array fixo e validar o input antes de usar."

> **P:** "Me mostra um exemplo de SQL injection e como você preveniria."
>
> **R (30s):**
> "Input de usuário concatenado em query: `SELECT * FROM users WHERE email = '${input}'` — se input for `' OR '1'='1`, retorna todos os usuários. A prevenção correta é prepared statement: a query é compilada com placeholder `$1`, e o input chega separado como parâmetro — o banco nunca interpreta o dado como código. Em Node com Prisma isso é automático. Em raw query com `pg`, você passa `[userInput]` como segundo argumento do `pool.query`."

---

## Checkpoint

- [ ] Consigo explicar por que concatenação de string em SQL é vulnerável sem consultar
- [ ] Sei quando Prisma protege e quando não protege (os casos de `$queryRawUnsafe`)
- [ ] Rodei o grep nos projetos AG e documentei o resultado
- [ ] Sei implementar allowlist para colunas dinâmicas com type guard TypeScript
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Prisma — Raw database access](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access) — documentação dos métodos raw e suas diferenças de segurança
- [Equifax breach Wikipedia](https://en.wikipedia.org/wiki/2017_Equifax_data_breach) — contexto do caso real
- CVE-2021-34473 (ProxyShell) — para ver como CVEs em componentes abrem vetor para injection
