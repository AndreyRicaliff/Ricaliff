# 08 — Vulnerabilidades em Dependências

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Dependência é código de terceiro que você roda no seu servidor com os seus privilégios. Uma vulnerabilidade em qualquer dep sua é uma vulnerabilidade no seu produto — você não escreveu a linha, mas ela executa dentro da sua fronteira de confiança. A OWASP cataloga isso como **A06:2021 — Vulnerable and Outdated Components**, e a categoria sobe no ranking justamente porque a superfície de código de terceiro cresce mais rápido que a capacidade de auditá-la. Este módulo é sobre o vocabulário (CVE, CVSS), o instrumento (audit/scanner) e — o que separa júnior de pleno — a **priorização**: severidade não é risco, e tratar as duas como sinônimo faz você apagar incêndio em `devDependency` enquanto a casa queima no runtime.

---

## § BASE — o fundamento

**O identificador: CVE.** Em 1999, a MITRE Corporation criou o **CVE (Common Vulnerabilities and Exposures)** para resolver um problema de Babel: cada fornecedor de antivírus nomeava a mesma falha de um jeito, e ninguém conseguia cruzar informação. O CVE é só um nome canônico — `CVE-YYYY-NNNNN` — para que "a falha do log4j de dezembro de 2021" tenha um endereço único, `CVE-2021-44228`, que todo mundo referencia. Não é um score, não é uma correção: é o registro de identidade da vulnerabilidade, mantido hoje num programa federado (MITRE + CNAs, os *CVE Numbering Authorities*).

**A régua: CVSS.** O **Common Vulnerability Scoring System**, mantido pelo **FIRST.org** (spec v3.1, 2019; v4.0, 2023), tenta transformar "quão grave é isso?" num número de 0 a 10. A pegadinha que quase todo júnior comete é achar que esse número é o risco. Não é. O **Base Score** do CVSS combina dois grupos de métricas: **Exploitability** (Attack Vector — rede/local/físico? Attack Complexity, Privileges Required, User Interaction) e **Impact** (Confidentiality, Integrity, Availability). Ele mede a **severidade intrínseca** da falha *isolada* — não sabe nada sobre o *seu* deployment. A própria especificação do FIRST diz isso com todas as letras: o Base Score deve ser *ajustado* pelas métricas Temporal e Environmental para virar risco. Quase ninguém ajusta, e aí um `9.8` numa lib que só roda no build gera pânico do mesmo tamanho de um `9.8` no seu parser de request público — que é errado.

**Severidade não é risco.** A relação honesta, e a tese central deste módulo:

```
Risco ≈ Severidade (CVSS base) × Exploitabilidade (o código vulnerável é alcançável no MEU uso?) × Exposição (runtime em prod? dev-only? atrás de WAF?)
```

Um `CVE 10.0` numa `devDependency` que nunca vai pra produção tem exposição ~0 — é risco pra máquina do dev e pro CI, não pros usuários. Um `CVE 6.5` no seu middleware de autenticação exposto na internet pode ser risco maior. O CVSS Base entrega só o primeiro fator; os outros dois são análise sua, e são onde mora a decisão.

**A controvérsia (declarada).** A comunidade sabe que o CVSS Base é enviesado pra severidade teórica e péssimo pra prever exploração real — por isso o próprio FIRST publica o **EPSS (Exploit Prediction Scoring System)**, um modelo que estima a *probabilidade* de uma CVE ser explorada nos próximos 30 dias. A maioria das CVEs de score alto **nunca é explorada in-the-wild**; um punhado de score médio vira arma em massa. Complementarmente, scanners modernos (Snyk, Socket, GitHub) fazem **reachability analysis** — o caminho de código vulnerável é de fato chamado pela sua aplicação? Se a função afetada está numa parte da lib que você não importa, a CVE existe mas não te alcança. Priorizar por CVSS puro é o estado da arte de 2015, não de 2026.

**O caso definitivo — Log4Shell.** `CVE-2021-44228`, CVSS **10.0** (o máximo). A lib de log Java `log4j` — presente em metade dos sistemas Java do planeta — interpretava qualquer string no formato `${jndi:ldap://host/a}` que passasse por um log como um *lookup* JNDI: o servidor fazia request ao endereço e **executava o código retornado**. RCE (execução remota de código) trivial, disparada por qualquer input logado — um User-Agent, um nome de usuário. O advisory da Apache e a entrada no NVD são a fonte; o patch saiu em ~72h, mas a janela já tinha sido varrida por scanners de exploração em escala global. A lição do §BASE: a lib mais inofensiva do mundo (um *logger*) processa **todo input do usuário** e por isso é superfície de ataque de primeira classe.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O `node_modules` não é uma lista — é uma **árvore**. Você declara deps diretas no `package.json`; cada uma arrasta as suas (transitivas), recursivamente. Um app Node modesto tem dezenas de diretas e **centenas** de transitivas. A CVE quase sempre mora numa transitiva que você nunca escolheu — daí o campo `Dependency of` do audit ser o dado mais importante que ele te dá:

