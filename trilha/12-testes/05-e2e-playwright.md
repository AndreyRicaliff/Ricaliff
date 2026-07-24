# 05 — E2E com Playwright

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

E2E (end-to-end) é a única camada que prova o **fluxo inteiro** do usuário: React renderizou, o fetch saiu, o RLS deixou passar, o dado voltou pra tela. **Playwright** (Microsoft, 2020) é a ferramenta; mas o miolo do módulo não é a API — é o **senso de custo**. E2E é a camada mais cara e mais flaky da pirâmide, e o erro do júnior empolgado é querer e2e de tudo. O aprendizado aqui é *quando o custo se paga* e as três disciplinas que separam suíte estável de suíte que o time desliga.

---

## § BASE — o fundamento

**O que só o e2e prova — e por que isso custa.** Todo teste abaixo do topo prova uma **parte**: o unit prova a lógica, o de integração prova o contrato com o banco. Nenhum prova que, quando o usuário clica em "Entrar", ele *entra* — que a fiação inteira (roteamento, render, fetch, auth, RLS, resposta, re-render) funciona junta. Só o e2e exercita o sistema como o usuário o vê. Essa fidelidade máxima é o valor; e é inseparável do custo máximo. E2E depende de app buildado + banco com estado conhecido, roda em dezenas de segundos por fluxo, e **quebra por motivos que não são bug**: dado residual, latência, animação, seletor mudado num redesign.

**A conta de sênior — e o dado que a sustenta.** A regra econômica: e2e vale onde **(custo da quebra em prod × chance de quebrar) supera o custo de manter o teste**. Login, fluxo de dinheiro, troca de tenant entram; a cor de um badge não. O **Google Testing Blog**, em *Just Say No to More End-to-End Tests* (Mike Wacker, 2015), documentou o modo de falha do excesso: a equipe de exemplo tinha uma suíte e2e que, de tão lenta e flaky, quase nunca ficava verde — e o time acabava validando manualmente de qualquer jeito. A lição, na frase do post: um **smoke pequeno e confiável** protege mais do que uma suíte e2e grande e ignorada. É o mesmo argumento anti-cone-de-sorvete do módulo 01, visto do topo.

**Por que Playwright, tecnicamente.** Playwright foi criado por engenheiros que vieram do time do Puppeteer, e superou o Cypress por três razões concretas: roda os **três engines** (Chromium, Firefox, WebKit), **paraleliza** de verdade, e traz o **auto-waiting**. Este último é o que mata a era do `sleep(3000)`: antes de cada ação, o Playwright roda **actionability checks** — espera o elemento estar **visível, estável (parou de animar), habilitado, recebendo eventos e não obscurecido** — e só então age. A espera é sobre a **condição real**, não sobre um relógio arbitrário. Isso ataca a raiz do flaky de e2e, que **Martin Fowler** analisa em *Eradicating Non-Determinism in Tests*: a maior fonte de não-determinismo em teste de UI é a espera por tempo em vez de espera por estado.

**As três disciplinas anti-flaky (por que cada uma existe).**
1. **Seletor por papel, não por CSS.** `getByRole`/`getByLabel` sobrevivem a redesign (a classe muda, o papel "button/Entrar" não) e forçam acessibilidade de graça — se o Playwright não acha o elemento por papel, provavelmente falta um label que o leitor de tela também precisaria. `data-testid` é último recurso.
2. **Credencial via env/secret, ambiente de teste, nunca prod.** E2E **escreve** no banco; rodar contra produção suja dados reais. Usuário dedicado, senha fora do código.
3. **Estado conhecido.** Teste que cria dado limpa depois, ou a suíte roda sobre banco resetado por seed. Depender do lixo do teste anterior é **flaky por construção** — a ideia de teste **hermético** (isolado do estado dos outros), que a cultura de testes do Google formalizou.

**O trace: transformar "não reproduzo" em evidência.** Com `trace: 'on-first-retry'`, cada falha gera um `trace.zip` — um filme do teste com screenshot de cada passo, DOM navegável, console e requests. É a diferença entre "falhou no CI, não reproduzo local" e *ver* qual request voltou 500. É o instrumento que aplica ao e2e o princípio da casa: provar por evidência do alvo certo, não por suposição (skill `alvo-certo`).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O e2e é o único teste que percorre a coluna inteira; por isso é o mais caro e o que exige mais disciplina de ambiente:

```
   O QUE SÓ O E2E EXERCITA (a coluna inteira)
   ┌─────────────────────────────────────────────┐
   │ [navegador real]  clique / digita             │  ← Playwright dirige
   │        ▼                                       │
   │ React render → fetch → auth/JWT → RLS → banco  │  ← unit/integração
   │        ▲                                       │     só provam PEDAÇOS
   │        └──── dado volta → re-render → tela ─────┤
   └─────────────────────────────────────────────┘
        custo ↑↑   fidelidade ↑↑   flakiness ↑↑

   AS 3 DISCIPLINAS (cada uma mata uma classe de flaky)
   ┌────────────────────┬──────────────────────────────────┐
   │ seletor por papel  │ redesign não quebra; a11y de graça │
   │ credencial de teste│ e2e ESCREVE — nunca prod, nunca real│
   │ estado conhecido   │ seed/reset → teste hermético        │
   └────────────────────┴──────────────────────────────────┘

   auto-waiting  = espera a CONDIÇÃO (visível/estável/habilitado), não o relógio
   trace viewer  = a falha vira filme navegável (o debugger do e2e)
```

