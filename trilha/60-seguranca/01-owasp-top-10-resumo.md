# 01 — OWASP Top 10: Mapa do Território

## O que é

OWASP (Open Web Application Security Project) publica a cada ~4 anos a lista das 10 categorias de vulnerabilidade mais críticas em aplicações web, baseada em dados reais de CVEs, reportes de bug bounty e pesquisas com empresas. A lista atual é de **2021** — ainda vigente e referência universal em entrevistas e security audits.

---

### As 10 categorias (OWASP Top 10 — 2021)

**A01 — Broken Access Control** (era A05 em 2017, subiu para #1)
Usuário acessa recursos que não deveria: outra conta, admin endpoint, arquivo de outro tenant. 94% das aplicações testadas tinham alguma forma disso. Exemplos: IDOR (Insecure Direct Object Reference), falta de RLS, endpoint `/admin` sem verificação de role.

**A02 — Cryptographic Failures** (era "Sensitive Data Exposure")
Dados sensíveis em trânsito ou em repouso sem proteção adequada: HTTP sem TLS, senhas em MD5, chaves privadas no repositório, banco sem encryption-at-rest. O nome mudou porque o real problema é falha criptográfica, não só exposição.

**A03 — Injection** (era #1 em 2017)
Código de ataque interpretado como dado: SQL injection, NoSQL injection, LDAP injection, command injection. A causa raiz é sempre a mesma: concatenar input não-confiável em comandos/queries. Prisma resolve 99% do SQL injection — mas `$queryRaw` com template string reintroduz o risco.

**A04 — Insecure Design**
Ausência de modelagem de ameaças no design da feature. Não é bug de implementação — é decisão de produto que ignora adversário. Exemplo: "reset de senha via pergunta de segurança" é design inseguro por definição. O fix não é um patch, é redesenho.

**A05 — Security Misconfiguration**
Configurações padrão perigosas deixadas como estão: debug mode em produção, S3 bucket público, CORS com `*`, permissões de banco excessivas (ex.: usar `SERVICE_ROLE_KEY` onde `ANON_KEY` bastaria), headers de segurança ausentes.

**A06 — Vulnerable and Outdated Components**
Dependências com CVEs conhecidos. O caso mais famoso da história: **Log4Shell (CVE-2021-44228)** — uma linha de JNDI lookup na lib de log Java `log4j` comprometeu milhões de servidores em dezembro de 2021. A AG usa Node; equivalente: `npm audit` mostrando Critical.

**A07 — Identification and Authentication Failures**
Autenticação quebrada: senhas fracas sem política, sem rate limit em login, tokens JWT sem expiração, sessão não invalidada no logout. A AG mitiga isso usando Google OAuth — elimina a gestão de senha por design.

**A08 — Software and Data Integrity Failures**
CI/CD sem verificação de integridade, deserialização de dados não-confiáveis, atualizações de software sem assinatura. O ataque **SolarWinds (2020)** é o caso definitivo: o pacote de update legítimo foi comprometido na cadeia de supply chain e instalado por 18 mil organizações, incluindo agências do governo americano.

**A09 — Security Logging and Monitoring Failures**
Sem logs de acesso, sem alertas de anomalia, sem auditoria de quem fez o quê. Quando o breach acontece, não tem evidência. O tempo médio para detectar um breach sem logging adequado é **207 dias** (IBM Cost of a Data Breach 2023).

**A10 — Server-Side Request Forgery (SSRF)**
A aplicação aceita URL de input externo e faz request server-side — atacante aponta para `http://169.254.169.254` (metadata AWS/GCP) e extrai credenciais do cloud. Capital One breach 2019: SSRF em WAF mal configurado expôs 100 milhões de registros.

---

## Por que cai em entrevista

É o mapa. Entrevistador de segurança pede para você "citar vulnerabilidades comuns" — quem responde com 2-3 itens OWASP pelo nome, com exemplo real, passa o filtro. Quem responde "validar inputs" sem nomear a categoria, não passa.

Frequência por nível:
- Júnior: A01, A03, A07 (os mais básicos de explicar)
- Pleno: + A02, A05, A06 (os mais comuns em auditoria de código)
- Sênior: + A04, A08, A09, A10 (os que exigem visão de sistema)

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| Corrigir tudo ao mesmo tempo | Zero dívida técnica de segurança | Paralisa feature dev — inviável em startup |
| CVSS score como prioridade | Objetivo, defensável | CVE crítico em dep dev-only tem impacto zero em prod |
| Corrigir só o que está em prod | Foco real de risco | Dep vulnerável em dev vira vetor de comprometimento de máquina do dev |
| Pentest externo periódico | Descobre o que auditoria interna não vê | Caro; relatório chega meses depois do bug introduzido |

Regra prática para startups: **corrigir imediatamente** vulnerabilidades em `dependencies` (não `devDependencies`) com CVSS ≥ 7.0. O resto: agendar na sprint seguinte.

---

## Exercício aplicado (projeto AG real)

### O que a AG já corrigiu

| Categoria OWASP | Status AG | Evidência |
|---|---|---|
| A03 — Injection | Mitigado via Prisma | ORM parameterizado em todos os projetos com banco |
| A07 — Auth Failures | Mitigado por design | Google OAuth com `hd === 'agconsultorialtda.com'` elimina auth própria |
| A01 — Broken Access Control | Mitigado no PULSAR-RH | RLS multi-tenant no Supabase |
| A03 — XSS (subclasse de Injection) | Corrigido (2026-05-28) | Commit de fix PULSAR-RH — URL params não eram encoded |
| A05 — Misconfiguration | **Risco aberto** | `SERVICE_ROLE_KEY` exposto no CLIENTE OFICINA |
| A09 — Logging Failures | Parcialmente endereçado | `cag_log` imutável no Café com AG; outros projetos sem audit log |

### Passo a passo

```bash
# 1. Rodar npm audit em 1 projeto AG com dependências
cd ~/projetos/meet-hub
npm audit

# Saída esperada: tabela com severity (critical/high/moderate/low)
# Coluna "Path" mostra a cadeia de dependência

# 2. Filtrar só high + critical (o que precisa de ação imediata)
npm audit --audit-level=high

# 3. Ver o que tem fix disponível
npm audit fix --dry-run

# 4. Instalar Snyk CLI (free tier) para análise mais detalhada
npm install -g snyk
snyk auth           # abre browser para login (conta GitHub funciona)
snyk test           # analisa o projeto atual

# 5. Para cada CVE encontrado, registrar decisão:
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] audit npm meet-hub

**Contexto:** npm audit identificou N vulnerabilidades.
**Classificação:**
- Critical/High em deps de produção → fix imediato nesta sprint
- Moderate em deps de produção → fix na próxima sprint
- Qualquer severity em devDependencies → agendar; risco só na máquina do dev
**Ação tomada:** [listar o que foi resolvido e o que foi deliberadamente adiado + motivo]
**Consequências:** [o que muda no comportamento da app]
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Me cite 3 categorias do OWASP Top 10 e como você as mitigou nos seus projetos."
>
> **R (30s):**
> "Injection: uso Prisma como ORM — queries parameterizadas por padrão, então SQL injection está coberto. Temos um caso real de XSS que corrigimos em maio de 2026 no PULSAR-RH: parâmetros de URL eram inseridos no DOM sem encoding — ficou um commit documentado disso. Para Auth Failures, adotamos Google OAuth restrito ao domínio `agconsultorialtda.com` — eliminamos gestão de senha completamente, que é a fonte de 80% dos problemas de auth."

> **P:** "O que é o Log4Shell e por que foi tão grave?"
>
> **R (30s):**
> "CVE-2021-44228: a biblioteca de logging Java `log4j` interpretava strings no formato `${jndi:ldap://...}` como comandos — bastava logar input do usuário para executar código remoto. Grave porque: log4j está em metade da internet Java, o exploit tinha uma linha, e funciona contra qualquer serviço que logava qualquer coisa do usuário. É o caso definitivo de A06 (Vulnerable Components) — a lib estava em todo lugar, mas ninguém rastreava a versão."

---

## Checkpoint

- [ ] Consigo nomear as 10 categorias OWASP sem consultar e dar um exemplo de cada
- [ ] Sei classificar qualquer vulnerabilidade encontrada em qual categoria OWASP ela se encaixa
- [ ] Rodei `npm audit` em pelo menos 1 projeto AG e classifiquei os resultados por prioridade
- [ ] Consigo explicar qual categoria o XSS fix do PULSAR-RH resolve (A03) e por quê
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [OWASP Top 10 oficial (2021)](https://owasp.org/Top10/) — ler pelo menos o resumo de cada categoria
- [CVE-2021-44228 (Log4Shell)](https://nvd.nist.gov/vuln/detail/CVE-2021-44228) — ver o CVSS 10.0
- [SolarWinds attack timeline](https://www.cisa.gov/news-events/news/solarwinds-orion-code-compromise) — CISA report
- `npm audit` — embutido no npm, não precisa instalar nada
- [Snyk](https://snyk.io/) — free tier cobre repositórios públicos e privados com limite
