# 01 — OWASP Top 10: Mapa do Território

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

O OWASP (Open Web Application Security Project) publica a cada ~4 anos a lista das 10 classes de vulnerabilidade mais críticas em aplicações web. A lista atual é de **2021** e é a referência universal em auditoria e entrevista. Mas o Top 10 é o **retrato empírico** de um momento — o que os dados mostram estar quebrando agora. Debaixo dele existe um fundamento que não envelhece: os **8 princípios de projeto seguro** de Saltzer & Schroeder (1975). Este módulo ensina o mapa (OWASP) ancorado na bússola (Saltzer & Schroeder) — porque quem só decora a lista esquece na próxima edição; quem entende o princípio classifica qualquer vulnerabilidade, inclusive as que ainda não têm nome.

---

## § BASE — o fundamento

**A bússola que não envelhece: Saltzer & Schroeder (1975).** No paper *The Protection of Information in Computer Systems* (Proceedings of the IEEE, vol. 63 nº 9, seção I.A.3), Jerome Saltzer e Michael Schroeder destilaram **8 princípios de projeto** que continuam sendo o alicerce de segurança 50 anos depois:

1. **Economy of mechanism** — o mecanismo de segurança deve ser o mais simples possível (o que é simples, se audita; o que é complexo, esconde falha).
2. **Fail-safe defaults** — o padrão é *negar*; o acesso se concede explicitamente, nunca por omissão (default-deny, não default-allow).
3. **Complete mediation** — *toda* requisição a um recurso é verificada, sem atalho ou cache de decisão de acesso.
4. **Open design** — a segurança não depende do segredo do desenho, só do segredo da chave. É o **princípio de Kerckhoffs (1883)** generalizado: o sistema deve ser seguro mesmo com o código público.
5. **Separation of privilege** — exigir mais de uma condição para conceder acesso (a raiz conceitual do 2FA).
6. **Least privilege** — cada componente opera com o mínimo de poder necessário à sua função.
7. **Least common mechanism** — minimizar o que é compartilhado entre usuários (mecanismo comum é canal de vazamento).
8. **Psychological acceptability** — se a proteção atrapalha demais, o usuário a contorna; segurança que ninguém usa não protege.

Os autores ainda listam duas "quase-regras" pragmáticas: **work factor** (custar caro atacar) e **compromise recording** (registrar o comprometimento) — esta última é literalmente o fundamento de auditoria do módulo 07.

**Por que o OWASP é retrato, não teoria.** O Top 10 2021 é, pela primeira vez, majoritariamente **data-driven**: segundo o próprio relatório, 8 das 10 categorias saíram de dados agregados de centenas de milhares de aplicações reais, e 2 (A04 e A10) vieram da *community survey* — o que os especialistas sabem que dói mas ainda não aparece bem nos dados automatizados. O ranking passou a usar **taxa de incidência** (percentual de aplicações em que a categoria aparece pelo menos uma vez), não frequência bruta de achados — decisão metodológica que evita que um scanner barulhento infle uma categoria. Cada categoria mapeia um conjunto de **CWEs** (Common Weakness Enumeration, o dicionário canônico de fraquezas do MITRE): A03 agrega CWE-79 (XSS), CWE-89 (SQLi) e dezenas de outras.

**A tese central deste módulo:** toda categoria OWASP é a **violação de um ou mais princípios de Saltzer & Schroeder**. A01 (Broken Access Control) é falha de *least privilege* + *complete mediation*. A05 (Misconfiguration) é falha de *fail-safe defaults*. A04 (Insecure Design) é a ausência do princípio de que segurança se projeta, não se remenda. Ler o OWASP por essa lente é o que transforma decoreba em entendimento.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As 10 categorias de 2021, cada uma com o princípio S&S que ela quebra e o dado de incidência que o relatório reporta:

```
CAT.  NOME                              PRINCÍPIO S&S VIOLADO        SINAL DO RELATÓRIO 2021
A01   Broken Access Control             least privilege / mediation  subiu p/ #1; 94% das apps
A02   Cryptographic Failures            open design / fail-safe       (ex "Sensitive Data Exposure")
A03   Injection (SQLi, XSS, cmd)        complete mediation            era #1 em 2017; CWE-79/-89
A04   Insecure Design                   [ausência de projeto seguro]  NOVA; veio da community survey
A05   Security Misconfiguration         fail-safe defaults            default perigoso não trocado
A06   Vulnerable/Outdated Components    least common mechanism         difícil de testar; #2 na survey
A07   Identification & Authn Failures   separation of privilege        (ex "Broken Authentication")
A08   Software & Data Integrity Fail.   [integridade da cadeia]        NOVA; supply chain
A09   Logging & Monitoring Failures     compromise recording           NOVA posição; base survey
A10   Server-Side Request Forgery       complete mediation             NOVA; maior nota de impacto na survey
```

**A01 — Broken Access Control.** Usuário acessa recurso alheio (IDOR, falta de RLS, `/admin` sem checagem de role). Segundo o relatório 2021, foi a categoria com **mais ocorrências no dataset — mais de 318 mil** — e **94%** das aplicações testadas exibiram alguma forma dela. Por isso saltou de A05 (2017) para **#1**.

