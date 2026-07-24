# 03 — Dados, features e o ciclo treino/teste

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Antes de qualquer modelo, vem o **dado** — e o dado tem um vocabulário fixo que cai sempre. **Dataset** é a tabela de exemplos (uma linha = um exemplo). **Feature** é uma coluna de entrada (metragem, quartos, bairro) — o sinal que o modelo lê. **Label** (alvo/target) é a coluna que você quer prever (o preço), no supervisionado.

```text
| metragem | quartos | bairro  |  preço   |
|----------|---------|---------|----------|
|   80     |   2     | centro  | 450.000  |   ← features = entrada | label = preço
|  120     |   3     | jardim  | 600.000  |
```

Este módulo é sobre a única coisa que decide se um modelo presta: ele **generaliza** — vai bem em dado que nunca viu — ou só **decorou** o que viu? Toda a engenharia de treino/validação/teste existe para responder isso sem se enganar.

---

## § BASE — o fundamento

**O problema central de ML tem nome: generalização.** Treinar é fácil; o difícil é ir bem no **futuro**, em dados que o modelo nunca viu. A **teoria estatística do aprendizado** (**Vapnik**, *The Nature of Statistical Learning Theory*, 1995) formaliza isso: assume-se que treino e mundo real vêm da **mesma distribuição**, e o objetivo é minimizar o **erro esperado** nessa distribuição — não o erro no treino. Quando essa suposição quebra (o mundo mudou, *distribution shift*), a garantia some. Guarde: minimizar erro de treino **não é** o objetivo; é só um proxy do que importa, que é o erro em dado novo.

**A tensão fundamental: viés × variância.** **Geman, Bienenstock & Doursat (1992)**, em *"Neural Networks and the Bias/Variance Dilemma"*, decompuseram o erro de um modelo em três parcelas: **viés** (erro por o modelo ser simples demais para o padrão), **variância** (erro por o modelo ser sensível demais aos acidentes daquele treino específico) e ruído irredutível. As duas primeiras puxam em direções opostas:
- **Underfitting = viés alto:** modelo simples demais, não capta o padrão. Vai mal no treino **e** no teste. É o aluno que não estudou.
- **Overfitting = variância alta:** modelo complexo demais, **decorou** o treino incluindo o ruído. Vai perfeito no treino e mal no teste. É o aluno que decorou as respostas da lista e trava quando a prova muda os números.

O **sinal clássico de overfitting** é o **gap**: erro de treino baixo, erro de teste alto. A distância entre os dois é o alarme.

```text
Erro
 │                          ____ teste (sobe = overfitting)
 │  \                  ____/
 │   \            ____/
 │    \______treino (cai sempre)
 │_________________________________________ complexidade do modelo →
        ↑underfit        ↑ponto bom        ↑overfit
```

**Por que o teste tem que ser um cofre lacrado.** O erro nº 1 do iniciante é avaliar o modelo nos mesmos dados em que treinou — colar na prova com a prova aberta: a nota é alta e mentirosa. A defesa é dividir o dataset em três partes vistas em momentos diferentes: **treino** (o modelo aprende), **validação** (você ajusta hiperparâmetros) e **teste** (nota final, aberto **uma vez só**). Se você fica espiando o teste para melhorar o modelo, a informação dele **vaza** para as suas decisões — é **data leakage** — e a nota volta a mentir. O teste estima o desempenho no mundo real justamente porque o modelo (e você) nunca o usaram para decidir nada.

**"Mais dados" costuma ganhar de "modelo melhor" — e isso tem fonte.** **Banko & Brill (2001)**, em *"Scaling to Very Very Large Corpora for Natural Language Disambiguation"*, mostraram algo que virou lenda: em desambiguação de linguagem, algoritmos medíocres com muito mais dados **superavam** algoritmos sofisticados com pouco dado — e as curvas de todos continuavam subindo com mais dados, sem saturar. **Halevy, Norvig & Pereira (2009)**, no ensaio da Google *"The Unreasonable Effectiveness of Data"*, generalizaram: para muitos problemas, investir em mais dados rende mais que investir em algoritmo mais esperto. A intuição: mais exemplos cobrem mais casos reais, ensinam o que é ruído vs sinal e empurram o modelo a generalizar em vez de decorar. Foi essa lição — dados em escala massiva — que destravou o deep learning e os LLMs (módulos 06–07).

