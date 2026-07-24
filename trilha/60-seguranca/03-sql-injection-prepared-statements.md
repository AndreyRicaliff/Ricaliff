# 03 — SQL Injection e Prepared Statements

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**SQL Injection (SQLi)** é quando input de usuário é interpretado como parte da query SQL em vez de ser tratado como dado. É o ataque mais antigo e documentado da web — foi **#1 no OWASP 2017** e, absorvido por ORMs e prepared statements, desceu para dentro de **A03 (Injection)** em 2021. É a mesma família do XSS (módulo 02): dado que atravessa a fronteira e vira código. Aqui o interpretador é o banco.

---

## § BASE — o fundamento

**A fraqueza tem nome e número: CWE-89.** O MITRE cataloga SQLi como CWE-89 — *Improper Neutralization of Special Elements used in an SQL Command*. O defeito não é "aceitar input"; é **construir o comando SQL sem neutralizar os elementos especiais** (aspas, `;`, `--`) que o dado carrega.

**A raiz: plano de controle vs. plano de dados.** Toda linguagem de comando tem dois planos misturados na mesma string: o **controle** (a estrutura: `SELECT ... WHERE ... =`) e o **dado** (os valores: `'usuario@email.com'`). Quando você concatena input na string, você deixa o dado poder *reescrever a estrutura* — a aspa que deveria fechar um literal passa a abrir uma nova cláusula. O banco recebe uma string só e não tem como saber que parte era "sua estrutura" e que parte era "dado do usuário": para ele, tudo é SQL. É idêntico ao XSS, trocando o parser do browser pelo parser do SQL.

```sql
const query = `SELECT * FROM users WHERE email = '${userInput}'`
-- input normal:      usuario@email.com  → SELECT ... WHERE email = 'usuario@email.com'
-- input malicioso:   ' OR '1'='1        → SELECT ... WHERE email = '' OR '1'='1'  → TODOS
-- input destrutivo:  '; DROP TABLE users; --  → apaga a tabela
```

O problema **não é** o input "malicioso" — é a arquitetura que deixa dado e código chegarem juntos.

**A solução correta separa os dois planos: prepared statement.** Um prepared statement envia a **estrutura primeiro** (`SELECT * FROM users WHERE email = $1`), o banco **compila o plano de execução** com o placeholder `$1` marcado como *slot de dado*, e só **depois** os valores chegam por um canal separado. O `$1` é, por construção, sempre dado — nunca pode virar estrutura, porque a estrutura já foi compilada e congelada antes do dado existir. É a **parametrização**, e é a única defesa que ataca a causa em vez do sintoma.

```ts
// pg (driver nativo): userInput nunca é interpolado na string — vai como parâmetro
const result = await pool.query('SELECT * FROM users WHERE email = $1', [userInput])
// se userInput = "' OR '1'='1", o banco procura literalmente esse email
```

**A história tem autor e data.** A primeira descrição pública de SQL injection é creditada a **Jeff Forristal** (sob o pseudônimo *rain.forest.puppy*), no artigo *NT Web Technology Vulnerabilities*, publicado na **Phrack magazine #54, em dezembro de 1998**. A técnica tem, portanto, mais de duas décadas — e ainda aparece: a longevidade é a prova de que o problema é *arquitetural*, não de "programador desatento".

**O caso real — e uma correção importante de mito.** É comum ouvir "o breach da Equifax (2017) foi SQL injection". Não foi. Segundo o relatório oficial do **GAO (US Government Accountability Office), GAO-18-559 (agosto de 2018)**, a causa-raiz foi uma vulnerabilidade **não corrigida no Apache Struts (CVE-2017-5638, RCE)** — ou seja, é caso de **A06 (componente vulnerável)**, não de SQLi; depois de entrar via Struts, os atacantes encontraram credenciais e rodaram queries. O breach **canônico de SQL injection** é outro: a série de invasões liderada por **Albert Gonzalez** (Heartland Payment Systems, 7-Eleven e outros, ~2007-2008), com **~130 milhões de números de cartão** exfiltrados — a acusação federal do **DOJ (US v. Albert Gonzalez)** descreve explicitamente SQL injection como o vetor. Citar a fonte certa para o caso certo é parte do rigor.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O território tem uma camada segura por padrão (ORM), uma escotilha de risco (raw) e um ponto que a parametrização **não** cobre (identificadores):

```
                        DADO É PARAMETRIZÁVEL?      PROTEÇÃO
prisma.user.findMany()   sim (automático)           ✅ seguro por padrão
$queryRaw`... ${x}`      sim (tagged template)       ✅ Prisma intercepta e parametriza
$queryRawUnsafe(str)     depende de QUEM montou str  ⚠️ seguro só com string 100% controlada
ORDER BY ${coluna}       NÃO — identificador          ❌ nunca parametrizável → exige ALLOWLIST
```