**A02 — Cryptographic Failures.** Dado sensível sem proteção em trânsito ou repouso: HTTP sem TLS, senha em MD5, chave no repo. O nome mudou de "Sensitive Data Exposure" porque o problema-raiz é a *falha criptográfica*, não a exposição em si.

**A03 — Injection.** Código do atacante interpretado como comando: SQLi, NoSQLi, command, LDAP — e **XSS**, absorvido aqui em 2021. Causa única: concatenar input não-confiável em comando/query. Prisma cobre ~99% do SQLi; `$queryRawUnsafe` reabre o buraco (módulo 03).

**A04 — Insecure Design.** Ausência de *threat modeling* no desenho da feature. Não é bug de implementação — é decisão de produto que ignora o adversário ("reset de senha por pergunta secreta" é inseguro por definição). O fix é redesenho, não patch. Categoria **nova** em 2021.

**A05 — Security Misconfiguration.** Default perigoso deixado como está: debug em produção, bucket público, CORS `*`, usar `SERVICE_ROLE_KEY` onde `ANON_KEY` bastaria (violação direta de *least privilege* + *fail-safe defaults*).

**A06 — Vulnerable and Outdated Components.** Dependência com CVE conhecido. O caso definitivo: **Log4Shell (CVE-2021-44228)** — uma linha de JNDI lookup no `log4j` deu RCE em milhões de servidores em dez/2021. Equivalente no stack Node: `npm audit` acusando Critical.

**A07 — Identification and Authentication Failures.** Auth quebrada: sem rate limit no login, JWT sem expiração, sessão não invalidada no logout. A AG mitiga com Google OAuth restrito ao domínio — elimina a gestão de senha por design.

**A08 — Software and Data Integrity Failures.** CI/CD sem verificação de integridade, deserialização insegura, update sem assinatura. **SolarWinds (2020)** é o caso: o pacote de update *legítimo* foi comprometido na cadeia e instalado por ~18 mil organizações.

**A09 — Security Logging and Monitoring Failures.** Sem log, sem alerta, sem trilha de quem fez o quê — quando o breach vem, não há evidência. É o *compromise recording* de S&S ausente (módulo 07).

**A10 — Server-Side Request Forgery (SSRF).** A app aceita URL externa e faz o request server-side; o atacante aponta para `http://169.254.169.254` (metadata AWS/GCP) e extrai credenciais. O **breach da Capital One (2019)** foi exatamente isso: segundo a acusação federal (US v. Paige Thompson, DOJ), uma SSRF num WAF mal configurado expôs ~100 milhões de registros. Categoria **nova**, entrou pela survey com a maior nota de impacto.

**Trade-off de priorização** (nenhum critério é grátis):

| Critério | Vantagem | Custo |
|---|---|---|
| Corrigir tudo já | Zero dívida de segurança | Paralisa o dev — inviável em time pequeno |
| CVSS score como fila | Objetivo, defensável | CVE crítico em dep dev-only tem impacto real ~zero |
| Só o que está em prod | Foco no risco real | Dep vulnerável em dev vira vetor de comprometer a máquina do dev |
| Pentest externo periódico | Vê o que a auditoria interna não vê | Caro; relatório chega meses depois do bug entrar |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CLASSIFICAR o achado na categoria.** Toda vulnerabilidade encontrada recebe um rótulo A01–A10. Se você não sabe classificar, não entendeu o achado. A pergunta-guia: *qual princípio de Saltzer & Schroeder isso viola?*

**2. MEDIR o risco real, não o teórico.** Risco = probabilidade × impacto no *seu* contexto. CVE Critical numa `devDependency` que não roda em produção tem impacto operacional baixo; A01 num endpoint que serve dado de cliente é alto sempre.

**3. PRIORIZAR por incidência × impacto.** Espelhe a lógica do próprio OWASP: o que é comum *e* dói vem primeiro. Regra de bolso AG: `dependencies` (não `devDependencies`) com CVSS ≥ 7.0 → corrigir nesta sprint; o resto → agendar.

**4. REGISTRAR a decisão (inclusive a de adiar).** Adiar um risco é uma decisão de engenharia — vai para o `DECISIONS.md` com o motivo. Risco não-registrado vira surpresa no incidente.

**5. REVERIFICAR após o fix.** Rodar `npm audit` de novo, confirmar que o achado sumiu e que nada novo apareceu. "Corrigido" só existe depois de observado (regra da casa).

**Anti-padrões:**
- **Decorar a lista sem o princípio:** você recita A01–A10 mas não classifica um achado novo. O princípio S&S é o que generaliza.
- **CVSS como oráculo cego:** tratar 9.8 em dev-only igual a 9.8 em prod. Score sem contexto engana.
- **"Validar inputs" como resposta genérica:** nomeie a categoria e o mecanismo, ou não passa no filtro do entrevistador.

