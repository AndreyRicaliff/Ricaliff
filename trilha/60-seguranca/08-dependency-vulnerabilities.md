# 08 — Vulnerabilidades em Dependências

## O que é

Dependências são código de terceiros que você roda no seu servidor. Uma vulnerabilidade em qualquer dep sua é uma vulnerabilidade no seu produto. A OWASP chama isso de **A06 — Vulnerable and Outdated Components** — subiu para o top 10 e continua subindo porque o número de ataques via supply chain aumentou.

O caso definitivo: **Log4Shell (CVE-2021-44228, CVSS 10.0)**. A biblioteca `log4j` — usada em metade dos sistemas Java no mundo — tinha uma vulnerabilidade de execução remota de código (RCE) trivial de explorar: qualquer string no formato `${jndi:ldap://...}` no log causava o servidor a fazer request para o endereço indicado e executar o código retornado. Uma linha. CVSS 10.0 — máximo possível. Patched em 72h, mas a janela de exploração já era.

Para Node.js o risco é real: `event-stream` (2018) foi comprometido via transferência de ownership no npm e injetou código malicioso que roubava bitcoin wallets. Um pacote com 2 milhões de downloads/semana, infectado por meses.

---

### CVE e CVSS: o vocabulário

**CVE (Common Vulnerabilities and Exposures):** identificador único de vulnerabilidade. Formato: `CVE-YYYY-NNNNN`. Exemplo: `CVE-2021-44228` (Log4Shell).

**CVSS (Common Vulnerability Scoring System):** score de 0 a 10 que quantifica severidade.

| Score | Severidade | Ação recomendada |
|---|---|---|
| 9.0–10.0 | Critical | Patch imediato — horas, não dias |
| 7.0–8.9 | High | Patch no máximo em 48h se em prod |
| 4.0–6.9 | Medium | Planejar para próxima sprint |
| 0.1–3.9 | Low | Agendar; pode esperar |
| 0.0 | None | Informacional |

**O que CVSS NÃO captura:** contexto de deployment. Um CVE 9.0 em uma lib que só corre em `devDependencies` tem impacto real próximo de zero em produção — é um risco para a máquina do dev, não para os usuários. CVSS não sabe disso.

---

### npm audit: como usar de verdade

```bash
# Análise completa
npm audit

# Saída típica:
# ┌───────────────┬──────────────────────────────────────────────────┐
# │ high          │ Regular Expression Denial of Service in semver   │
# ├───────────────┼──────────────────────────────────────────────────┤
# │ Package       │ semver                                           │
# │ Dependency of │ jest > @jest/core > jest-resolve > semver        │
# │ Path          │ jest > ... > semver                              │
# │ More info     │ https://github.com/advisories/GHSA-...           │
# └───────────────┴──────────────────────────────────────────────────┘

# Leitura do campo "Dependency of":
# - Começa com nome de devDependency (jest, eslint, vite)? → risco só em dev
# - Começa com dep de produção (express, prisma, axios)? → risco real

# Ver só severidade crítica/alta
npm audit --audit-level=high

# Ver o que tem fix disponível sem instalar
npm audit fix --dry-run

# Instalar fixes (patch level — sem breaking change)
npm audit fix

# Instalar fixes com breaking change (cuidado — pode quebrar a app)
npm audit fix --force
# Sempre testar depois de --force

# Listar vulnerabilidades em formato JSON para análise
npm audit --json | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const vulns = Object.values(data.vulnerabilities);
  vulns.filter(v => v.severity === 'critical' || v.severity === 'high')
       .forEach(v => console.log(v.severity, v.name, v.range));
"
```

---

### Snyk: análise mais rica

```bash
npm install -g snyk
snyk auth   # login com GitHub ou email

# Análise do projeto atual
snyk test

# Snyk diferencia deps de produção de devDependencies automaticamente
# Mostra: CVE, CVSS, se tem fix disponível, se afeta produção
# Monitora em background (via snyk monitor) e avisa quando nova vuln é publicada

# Ver apenas vulnerabilidades com exploit disponível
snyk test --severity-threshold=high

# Ignorar um item por 30 dias (quando já avaliou e decidiu não corrigir agora)
snyk ignore --id=SNYK-JS-XXXXXXXX --expiry=2026-07-01 --reason="devDep only"
```

---

### Dependabot: automação via GitHub

Para projetos com repositório no GitHub:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "security"     # só PRs de segurança em prod automaticamente
          - "patch"        # e patches (x.y.Z)
```

Dependabot abre PRs automáticos com a atualização. Você revisa e merge. Para patches de segurança em deps de produção, auto-merge pode ser configurado.

---

### Patch vs Major: a decisão difícil

```
semver: MAJOR.MINOR.PATCH

PATCH (1.2.3 → 1.2.4): bug fix, sem breaking change
→ Atualizar sem hesitar, especialmente se é fix de segurança

MINOR (1.2.3 → 1.3.0): funcionalidade nova, retrocompatível
→ Atualizar na próxima sprint, rodar testes depois

MAJOR (1.2.3 → 2.0.0): breaking change — API mudou
→ Avaliar changelog, planejar migration, testar extensivamente
→ Pode exigir mudança de código
```

**Quando ignorar uma vulnerabilidade (documentado):**

```
Critérios para ignorar:
1. É em devDependency e nunca vai para produção
2. O código vulnerável não é chamado pela sua aplicação (unreachable code path)
3. Já tem mitigação diferente no sistema (WAF, firewall)
4. Não existe versão com fix disponível ainda (CVE publicado, fix pendente)

Nunca ignorar sem documentar: por que, quando reavaliar, quem decidiu
```

---

### Lockfile: obrigação em aplicação

```bash
# package-lock.json (npm) ou pnpm-lock.yaml (pnpm):
# - Grava a versão EXATA de cada dep instalada
# - Garante que prod instala exatamente o que dev testou
# - Sem lockfile: npm install pode trazer versão diferente com bug novo