**Prisma protege por padrão** — toda query via a API (`findUnique`, `findMany`, `where: { contains }`) é parametrizada; o dado vai como parâmetro, nunca interpolado.

**Onde Prisma falha:**

```ts
const users = await prisma.$queryRaw`SELECT * FROM users WHERE role = ${userRole}`  // ✅ tagged template → parametrizado
const query = `SELECT * FROM users ORDER BY ${req.query.orderBy}`                   // ❌ string montada à mão
const users = await prisma.$queryRawUnsafe(query)                                   // ❌ bypassa toda a proteção
```

`$queryRaw` com *tagged template* (backtick direto) é seguro — o Prisma intercepta e parametriza. `$queryRawUnsafe` com string construída **nunca** é seguro com input de usuário.

**O ponto que a parametrização não cobre: identificadores.** Nomes de coluna e de tabela **não podem** ser parâmetros — o SQL não aceita `ORDER BY $1`, porque a compilação do plano precisa saber a coluna *antes* dos dados. Coluna dinâmica exige **allowlist tipada**, não parametrização:

```ts
const ALLOWED_SORT = ['name', 'created_at', 'email'] as const
type SortColumn = typeof ALLOWED_SORT[number]
function isSortColumn(v: string): v is SortColumn {
  return ALLOWED_SORT.includes(v as SortColumn)
}
const sortBy = req.query.sortBy as string
if (!isSortColumn(sortBy)) throw new Error('Invalid sort column')
const users = await prisma.$queryRaw`SELECT * FROM users ORDER BY ${Prisma.raw(sortBy)}`
```

**O princípio é maior que SQL — separe código de dado:**

| Tipo | Exemplo vulnerável | Mitigação |
|---|---|---|
| NoSQL Injection (Mongo) | `{ $where: userInput }` | nunca `$where` com input |
| Command Injection | `exec('ls ' + userInput)` | `execFile('ls', [userInput])` — separa comando de args |
| LDAP Injection | query LDAP com input não escapado | libs com escaping nativo |
| Template Injection | `eval(render(userInput))` | nunca `eval` com dado externo |

**Trade-off de abordagem:**

| Abordagem | Vantagem | Custo |
|---|---|---|
| ORM (Prisma) sempre | proteção automática, legibilidade | query complexa fica verbosa |
| Prepared statement direto (pg) | controle total do SQL | verboso; sem type safety |
| `$queryRawUnsafe` + allowlist | flexível para query dinâmica | validação frágil; erro humano possível |

Para a AG: Prisma é a decisão correta; `$queryRaw` tagged template para raw; `$queryRawUnsafe` só com allowlist estrita **e comentado**.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LOCALIZAR toda construção de SQL.** `grep` por `$queryRaw`, `$queryRawUnsafe`, `$executeRaw`, `pool.query`, `db.query`. Todo ponto onde uma string vira comando é um candidato.

**2. CLASSIFICAR cada ponto: tagged template (seguro) ou string montada (risco)?** O backtick direto do `$queryRaw` é seguro; a variável construída antes e passada a `$queryRawUnsafe` é onde mora o bug.

**3. RASTREAR a origem do dado interpolado.** Vem de `req.query`/`req.body`/`req.params`? Se o dado é 100% interno e constante, o risco é baixo; se chega do usuário, é alto.

**4. APLICAR a defesa certa ao tipo.** Valor → parametrizar (`$1` / tagged template). Identificador (coluna/tabela) → **allowlist tipada** com type guard. Nunca concatenar input em SQL.

**5. VERIFICAR com payload.** `' OR '1'='1` num campo de busca: se voltar tudo, o ponto está aberto; se voltar vazio/erro de "email inválido", está parametrizado.

**Anti-padrões:**
- **Escapar aspas na mão:** trocar `'` por `''` parece resolver e falha em codificações, comentários e casos de borda. Parametrize; não escape manualmente.
- **`$queryRawUnsafe` "porque é mais fácil":** cada uso é uma auditoria futura. Só com allowlist e comentário do porquê.
- **Tentar parametrizar identificador:** `ORDER BY $1` não funciona — o erro do banco te empurra ao `$queryRawUnsafe`, que é o buraco. Allowlist é o caminho.
- **Confiar só no WAF:** WAF de SQLi é filtro de padrões e é contornável; a defesa real é a arquitetura (parametrização).

---

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
# 1. Caçar uso de raw queries nos projetos AG
cd ~/projetos
grep -rn "\$queryRaw\|\$executeRaw\|\$queryRawUnsafe" \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist

# 2. Para cada match: tagged template (seguro) ou string construída (risco)?
#    O conteúdo interpolado vem de req.query/req.body/req.params?

# 3. SQL raw em outros drivers (código legado)
grep -rn "pool\.query\|db\.query\|connection\.query" \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules

