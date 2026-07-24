# 05 — Secrets Management e Rotação

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**Secret** é qualquer valor que concede acesso a um recurso: API key, token de serviço, connection string com credencial, chave privada, senha de banco, OAuth client secret. A regra é simples de enunciar e difícil de manter: **o secret nunca vai para um lugar com acesso mais amplo do que o serviço que ele protege** — não para o repositório, o log, o screenshot, o bundle do frontend. Este módulo mostra por que essa regra é uma consequência direta de um princípio de 1883, e o que fazer quando ela é violada.

---

## § BASE — o fundamento

**Por que existe "secret" separado do código: Kerckhoffs (1883).** Auguste Kerckhoffs, em *La Cryptographie Militaire* (Journal des sciences militaires, 1883), formulou o princípio que sustenta toda a criptografia moderna: **um sistema deve permanecer seguro mesmo que tudo sobre ele, exceto a chave, seja de conhecimento público.** A segurança mora na **chave**, não no segredo do mecanismo. Saltzer & Schroeder (1975) generalizaram isso no princípio de **open design** (módulo 01): não confie no segredo da arquitetura. A consequência prática é exatamente a disciplina de secrets: **o código pode ser público** (repositório, bundle, review) porque a segurança não depende dele — ela depende do secret, que por isso precisa ser rigorosamente separado do que é público. "Segurança por obscuridade" (esconder o algoritmo) é o antônimo direto; secrets management é Kerckhoffs aplicado à engenharia do dia a dia.

**Um secret é um segredo de alta entropia.** Ele só funciona enquanto for **inadivinhável**: sua força é medida em bits de entropia, `H = log₂(N)`, onde N é o espaço de valores possíveis. Uma chave de 256 bits tem 2²⁵⁶ possibilidades — inatacável por força bruta. Isso importa para o design: secret **não é senha de humano** (que precisa ser memorizável e por isso tem baixa entropia); secret é gerado por CSPRNG e tratado como material criptográfico. E, ao contrário de dado comum, um secret **não tem valor de negócio** — só de acesso — então não há razão para ele estar em lugar nenhum além de onde é consumido.

**Least privilege define a gravidade de cada secret: o blast radius.** Nem todo secret é igual. O princípio de **least privilege** (Saltzer & Schroeder) diz que cada credencial deve conceder o mínimo — e o "raio de explosão" (*blast radius*) de um vazamento é proporcional ao privilégio da chave vazada. A `ANON_KEY` do Supabase, sujeita a RLS, tem raio pequeno; a `SERVICE_ROLE_KEY`, que **bypassa RLS por completo**, tem raio máximo: quem a tem lê, escreve e apaga qualquer dado de qualquer tenant, via HTTPS, de qualquer lugar do mundo. É por isso que ela é **mais perigosa que a senha do banco** — a senha exige acesso de rede ao Postgres; a service key funciona por HTTPS de qualquer IP. Classificar secrets por blast radius é o que decide a urgência de contenção.

**Rotação é gestão de risco, não paranoia: o cryptoperiod.** A premissa correta é que todo secret **será** exposto um dia — a única variável é *quando* e por *quanto tempo* ele fica válido depois. O NIST, em **SP 800-57 Part 1 (Recommendation for Key Management)**, formaliza o conceito de **cryptoperiod**: o intervalo em que uma chave permanece autorizada. Rotação periódica **encurta a janela de exposição** de um vazamento silencioso — se a chave é trocada a cada 6 meses, um leak não detectado tem no máximo 6 meses de vida. Rotação não previne o vazamento; ela **limita o dano** de um vazamento que você ainda não sabe que aconteceu.

**O caso real.** Em setembro de 2022, um atacante comprometeu a Uber: após obter acesso inicial, encontrou **credenciais hardcoded em um script interno** e as usou para pivotar para AWS, GCP, painéis internos e ferramentas de segurança — comprometimento amplo da infraestrutura. Segundo a própria comunicação da Uber sobre o incidente, o problema-chave não foi ausência de MFA, e sim **secret no lugar errado** dando movimento lateral. É o blast radius em ação: uma credencial mal-guardada virou acesso a tudo.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A hierarquia de onde secrets moram, do pior ao melhor:

```
Pior ←──────────────────────────────────────────────────────→ Melhor
Hardcoded      .env commitado    .env ignorado    var de env      Vault /
no código      no git            no git           no servidor     Secret Manager
(blast total)  (histórico git    (mínimo           (padrão AG      (rotação
               = permanente)      aceitável)        produção)       automática, TTL)
```

**Mínimo aceitável:** `.env` local ignorado pelo `.gitignore`, com `.env.example` documentando as variáveis **sem valores**. **Padrão AG produção:** `.env` em `/opt/<projeto>/.env` no servidor, permissão `600`, owner `root`. Não commitado, não logado, não em storage público.

