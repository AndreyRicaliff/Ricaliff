# 01 — O que é Machine Learning de verdade

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Na programação tradicional, **você** escreve as regras. Você olha o problema, pensa na lógica e digita `if/else`. O computador só executa o que você mandou.

```ts
// detectar email de spam à mão: você escreve cada regra
function isSpam(email: string): boolean {
  if (email.includes('viagra')) return true
  if (email.includes('grátis') && email.includes('clique')) return true
  if (email.match(/\$\$\$|R\$ ?\d{4,}/)) return true
  return false
}
```

O problema: spam tem milhares de variações, muda toda semana, e você nunca termina de escrever regras. Cada `if` novo quebra outro. Este módulo existe para você entender, com precisão, o que muda quando a máquina infere as regras no seu lugar — e por que isso não é mágica, é uma troca epistemológica bem definida.

---

## § BASE — o fundamento

**A definição que fundou o campo.** O termo "machine learning" nasce com **Arthur Samuel (1959)**, em *"Some Studies in Machine Learning Using the Game of Checkers"* (IBM Journal). Samuel escreveu um programa de damas que jogava melhor que ele próprio, e cunhou a definição informal: dar ao computador a capacidade de aprender "sem ser explicitamente programado" para a tarefa. O ponto histórico não é o jogo — é a inversão: o programa **melhorava com a experiência** de partidas, ajustando sozinho como avaliava um tabuleiro. Ninguém codou a estratégia vencedora; ela emergiu dos dados de jogo.

**A definição formal que se usa até hoje.** **Tom Mitchell (1997)**, no livro-texto *Machine Learning*, deu a definição rigorosa que todo curso repete — a tríade **T, P, E**: *"Um programa aprende da experiência **E**, com relação a uma tarefa **T** e uma medida de desempenho **P**, se seu desempenho em T, medido por P, melhora com E."* Traduzindo para o spam: **T** = classificar email em spam/não-spam; **P** = a fração de acertos; **E** = os milhares de emails já rotulados. Essa formalização não é decoração — ela **força** você a nomear as três coisas antes de começar. Um projeto de ML sem uma medida P explícita não é ML, é achismo com GPU: você não tem como saber se está melhorando.

**Por que isso é filosoficamente diferente de programar.** Programação clássica é **dedução**: das regras (premissas) o computador deriva o resultado. ML é **indução**: dos exemplos (casos particulares) a máquina infere a regra geral. Essa é a mesma inferência do método científico — generalizar a partir de observações — e carrega a mesma fragilidade, que David Hume apontou no séc. XVIII (o **problema da indução**): nenhuma quantidade de exemplos *garante* que a regra vale para o próximo caso. É por isso que **todo modelo de ML erra por design**: ele aposta que o futuro se parece com os dados passados. Quando não se parece (o mundo mudou, o dado novo é diferente do treino), o modelo erra com confiança. Guarde isso — volta como *overfitting* (módulo 03) e como *distribution shift*.

**A visão de engenharia: "Software 2.0".** **Andrej Karpathy (2017)**, no ensaio *"Software 2.0"*, deu o enquadramento que mais serve a um dev: no Software 1.0, o programador escreve código explícito que ocupa um ponto no espaço de todos os programas possíveis. No Software 2.0, você **não escreve o programa** — você especifica um objetivo (a medida P), restringe o espaço de programas com a arquitetura do modelo, e uma busca (o treino, módulo 04) encontra o programa que atinge o objetivo. O código final são os **pesos** — números que ninguém digitou. Você deixou de escrever a solução e passou a escrever a **especificação** (os dados rotulados + a função de perda) que define o que é uma boa solução.