# Deve ser commitado em aplicação (meet-hub, PULSAR-RH, etc.)
# NÃO deve ser commitado em biblioteca/SDK (para não forçar versões no consumidor)

# Atualizar lockfile após npm audit fix:
npm install  # regenera lockfile
git add package-lock.json
git commit -m "chore(deps): update lockfile after security patches"
```

---

## Por que cai em entrevista

Não é pergunta técnica profunda — é pergunta de processo. "Como você garante que as deps do seu projeto estão seguras?" Candidatos que não têm processo definido passam uma imagem de descuido. A AG tem projetos reais — rodar o audit e ter uma resposta baseada em números reais é diferencial.

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| `npm audit` manual quando lembra | Zero custo | Não detecta nada entre as auditorias manuais |
| Dependabot auto PRs | Automático, visível | PRs demais em repos com muitas deps |
| Snyk + monitoramento | Alerta proativo quando nova CVE publicada | Custo em planos maiores; mais uma ferramenta |
| Atualizar tudo toda sprint | Deps sempre atuais | Risco de breaking change; testagem constante |
| Só atualizar critical em prod | Foco no risco real | Medium/High acumulam; eventual dívida maior |

Regra prática AG: Critical em prod → patch em 48h. High em prod → próxima sprint. Medium+ em devDep → agenda trimestral.

---

## Exercício aplicado (projeto AG real)

```bash
# Rodar npm audit em 3 projetos AG e priorizar

PROJECTS=("meet-hub" "PULSAR-RH" "cliente-oficina-backend")

for project in "${PROJECTS[@]}"; do
  echo ""
  echo "════════════════════════════"
  echo "Projeto: $project"
  echo "════════════════════════════"

  if [ -d ~/projetos/$project ]; then
    cd ~/projetos/$project

    # Total de vulnerabilidades
    echo "--- Resumo ---"
    npm audit --audit-level=none 2>/dev/null | tail -5

    # Só high e critical
    echo "--- High/Critical ---"
    npm audit --audit-level=high 2>/dev/null | grep -E "high|critical|Package|Dependency" | head -20
  else
    echo "Projeto não encontrado"
  fi
done
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] npm audit 3 projetos AG

**Data da auditoria:** 2026-06-XX

| Projeto | Critical | High | Medium | Low | Ação |
|---|---|---|---|---|---|
| meet-hub | ? | ? | ? | ? | ? |
| PULSAR-RH | ? | ? | ? | ? | ? |
| cliente-oficina-backend | ? | ? | ? | ? | ? |

**Vulnerabilidades críticas em produção:**
- [listar cada uma: nome da dep, CVE, path de dependência, fix disponível?]

**Decisões:**
- [dep X]: patch disponível → aplicar agora com npm audit fix
- [dep Y]: major update necessário → planejar migration para próxima sprint
- [dep Z]: só devDependency → ignorar com documentação, reavaliar em 30 dias

**Próxima auditoria programada:** [data]

**Como explicar em entrevista (30s):**
> "Rodei npm audit nos 3 projetos principais. Encontrei N vulnerabilidades em deps de produção — X critical, Y high. Das critical, 2 tinham fix via patch automático (npm audit fix), 1 exigia major update que planejei para a sprint seguinte. As High em devDependencies foram documentadas como risco baixo e agendadas para revisão trimestral."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Você encontrou uma vulnerabilidade critical no npm audit, mas é numa devDependency. O que você faz?"
>
> **R (30s):**
> "Analiso o path de dependência. Se é devDependency e o código nunca vai para produção — o pacote só roda na minha máquina durante desenvolvimento — o risco para os usuários é zero. O risco é para minha máquina e para o pipeline de CI. Ainda assim, documento a decisão: CVE, motivo de não corrigir agora, prazo para reavaliar. Se tiver fix disponível sem breaking change, aplico assim mesmo — é rápido e elimina o ruído nos próximos audits. Se exigir major update, avalio o esforço vs exposição real."

> **P:** "O que é Log4Shell e como você teria detectado isso nos seus projetos?"
>
> **R (30s):**
> "CVE-2021-44228, CVSS 10.0: a biblioteca de log Java `log4j` interpretava strings como `${jndi:ldap://...}` como comandos — qualquer input logado podia executar código remoto. Detecção: npm audit teria mostrado a vulnerabilidade, ou Dependabot teria aberto PR automaticamente assim que o advisory foi publicado. No nosso caso usamos Node, não Java, então log4j não era risco direto — mas a lição é que log libraries são attack surface porque processam todo input do usuário."

---

## Checkpoint

- [ ] Rodei `npm audit` nos 3 projetos AG e classifiquei os resultados em produção vs devDep
- [ ] Sei a diferença entre CVSS e contexto de deployment na priorização
- [ ] Consigo configurar `dependabot.yml` básico para um repositório AG
- [ ] Documentei o resultado da auditoria com decisões explícitas para cada item
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [npm audit docs](https://docs.npmjs.com/cli/v10/commands/npm-audit) — flags e opções
- [NVD (National Vulnerability Database)](https://nvd.nist.gov/) — buscar qualquer CVE pelo número
- [Snyk Vulnerability Database](https://security.snyk.io/) — mais orientado a devs que o NVD
- [GitHub Dependabot docs](https://docs.github.com/en/code-security/dependabot)
- CVE-2021-44228 Log4Shell: [lunasec analysis](https://www.lunasec.io/docs/blog/log4j-zero-day/) — análise técnica detalhada da exploração
- `event-stream` incident (2018): pesquisar "event-stream npm malicious 2018 flatmap-stream" — case de supply chain attack