**A versão moderna e quantificada: scaling laws — com a controvérsia.** **Kaplan et al. (2020)**, em *"Scaling Laws for Neural Language Models"*, mostraram que a perda de um LLM cai de forma previsível (lei de potência) conforme você aumenta parâmetros, dados e compute. Só que **Hoffmann et al. (2022)** — o paper **Chinchilla** da DeepMind — **corrigiram** a receita: os modelos da época estavam **subtreinados em dados** (grandes demais para o pouco texto que viam). Com o mesmo orçamento de compute, um modelo **menor treinado em muito mais dados** (eles usaram ~70B de parâmetros e ~1,4 trilhão de tokens) **ganha**. Ou seja: parâmetros e dados têm que escalar **juntos**. **Incerteza declarada:** scaling laws são regularidades empíricas robustas, não leis físicas — extrapolam bem no regime medido, mas não há garantia teórica de que continuam indefinidamente, e o "quanto de dado por parâmetro" foi revisado uma vez (Kaplan → Chinchilla) e pode ser de novo. O princípio que sobrevive: **mais dados BONS** ganham; dado sujo, enviesado ou desbalanceado estraga o modelo por mais que exista. Garbage não escala.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O ciclo de vida do dado, e onde cada conjunto entra:

```text
Dataset (100%)  ──►  feature engineering (as colunas de entrada)
 ├── TREINO (~70%)     → o modelo aprende aqui (vê features + label)
 ├── VALIDAÇÃO (~15%)  → você ajusta config/hiperparâmetros aqui
 └── TESTE (~15%)      → nota final. Abre UMA vez. Nunca decide nada com ele.

  qualquer decisão baseada no TESTE  ──►  data leakage  ──►  nota mentirosa
```

A hierarquia de importância, que surpreende quem começa:
```
   dados BONS  >  boas features  >  escolha do modelo  >  ajuste fino
   (Banko&Brill,   (feature eng.:    (o modelo importa    (o último
    Halevy 2009)    "lixo entra,      menos do que        ganho, o menor)
                     lixo sai")        parece)
```
Feature engineering — escolher e preparar boas colunas de entrada — costuma mover o ponteiro mais que trocar de modelo: *"lixo entra, lixo sai"*. Se as features não carregam o sinal, nenhum modelo salva.

A tensão viés×variância organiza os remédios:
```
   overfitting (variância alta) → mais dados · modelo mais simples ·
                                   regularização · early stopping
   underfitting (viés alto)     → modelo mais expressivo · mais features ·
                                   treinar mais
```

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Separe o teste ANTES de olhar qualquer coisa.** Faça o split logo no início e **lacre o teste**. Toda exploração, gráfico e decisão acontece só no treino+validação. Teste que você "deu uma olhadinha" já vazou.

**2. Invista em feature engineering antes de caçar modelo.** Pergunte de cada feature: ela carrega sinal do que quero prever? Colunas cruas raramente são as melhores; derivar (razões, agregados, datas quebradas) costuma render mais que trocar o algoritmo.

**3. Treine no treino, ajuste na validação.** Todo hiperparâmetro (complexidade, learning rate — módulo 04) é escolhido pela nota de **validação**, nunca de teste.

**4. Diagnostique viés vs variância pelo gap.** Erro de treino alto → underfitting (aumente a capacidade). Erro de treino baixo mas de teste alto → overfitting (mais dados, simplifique, regularize, early stopping).

**5. Abra o teste UMA vez, no fim.** A nota de teste é a estimativa honesta do mundo real. Se você não gostou e voltou a mexer no modelo, contaminou o teste — precisa de dado novo intocado.

**Anti-padrões:**
- **Avaliar no treino:** reportar a acurácia do treino como se fosse o desempenho real. É a nota mentirosa. Sempre reporte a de teste.
- **Data leakage:** deixar informação do teste (ou do futuro) escorrer para o treino/features — normalizar usando estatísticas do dataset inteiro, incluir uma coluna que só existe *depois* do evento previsto. Nota linda no laboratório, fracasso em produção.
- **Perseguir modelo com dado ruim:** trocar de algoritmo sem parar para limpar/aumentar os dados. Quase sempre o ganho estava no dado (Halevy 2009), não no modelo.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Use uma tabela real que você tenha (ex.: histórico de vendas de um **Cliente Varejo**, prevendo se um cliente vai voltar):

