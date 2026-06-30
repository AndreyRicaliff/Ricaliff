# 02 — Os 3 tipos de aprendizado

## O que é

Todo ML cai em uma de três famílias, e elas se diferenciam por **que tipo de feedback** a máquina recebe enquanto aprende.

### 1. Supervisionado (supervised learning) — aprender com gabarito

Você dá pares **entrada → resposta certa**. O modelo vê a entrada, chuta a resposta, compara com o gabarito e se corrige. É de longe o tipo mais usado na prática.

Analogia: estudar para prova com a lista de exercícios **já resolvida** ao lado. Você tenta, confere com o gabarito, ajusta.

Dois sabores:
- **Classificação (classification):** a resposta é uma categoria. "Esse email é spam ou não?", "essa foto é gato, cachorro ou pássaro?".
- **Regressão (regression):** a resposta é um número contínuo. "Quanto vai valer este apartamento?", "quantas vendas mês que vem?".

```text
Treino (com gabarito):
  [80m², 2 quartos, centro]  → R$ 450.000
  [120m², 3 quartos, bairro] → R$ 600.000
  ... milhares de exemplos ...
Depois (sem gabarito, modelo prevê):
  [95m², 2 quartos, centro]  → R$ ?  (modelo responde ~R$ 510.000)
```

Mundo real: detecção de fraude no cartão, diagnóstico por exame, recomendação "vai gostar disso", previsão de churn. **Custo escondido:** alguém precisou rotular (label) todos os exemplos à mão — isso é caro e lento.

### 2. Não-supervisionado (unsupervised learning) — achar padrão sem gabarito

Você dá só os dados, **sem resposta certa**. O modelo procura estrutura escondida sozinho. Ninguém disse o que é "certo" — ele agrupa o que é parecido.

Analogia: te dão uma caixa com 500 peças de Lego misturadas e pedem pra "organizar". Sem instrução, você naturalmente separa por cor e tamanho. Você descobriu grupos que ninguém te ensinou.

Tarefas típicas:
- **Clustering (agrupamento):** segmentar clientes em perfis ("os que compram barato e sempre", "os que somem 6 meses e voltam").
- **Redução de dimensionalidade:** comprimir dados de 1000 colunas pra 2, pra visualizar ou acelerar.
- **Detecção de anomalia:** o que foge do padrão (transação estranha, sensor com defeito).

Mundo real: segmentação de marketing, sistemas de recomendação, compressão. Os **embeddings** de LLM (módulo 07) nascem de ideias não-supervisionadas.

### 3. Por reforço (reinforcement learning, RL) — aprender por tentativa e erro

Não há gabarito nem dados prontos. Há um **agente** que age num ambiente, recebe **recompensa (reward)** quando acerta e **punição** quando erra, e aprende a sequência de ações que maximiza a recompensa ao longo do tempo.

Analogia: treinar um cachorro com petisco. Sentou → petisco. Mordeu o sofá → "não!". Depois de muitas repetições ele aprende **qual comportamento gera recompensa** — sem você nunca ter explicado a regra.

A pegadinha que define RL: a recompensa pode vir **atrasada**. No xadrez, a jogada decisiva aconteceu 20 lances antes do xeque-mate. O agente precisa aprender que ações cedo levam a recompensa lá na frente — esse é o problema difícil (credit assignment).

Mundo real: AlphaGo, robôs aprendendo a andar, carros autônomos, otimização de data center. E o **RLHF** (Reinforcement Learning from Human Feedback) é o que transforma um LLM cru num assistente educado — humanos pontuam respostas, o modelo aprende a maximizar essa nota (ver módulo 07).

## Resumo

| Tipo | Recebe | Pergunta que responde | Exemplo |
|---|---|---|---|
| Supervisionado | entrada + resposta certa | "qual a resposta pra esta entrada?" | preço de imóvel, spam |
| Não-supervisionado | só entradas | "que estrutura existe aqui?" | segmentar clientes |
| Por reforço | recompensa por ação | "que sequência de ações maximiza o ganho?" | jogar Go, robô andar |

**Em entrevista:** "Supervisionado aprende com gabarito — entrada e resposta certa, tipo prever preço ou classificar spam. Não-supervisionado só recebe os dados e acha padrão sozinho, tipo agrupar clientes parecidos. Por reforço é tentativa e erro com recompensa, tipo treinar cachorro com petisco — é o que faz o AlphaGo, e o RLHF que alinha os LLMs."
