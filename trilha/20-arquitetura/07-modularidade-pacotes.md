# 07 — Modularidade e Pacotes

## O que é

Modularidade é a arte de dividir código em unidades com limites claros. Monorepo é uma estratégia de organização onde múltiplos projetos vivem no mesmo repositório git mas mantêm independência de build e deploy. O meet-hub é um monorepo real: `apps/api`, `apps/web`, `apps/bot` no mesmo repo, mas cada um com seu `package.json`, seu `Dockerfile` e seu processo de build separado.

```
Polyrepo (um repo por projeto):
  repo/meet-hub-api      → build/deploy independente
  repo/meet-hub-web      → build/deploy independente
  repo/meet-hub-bot      → build/deploy independente
  Problema: como compartilhar tipos? Como mudar a API e o front ao mesmo tempo?

Monorepo (tudo junto):
  meet-hub/
  ├── apps/api/          → package.json próprio, build próprio
  ├── apps/web/          → package.json próprio, build próprio
  ├── apps/bot/          → package.json próprio
  └── packages/shared/   → tipos e utils compartilhados entre apps
  Benefício: mudança em shared/ é visível para api/ e web/ no mesmo commit
```

```json
// package.json raiz do meet-hub — define workspaces
{
  "name": "meet-hub",
  "workspaces": ["apps/*", "packages/*"]
}
```

Com workspaces do npm/pnpm, `packages/shared` pode ser importado em `apps/api` como `import { Recording } from 'shared'` sem publicar no npm.

**Por que o CLIENTE OFICINA não é monorepo:** o OFICINA tem só um processo (`src/server.ts`, `src/services/`). Criar monorepo para uma app é overhead sem benefício. Monorepo paga quando há 2+ apps que precisam compartilhar código.

---

## Por que cai em entrevista

- "O que é monorepo? Quando você escolheria?"
- "Como você compartilha código entre projetos sem duplicar?"
- "Conhece Turborepo ou Nx? Para que serve?"
- "Diferença entre `pnpm workspaces` e `npm workspaces`?"
- "Como você evita que mudança em um pacote quebre outro sem você saber?"

---

## Trade-offs (quando usar X vs Y)

| Ferramenta | O que faz | Quando vale |
|---|---|---|
| npm workspaces | Gerencia symlinks entre packages locais | Monorepo simples, ≤5 pacotes, build linear |
| pnpm workspaces | Mesma coisa + deduplicação de deps na `node_modules` | Monorepo com muitos pacotes; economiza disco e instalação |
| Turborepo | Cache de build distribuído + pipeline de tasks | Monorepo com build lento; CI/CD que precisa ser mais rápido |
| Nx | Geração de código, cache, análise de dependências | Time grande com muitos projetos; precisa de scaffolding automático |
| Polyrepo | Um repo por projeto | Times totalmente independentes; projetos sem código compartilhado |

**Regra de bolso:**
- 1-2 apps sem código compartilhado → polyrepo
- 2-5 apps com tipos/utils compartilhados → monorepo com npm/pnpm workspaces
- 5+ apps com build lento em CI → adicionar Turborepo
- 20+ apps com múltiplos times → considerar Nx

**O que você nunca deve fazer:** copiar tipo de `apps/api/types.ts` para `apps/web/types.ts`. Isso é "pseudo-compartilhamento por copiar/colar" — as duas definições vão divergir.

---

## Exercício aplicado (projeto AG real)

O Meet Hub tem `packages/` mas vamos verificar o que existe lá e se está sendo usado corretamente.

### Passo a passo

1. **Verificar o que existe em packages/:**
   ```bash
   ls ~/projetos/meet-hub/packages/
   find ~/projetos/meet-hub/packages/ -name "*.ts" | head -20
   ```

2. **Verificar se apps importam de packages/:**
   ```bash
   grep -rn "from 'shared'\|from '@meet-hub" ~/projetos/meet-hub/apps/ --include="*.ts" | head -10
   ```
   Se não importa nada de `packages/`, o monorepo não está sendo usado — as apps podem estar duplicando tipos.