```
seu-app  (package.json — você escolheu)
├── express            (direta, PRODUÇÃO → runtime exposto)
│   └── body-parser
│       └── qs         (transitiva — CVE aqui É risco de runtime)
├── jest               (direta, DEV → só roda no seu CI/máquina)
│   └── @jest/core
│       └── semver     (transitiva — CVE aqui é risco de dev, não de usuário)
└── prisma             (direta, PRODUÇÃO)

Fronteira que decide a prioridade:  ┌ runtime/prod ┐  vs  ┌ dev-only ┐
```

A régua de ação nasce do cruzamento **severidade × exposição** (não da severidade sozinha):

| CVSS | em dep de **runtime/prod** | em **devDependency** |
|---|---|---|
| 9.0–10.0 Critical | patch em **horas** | documentar + agendar; fix se sem breaking |
| 7.0–8.9 High | patch em ≤48h | próxima sprint |
| 4.0–6.9 Medium | próxima sprint | revisão trimestral |
| 0.1–3.9 Low | agenda | ruído — agrupar |

A leitura do `Dependency of` do `npm audit` é a chave: começa com `jest`/`eslint`/`vite` (dev)? Risco contido. Começa com `express`/`prisma`/`axios` (prod)? Risco real, sobe na fila.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. INVENTARIAR com lockfile.** Sem `package-lock.json`/`pnpm-lock.yaml` commitado você nem sabe qual versão exata roda — prod pode instalar uma diferente da que dev testou. O lockfile grava a versão exata de cada nó da árvore. É pré-requisito de qualquer auditoria séria.

**2. ESCANEAR.** `npm audit` (grátis, embutido) cruza sua árvore com o GitHub Advisory Database. Snyk/Dependabot adicionam reachability e monitoramento contínuo.

**3. CLASSIFICAR por severidade × exposição.** Para cada achado, responda três perguntas *antes* de agir: (a) runtime ou dev? (b) o código vulnerável é alcançável no meu uso? (c) há mitigação já no sistema (WAF, o path não é chamado)? Só o cruzamento vira prioridade.

**4. DECIDIR: patch, mitigar ou ignorar-documentado.** Patch disponível sem breaking → aplica. Só major disponível → planeja migration. Sem fix ainda → mitiga ou aceita com documentação.

**5. AUTOMATIZAR.** Auditoria manual "quando lembra" não detecta nada entre as lembranças. Dependabot/Snyk monitoram e abrem PR quando um advisory novo cai.

**Anti-padrões:**
- **`npm audit fix --force` no escuro.** O `--force` sobe versões major (breaking) sem dó — pode "consertar" a CVE e quebrar a app. Sempre rodar os testes depois; ler o que ele vai fazer com `--dry-run` antes.
- **CVSS como risco.** Priorizar pelo número sem olhar exposição/exploitabilidade é gastar o dia no `9.8` de devDep e deixar o `6.5` de runtime aberto.
- **Ignorar sem documentar.** "Depois eu vejo" some. Ignorar é decisão válida — *documentada*: qual CVE, por quê (dev-only / unreachable / mitigado), quando reavaliar, quem decidiu. Snyk tem `snyk ignore --expiry`; sem ferramenta, uma linha no `DECISIONS.md`.
- **Patchar o ruído de dev e ignorar o runtime.** O inverso da prioridade correta — comum em quem persegue o "0 vulnerabilidades" do relatório em vez do risco real.

```bash
npm audit --audit-level=high     # só o que importa; filtra o ruído low/info
npm audit fix --dry-run          # o que ELE faria, sem tocar em nada
npm audit fix                    # patch/minor: seguro
# npm audit fix --force          # major/breaking: SÓ com testes rodando depois
```

```yaml
# .github/dependabot.yml — automatiza o passo 5
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly", day: "monday" }
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:    { dependency-type: "development" }
      production-dependencies:
        dependency-type: "production"
        update-types: ["security", "patch"]   # prod: só segurança e patch automáticos
```

---

## Passo-a-passo aplicado (faça agora, ~30min)

Rode a auditoria em 3 projetos AG reais e priorize por risco, não por score.

```bash
PROJECTS=("meet-hub" "PULSAR-RH" "cliente-oficina-backend")
for p in "${PROJECTS[@]}"; do
  echo "════ $p ════"
  [ -d ~/projetos/$p ] || { echo "não encontrado"; continue; }
  cd ~/projetos/$p
  npm audit --audit-level=high --json 2>/dev/null | node -e "
    const d=JSON.parse(require('fs').readFileSync(0,'utf8')).vulnerabilities||{};
    Object.values(d).filter(v=>['critical','high'].includes(v.severity))
      .forEach(v=>console.log(v.severity.padEnd(9), v.name.padEnd(24),
        (v.nodes?.[0]||'').includes('node_modules') ? 'transitiva' : 'direta'));
  "
done
```

