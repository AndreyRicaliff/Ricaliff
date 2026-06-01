# 05 — ADRs: Architecture Decision Records

## O que é

ADR é um documento curto que registra uma decisão arquitetural: o contexto, as opções consideradas, a decisão tomada e as consequências esperadas. Não é burocracia — é memória técnica. Seis meses depois, quando alguém (você mesmo) perguntar "por que fizemos isso?", o ADR é a resposta.

O formato importa menos que o hábito. O PULSAR-RH já tem `DECISIONS.md` com entradas nesse formato. Cada entrada tem: problema, opções, decisão, por quê, consequências, e como explicar em entrevista. Isso é ADR-leve — sem template MADR formal, sem número sequencial, mas com a informação que importa.

```markdown
## 2026-05-06 — [segurança] Multi-tenancy via RLS no Postgres

**Problema:** múltiplos clientes no mesmo banco...
**Opções consideradas:**
- A: RLS no Postgres
- B: Middleware na API
**Decisão:** RLS.
**Por quê:** isolamento no banco não depende de código correto...
**Consequências:** RPCs SECURITY DEFINER...
**Como explicar em entrevista (30s):** ...
```

O que torna isso valioso não é o formato — é a **data** e o **contexto de então**. Reler um ADR de 2026-04 em 2027 te mostra o que você sabia, o que não sabia, e se a decisão envelheceu bem.

---

## Por que cai em entrevista

Mostra maturidade técnica. Dev júnior faz. Dev que pensa em engenharia documenta a decisão.

- "Como você toma decisões técnicas no dia a dia?"
- "Você já reverteu uma decisão técnica? O que aconteceu?"
- "Como você garante que o próximo dev vai entender por que o código é assim?"
- "O que é ADR? Você usa alguma forma de documentar decisões?"
- "Você já precisou defender uma escolha técnica para o time? Como foi?"

---

## Trade-offs (quando usar X vs Y)

| Abordagem | Quando faz sentido | Custo |
|---|---|---|
| ADR no DECISIONS.md do repo | Projeto solo ou time pequeno — decisões técnicas são poucas | Manutenção manual; fácil de deixar de atualizar |
| MADR formal (Markdown ADR) | Time com disciplina; processo de revisão de PR que inclui ADR | Overhead de template; adequado para equipes maiores |
| RFC (Request for Comments) | Decisão grande com impacto cross-team; precisa de aprovação | Processo longo; overkill para decisão de 1 dev |
| Comentário no código | Decisão local e tática ("por que esse workaround") | Não é encontrável quando a pergunta é sobre o sistema todo |
| Sem documentação | Nunca — "o código documenta" é mito para decisões de contexto | Custo: reexplicar cada vez, risco de reverter sem saber por quê |

**Por que datar:** a data contextualiza o estado do arte. Uma decisão de 2024 tomada quando Redis tinha limitações que 2026 resolveu parece errada hoje — mas era certa então. Sem data, você não sabe o que priorizar ao reler.

**Regra de bolso:** escreva ADR quando a decisão tem trade-off real (duas opções válidas e você escolheu uma) ou quando vai gerar surpresa para quem ler o código sem contexto.

---

## Exercício aplicado (projeto AG real)

O PULSAR-RH tem `DECISIONS.md` com pelo menos 5 entradas reais. Vamos ler, simular entrevista e escrever um ADR novo.

### Passo a passo

1. **Ler as 3 primeiras entradas do PULSAR-RH:**
   ```bash
   head -120 ~/projetos/PULSAR-RH/DECISIONS.md
   ```

2. **Para cada entrada, responda em voz alta (sem olhar):**
   - Qual era o problema?
   - Por que a outra opção foi descartada?
   - Qual a consequência negativa da decisão tomada?

   Isso simula a pergunta de entrevista "me fala sobre uma decisão técnica difícil que você tomou".

3. **Identificar uma decisão recente que NÃO tem ADR:**
   ```bash
   git -C ~/projetos/meet-hub log --oneline -20
   ```
   Procure commits que sugerem decisão (ex: "feat: add SSE", "chore: add Bull queue"). Existe ADR correspondente?