**Por que ML não é "melhor" — o No Free Lunch.** **Wolpert & Macready (1997)** provaram o teorema do **No Free Lunch**: mediado sobre *todos* os problemas possíveis, nenhum algoritmo de aprendizado é melhor que outro — inclusive melhor que o chute aleatório. A consequência prática é forte: um modelo só ganha porque **assume uma estrutura** que casa com o problema real (dados de imagem têm localidade, texto tem sequência, etc.). Não existe o modelo universalmente bom. Isso desmancha a ideia de "IA que resolve tudo": todo ganho de ML vem de um viés indutivo que combina com o mundo daquele problema — e num problema de estrutura diferente, o mesmo modelo é lixo.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O critério de decisão nasce de uma pergunta única — *"eu consigo escrever as regras à mão?"* — cruzada com *"eu tenho exemplos rotulados?"*. O quadrante:

```
                  TENHO EXEMPLOS ROTULADOS       NÃO TENHO
REGRA ESCREVÍVEL  ┌──────────────────────────┬──────────────────────┐
À MÃO             │  código normal (o if      │  código normal        │
                  │  é mais simples/auditável)│  (escreva a regra)    │
                  ├──────────────────────────┼──────────────────────┤
REGRA NÃO         │  ✅ TERRITÓRIO DO ML      │  ⚠ colete dados       │
ESCREVÍVEL        │  (spam, fraude, visão)    │  primeiro, ou desista │
                  └──────────────────────────┴──────────────────────┘
```

A regra e o modelo não são opostos — o modelo **é** uma regra, só que induzida e guardada como números (os pesos, módulo 04). A cadeia de dependências que sustenta o resto da trilha:

```
DADOS rotulados (E) ──► ALGORITMO de treino ──► MODELO (função com pesos)
        │                       │                      │
   medida P define         busca o programa       prevê em dado NOVO
   "o que é bom"           que maximiza P         (indução: pode errar)
```

Três eixos organizam qualquer decisão de "ML sim ou não":
1. **Determinismo exigido.** Código normal dá a mesma saída sempre e é auditável linha a linha. ML é probabilístico e é caixa-preta — se o domínio exige justificar cada decisão (crédito negado num tribunal, LGPD), isso pesa contra.
2. **Tolerância a erro.** ML acerta 97%, não 100% (a indução de Hume). Domínio que não tolera o erro residual precisa de humano no loop.
3. **Volume e qualidade de exemplos.** Sem E suficiente e limpo, não há o que induzir — "garbage in, garbage out" (módulo 03).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Nomeie T, P, E antes de escrever qualquer linha (Mitchell).** Se você não consegue escrever a medida **P** numa fórmula ("% de emails classificados certo no conjunto de teste"), pare — você ainda não tem um problema de ML, tem um desejo vago.

**2. Faça o teste do `if`.** Tente escrever a regra à mão, de verdade, por 15 minutos. Se sair um `if` limpo e estável, **entregue o `if`** — é mais barato, determinístico e auditável. ML só se justifica quando o padrão é real mas escapa de qualquer `if` mantível.

**3. Cheque se existe E (exemplos rotulados) — e a que custo.** ML supervisionado (módulo 02) exige alguém ter rotulado os exemplos. Esse custo é frequentemente o gargalo real do projeto, não o modelo.

**4. Cheque as restrições de determinismo e auditabilidade.** Precisa explicar cada decisão? Prefira modelo interpretável (módulo 05) ou fique no código normal.

**5. Comece pelo baseline mais burro.** A primeira "IA" deve ser a regra `if` óbvia ou o modelo mais simples. Sem ela você não tem P de referência para saber se o modelo sofisticado ganhou alguma coisa (módulo 05).

**Anti-padrões:**
- **ML como martelo dourado:** aplicar rede neural onde um `if` de 3 linhas resolvia. Você trocou código auditável por caixa-preta cara, e violou o No Free Lunch (adicionou complexidade sem estrutura que a justifique).
- **"IA que resolve tudo":** prometer um modelo geral para um domínio sem dados nem medida P. Sem T/P/E definidos, o projeto não tem como falhar de forma detectável — logo, não tem como acertar.
- **Ignorar o erro residual:** desenhar o produto assumindo 100% de acerto. O modelo é probabilístico; o fluxo tem que absorver o erro (revisão, fallback, humano no loop).