Registre a decisão — não o número cru, mas a análise de risco:

```markdown
## DECISIONS.md — 2026-06-XX — [security] auditoria de deps 3 projetos AG

| Projeto | Critical prod | High prod | Dev-only | Ação |
|---|---|---|---|---|
| meet-hub | ? | ? | ? | ? |
| PULSAR-RH | ? | ? | ? | ? |
| cliente-oficina-backend | ? | ? | ? | ? |

**Runtime/prod (risco real):** [dep, CVE, alcançável? fix disponível?]
**Dev-only (risco contido):** [dep, CVE, motivo de agendar]
**Ignorados com documentação:** [CVE, motivo, reavaliar em, quem]
**Próxima auditoria:** [data] — ou automatizada via Dependabot (link do PR)
```

## Por que cai em entrevista

Não é pergunta de algoritmo — é de **processo e maturidade**. "Como você garante que as deps do seu projeto estão seguras?" mede se você opera com responsabilidade ou reza pra não dar ruim. Quem responde com números reais de um audit que rodou, e sabe separar severidade de risco, passa uma imagem completamente diferente de quem nunca abriu o relatório.

> **P:** "Você encontrou uma vulnerabilidade critical no npm audit, mas é numa devDependency. O que você faz?"
>
> **R (30s):**
> "Analiso o path de dependência. Se é devDependency e o código nunca vai para produção — o pacote só roda na minha máquina durante desenvolvimento — o risco para os usuários é zero. O risco é para minha máquina e para o pipeline de CI. Ainda assim, documento a decisão: CVE, motivo de não corrigir agora, prazo para reavaliar. Se tiver fix disponível sem breaking change, aplico assim mesmo — é rápido e elimina o ruído nos próximos audits. Se exigir major update, avalio o esforço vs exposição real."

> **P:** "O que é Log4Shell e como você teria detectado isso nos seus projetos?"
>
> **R (30s):**
> "CVE-2021-44228, CVSS 10.0: a biblioteca de log Java `log4j` interpretava strings como `${jndi:ldap://...}` como comandos — qualquer input logado podia executar código remoto. Detecção: npm audit teria mostrado a vulnerabilidade, ou Dependabot teria aberto PR automaticamente assim que o advisory foi publicado. No nosso caso usamos Node, não Java, então log4j não era risco direto — mas a lição é que log libraries são attack surface porque processam todo input do usuário."

> **P (nova):** "Um scanner apontou 40 vulnerabilidades no seu projeto. Como você prioriza?"
>
> **R (30s):** "Não pelo CVSS, que é a armadilha. CVSS Base mede severidade intrínseca da falha isolada, não o meu risco — e risco é severidade × exploitabilidade × exposição. Então primeiro separo runtime de dev-only pelo path de dependência: metade das 40 costuma ser devDep que nunca vai pra prod. Das de runtime, olho se o código vulnerável é de fato alcançável no meu uso — scanner com reachability ou EPSS ajuda, porque a maioria das CVEs de score alto nunca é explorada de verdade. O que sobra — critical alcançável em runtime exposto — é o que patcho primeiro; o resto vira agenda documentada. O erro clássico é gastar o dia zerando o número do relatório com fixes de devDep e deixar aberto o médio que está no caminho do request."

## Checkpoint

- [ ] Sei o que é CVE (MITRE) e CVSS (FIRST) e por que Base Score ≠ risco
- [ ] Explico risco como severidade × exploitabilidade × exposição, com exemplo de cada fator
- [ ] Leio o campo `Dependency of` pra separar runtime de devDependency
- [ ] Rodei `npm audit` nos 3 projetos AG e classifiquei por risco, não por score
- [ ] Sei quando `npm audit fix --force` é perigoso e o que fazer depois dele
- [ ] Documentei cada "ignorar" com motivo, prazo e responsável

## Recursos

- **CVSS v3.1 Specification Document** — FIRST.org: as métricas Base/Temporal/Environmental e por que só o Base não é risco (fonte primária da §BASE)
- **CVE Program** — MITRE: o que é um CVE e o papel dos CNAs
- **NVD — CVE-2021-44228 (Log4Shell)** e o **Apache Log4j Security page**: o advisory e o mecanismo JNDI
- **EPSS (Exploit Prediction Scoring System)** — FIRST.org: probabilidade de exploração como complemento ao CVSS
- **OWASP Top 10 — A06:2021 Vulnerable and Outdated Components**: a categoria e as defesas
- npm docs — `npm audit`; **GitHub Advisory Database** e **Dependabot docs**; **Snyk Vulnerability Database**
