# 04 — Débito Técnico Gerenciado

## O que é

A metáfora é de **Ward Cunningham (OOPSLA, 1992)**: entregar código imperfeito é como tomar um empréstimo — acelera agora, mas cobra **juros**: cada vez que você toca aquela área, paga um extra em tempo, bugs e medo de mexer. Débito não é pecado; débito **invisível e sem gestão** é. Martin Fowler refina com o *Technical Debt Quadrant* — dois eixos:

- **Deliberado × inadvertido**: "sabemos que é gambiarra, prazo manda" × "não sabíamos fazer melhor".
- **Prudente × imprudente**: "atalho consciente com plano" × "não temos tempo pra design" (que sempre custa mais caro depois).

Débito **prudente-deliberado** é ferramenta legítima; **imprudente-inadvertido** é só código ruim. O trabalho do engenheiro é converter todo débito em prudente-deliberado: **registrado, datado, com contexto**.

### PENDENCIAS.md como sistema (o padrão AG)

Não é um TODO solto — é um contrato com regras:

1. **Item datado + contexto + ponteiro**: quando entrou, POR QUE foi aceito, e onde mora no código. Sem ponteiro, daqui a 3 meses ninguém acha; sem contexto, ninguém sabe se ainda vale.
2. **Resolver = apagar a linha NO MESMO COMMIT do fix**: o arquivo nunca mente sobre o estado atual. PENDENCIAS.md desatualizado é pior que nenhum: registro que afirma coisa falsa. Hábito sênior: nenhum artefato afirmando o que não se verificou.
3. **A revisão lê o arquivo no início**: item crítico (🔴) sobe direto pro relatório. O débito participa do ciclo, não hiberna.

```markdown
## PENDENCIAS.md — exemplo real de formato

- [2026-06-10] 🔴 Fórmula de faturamento duplicada em 2 telas (painel e
  relatório) — divergência já causou número diferente pro cliente.
  → src/lib/faturamento.ts vs src/pages/relatorio.tsx:114
- [2026-05-28] 🟡 Sync ERP-externo sem lockfile: duas execuções simultâneas
  duplicam registro. Aceito porque cron roda 1x/h; vira 🔴 se frequência subir.
  → supabase/functions/sync/index.ts
```

### Quando pagar: a regra do acúmulo de juros

Juros = frequência de toque × dor por toque. Regra prática:

- **Área tocada pela 3ª vez e o débito atrapalhou de novo → pagar agora**, antes da feature. Mesmo espírito da regra dos três: a 3ª ocorrência prova o padrão.
- **Débito que causou bug em produção → pagar já** — o juro virou principal.
- **Débito em código que ninguém toca há meses → deixar.** Juro de código parado é zero; refatorar código estável é pagar empréstimo sem juros — custo sem retorno, com risco de regressão.

### Quando aceitar pra sempre

Alguns débitos morrem de velhice, não de pagamento: workaround para limitação de ambiente (ex.: o `prefers-reduced-motion` forçado por acesso remoto que exigiu ignorar o flag nos decks — enquanto o ambiente for esse, o "débito" é a decisão certa), código de módulo que será desativado, atalho num one-off já entregue. O honesto é registrar como **decisão aceita** (DECISIONS.md, módulo 07), não fingir que um dia será "arrumado".

### Passo a passo: instalar o sistema num projeto AG

```bash
cd C:\Projetos\cliente-oficina   # oficina multi-loja
# 1. Varredura de débito implícito já confessado no código:
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"

# 2. Cada achado vira linha no PENDENCIAS.md (data + contexto + ponteiro)
#    ou é resolvido na hora se for < 10 min.
# 3. Commit atômico:
git add PENDENCIAS.md && git commit -m "chore: materializa debito tecnico em PENDENCIAS.md"
```

## Por que cai em entrevista

"Como você lida com débito técnico?" mede maturidade: júnior responde "refatoro tudo" (irreal) ou "ignoro" (irresponsável). Pleno responde com sistema — registro, critério de pagamento, critério de aceitação — e prova com artefato real.

> **P:** "Seu prazo aperta e você precisa cortar caminho. O que faz com a gambiarra?"
>
> **R (30s):** "Aceito o atalho conscientemente, mas ele nasce registrado: linha datada no PENDENCIAS.md com o porquê e o ponteiro pro arquivo. Minha regra de pagamento é juros: se toco a área pela terceira vez e o débito atrasa de novo, pago antes da feature; se causou bug em produção, pago já; se é código que ninguém toca, deixo — juro de código parado é zero. E quando resolvo, apago a linha no mesmo commit do fix, pra o registro nunca mentir."

## Checkpoint

- [ ] Sei explicar a metáfora de Cunningham e o quadrante de Fowler
- [ ] Um projeto real meu tem PENDENCIAS.md com itens datados + contexto + ponteiro
- [ ] Apliquei a regra "resolver = apagar a linha no mesmo commit" pelo menos 1x
- [ ] Sei citar um débito que decidi ACEITAR pra sempre, e por quê
- [ ] Recitei a resposta de entrevista em menos de 30s

## Recursos

- Ward Cunningham — "The WyCash Portfolio Management System" (OOPSLA '92, origem da metáfora)
- [Martin Fowler — Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
- [Martin Fowler — Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html)
- *Refactoring* — Martin Fowler (o COMO pagar, depois que o QUANDO está decidido)