---

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
# 1. Rodar npm audit em 1 projeto AG com dependências
cd ~/projetos/meet-hub
npm audit                       # tabela por severity (critical/high/moderate/low)

# 2. Filtrar o que exige ação imediata
npm audit --audit-level=high

# 3. Ver o que tem fix disponível (sem aplicar ainda)
npm audit fix --dry-run

# 4. Análise mais detalhada com Snyk (free tier)
npm install -g snyk
snyk auth                       # login via GitHub
snyk test                       # analisa o projeto atual
```

Para cada CVE, **classifique na categoria OWASP e registre a decisão**:

```markdown
## DECISIONS.md — 2026-06-XX — [security] audit npm meet-hub
**Contexto:** npm audit acusou N vulnerabilidades.
**Classificação (OWASP + princípio S&S):**
- Critical/High em deps de PRODUÇÃO → A06; fix nesta sprint
- Moderate em deps de produção → A06; próxima sprint
- Qualquer severity em devDependencies → risco só na máquina do dev; agendar
**Ação:** [o que resolvi e o que adiei deliberadamente + motivo]
**Consequências:** [o que muda no comportamento da app]
```

Ao final: consiga dizer, para cada achado, **qual categoria e qual princípio** — esse é o exercício.

## Por que cai em entrevista

É o mapa. O entrevistador pede "cite vulnerabilidades comuns" — quem responde 2-3 itens OWASP pelo nome, com exemplo real e o princípio por trás, passa o filtro; quem diz "validar inputs" sem nomear a categoria, não. Frequência por nível: **Júnior** A01/A03/A07; **Pleno** + A02/A05/A06; **Sênior** + A04/A08/A09/A10 (os que exigem visão de sistema).

> **P:** "Me cite 3 categorias do OWASP Top 10 e como você as mitigou nos seus projetos."
>
> **R (30s):**
> "Injection: uso Prisma como ORM — queries parameterizadas por padrão, então SQL injection está coberto. Temos um caso real de XSS que corrigimos em maio de 2026 no PULSAR-RH: parâmetros de URL eram inseridos no DOM sem encoding — ficou um commit documentado disso. Para Auth Failures, adotamos Google OAuth restrito ao domínio `agconsultorialtda.com` — eliminamos gestão de senha completamente, que é a fonte de 80% dos problemas de auth."

> **P:** "O que é o Log4Shell e por que foi tão grave?"
>
> **R (30s):**
> "CVE-2021-44228: a biblioteca de logging Java `log4j` interpretava strings no formato `${jndi:ldap://...}` como comandos — bastava logar input do usuário para executar código remoto. Grave porque: log4j está em metade da internet Java, o exploit tinha uma linha, e funciona contra qualquer serviço que logava qualquer coisa do usuário. É o caso definitivo de A06 (Vulnerable Components) — a lib estava em todo lugar, mas ninguém rastreava a versão."

> **P:** "Por que o OWASP Top 10 muda de edição em edição, e como você não fica desatualizado?"
>
> **R (30s):**
> "Porque o Top 10 é empírico — é o retrato do que os dados de milhares de aplicações mostram quebrando *agora*, ranqueado por taxa de incidência. Categorias entram, saem e se fundem: XSS virou subclasse de Injection em 2021, Broken Access Control subiu pra número um. O que não muda são os princípios que estão por baixo — os oito de Saltzer e Schroeder, de 1975: least privilege, fail-safe defaults, complete mediation. Eu ancoro no princípio, não na posição da lista: cada categoria OWASP é a violação de um deles. Assim eu classifico até uma vulnerabilidade que ainda não tem nome na lista."

## Checkpoint

- [ ] Nomeio as 10 categorias OWASP 2021 e dou um exemplo real de cada
- [ ] Ligo cada categoria ao princípio de Saltzer & Schroeder que ela viola
- [ ] Explico por que o ranking usa taxa de incidência e por que XSS virou subclasse de A03
- [ ] Rodei `npm audit` num projeto AG e classifiquei os achados por categoria + prioridade
- [ ] Sei em qual categoria cai o XSS do PULSAR-RH (A03) e por quê
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- *The Protection of Information in Computer Systems* — Saltzer & Schroeder (Proc. IEEE, 1975), seção I.A.3: os 8 princípios de projeto + work factor e compromise recording (a âncora de TODA a trilha)
- OWASP Top 10 2021 — a página oficial de cada categoria traz a taxa de incidência e os CWEs mapeados (ler o "Overview" e os números por categoria)
- CWE (MITRE) — o dicionário de fraquezas referenciado pelo OWASP; consultar por número (CWE-79, CWE-89, CWE-352)
- *La Cryptographie Militaire* — Auguste Kerckhoffs (1883): o princípio de open design ("a segurança está na chave, não no segredo do método")
- CVE-2021-44228 (Log4Shell) e o relatório CISA sobre SolarWinds (2020) — os casos de A06 e A08
- Acusação federal US v. Paige Thompson (DOJ, 2019) — o breach da Capital One como caso de A10/SSRF
- IBM *Cost of a Data Breach 2023* — a fonte dos números de tempo-de-detecção usados na trilha (A09)