```bash
# .gitignore — ANTES do primeiro commit
.env
.env.local
.env.*.local
*.pem
*.key
*_credentials.json
```

```bash
# .env.example — commitado, SEM valores reais
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # blast radius MÁXIMO — nunca no frontend
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

**Rotação por blast radius** (cryptoperiod menor para chave mais perigosa):

| Secret | Frequência AG | Rotacionar já quando |
|---|---|---|
| Supabase `SERVICE_ROLE_KEY` | 6 meses | qualquer exposição confirmada ou suspeita |
| Google OAuth client secret | 6 meses | suspeita; ex-colaborador com acesso |
| Redis password / tokens de bot | 6 meses | mudança de colaboradores |
| Supabase `ANON_KEY` | 12 meses | exposição em repositório público |
| Chaves SSH de deploy | anual | comprometimento de máquina |

**Fluxo de rotação sem downtime:** gerar nova no provider → adicionar no servidor → app aceita ambas (dual-write, se a arquitetura permitir) → deploy com a nova como primária → smoke test → revogar a antiga → deploy final limpo. Para app simples sem dual-write: aceitar janela de 1-2 min na troca.

**Gerenciadores (vocabulário de entrevista — a AG hoje usa `.env` no servidor):**

| Ferramenta | Quando faz sentido |
|---|---|
| HashiCorp Vault | time >5 devs; dynamic secrets com TTL |
| Doppler / Infisical | SaaS, sync automático p/ Vercel/Railway; começa grátis |
| AWS Secrets Manager | stack AWS; rotação nativa de RDS |
| Vercel/Railway Env Vars | apps hospedados lá — já embutido |
| GitHub Secrets | só CI/CD — não disponível em runtime |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. INVENTARIAR os secrets e seu blast radius.** Liste cada credencial do projeto e classifique o raio: bypassa RLS/tem acesso admin (máximo) → sessão/leitura restrita (menor). A urgência de tudo o mais deriva daqui.

**2. GARANTIR a separação (Kerckhoffs aplicado).** `.gitignore` com `.env*` antes do primeiro commit; `.env.example` sem valores; secret só onde é consumido, nunca no bundle/log/screenshot.

**3. DETECTAR leak antes do commit.** `gitleaks protect --staged` como pre-commit hook; `gitleaks detect` para varrer o histórico. Examinar cada hit (há falso-positivo).

**4. Se vazou — CONTER na ordem certa.** **Revogar primeiro** (a chave antiga morre na hora), *depois* auditar uso, *depois* limpar histórico. Inverter a ordem (limpar antes de revogar) deixa a chave viva enquanto você trabalha.

**5. ROTACIONAR periodicamente (cryptoperiod).** Frequência por blast radius; a chave de raio máximo tem o menor cryptoperiod.

**Anti-padrões:**
- **Confiar no repo privado:** privado hoje pode virar público, ou o histórico vaza. Secret nunca entra no git, privado ou não.
- **Limpar o histórico antes de revogar:** enquanto você roda `git filter-repo`, a chave continua válida. Revogue primeiro, sempre.
- **`SERVICE_ROLE_KEY` no frontend:** blast radius máximo exposto no bundle público. É o erro mais caro da lista.
- **"Rotação é paranoia":** rotação não previne o leak — limita a janela do leak que você ainda não descobriu.

---

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
# 1. .gitignore de todos os projetos AG cobre secrets?
for p in ~/projetos/*/; do echo "=== $p ==="; \
  [ -f "$p/.gitignore" ] && grep -E "\.env|secret|credential|key" "$p/.gitignore" || echo "SEM .gitignore!"; done

# 2. Algum .env foi commitado por engano (histórico)?
for p in ~/projetos/*/; do cd "$p" 2>/dev/null || continue; \
  git rev-parse --git-dir >/dev/null 2>&1 && \
  [ -n "$(git log --all --full-history -- '.env' '*.env' 2>/dev/null)" ] && echo "ALERTA: $p tem .env no histórico!"; done

# 3. gitleaks em pelo menos um projeto
cd ~/projetos/meet-hub && gitleaks detect --source . --verbose 2>&1 | head -50

# 4. Onde está a SERVICE_ROLE_KEY do OFICINA? (blast radius máximo)
cd ~/projetos/cliente-oficina-backend
grep -rn "SERVICE_ROLE\|service_role" . --exclude-dir=node_modules --exclude-dir=.git \
  --include="*.ts" --include="*.js" --include="*.env*" --include="*.json"
```

**Contenção quando um secret vaza (a ordem é lei):**