3. **Identificar tipos duplicados entre apps:**
   ```bash
   grep -rn "interface Recording\|type Recording" ~/projetos/meet-hub/apps/ --include="*.ts"
   ```
   Se `Recording` aparece em `apps/api` e `apps/web` separados, é divergência esperando para acontecer.

4. **Verificar o workspace config:**
   ```bash
   cat ~/projetos/meet-hub/package.json
   ```
   Confirme que `"workspaces": ["apps/*", "packages/*"]` está configurado.

5. **Propor o que deveria estar em packages/shared:**
   Com base no que você encontrou, liste os tipos e utilitários que são usados tanto pela API quanto pelo front. Esses deveriam morar em `packages/shared/src/types.ts` e ser importados de ambos os lados.

6. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Monorepo Meet Hub: estado atual do packages/shared

   **Observação:** meet-hub é monorepo com npm workspaces, mas packages/shared pode não estar sendo usado.
   **Audit:**
   - tipos duplicados encontrados: [listar o que você encontrou]
   - imports de shared nos apps: [listar se existem]
   **Decisão:** [manter estado atual com debt registrado / extrair tipos para shared]
   **Motivo para ser monorepo:** mudança no schema Prisma (api) e atualização dos tipos do front podem ser feitas no mesmo commit — sem sincronização manual entre repos.
   **Por que OFICINA não é monorepo:** só uma app, zero compartilhamento — monorepo seria overhead.
   **Como explicar em entrevista (30s):**
   > "O Meet Hub é monorepo com npm workspaces porque tem API, front e bot que compartilham tipos. Mudança no schema do banco atualiza os tipos em todos no mesmo commit — sem sincronizar repos separados. O CLIENTE OFICINA é polyrepo porque é uma aplicação só — monorepo seria overhead sem ganho."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que é monorepo e quando você escolheria?"
>
> **R (30s):**
> "Monorepo é colocar múltiplos projetos no mesmo repositório git, mas com builds e deploys independentes. Escolho quando projetos precisam compartilhar código — tipos, utilitários, validações. No Meet Hub, API e front compartilham os tipos do domínio: se o tipo `Recording` muda na API, o front vê a mudança no mesmo commit, não precisa sincronizar dois repos.
>
> O custo é CI/CD mais complexo se você não tiver cache de build. Para 2-3 apps, npm workspaces resolve. Para 10+, Turborepo ou Nx adicionam cache e análise de dependência."

> **P:** "Como você evita que mudança num pacote interno quebre outro sem você saber?"
>
> **R (30s):**
> "Com TypeScript, a mudança de tipo em `packages/shared` já quebra em compile time nos apps que dependem dele — antes do CI rodar. Isso é o principal benefício. Se quiser mais rigor, adiciona um teste de integração que importa os tipos dos apps — qualquer breaking change vai aparecer ali. Em monorepos grandes, Nx e Turborepo têm análise de impacto: mostram quais apps são afetados por uma mudança em determinado pacote antes de você fazer o merge."

---

## Checkpoint

- [ ] Sei explicar a diferença entre monorepo e polyrepo com exemplo real
- [ ] Verifiquei se `packages/` do Meet Hub está sendo usado corretamente (com grep)
- [ ] Sei o que vai em `packages/shared` e o que fica em cada app
- [ ] Entendo quando Turborepo faz sentido vs. workspaces simples
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Modularidade e Monorepo dominado`.

---

## Recursos

- Turborepo — [Why Turborepo](https://turbo.build/repo/docs/core-concepts/monorepos) (explica o problema antes de vender a solução)
- pnpm — [Workspaces](https://pnpm.io/workspaces)
- Nx — [Why Nx](https://nx.dev/concepts/mental-model) (quando Turborepo não basta)
- Código real: `~/projetos/meet-hub/package.json` — workspaces config real
- Código real: `~/projetos/cliente-oficina-backend/` — polyrepo como contra-exemplo