# 4. Ordem dinâmica sem allowlist (o vetor clássico de identificador)
grep -rn "ORDER BY.*req\.\|ORDER BY.*query\." \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules

# 5. CLIENTE OFICINA (integração Firebird legado — maior risco de SQL manual)
cd ~/projetos/cliente-oficina-backend
grep -rn "query\|execute\|sql" src/ --include="*.ts" | grep -v "//\|node_modules"
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] SQL injection audit
**Escopo:** meet-hub, PULSAR-RH, cliente-oficina-backend
**Método:** grep por $queryRaw*, pool.query; classificar tagged vs. montada; rastrear origem.
**Resultados:**
- Prisma standard API: 100% — sem risco (CWE-89 coberto por parametrização)
- $queryRaw tagged template: [N] — seguros
- $queryRawUnsafe: [N] — verificar se input do usuário chega
- Query dinâmica sem allowlist (identificador): [N] — corrigir com type guard
**Ações:** [o que encontrei e como tratei]
**Em entrevista (30s):**
> "Auditei SQLi no portfólio. A maioria usa Prisma, que parametriza por padrão. Em dois pontos
> havia $queryRawUnsafe com coluna vinda de query param — vulnerável. Corrigi com allowlist
> tipada: as colunas permitidas como union type, validadas antes de usar."
```

## Por que cai em entrevista

SQLi é pergunta obrigatória em qualquer entrevista backend. O que diferencia: **Júnior** que só usa ORM diz "Prisma protege automaticamente" (parcialmente certo); **Pleno** entende o mecanismo — sabe *quando* o ORM não protege e por quê; **Sênior** sabe que identificador nunca é parametrizável e usa allowlist.

> **P:** "Como Prisma protege contra SQL injection? Existe algum caso onde ele não protege?"
>
> **R (30s):**
> "Prisma usa prepared statements por baixo — toda query via a API padrão é parameterizada automaticamente: o dado nunca é interpolado na string SQL. O caso onde ele não protege é quando você usa `$queryRawUnsafe` com uma string que você mesmo constrói. Também tem um ponto de atenção em nomes de tabela e coluna dinâmicos: esses não podem ser parametrizados em SQL — o banco não aceita. A solução é allowlist: definir os valores permitidos como array fixo e validar o input antes de usar."

> **P:** "Me mostra um exemplo de SQL injection e como você preveniria."
>
> **R (30s):**
> "Input de usuário concatenado em query: `SELECT * FROM users WHERE email = '${input}'` — se input for `' OR '1'='1`, retorna todos os usuários. A prevenção correta é prepared statement: a query é compilada com placeholder `$1`, e o input chega separado como parâmetro — o banco nunca interpreta o dado como código. Em Node com Prisma isso é automático. Em raw query com `pg`, você passa `[userInput]` como segundo argumento do `pool.query`."

> **P:** "Por que um prepared statement é imune, e não só 'mais seguro'? Explica o mecanismo."
>
> **R (30s):**
> "Porque ele separa os dois planos no tempo. O banco recebe primeiro a estrutura da query — `WHERE email = $1` — e compila o plano de execução com o `$1` marcado como slot de dado. Só depois os valores chegam por um canal separado. Como o plano já está congelado antes de o dado existir, não há como o dado virar estrutura: uma aspa no input é só uma aspa dentro do valor, não o fim de um literal. É a mesma ideia do XSS — manter dado e código em planos separados. O que a concatenação faz é justamente destruir essa separação."

## Checkpoint

- [ ] Explico por que concatenar string em SQL é vulnerável, em termos de plano de controle vs. dado
- [ ] Sei que SQLi é CWE-89 e por que prepared statement é imune (compila antes, binda depois)
- [ ] Sei quando Prisma protege e quando não (`$queryRawUnsafe` e identificadores)
- [ ] Implemento allowlist tipada com type guard para coluna dinâmica
- [ ] Rodei o grep nos projetos AG e documentei o resultado
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- CWE-89 (MITRE) — *Improper Neutralization of Special Elements used in an SQL Command*: a definição canônica
- *NT Web Technology Vulnerabilities* — Jeff Forristal (rain.forest.puppy), Phrack #54 (dez/1998): a primeira descrição pública de SQLi
- OWASP *SQL Injection Prevention Cheat Sheet* — parametrização, allowlist para identificadores, escaping como último recurso
- Prisma docs — *Raw database access*: as diferenças de segurança entre `$queryRaw` e `$queryRawUnsafe`
- GAO-18-559 (ago/2018) — relatório oficial do breach da Equifax: causa-raiz Apache Struts (CVE-2017-5638), **não** SQLi
- Acusação federal US v. Albert Gonzalez (DOJ) — o breach da Heartland (~130M cartões) como caso canônico de SQLi
- Módulo-irmão `02-xss` — a mesma confusão dado×código, no plano do browser
