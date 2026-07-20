# 07 — Documentar Decisões

## O que é

ADR — *Architecture Decision Record* — é o formato proposto por **Michael Nygard (2011)** para registrar decisões técnicas não-triviais: um bloco curto com contexto, decisão e consequências, versionado JUNTO do código. A tese: código mostra O QUE foi feito, mas o **porquê** evapora em semanas — e o porquê é o que o próximo dev (ou a IA) precisa pra não desfazer por engano uma decisão com motivo. Sem registro, o projeto herda "medo arqueológico": ninguém mexe porque não se sabe o que é intencional e o que é acidente.

**Decisão não-trivial** (o filtro que evita burocracia): stack/lib/padrão, trade-off entre caminhos viáveis, workaround que cria dívida, mudança de schema, abstração estrutural. **NÃO é**: rename, typo, bump, formatação. Regra de bolso: se em 6 meses alguém pode perguntar "por que isso é assim?" — registra; senão, não.

### ADR leve: o formato AG (DECISIONS.md por projeto)

Um arquivo por repo, um bloco por decisão, no commit da mudança:

```markdown
## 2026-06-14 — [sync] Lockfile em vez de fila para o sync do ERP-externo
**Problema:** execuções simultâneas do sync duplicavam registros.
**Opções:** (A) fila de jobs; (B) lockfile com timeout; (C) idempotência total.
**Decisão:** B — lockfile com timeout de 10 min.
**Por quê:** A exige infra nova pra um cron de 1x/h; C é o ideal, mas custa
refactor do pipeline inteiro — vira dívida registrada, não bloqueio.
**Consequências:** processo morrendo com o lock preso = sync pausa até 10 min.
**Em entrevista (30s):** "Corrida entre execuções de sync; comparei fila,
lockfile e idempotência; escolhi lockfile por custo — sei o que troco:
até 10 min de pausa no pior caso."
```

O que faz o formato funcionar: **opções rejeitadas ficam registradas** (decisão sem alternativa é só descrição); **consequências incluem o lado ruim** (registro que só elogia a própria escolha é propaganda, não engenharia); e o campo **"Em entrevista (30s)" nasce em primeira pessoa** — na entrevista você não improvisa a defesa, recita a que escreveu com calma.

### A defesa em entrevista nasce aqui

O salto júnior→pleno não se prova listando tecnologias — se prova **defendendo decisões**: "escolhi X em vez de Y porque Z, e aceitei o custo W". Esse repertório não se constrói na véspera; acumula um bloco por vez, no dia da decisão, com o trade-off fresco. DECISIONS.md é o gerador do seu material de entrevista: 20 blocos = 20 respostas prontas, com evidência versionada no git.

### Passo a passo: recuperar decisões perdidas de um projeto AG

```bash
cd C:\Projetos\pulsar-finance
# 1. Arqueologia: os commits que mudaram direção
git log --oneline --all | grep -iE "refactor|migra|troca|substitui" | head -20

# 2. Para 3 decisões que você LEMBRA o porquê (ex.: fórmulas do DRE/DFC
#    no banco vs no front), escrever o bloco retroativo — marcado como tal:
```

```markdown
## 2026-07-19 — [retroativo, ~2026-05] [dre] Fórmulas do DRE no banco
**Problema:** fórmula no front divergia entre telas...
```

```bash
# 3. Commitar e adotar a regra dali em diante: decisão nova = bloco novo
git add DECISIONS.md && git commit -m "docs: recupera decisoes em DECISIONS.md"
```

No retroativo, honestidade: se não lembra o porquê real, escreva "motivo não registrado — hipótese atual: ..." em vez de inventar. Registro falso é pior que lacuna: contamina a confiança nos demais blocos.

## Por que cai em entrevista

"Por que você escolheu essa abordagem?" é A pergunta de toda entrevista técnica. Quem tem ADRs responde problema → opções → trade-off → consequência aceita, com naturalidade — porque já escreveu essa resposta. Quem não tem responde "era o que eu conhecia", e a conversa acaba ali.

> **P:** "Me conte uma decisão técnica difícil que você tomou e do que abriu mão."
>
> **R (30s):** "No meu pipeline financeiro, execuções simultâneas de sync duplicavam registros. Comparei fila de jobs, lockfile e idempotência total. Escolhi lockfile com timeout — fila exigia infra nova pra um cron de 1x/h, e idempotência, o ideal, custava um refactor inteiro; virou dívida consciente. Abri mão de robustez máxima por custo proporcional ao risco. Está no DECISIONS.md do projeto, com as alternativas rejeitadas — posso mostrar."

## Checkpoint

- [ ] Sei explicar o que é ADR, quem propôs e qual problema resolve
- [ ] Aplico o filtro de não-trivialidade (3 exemplos que registram, 3 que não)
- [ ] Um projeto real meu tem DECISIONS.md com ≥ 3 blocos (com opções rejeitadas)
- [ ] Escrevi ao menos 1 bloco retroativo honesto (marcado como tal)
- [ ] Recitei uma defesa de decisão real em primeira pessoa em menos de 30s

## Recursos

- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — o post original
- [adr.github.io](https://adr.github.io/) — catálogo de formatos de ADR (MADR, Nygard, etc.)
- *The Staff Engineer's Path* — Tanya Reilly
- Repo "architecture-decision-record" (Joel Parker Henderson, GitHub) — exemplos