```bash
# 1º REVOGAR — Supabase Dashboard → Settings → API → Service Role Key → Regenerate (antiga morre na hora)
# 2º AUDITAR — Dashboard → Logs → API: requests com a chave antiga? IPs/timestamps suspeitos?
# 3º ATUALIZAR — ssh root@<servidor>; editar /opt/<projeto>/.env; docker compose restart
# 4º LIMPAR HISTÓRICO (só depois de revogar) — se apareceu em commit:
git log --all -p | grep -i "service_role\|SUPABASE_SERVICE"   # confirmar
# git filter-repo para expurgar + force push (repo já comprometido — a revogação é o que protege)
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] secrets audit
**Inventário por blast radius:** [SERVICE_ROLE_KEY (máx), OAuth secret, ANON_KEY (mín)...]
**Resultado gitleaks:** [achados ou "nenhum secret detectado"]
**SERVICE_ROLE_KEY OFICINA:** [status — exposto/contido/rotacionado]
**Ações:** revogar+rotacionar se necessário; gitleaks como pre-commit; .env.example onde falta
**Cryptoperiod programado:** [próximas datas por secret crítico]
```

## Por que cai em entrevista

Frequente em pleno/sênior e em empresas que já levaram breach. A pergunta não é "o que é `.env`" — é "como você gerenciaria secrets num projeto com 3 ambientes (dev/staging/prod) e 2 devs, e o que faz se um vazar".

> **P:** "Como você gerencia secrets em projetos Node.js? E o que faz se descobrir que um secret vazou no repositório?"
>
> **R (30s):**
> "Secrets ficam em `.env` local, nunca commitados. `.gitignore` tem `.env*` antes do primeiro commit, e `.env.example` documenta as variáveis sem valores. Em produção, o arquivo `.env` fica no servidor com permissão `600`. Não uso Vault ainda — para time pequeno não compensa a operação. Se um secret vazar: primeira ação é revogar imediatamente no provider — a chave antiga para de funcionar na hora. Depois limpar o histórico git com `git filter-repo` e force push. Depois auditar logs do serviço para ver se houve uso malicioso. Rotacionar preventivamente a cada 6 meses."

> **P:** "O que é SERVICE_ROLE_KEY no Supabase e por que é perigoso?"
>
> **R (30s):**
> "É a chave de superusuário do Supabase — bypassa todas as políticas de RLS. Quem tem a chave pode ler e escrever qualquer dado de qualquer tenant sem restrição, via HTTPS de qualquer IP. É mais perigosa que a senha do banco porque não precisa de acesso de rede ao servidor. Deve ficar só no backend, nunca no bundle do frontend, e ser rotacionada a cada 6 meses ou imediatamente se houver suspeita de exposição."

> **P:** "Por que a gente separa secret do código, se o repositório é privado? E por que rotacionar se nada vazou?"
>
> **R (30s):**
> "Pelo princípio de Kerckhoffs, de 1883: a segurança tem que morar na chave, não no segredo do código. Isso me deixa tratar o código como potencialmente público — repo, bundle, review — porque a proteção não depende dele; depende do secret, que por isso fica rigorosamente separado. Repo privado vira público, histórico vaza, bundle vai pro browser. Sobre rotação: eu parto do princípio de que todo secret será exposto um dia — a rotação é o cryptoperiod do NIST, ela não previne o leak, encurta a janela de um leak que eu ainda não descobri. Chave de blast radius maior, como a service role, tem o menor cryptoperiod."

## Checkpoint

- [ ] Todos os projetos AG têm `.env` no `.gitignore` e `.env.example` commitado
- [ ] Classifico cada secret por blast radius e explico por que a `SERVICE_ROLE_KEY` é a mais crítica
- [ ] Explico secrets management como Kerckhoffs/open design aplicado (segurança na chave, não no código)
- [ ] Sei o plano de contenção na ordem certa: revogar → auditar → limpar → rotacionar
- [ ] Rodei gitleaks num projeto AG e documentei o status da `SERVICE_ROLE_KEY` do OFICINA
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- *La Cryptographie Militaire* — Auguste Kerckhoffs (1883): a segurança mora na chave, não no segredo do mecanismo (o fundamento de todo secrets management)
- *The Protection of Information in Computer Systems* — Saltzer & Schroeder (1975): os princípios de open design e least privilege (o blast radius)
- NIST SP 800-57 Part 1 — *Recommendation for Key Management*: o conceito de cryptoperiod (por que e a cada quanto rotacionar)
- OWASP *Secrets Management Cheat Sheet* — armazenamento, rotação, detecção
- gitleaks e TruffleHog — scanners de secret em git (detecção pré-commit e no histórico)
- Supabase docs — *API keys*: a diferença de privilégio entre `ANON_KEY` e `SERVICE_ROLE_KEY`
- Comunicação oficial da Uber sobre o incidente de segurança de setembro/2022 — credencial hardcoded como vetor de movimento lateral