A dependência prática: sem **ambiente de teste com estado conhecido** o e2e é flaky por construção; sobre esse ambiente, **auto-waiting + seletor semântico** dão estabilidade; e o **trace** é o que torna a falha diagnosticável quando mesmo assim quebra.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LISTAR os fluxos que derrubam o cliente** — login, lançamento de dinheiro, troca de tenant, sync. Meia dúzia, não oitenta.

**2. APONTAR pra ambiente de teste** com banco de estado conhecido (seed/reset), nunca prod. Credencial via secret.

**3. ESCREVER cada fluxo com seletor por papel** (`getByRole`/`getByLabel`), deixando o auto-waiting cuidar da espera — zero `sleep`.

**4. LIGAR o trace no retry** (`trace: 'on-first-retry'`) para toda falha nascer com evidência navegável.

**5. RODAR no CI como smoke** de poucos minutos, publicando o trace da falha como artifact.

**Anti-padrões:**
- **E2E de tudo:** a suíte grande apodrece — lenta, flaky, ignorada (o caso do Google). Reserve para o custo-de-quebra alto.
- **`waitForTimeout(3000)`:** espera por relógio em vez de estado; fonte número um de flaky (Fowler). Use `expect(...).toBeVisible()`.
- **Seletor CSS frágil** (`.btn-primary > span:nth-child(2)`): quebra no primeiro redesign. Papel primeiro, `data-testid` só em último caso.
- **Rodar contra produção:** e2e escreve no banco; suja dado real e pode disparar efeito colateral. Ambiente de teste, sempre.
- **Depender do dado do teste anterior:** flaky por construção; cada teste arruma o próprio cenário.

---

## Passo-a-passo aplicado (faça agora, ~30min)

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

Repare que não há um único `sleep`: cada `expect(...).toBeVisible()` deixa o auto-waiting esperar a condição. Depois, **provoque uma falha de propósito** (mude o nome de um botão), rode, e abra o trace: `npx playwright show-trace trace.zip`. Ache o passo exato onde quebrou — é a prova de que você sabe diagnosticar, não só rodar. No CI, publique o `trace.zip` como artifact do job (módulo 07).

## Por que cai em entrevista

E2E é onde o entrevistador testa seu senso de custo: júnior empolgado quer e2e de tudo; pleno sabe que suíte e2e grande apodrece. "Quantos testes e2e você teria?" com resposta pequena e critério explícito impressiona mais que "cobertura total".

> **P:** "Como você decide o que merece teste e2e?"
>
> **R (30s):** "Pelo custo da quebra, não pela facilidade de testar. E2E é a camada mais cara — lenta, exige estado conhecido, quebra por motivo que não é bug — então reservo pros fluxos onde produção quebrada custa caro: login, lançamento de dinheiro, isolamento entre tenants. Uso Playwright com seletores por role, credencial de teste via secret e trace ligado no retry. Minha meta é um smoke de meia dúzia de fluxos em poucos minutos no CI, não oitenta testes que o time aprende a ignorar."

> **P:** "Seus testes de e2e falham de vez em quando sem mudança no código. Como você ataca isso?"
>
> **R (30s):** "A causa número um é espera por tempo em vez de espera por estado — aquele `sleep(3000)` que às vezes não basta. O Playwright resolve na raiz com auto-waiting: antes de cada ação ele checa que o elemento está visível, estável e habilitado, então eu troco todo sleep por `expect(...).toBeVisible()`. As outras causas clássicas são dado residual entre testes — que eu mato com seed/reset pra cada teste ser hermético — e relógio ou rede reais. E ligo o trace no retry: a falha vira um filme navegável com o request que voltou 500, então paro de chutar. É o mesmo diagnóstico que o Fowler descreve em 'Eradicating Non-Determinism in Tests'."

## Checkpoint

- [ ] Instalei Playwright num app real e o `webServer` sobe o app sozinho no teste
- [ ] Tenho e2e de login + 1 CRUD passando, com seletores `getByRole`/`getByLabel` e zero `sleep`
- [ ] Sei explicar o auto-waiting (actionability checks) e por que ele mata o flaky de espera
- [ ] Credencial de e2e vem de env var e aponta pra ambiente de teste, não prod
- [ ] Provoquei uma falha, abri o trace no viewer e achei o passo exato que quebrou
- [ ] Sei defender em 1 frase quais fluxos do meu app merecem e2e e quais não

## Recursos

- Google Testing Blog — *Just Say No to More End-to-End Tests* (Mike Wacker, 2015): o custo/flakiness do topo da pirâmide e o smoke pequeno como alternativa
- Martin Fowler — *Eradicating Non-Determinism in Tests* (ensaio): a espera por tempo como fonte número um de flaky
- Playwright — docs oficiais (playwright.dev): "Writing tests", "Locators", "Auto-waiting" e "Best Practices" — leitura obrigatória do módulo (SYLLABUS)
- Playwright — "Trace Viewer" e "Continuous Integration" (playwright.dev/docs): o debugger do e2e e a receita de CI