4. **Escrever um ADR real para o Meet Hub** sobre a escolha de Bull + Redis para queue:
   ```bash
   cat >> ~/projetos/meet-hub/DECISIONS.md << 'EOF'
   
   ## 2026-06-XX — [infra] Bull + Redis para queue de jobs de bot
   
   **Problema:** gravar reunião leva 5-15 minutos — não dá para manter HTTP aberto esperando.
   **Opções consideradas:**
   - A: Bull + Redis — queue persistente, retry automático, painel de monitoramento
   - B: resposta assíncrona com polling (cliente pergunta a cada X segundos) — sem infra extra, mas carga desnecessária e latência de X segundos
   - C: WebSocket para notificar quando terminar — mais complexo, mesmo problema de processo longo
   **Decisão:** Bull + Redis.
   **Por quê:** o job de bot pode falhar no meio e precisa ser retentado sem perder o contexto. Bull persiste o job no Redis — se o worker morrer, o job sobrevive e é retomado. SSE notifica o front quando termina.
   **Consequências:** Redis virou dependência de infra (custo + mais um serviço pra monitorar). Se Redis cair, novos jobs param de ser aceitos.
   **Sinal para reavaliar:** se migrar para plataforma sem Redis (ex: Vercel Functions sem estado), precisaria de alternativa (ex: SQS, Inngest).
   **Como explicar em entrevista (30s):**
   > "Usei Bull + Redis para processar gravações porque a operação leva minutos — manter HTTP aberto não é opção. Com Bull, a rota só enfileira o job e retorna 201 imediatamente. O worker processa quando pode, e SSE notifica o front quando termina. Redis persiste o job: se o worker morrer no meio, o job volta pra fila automaticamente."
   EOF
   ```

5. **Confirmar que foi registrado:**
   ```bash
   tail -30 ~/projetos/meet-hub/DECISIONS.md
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você documenta decisões técnicas no seu dia a dia?"
>
> **R (30s):**
> "Uso um arquivo `DECISIONS.md` em cada projeto com entradas datadas. Cada entrada tem: o problema, as opções que considerei, a decisão, o porquê e as consequências esperadas. No PULSAR-RH, tenho decisões de stack, de segurança, de frontend — todas datadas. Isso me permite reler 6 meses depois e entender se a decisão ainda faz sentido dado o que aprendi. Em entrevista, consigo defender qualquer escolha porque está documentado o raciocínio, não só o resultado."

> **P:** "Me fala de uma decisão técnica difícil que você tomou."
>
> **R (30s):**
> "No PULSAR-RH, decidi usar RLS no Postgres para multi-tenancy em vez de filtrar no middleware. A alternativa era mais fácil de implementar, mas isolamento no código depende de código correto — um bug pode vazar dados entre clientes. RLS no banco é uma garantia que não depende de eu escrever o filtro certo em cada query. O custo foi que operações de escrita precisaram de RPCs com SECURITY DEFINER, que têm superfície de ataque. Documentei esse trade-off no DECISIONS.md e considero que valeu."

---

## Checkpoint

- [ ] Li as 3 primeiras entradas do `PULSAR-RH/DECISIONS.md` e consegui recitar o trade-off de cada uma
- [ ] Escrevi um ADR real no `meet-hub/DECISIONS.md` com problema/opções/decisão/consequências
- [ ] Entendo por que datar a decisão é importante
- [ ] Sei a diferença entre ADR e RFC e quando usar cada um
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — ADRs dominado`.

---

## Recursos

- Michael Nygard — [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (o post original — 5 min)
- MADR — [Markdown Any Decision Records](https://adr.github.io/madr/) (template mais formal)
- Código real: `~/projetos/PULSAR-RH/DECISIONS.md` — ADRs reais datados
- Código real: `~/projetos/meet-hub/DECISIONS.md` — ADRs do Meet Hub
