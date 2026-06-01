# 03 — CI/CD com GitHub Actions

## O que é

CI (Continuous Integration) é rodar verificações automáticas em todo push: lint, tipos, testes. CD (Continuous Delivery/Deployment) é fazer deploy automaticamente quando o CI passa. O GitHub Actions é a plataforma de CI/CD integrada ao GitHub — um arquivo YAML em `.github/workflows/` define o que roda, quando e em qual ambiente.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'          # cacheia node_modules entre runs

      - run: npm ci             # instala exatamente o que está no lockfile

      - run: npm run lint       # ESLint — falha aqui bloqueia o merge
      - run: npm run build      # TypeScript — erro de tipo bloqueia aqui
      - run: npm test           # testes — falha bloqueia

  deploy:
    needs: verify               # só roda se verify passar
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # só no push em main
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

**Secrets no GitHub:** variáveis sensíveis ficam em `Settings → Secrets and variables → Actions`. Você referencia com `${{ secrets.NOME }}` — o valor nunca aparece nos logs.

**Matrix:** rodar o mesmo job em múltiplas versões/sistemas:
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

---

## Por que cai em entrevista

- "Como você estruturaria um pipeline de CI/CD para esse projeto?"
- "O que deve bloquear um merge? O que não deve?"
- "Como você gerencia secrets num pipeline?"
- "Qual a diferença entre CI e CD?"
- "O que é um job e um step no GitHub Actions?"
- "Como você otimizaria um pipeline lento?"

---

## Trade-offs (quando usar X vs Y)

| Ferramenta | Quando | Custo |
|---|---|---|
| GitHub Actions | Projeto no GitHub, CI simples a médio | Gratuito para repos públicos; 2000 min/mês grátis em privados |
| CircleCI / Travis CI | Pipelines mais complexos com orbs | Custo mensal; migração se sair do GitHub |
| Jenkins | Controle total, infra própria, regras complexas | Servidor próprio para manter; configuração pesada |
| Vercel / Railway CI nativo | Deploy de frontend sem YAML | Menos controle; acoplado à plataforma |
| Sem CI | Projeto de estudo individual | Sem custo; sem proteção contra "funciona na minha máquina" |

**O que deve bloquear o merge:**
- `npm run build` com erro de TypeScript
- `npm run lint` com erro (não warning)
- Testes com falha
- Cobertura abaixo do threshold definido (se configurado)

**O que NÃO deve bloquear:**
- Warnings de lint (apenas erros bloqueiam)
- Cobertura de teste acima do threshold mínimo
- Jobs de deploy (CD nunca bloqueia PR — só CI bloqueia)

**Regra de bolso:** o pipeline precisa ser rápido (< 5 min) ou as pessoas vão fazer push diretamente em main. Cache de `node_modules` entre runs é o maior ganho de velocidade.

---

## Exercício aplicado (projeto AG real)

O PULSAR-RH não tem CI/CD configurado — qualquer push vai direto para o Vercel sem verificação. Vamos desenhar o pipeline ideal.

### Passo a passo

1. **Verificar se existe algum workflow:**
   ```bash
   ls ~/projetos/PULSAR-RH/.github/workflows/ 2>/dev/null || echo "sem workflows"
   ```

2. **Entender o que o PULSAR-RH tem para verificar:**
   ```bash
   cat ~/projetos/PULSAR-RH/package.json 2>/dev/null | grep -A 5 '"scripts"'
   ```
   Anote quais scripts existem: `lint`, `build`, `test`. Se não existirem, o CI vai precisar criá-los primeiro.

3. **Verificar como o Vercel faz o deploy hoje:**
   ```bash
   cat ~/projetos/PULSAR-RH/vercel.json 2>/dev/null
   ```
   O Vercel provavelmente está configurado para fazer deploy a cada push no GitHub via integração automática.

4. **Desenhar o pipeline no papel (não precisa criar o arquivo agora):**
   ```
   trigger: push em main, pull_request para main

   job: ci
   ├── checkout
   ├── setup-node@v4 (cache npm)
   ├── npm ci
   ├── npm run lint   → bloqueia se falhar
   └── npm run build  → bloqueia se TypeScript reclamar

   job: deploy (needs: ci, só se branch == main)
   ├── checkout
   └── vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
   ```

5. **Criar o workflow se o PULSAR-RH tiver scripts configurados:**
   ```bash
   mkdir -p ~/projetos/PULSAR-RH/.github/workflows
   ```
   Crie `.github/workflows/ci.yml` com o pipeline acima adaptado para o que o projeto tem.

6. **Verificar onde o VERCEL_TOKEN viria:**
   ```bash
   # Ver se existe .env com alguma referência ao Vercel
   grep -i "vercel\|VERCEL" ~/projetos/PULSAR-RH/.env.example 2>/dev/null
   ```
   O token do Vercel fica em `Settings → Secrets` do repositório GitHub — nunca em `.env`.

7. **Registrar em `~/projetos/PULSAR-RH/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [infra] Pipeline CI/CD para PULSAR-RH

   **Problema:** push em main vai direto pro Vercel sem verificação — erro de TypeScript chega em produção.
   **Decisão:** adicionar GitHub Actions com CI (lint + build) antes de deploy.
   **Jobs:** ci → deploy (sequencial; CD só roda se CI passar).
   **Secrets necessários:** VERCEL_TOKEN no GitHub Secrets.
   **Como explicar em entrevista (30s):**
   > "O PULSAR-RH não tinha CI — push ia direto pro Vercel. Adicionei GitHub Actions com dois jobs: CI roda lint e build TypeScript; CD roda o deploy Vercel só se o CI passou. Qualquer erro de tipo bloqueia o deploy antes de chegar em produção."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você estruturaria um pipeline de CI/CD básico para um projeto Node+TypeScript no Vercel?"
>
> **R (30s):**
> "Dois jobs sequenciais. O primeiro é CI: checkout, setup-node com cache de npm, `npm ci` para instalar o lockfile, lint e build TypeScript. Se qualquer um falhar, o pipeline para. O segundo é CD: só roda se o CI passou E é um push em main — nunca num PR. Executa o deploy no Vercel com o token em secret do repositório.
>
> O que bloqueia merge: lint com erro e build com erro de tipo. O que não bloqueia: warnings e o job de deploy. Cache de node_modules entre runs é o que faz o pipeline caber em 3 minutos."

> **P:** "Como você gerencia secrets num pipeline de CI?"
>
> **R (30s):**
> "No GitHub, secrets ficam em `Settings → Secrets and variables → Actions`. Você referencia no YAML com `${{ secrets.NOME_DO_SECRET }}`. O GitHub mascara automaticamente o valor em qualquer output de log — mesmo que você tente fazer `echo ${{ secrets.TOKEN }}`, aparece `***`. O token nunca vai para o código, nunca para o git. A única coisa que você commita é o nome da variável."

---

## Checkpoint

- [ ] Sei o que é CI e o que é CD e a diferença entre os dois
- [ ] Verifiquei se o PULSAR-RH tem workflows configurados
- [ ] Desenhei (no papel ou em arquivo) o pipeline CI/CD para o PULSAR-RH
- [ ] Sei como configurar secrets no GitHub e referenciá-los no YAML
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — CI/CD GitHub Actions dominado`.

---

## Recursos

- GitHub Actions docs — [Quickstart](https://docs.github.com/en/actions/quickstart)
- GitHub Actions docs — [Caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- Vercel docs — [Deploy with GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- Código real: `~/projetos/PULSAR-RH/vercel.json` — configuração de deploy atual
