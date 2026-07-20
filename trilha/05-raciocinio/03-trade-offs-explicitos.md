# 03 — Trade-offs Explícitos

## O que é

Não existe decisão técnica grátis: toda escolha compra uma vantagem pagando um custo, e engenharia é a disciplina de escolher **qual custo aceitar de olhos abertos**. Júnior pergunta "qual é o melhor?"; sênior pergunta "melhor **em quê**, pagando **o quê**?". O CAP theorem é o exemplo formalizado: sob partição de rede, um sistema distribuído escolhe entre consistência e disponibilidade — não há terceira opção, só escolha consciente. Em escala menor, o mesmo vale para memoizar vs recalcular (memória vs CPU), monolito vs microsserviço (simplicidade vs autonomia de deploy), retry vs fila (simplicidade vs garantia).

E **"depende" sozinho é não-resposta**. A resposta de engenheiro tem a forma "depende de X: se X, então A; senão, B" — ela nomeia o critério decisivo. Quem não nomeia o critério não entendeu o trade-off; decorou que ele existe.

### O framework em 4 passos

1. **Opções A/B/C** — mínimo duas reais (se só existe uma, não há decisão a documentar)
2. **Critério decisivo** — a UMA variável que desempata neste contexto (volume? prazo? infra disponível? reversibilidade?)
3. **Decisão** — qual opção o critério escolhe
4. **Consequências aceitas** — o que você está deliberadamente pagando; escrever isso é o que evita o "por que não pensaram nisso?" seis meses depois

### ADR de 6 linhas

ADR (Architecture Decision Record, popularizado por Michael Nygard em 2011) é o registro imutável da decisão. A versão leve, que cabe em qualquer commit:

```markdown
## 2026-07-19 — [sync] Retry + lockfile em vez de fila
**Problema:** sync do ERP-externo falha sob rate-limit e duplica em execução concorrente.
**Opções:** A) retry+backoff+lockfile na edge function · B) fila (Redis/Bull) · C) cron ingênuo
**Decisão:** A.
**Por quê:** critério decisivo = infra disponível: sem servidor p/ Redis; volume (centenas de registros/dia) não justifica fila.
**Consequências:** sem escala horizontal do worker; lock órfão exige TTL; migrar p/ B se volume ×10.
**Em entrevista (30s):** "o mais simples que resolve o volume atual, com gatilho de migração escrito."
```

Caso real AG: foi exatamente essa a decisão no sync do **CLIENTE OFICINA** — retry com backoff exponencial + lockfile com TTL contra execução dupla. A fila era "mais certa" no abstrato; o critério decisivo (infra zero + volume baixo) escolheu o simples, e a consequência ficou registrada com gatilho de revisão.

### Passo a passo: praticar em decisão já tomada

```bash
# 1. Ache uma decisão implícita no seu projeto (lib, padrão, workaround)
git log --oneline -20
# 2. Crie DECISIONS.md na raiz (se faltar) e escreva o ADR de 6 linhas
# 3. Teste de qualidade: apague mentalmente a linha "Decisão".
#    Um colega chegaria à mesma escolha só com Problema + Opções + Critério?
#    Se não, o critério decisivo está mal nomeado — reescreva.
```

## Por que cai em entrevista

"Por que X e não Y?" é A pergunta que separa pleno de júnior — mais que qualquer pergunta de sintaxe. O entrevistador quase nunca discorda da sua escolha; ele mede se a escolha teve dono. Responder com critério + consequência aceita prova senioridade mesmo quando a escolha foi discutível.

> **P:** "Por que você usou retry com backoff em vez de uma fila de mensagens?"
>
> **R (30s):** "Critério decisivo: infra e volume. Eram centenas de registros por dia num sync de ERP e eu não tinha servidor para sustentar Redis — fila adicionaria uma peça de infra inteira para um problema que backoff exponencial mais lock com TTL resolve. Aceitei duas consequências, documentadas no ADR: não escala horizontal e lock órfão depende do TTL. E deixei o gatilho escrito: volume dez vezes maior, a decisão certa passa a ser fila. Não é 'fila é ruim' — é 'fila custa mais do que este problema paga'."

## Checkpoint

- [ ] Transformo "depende" em "depende de X: se X então A, senão B" em 3 decisões do meu stack
- [ ] Escrevi ≥ 1 ADR de 6 linhas num projeto real esta semana
- [ ] Toda opção da minha lista tem o CUSTO nomeado, não só a vantagem
- [ ] Passo no teste "apaga a decisão": o critério sozinho reconstrói a escolha
- [ ] Sei citar um trade-off formal (CAP) e um do dia a dia (memoizar vs recalcular)

## Recursos

- Documenting Architecture Decisions — Michael Nygard (2011), o post original dos ADRs
- [adr.github.io](https://adr.github.io/) — templates e ferramentas de ADR
- Designing Data-Intensive Applications — Martin Kleppmann (o livro inteiro é análise de trade-off)
- Módulo `20-arquitetura/05-adrs-architecture-decision-records.md` desta trilha — aprofunda o formato
