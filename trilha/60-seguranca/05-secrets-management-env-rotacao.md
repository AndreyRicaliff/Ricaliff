# 05 — Secrets Management e Rotação

## O que é

**Secret** é qualquer valor que dá acesso a um recurso: API key, token de serviço, connection string com credencial, chave privada, senha de banco, OAuth client secret. O princípio é simples: secret nunca vai para repositório, log, screenshot ou qualquer lugar com acesso mais amplo do que o serviço que usa o secret.

O caso que define a gravidade: **Uber (2022)**. Attacker encontrou credenciais hardcoded em repositório interno → acessou AWS, GCP, HackerOne, repositórios de código, Slack, ferramentas internas. Compromisso total da infraestrutura. O problema não foi ausência de 2FA — foi secret em lugar errado.

---

### A hierarquia de onde secrets moram

```
Pior ←————————————————————————————→ Melhor

Hardcoded    .env      .env         Variável    Vault /
em código    commitado ignorado     de env      Secret Manager
             no git    no git       no servidor  gerenciado
```

**O mínimo aceitável:** `.env` local ignorado pelo `.gitignore`, com `.env.example` documentando as variáveis sem valores.

**Padrão AG produção:** arquivo `.env` em `/opt/<projeto>/.env` no servidor, permissão `600`, owner `root`. Não commitado, não logado, não em cloud storage público.

---

### Estrutura obrigatória em todo projeto AG

```bash
# .gitignore — deve ter ANTES do primeiro commit
.env
.env.local
.env.*.local
*.pem
*.key
*_credentials.json
```

```bash
# .env.example — commitado, sem valores reais
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NUNCA usar no frontend
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
REDIS_URL=redis://localhost:6379
```

---

### Caso real (cliente anonimizado) — SERVICE_ROLE_KEY

Num projeto de cliente, a retrospectiva registrou: **`SERVICE_ROLE_KEY` exposta** durante o desenvolvimento.

`SERVICE_ROLE_KEY` do Supabase bypassa RLS completamente. Quem tem essa chave tem acesso de superusuário ao banco — pode ler, escrever e deletar qualquer dado de qualquer tenant sem nenhuma política de segurança.

**O que o SERVICE_ROLE_KEY não deve ser:**
- Incluído no bundle do frontend
- Commitado em repositório (mesmo privado)
- Passado em variável de ambiente de cliente
- Logado em qualquer sistema

**Por que é pior que uma senha de banco:** a senha de banco exige acesso de rede ao servidor Postgres. A SERVICE_ROLE_KEY funciona via HTTPS de qualquer lugar do mundo.

**Plano de contenção quando exposto:**

```bash
# 1. IMEDIATAMENTE: revogar a chave atual no Supabase
# Dashboard → Settings → API → Service Role Key → Regenerate
# A chave antiga para de funcionar instantaneamente

# 2. Verificar se foi usada de forma maliciosa
# Supabase Dashboard → Logs → API logs
# Buscar por requests com Authorization: Bearer <chave_antiga>
# Verificar IPs e timestamps suspeitos

# 3. Atualizar o .env no servidor com a nova chave
ssh root@<servidor>
nano /opt/cliente-oficina-backend/.env
# Substituir SERVICE_ROLE_KEY pelo novo valor

# 4. Reiniciar a aplicação
cd /opt/cliente-oficina-backend
docker compose restart api

# 5. Verificar se estava em outros lugares
git log --all -p | grep -i "service_role\|SUPABASE_SERVICE"
# Se aparecer em commit histórico, o repositório está comprometido
# Ação: git filter-repo para limpar histórico + force push (somente após revogar)
```

---

### Detecção de leak antes do commit

```bash
# gitleaks — scanner de secrets em repositório git
# Instalação:
brew install gitleaks  # macOS
# ou: https://github.com/gitleaks/gitleaks/releases

# Escanear repositório atual (histórico completo):
gitleaks detect --source . --verbose

# Escanear só arquivos não commitados (pre-commit):
gitleaks protect --staged

# Adicionar como pre-commit hook:
# .git/hooks/pre-commit:
#!/bin/sh
gitleaks protect --staged --redact
if [ $? -ne 0 ]; then
  echo "BLOQUEADO: gitleaks detectou possível secret. Verifique antes de commitar."
  exit 1
fi

# TruffleHog — alternativa com maior cobertura:
pip install truffleHog
trufflehog git file://. --only-verified
```

**Atenção:** gitleaks e trufflehog têm falsos positivos. Examinar cada hit antes de agir.

---

### Rotação periódica

| Secret | Frequência AG | Quando rotacionar imediatamente |
|---|---|---|
| Google OAuth client secret | 6 meses | Suspeita de comprometimento; ex-colaborador com acesso |
| Supabase SERVICE_ROLE_KEY | 6 meses | Qualquer exposição confirmada ou suspeita |
| Supabase ANON_KEY | 12 meses | Exposição em repositório público |
| Redis password | 6 meses | Mudança de colaboradores |
| Tokens de bot (agata@) | 6 meses | Qualquer suspeita |
| Chaves SSH de deploy | Anual | Compromisso de máquina |

**Fluxo de rotação sem downtime:**

```
1. Gerar nova chave no provider (Supabase, Google, etc.)
2. Adicionar nova chave no servidor: .env com NOVO_SECRET=<novo>
3. Atualizar aplicação para aceitar ambas (dual-write period) — se arquitetura permitir
4. Deploy com nova chave como primária
5. Verificar que está funcionando (smoke test)
6. Revogar chave antiga no provider
7. Remover NOVO_SECRET=<novo>; renomear para SECRET=<novo>
8. Deploy final limpo
```

Para apps simples sem dual-write: aceitar janela de downtime de 1-2 minutos durante a troca.

