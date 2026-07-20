# 05 — E2E com Playwright

## O que é

**Playwright** (Microsoft, 2020, dos engenheiros do Puppeteer) automatiza navegadores reais — Chromium, Firefox e WebKit — pra testar o app como o usuário o vê: URL, clique, digitação, assert no que está na tela. É a única camada que prova o fluxo inteiro: React renderizou, o fetch saiu, o RLS deixou passar, o dado voltou pra tela. Superou o Cypress por três motivos: roda os 3 engines, paraleliza de verdade, e o **auto-waiting** — cada ação espera o elemento estar visível, estável e habilitado antes de agir, matando a era do `sleep(3000)`.

O custo, dito com honestidade: e2e é a camada **mais cara por teste**. Dezenas de segundos por fluxo, depende de app buildado + banco com estado conhecido, e quebra por motivos que não são bug (dado residual, latência, animação). A conta de sênior: e2e vale onde **(custo da quebra em prod × chance de quebrar) supera o custo de manter o teste** — login, fluxo de dinheiro, troca de tenant. Um smoke de 5 fluxos em 2 min protege mais que 80 testes que o time desliga no terceiro flaky. Caso AG que só e2e pegaria: a divergência entre dois dashboards do mesmo cliente — só a camada que abre os DOIS apps e compara o número na tela prova consistência.

### Passo a passo: login + CRUD num app AG

```bash
cd C:\Projetos\dashboard-varejo   # codinome Cliente Varejo
npm init playwright@latest        # cria playwright.config.ts + e2e/
```

`playwright.config.ts` — o `webServer` sobe o app sozinho no CI:

```ts
export default defineConfig({
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173' },
});
```

`e2e/login-e-crud.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('login e criação de lançamento', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(process.env.E2E_USER!);
  await page.getByLabel('Senha').fill(process.env.E2E_PASS!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible();

  await page.getByRole('button', { name: 'Novo lançamento' }).click();
  await page.getByLabel('Descrição').fill('Venda e2e');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('cell', { name: 'Venda e2e' })).toBeVisible();
});
```

```bash
npx playwright test            # headless
npx playwright test --ui       # modo interativo
```

Três disciplinas que separam suíte estável de suíte flaky:

1. **Seletores por papel** (`getByRole`, `getByLabel`), não por CSS — sobrevivem a redesign e forçam acessibilidade de graça. Último recurso: `data-testid`.
2. **Credencial via env/secret**, usuário dedicado num ambiente de teste — nunca conta real, nunca senha no código, nunca contra prod (e2e escreve no banco).
3. **Estado conhecido**: teste que cria dado limpa depois (ou a suíte roda sobre banco resetado por seed). Depender do lixo do teste anterior é flaky por construção.

### Trace viewer: o debugger do e2e

Com `trace: 'on-first-retry'`, cada falha gera um `trace.zip`: filme do teste com screenshot de cada passo, DOM navegável, console e requests de rede. `npx playwright show-trace trace.zip` abre a linha do tempo. É a diferença entre "falhou no CI, não reproduzo local" e ver exatamente qual request voltou 500. No CI, publique o trace como artifact do job.

## Por que cai em entrevista

E2E é onde o entrevistador testa seu senso de custo: júnior empolgado quer e2e de tudo; pleno sabe que suíte e2e grande apodrece. "Quantos testes e2e você teria?" com resposta pequena e critério explícito impressiona mais que "cobertura total".

> **P:** "Como você decide o que merece teste e2e?"
>
> **R (30s):** "Pelo custo da quebra, não pela facilidade de testar. E2E é a camada mais cara — lenta, exige estado conhecido, quebra por motivo que não é bug — então reservo pros fluxos onde produção quebrada custa caro: login, lançamento de dinheiro, isolamento entre tenants. Uso Playwright com seletores por role, credencial de teste via secret e trace ligado no retry. Minha meta é um smoke de meia dúzia de fluxos em poucos minutos no CI, não oitenta testes que o time aprende a ignorar."

## Checkpoint

- [ ] Instalei Playwright num app real e o `webServer` sobe o app sozinho no teste
- [ ] Tenho e2e de login + 1 CRUD passando, com seletores `getByRole`/`getByLabel`
- [ ] Credencial de e2e vem de env var e aponta pra ambiente de teste, não prod
- [ ] Provoquei uma falha, abri o trace no viewer e achei o passo exato que quebrou
- [ ] Sei defender em 1 frase quais fluxos do meu app merecem e2e e quais não

## Recursos

- [Playwright — docs oficiais](https://playwright.dev/)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Best Practices — Playwright](https://playwright.dev/docs/best-practices) — ler a seção de seletores
- [Playwright no CI](https://playwright.dev/docs/ci) — receita pronta de GitHub Actions