---

## Passo-a-passo aplicado (faça agora, ~25min)

Pegue uma feature real que você já pensou em automatizar (ex.: categorizar as transações de um dashboard de um **Cliente Varejo**):

1. Escreva **T, P, E** em três linhas. Se travar em P, o problema ainda não está pronto.
2. Gaste 15 min tentando o `if`. Escreva quantas regras precisaria e quantos casos elas ainda deixam passar.
3. Responda honestamente: existem exemplos rotulados? Quantos? Quem rotularia os que faltam, e a que custo?
4. Classifique o problema no quadrante da §ESTRUTURAÇÃO e escreva a decisão em uma frase: "código normal porque X" ou "candidato a ML porque o padrão escapa do `if` e tenho N exemplos".
5. Se der ML, defina o **baseline burro** que você vai ter que bater — senão não saberá se o modelo valeu a pena.

## Por que cai em entrevista

"Quando você usaria ML em vez de código normal?" separa quem entende o custo de quem acha IA um enfeite. A resposta forte mostra o critério (o teste do `if`), a definição formal (T/P/E) e a consciência de que o modelo erra por design.

> **P:** "Qual a diferença entre machine learning e programação tradicional, e quando você usaria ML?"
>
> **R (30s):** "Programação tradicional é DADOS + REGRAS → resultado; ML é DADOS + RESULTADO → regras. Em vez de escrever a lógica, eu dou exemplos e o modelo infere o padrão. Uso ML quando o padrão existe mas é complexo demais pra codar à mão — tipo detectar spam ou fraude — e quando tenho muitos exemplos rotulados."

> **P:** "Se ML aprende sozinho, por que não usar ML pra tudo?"
>
> **R (30s):** "Porque não existe modelo universalmente melhor — é o teorema No Free Lunch do Wolpert e Macready: todo ganho vem de um viés que casa com a estrutura do problema, então num problema de estrutura diferente o mesmo modelo é ruim. Na prática: se eu consigo escrever o `if`, escrevo o `if` — é determinístico, auditável e barato. ML entra quando o padrão é real mas escapa de qualquer regra mantível, e mesmo aí eu pago o preço de uma caixa-preta que erra por design, porque ela generaliza por indução e o dado novo pode não se parecer com o treino."

## Checkpoint

- [ ] Sei enunciar a definição T/P/E de Mitchell e aplicá-la a um problema concreto meu
- [ ] Sei explicar por que ML é indução e por que isso implica que o modelo erra por design
- [ ] Faço o "teste do `if`" antes de propor ML, e entrego o `if` quando ele existe
- [ ] Sei o que o No Free Lunch (Wolpert & Macready) diz e por que "IA resolve tudo" é falso
- [ ] Consigo dizer, num problema real, se ele é território de ML ou de código normal — e por quê
- [ ] Entendo que o modelo é uma regra (pesos), só que induzida dos dados, não digitada

## Recursos

- *Some Studies in Machine Learning Using the Game of Checkers* — Arthur Samuel (1959): a origem do termo e da ideia de "aprender sem ser explicitamente programado"
- *Machine Learning* — Tom Mitchell (1997), cap. 1: a definição formal T/P/E
- *"Software 2.0"* — Andrej Karpathy (2017, ensaio): o modelo como programa induzido; pesos no lugar de código
- *No Free Lunch Theorems for Optimization* — Wolpert & Macready (1997): por que nenhum algoritmo é universalmente melhor
- Google — *Machine Learning Crash Course*, unidades "Introduction to ML" e "ML Framing" (developers.google.com/machine-learning)
- Módulo-irmão `03-dados-features-treino-teste` — por que o modelo induzido pode errar (generalização)