1. Nomeie **features** (entrada) e **label** (o que prever) explicitamente. Aponte 1 feature derivada que carregaria mais sinal que as colunas cruas.
2. Faça o **split** treino/validação/teste e escreva a regra: "não olho o teste até o fim". Cheque se há **leakage** — alguma feature só existe depois do que você quer prever?
3. Treine o baseline mais simples e anote **erro de treino vs erro de teste**. Calcule o **gap**.
4. Diagnostique: é underfitting (viés) ou overfitting (variância)? Escreva o remédio correspondente.
5. Antes de trocar de modelo, escreva o que você faria para **melhorar os dados** — e estime qual dos dois renderia mais (a aposta de Halevy 2009).

## Por que cai em entrevista

Overfitting e a disciplina de treino/teste são o feijão-com-arroz de toda entrevista de ML — errar aqui elimina. Amarrar "mais dados bons" às scaling laws (com a correção do Chinchilla) mostra que você acompanhou a literatura recente, não só o básico.

> **P:** "O que é overfitting e como você divide seus dados pra detectá-lo?"
>
> **R (30s):** "Features são as colunas de entrada, label é o que eu quero prever. Eu divido o dataset em treino, validação e teste — o teste eu só toco no fim, pra não enganar a mim mesmo. Overfitting é decorar o treino e ir mal em dado novo; o sinal é erro de treino baixo e de teste alto. E na prática, mais dados bons costuma render mais que um modelo mais sofisticado."

> **P:** "Por que 'mais dados' costuma ganhar de 'modelo melhor'? Isso tem limite?"
>
> **R (30s):** "Tem base empírica: o Banko e Brill em 2001 mostraram algoritmos simples com muito dado batendo algoritmos sofisticados com pouco, e o ensaio 'Unreasonable Effectiveness of Data' da Google generalizou isso. Mais exemplos cobrem mais casos reais e forçam a generalizar em vez de decorar. A versão moderna são as scaling laws do Kaplan em 2020 — a perda cai de forma previsível com dados, params e compute. Mas tem nuance: o Chinchilla, em 2022, corrigiu a receita mostrando que params e dados têm que crescer juntos, os modelos estavam subtreinados em dados. E o limite óbvio é qualidade: dado sujo ou enviesado não escala, garbage in garbage out."

## Checkpoint

- [ ] Sei que o objetivo real é generalização, não erro de treino, e por que o teste é lacrado
- [ ] Distingo feature de label e sei que feature engineering costuma render mais que trocar modelo
- [ ] Diagnostico overfitting vs underfitting pelo gap treino/teste e sei o remédio de cada
- [ ] Explico viés × variância (Geman 1992) como as duas parcelas do erro que puxam em direções opostas
- [ ] Reconheço data leakage e evito qualquer decisão baseada no conjunto de teste
- [ ] Ligo "mais dados bons ganham" a Halevy 2009 e às scaling laws (Kaplan 2020 / Chinchilla 2022)

## Recursos

- *The Nature of Statistical Learning Theory* — Vladimir Vapnik (1995): generalização e erro esperado
- *Neural Networks and the Bias/Variance Dilemma* — Geman, Bienenstock & Doursat (1992): a decomposição do erro
- *Scaling to Very Very Large Corpora...* — Banko & Brill (2001): mais dados batendo algoritmo melhor
- *The Unreasonable Effectiveness of Data* — Halevy, Norvig & Pereira (2009): o princípio generalizado
- *Scaling Laws for Neural Language Models* — Kaplan et al. (2020) e *Training Compute-Optimal LLMs* (Chinchilla) — Hoffmann et al. (2022): a correção params×dados
- Google *ML Crash Course* — "Generalization", "Training and Test Sets", "Validation Set"
- Módulo-irmão `04-como-um-modelo-aprende` — como o treino minimiza o erro que este módulo mede