---

### Vault e gerenciadores de secrets para projetos maiores

A AG não usa hoje, mas o vocabulário importa em entrevista:

| Ferramenta | Quando faz sentido |
|---|---|
| **HashiCorp Vault** | Time com >5 devs; rotação automática; dynamic secrets (Vault gera credencial de banco por demanda com TTL) |
| **Doppler** | SaaS, UI amigável, sync automático para Vercel/Railway/Heroku; começa gratuito |
| **AWS Secrets Manager** | Stack AWS; rotação automática de RDS passwords nativa |
| **Vercel/Railway Env Vars** | Apps hospedados nesses providers — padrão já embutido |
| **GitHub Secrets** | CI/CD pipelines apenas — não disponível em runtime da app |
| **.env no servidor** | AG atual — ok para times pequenos com acesso SSH restrito |

---

## Por que cai em entrevista

Pergunta frequente em pleno/sênior e em entrevistas de empresas que já levaram breach. A pergunta não é "o que é .env" — é "me descreve como você gerenciaria secrets num projeto com 3 ambientes (dev/staging/prod) e 2 devs".

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| `.env` local + `.gitignore` | Simples, funciona | Sem histórico; não escala para time |
| Doppler / Infisical | Sync automático, auditoria, rotação | Outro ponto de falha; custo em escala |
| Vault | Dynamic secrets, zero-trust | Operacionalmente complexo; infra extra |
| Secrets no CI/CD (GitHub/Vercel) | Zero fricção para deploy | Não disponível para código de runtime; separação de ambientes manual |
| Hardcoded (nunca) | Nenhuma | Compromisso imediato |

---

## Exercício aplicado (projeto AG real)

```bash
# 1. Verificar .gitignore de todos os projetos AG
for project in ~/projetos/*/; do
  echo "=== $project ==="
  if [ -f "$project/.gitignore" ]; then
    grep -E "\.env|secret|credential|key" "$project/.gitignore"
  else
    echo "SEM .gitignore!"
  fi
done

# 2. Verificar se algum .env foi commitado por engano
for project in ~/projetos/*/; do
  cd "$project" 2>/dev/null || continue
  if git rev-parse --git-dir > /dev/null 2>&1; then
    result=$(git log --all --full-history -- ".env" "*.env" 2>/dev/null)
    if [ -n "$result" ]; then
      echo "ALERTA: $project tem .env no histórico git!"
    fi
  fi
done

# 3. Rodar gitleaks em pelo menos um projeto AG
cd ~/projetos/meet-hub
gitleaks detect --source . --verbose 2>&1 | head -50

# 4. Verificar SERVICE_ROLE_KEY do OFICINA — está onde?
cd ~/projetos/cliente-oficina-backend
grep -rn "SERVICE_ROLE\|service_role" . \
  --exclude-dir=node_modules --exclude-dir=.git \
  --include="*.ts" --include="*.js" --include="*.env*" --include="*.json"
```

```markdown
## DECISIONS.md — 2026-06-XX — [security] secrets audit

**Projetos auditados:** [listar]
**Resultado gitleaks:** [achados ou "nenhum secret detectado"]
**SERVICE_ROLE_KEY OFICINA:** [status — exposto/contido/rotacionado]
**Projetos sem .gitignore adequado:** [listar]
**Ações imediatas:**
1. Revogar e rotacionar SERVICE_ROLE_KEY do OFICINA se necessário
2. Adicionar gitleaks como pre-commit hook em projetos AG
3. Criar .env.example em projetos que não têm

**Rotação programada:**
- [listar próximas datas de rotação dos secrets críticos]
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você gerencia secrets em projetos Node.js? E o que faz se descobrir que um secret vazou no repositório?"
>
> **R (30s):**
> "Secrets ficam em `.env` local, nunca commitados. `.gitignore` tem `.env*` antes do primeiro commit, e `.env.example` documenta as variáveis sem valores. Em produção, o arquivo `.env` fica no servidor com permissão `600`. Não uso Vault ainda — para time pequeno não compensa a operação. Se um secret vazar: primeira ação é revogar imediatamente no provider — a chave antiga para de funcionar na hora. Depois limpar o histórico git com `git filter-repo` e force push. Depois auditar logs do serviço para ver se houve uso malicioso. Rotacionar preventivamente a cada 6 meses."

> **P:** "O que é SERVICE_ROLE_KEY no Supabase e por que é perigoso?"
>
> **R (30s):**
> "É a chave de superusuário do Supabase — bypassa todas as políticas de RLS. Quem tem a chave pode ler e escrever qualquer dado de qualquer tenant sem restrição, via HTTPS de qualquer IP. É mais perigosa que a senha do banco porque não precisa de acesso de rede ao servidor. Deve ficar só no backend, nunca no bundle do frontend, e ser rotacionada a cada 6 meses ou imediatamente se houver suspeita de exposição."

---

## Checkpoint

- [ ] Todos os projetos AG têm `.env` em `.gitignore` e `.env.example` commitado
- [ ] Rodei gitleaks em pelo menos 1 projeto AG e analisei os resultados
- [ ] Sei o plano de contenção de secret vazado sem consultar (revogar → auditar → limpar → rotacionar)
- [ ] Documentei o status do SERVICE_ROLE_KEY do OFICINA e a ação tomada
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [gitleaks](https://github.com/gitleaks/gitleaks) — scanner de secrets, instalação e uso
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase — API keys](https://supabase.com/docs/guides/api/api-keys) — diferença entre ANON_KEY e SERVICE_ROLE_KEY
- [Doppler](https://www.doppler.com/) — gerenciador de secrets SaaS com free tier
- Uber breach 2022: [relatório SEC](https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=uber) e cobertura no Krebs on Security
