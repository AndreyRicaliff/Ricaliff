# 03 — Estimativa Honesta

## O que é

Estimativa falha de forma **sistemática e previsível** — não por incompetência individual. Três causas documentadas:

**Falácia do planejamento** (Kahneman & Tversky, 1979): humanos estimam pelo melhor cenário mesmo tendo histórico de atrasos. O estudo clássico: estudantes estimaram terminar a tese em 34 dias; a média real foi 55. O antídoto de Kahneman é a **visão externa** (*reference class forecasting*): em vez de "quanto acho que ESTA tarefa leva?", perguntar "quanto tarefas PARECIDAS levaram de verdade?". Seu histórico de git é sua classe de referência — grátis e verificável.

**Incerteza composta**: 5 tarefas, cada uma com 80% de chance de sair no prazo → 0,8⁵ ≈ **33%** de chance de TODAS saírem no prazo. O projeto atrasa mesmo com cada estimativa individual "boa". Quanto mais tarefas encadeadas, mais o prazo total é dominado pela cauda, não pela média.

**Lei de Hofstadter**: "sempre leva mais tempo do que você espera, mesmo levando em conta a Lei de Hofstadter." Piada com fundo estatístico: distribuição de duração de tarefa tem cauda longa à direita — dá pra adiantar 20%, dá pra atrasar 400% (a dependência que não existia, o dado sujo do ERP-externo, o `prefers-reduced-motion` forçado pelo ambiente que congela a animação e come uma tarde de debug).

### Faixa em vez de número

Número único ("3 dias") comunica falsa precisão. Faixa comunica o que você realmente sabe:

> "**2 a 5 dias.** 2 se a API do ERP-externo se comportar como a doc diz; 5 se eu descobrir paginação ou rate-limit não documentado — já aconteceu nesse fornecedor."

A faixa embute a **hipótese** (API conforme doc) e o **risco nomeado** (comportamento não documentado). Isso é raciocínio de engenheiro: previsão + condições de refutação, não chute com cara de certeza.

### Buffer explícito, nunca escondido

Buffer escondido (inflar tudo em 50% em silêncio) destrói confiança quando descoberto e vira teto que o trabalho expande pra preencher (Lei de Parkinson). Buffer explícito é item de linha: "estimativa: 4 dias de trabalho + 1 dia de buffer de integração, porque o sync com ERP-externo historicamente revela surpresa". O cliente vê o risco precificado — e você ganha autoridade em vez de perder.

### Passo a passo: calibrar com o próprio histórico

```bash
# 1. Classe de referência barata: suas últimas features no Pulsar Finance
cd C:\Projetos\pulsar-finance
git log --oneline --since="3 months ago" -- src/ | wc -l

# 2. Para 5 features passadas, compare estimado × real (datas dos commits
#    da branch: primeiro commit ao merge)
git log --format="%ad %s" --date=short --first-parent
```

```markdown
# 3. Registrar num arquivo pessoal de calibração:
| feature            | estimei | levou | fator |
|--------------------|---------|-------|-------|
| pipeline DRE       | 3d      | 6d    | 2.0x  |
| filtro global      | 1d      | 1d    | 1.0x  |
| sync retry/backoff | 2d      | 5d    | 2.5x  |
# 4. Padrão a procurar: integração com sistema externo estoura;
#    trabalho só-front dentro do meu código não. Estime DIFERENTE cada tipo.
```

**Comunicar risco cedo**: no primeiro sinal de estouro ("descobri que o dado vem sujo"), avisar NA HORA com faixa revisada — não na véspera. Má notícia cedo é gestão; má notícia tarde é incêndio (módulo 05).

## Por que cai em entrevista

"Como você estima?" separa quem chuta de quem tem método. Citar falácia do planejamento e responder com faixa + risco nomeado demonstra maturidade que a maioria dos plenos não tem — e "não sei ainda, preciso de X horas de investigação pra estimar com responsabilidade" é resposta forte, não fraqueza.

> **P:** "Quanto tempo você levaria pra integrar um ERP novo?"
>
> **R (30s):** "Honestamente: não sei ainda — e um número agora seria chute. O que eu faço: meio dia de spike lendo a doc e batendo em 2 endpoints reais; aí dou uma faixa. Pelo meu histórico com integração de ERP, minhas estimativas nessa categoria estouram ~2x por surpresa não documentada — rate-limit, paginação, dado sujo — então eu já embuto buffer explícito de integração e aviso no primeiro sinal de estouro, não na véspera."

## Checkpoint

- [ ] Sei explicar a falácia do planejamento e a visão externa de Kahneman
- [ ] Sei demonstrar a conta da incerteza composta (0,8⁵ ≈ 33%)
- [ ] Montei minha tabela de calibração com ≥ 5 features reais (estimado × real)
- [ ] Minha última estimativa dada foi em faixa, com risco nomeado e buffer explícito
- [ ] Já respondi "não sei ainda, preciso de um spike" em vez de chutar — pelo menos 1x

## Recursos

- *Rápido e Devagar* — Daniel Kahneman (falácia do planejamento, visão externa)
- *Software Estimation: Demystifying the Black Art* — Steve McConnell (cone da incerteza)
- Lei de Hofstadter — *Gödel, Escher, Bach* (a origem da citação)
- [#NoEstimates — debate](https://martinfowler.com/bliki/PurposeOfEstimation.html) — Martin Fowler sobre PARA QUE estimar
