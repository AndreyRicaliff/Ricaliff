# 05 — Decompor Problemas

## O que é

Problema grande não se resolve — se corta. Decomposição é transformar "migrar o dashboard pra multi-tenant" (impossível de começar) em 6 subproblemas com critério de pronto cada um (impossível de NÃO começar). A técnica tem nome em gestão (WBS — Work Breakdown Structure; CPM — Critical Path Method) e, em software, o exemplo canônico é o **strangler fig** descrito por Martin Fowler: migrar sistema legado não em big-bang, mas fatia por fatia, cada fatia entregável e reversível.

O corte bom produz subproblemas **independentes**: dá pra atacar, testar e entregar um sem esperar o outro. Se toda fatia depende de toda fatia, você não decompôs — só fez uma lista.

### Os três eixos de corte

- **Por camada** (banco → API → front): natural, mas cria dependência em cadeia — o front espera a API que espera o banco.
- **Por fatia vertical** (feature completa fininha, da tabela ao botão): cada fatia é demo-ável; preferível quando dá.
- **Por risco**: a parte que você NÃO sabe fazer vai primeiro. Se a incerteza mora em "como a API do ERP-externo pagina?", um spike de 1h nessa pergunta vale mais que 3 dias de UI — falhar cedo é barato; falhar no fim é replanejamento inteiro.

### Ordem de ataque

1. Desenhe as dependências (rabisco de setas basta)
2. **Arriscado/desconhecido primeiro** (spike)
3. O caminho crítico — a corrente mais longa de dependências — define o prazo; tudo fora dele pode paralelizar
4. Bloqueou? **Bloqueador não para o resto**: anote a linha bloqueada + o que falta, ataque a próxima frente independente, reporte no final "fiz X e Y; Z bloqueado por W"

Ficar parado esperando resposta de terceiro é a forma mais cara de espera: você tinha 4 frentes e escolheu ter zero.

### Passo a passo: sanitizar um repo antes de abrir ao público (caso real AG)

Problema grande e vago: "tornar o repo público sem vazar dado de cliente". Decomposto:

```bash
# 0. Critério de pronto ANTES: a varredura do passo 1 tem que voltar zero.
# 1. Inventário — subproblema independente, roda em minutos
#    (termos-proibidos.txt: um termo sensível por linha — nomes, domínios, docs)
rg -i -n -f termos-proibidos.txt --stats . > inventario.txt

# 2. Classificar cada hit: apagar / trocar por codinome / precisa de decisão
# 3. Reescrever classe a classe — frentes paralelas por pasta, independentes
# 4. Verificar com a MESMA varredura do passo 1:
rg -i -f termos-proibidos.txt . && echo "AINDA VAZA" || echo "limpo"

# 5. Hit que depende de decisão de terceiro → PENDENCIAS.md com contexto,
#    e as outras frentes seguem. Um item bloqueado não segura o repo inteiro.
```

Repare no desenho: o critério de pronto foi definido **antes** (varredura zero), então "pronto" não é opinião — é um comando que qualquer um roda e confere.

## Por que cai em entrevista

"Como você atacaria [tarefa grande e vaga]?" é pergunta de system design e comportamental ao mesmo tempo. O entrevistador observa se você congela, se levanta requisitos e, principalmente, se a sua primeira ação é cortar o problema e nomear o que ataca primeiro — e por quê.

> **P:** "Te dou uma feature grande e vaga. Por onde você começa?"
>
> **R (30s):** "Corto em subproblemas independentes e ordeno por risco, não por conforto: o pedaço que eu não sei fazer vai primeiro, como spike curto, porque é onde o plano pode morrer barato. Depois identifico o caminho crítico e o que dá pra paralelizar. E tenho uma regra: bloqueador não me para — frente que trava esperando terceiro vira pendência anotada com contexto, e eu ataco a próxima; no report final entrego 'fiz X e Y, Z bloqueado por W'. Numa sanitização de repo real, isso significou publicar no prazo com um único item pendente documentado, em vez de atrasar tudo por causa dele."

## Checkpoint

- [ ] Decompus uma tarefa real em ≥ 4 subproblemas com critério de pronto cada um
- [ ] Sei explicar fatia vertical vs camada e quando cada corte vence
- [ ] Ataquei o subproblema mais arriscado PRIMEIRO na última tarefa grande
- [ ] Registrei um bloqueador e continuei outra frente em vez de esperar
- [ ] Defini o critério de "pronto" (verificável por comando) ANTES de começar

## Recursos

- [Strangler Fig Application — martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html)
- How to Solve It — George Pólya (1945): o clássico da decomposição de problemas
- Critical Path Method — buscar "CPM project management" (conceito; qualquer fonte séria)
- Módulo `80-system-design/08-design-de-sistema-exemplo.md` desta trilha — decomposição aplicada
