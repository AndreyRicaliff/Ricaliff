# 00 — Por que a IA programa bem (e como roubar o método)

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. É o padrão que os demais módulos vão seguir.

## O que é

Este módulo responde a pergunta que sustenta a trilha inteira: **por que uma IA escreve código melhor que a maioria dos humanos — e o que disso é método aprendível?** A resposta importa porque o teu objetivo declarado não é competir com a IA digitando: é **trabalhar perfeitamente com ela** — e isso exige entender o que ela faz de melhor, o que ela faz de pior, e qual parte do processo dela você precisa internalizar pra ser o engenheiro no comando, não o passageiro.

---

## § BASE — o fundamento

**O que é programar, no fundo.** Programar é transformar uma *intenção* ("quero que o cliente veja o total de vendas") em *comportamento verificável de máquina* (uma função que, dado X, produz Y — sempre). Toda a engenharia de software é a gestão da distância entre esses dois pontos: a intenção é ambígua, humana, cheia de casos não ditos; o comportamento é literal, binário, impiedoso. **Bug é o nome que damos à diferença entre o que se quis dizer e o que se disse.**

**Por que isso é difícil pra humanos.** Três limitações cognitivas documentadas:
1. **Memória de trabalho:** humanos seguram ~4 blocos de informação simultâneos. Um sistema real tem milhares de partes interagindo. Programar bem é uma guerra contra esse limite — e TODA boa prática (função pequena, módulo, interface, nome bom) é uma tecnologia pra caber o problema na memória de trabalho.
2. **Confiança sem verificação:** o cérebro completa lacunas com suposição e *sente* a suposição como certeza. Por isso o "funciona na minha cabeça" quebra em produção.
3. **Custo do ego:** admitir "meu código está errado" dói; humanos defendem a própria hipótese em vez de tentar refutá-la (viés de confirmação). Debugging lento é quase sempre ego, não falta de técnica.

**Por que a IA se sai bem — os 5 mecanismos reais:**

1. **Recall de padrões em escala.** Fui treinado em bilhões de linhas de código: quase todo problema que você enfrenta já foi resolvido milhares de vezes, e eu reconheço a *forma* do problema e trago a *forma canônica* da solução (retry? backoff exponencial com jitter. Duplicata? chave natural + upsert). Não é mágica — é **vocabulário de padrões**. Humanos ganham isso com anos; a diferença é só a escala da exposição.
2. **Decomposição sistemática.** Eu não tento resolver "o sistema de vendas" — eu quebro em subproblemas com fronteira clara (buscar → validar → calcular → renderizar) e resolvo um por vez. Sempre. Humanos *sabem* decompor, mas pulam a etapa sob pressão.
3. **Iteração curta com verificação.** Escrevo pouco → rodo → leio o output de verdade → corrijo → repito. O ciclo inteiro dura segundos e NUNCA é pulado. Humanos escrevem 200 linhas antes do primeiro teste e depois caçam o erro no escuro.
4. **Zero ego, zero fadiga.** Quando o teste refuta minha hipótese, eu descarto a hipótese na hora — sem custo emocional, sem "mas deveria funcionar". Às 3h da manhã meu passo 47 tem a mesma qualidade do passo 1.
5. **Consistência de convenção.** Nome, formato, idioma, padrão do projeto — manter consistência não me custa disciplina. Pra humanos, consistência é esforço contínuo; pra IA, é o caminho de menor resistência.

**Onde a IA é PIOR que você (a parte que ninguém te conta):** contexto de negócio que não está escrito (a regra que só o dono da loja sabe); gosto e julgamento de produto (o que *vale a pena* construir); responsabilidade (eu não sofro as consequências do deploy — você sim); novidade genuína (padrão que nunca existiu não tem recall); e **verdade** — eu produzo texto *plausível*, e plausível-mas-errado é meu modo de falha característico. É exatamente por isso que o teu papel não desaparece: **a IA gera, o engenheiro responde.** Quem não sabe o fundamento não consegue nem julgar se o que eu entreguei está certo.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O método completo tem 3 camadas empilhadas, e cada trilha do hub mora numa delas:

```
CAMADA 3 — JULGAMENTO           o que construir, trade-offs, gosto, responsabilidade
   ↑ depende de                 (trilhas: 20-arquitetura, 25-gestão, 42-design, 95-diferencial)
CAMADA 2 — MÉTODO               decompor, iterar, verificar, refutar, padrões
   ↑ depende de                 (trilhas: 05-raciocínio, 12-testes, 82-robustez)
CAMADA 1 — VOCABULÁRIO          sintaxe, tipos, memória, protocolos, ferramentas
                                (trilhas: 00-fundamentos, 15-git, 30-banco, 40/50-front/back)
```

- **Camada 1 (vocabulário)** é o que a IA tem de graça e você precisa adquirir: sem ela você não *lê* o que a IA escreve. É treinável por exposição + recall (por isso a aba Revisar existe).
- **Camada 2 (método)** é o coração deste módulo: é 100% aprendível e é onde humanos e IA convergem — o método é o mesmo, a IA só o executa sem pular etapas.
- **Camada 3 (julgamento)** é onde você SUPERA a IA — mas ela só nasce em cima das outras duas. Julgamento sem vocabulário é opinião; julgamento sem método é chute.

A ordem de dependência explica o desenho da trilha: fundamentos primeiro, raciocínio como espinha, arquitetura/diferencial no topo. Pular camada é o erro clássico do júnior com IA: ele opera na camada 3 ("faz um app de vendas") sem ter a 1 e a 2 — e não consegue avaliar, corrigir nem defender o que recebeu.

---

## § METODOLOGIA — o passo-a-passo replicável (o loop da IA)

Este é o algoritmo que eu executo em TODA tarefa de código, explicitado pra você adotar. Sete passos, nenhum opcional:

**1. ESPECIFICAR — transformar intenção em critério verificável.**
Antes de escrever qualquer linha: *"como eu vou saber que terminei?"* Se a resposta não é observável ("a função retorna o total por loja, testável com esta entrada"), a tarefa ainda não está pronta pra começar. Anti-padrão: começar a codar com o objetivo na cabeça em forma de sensação.

**2. RESTRINGIR — declarar o que está FORA.**
Todo escopo sem borda cresce. "Sync de vendas" vira "sync de vendas, devoluções, trocas e estoque" no meio do caminho. Eu declaro o que NÃO vou fazer antes de começar (e o hub agora força isso: sprint com meta única).

**3. DECOMPOR — quebrar até cada parte caber numa cabeça.**
A regra prática: se você não consegue explicar o subproblema numa frase, ele ainda é grande demais. Decomposição boa tem fronteiras onde uma parte não precisa saber o interior da outra (é a semente de TODA arquitetura — módulo, função, API são decomposição cristalizada).

**4. RECONHECER O PADRÃO — "isso é uma instância de quê?"**
Antes de inventar: este problema tem nome? Retry, cache, fila, upsert, máquina de estados, mapa-reduce? Se tem nome, tem solução canônica com as armadilhas já mapeadas. É o passo onde o vocabulário (camada 1) paga o aluguel — e onde a Videoteca/bibliografia dos syllabi te dá o repertório.

**5. IMPLEMENTAR O MÍNIMO — a menor versão que já roda.**
Não a versão completa: a menor que produz comportamento observável. 10 linhas que rodam ensinam mais que 200 que talvez rodem. Cada acréscimo parte de um estado que FUNCIONAVA — quando quebrar, o suspeito é o último delta (é por isso que commit atômico importa: é o método aplicado ao git).

**6. VERIFICAR — rodar e LER o resultado, contra o critério do passo 1.**
Não "rodou sem erro": *o output bate com o critério?* Ler o erro de verdade (módulo 04), testar o caminho infeliz (82-robustez/08), e a regra de ouro: **"funciona" só existe depois de observado — antes disso é hipótese.**

**7. ITERAR OU PARAR — refutado? Volta com informação nova. Passou? Pergunta se já basta.**
Cada iteração deve consumir a informação da anterior (senão é tentativa-e-erro, não método). E "parar" é decisão ativa: o critério do passo 1 foi atingido? Então polir é procrastinação com cara de trabalho (módulo 07).

**Como isso vira "trabalhar perfeitamente com IA":** o teu papel em cada passo muda de executor pra engenheiro-no-comando —
- Passos **1-2 são teus por natureza** (a IA não sabe tua intenção nem teu limite de escopo): prompt bom É especificação + restrição. "Faz um dashboard" é intenção crua; "card com total por loja do mês corrente, fonte tabela X, ignora devoluções" é engenharia.
- Passos **3-5 a IA executa melhor** — mas você precisa RECONHECER a decomposição e os padrões escolhidos pra poder julgá-los. É aqui que a camada 1 te salva de aceitar lixo plausível.
- Passos **6-7 voltam pra você**: verificação é o contrato. A IA diz "pronto"; quem responde pelo deploy confere contra o critério. Nunca aceite "funciona" de ninguém — nem de mim — sem evidência.

---

## Passo-a-passo aplicado (faça agora, ~40min)

Pegue uma tarefa REAL pequena do teu backlog e execute o loop por escrito:

1. Escreva o critério verificável (passo 1) e o fora-de-escopo (passo 2) em 3 linhas — ANTES de abrir o editor.
2. Decomponha em ≤4 subproblemas de uma frase cada (passo 3). Nomeie o padrão de cada um, se tiver (passo 4).
3. Peça à IA a implementação do PRIMEIRO subproblema apenas, com teu critério no prompt.
4. Verifique contra o critério (passo 6) — rode, leia, anote o que divergiu.
5. Itere UMA vez com a informação da divergência (passo 7), não com "tenta de novo".
6. Compare: quanto do resultado final veio da qualidade do teu passo 1-2? (Spoiler: quase tudo.)

## Por que cai em entrevista

"Como você usa IA no seu fluxo de trabalho?" virou pergunta padrão — e a resposta fraca ("uso pra gerar código") elimina. A resposta forte demonstra o método: especificação própria, verificação própria, IA no meio. Você estará descrevendo exatamente este loop.

> **P:** "Você usa IA pra programar? Isso não te torna dependente?"
>
> **R (30s):** "Uso, com método: a especificação e o critério de aceite são meus, a decomposição eu reviso, e nada entra sem eu verificar contra o critério — rodando, não confiando. A IA é melhor que eu em recall de padrões e iteração rápida; eu respondo pelo julgamento, pelo contexto de negócio e pela verificação. Dependente é quem aceita o que ela gera sem conseguir avaliar — e é exatamente pra conseguir avaliar que eu estudo o fundamento. O código que ela escreve, eu tenho que ser capaz de defender linha a linha, porque quem faz o deploy respondo sou eu."

## Checkpoint

- [ ] Explico os 5 mecanismos que fazem a IA programar bem — e as 5 fraquezas dela
- [ ] Desenho as 3 camadas (vocabulário → método → julgamento) e sei em qual cada trilha mora
- [ ] Executei o loop de 7 passos por escrito numa tarefa real (o exercício acima)
- [ ] Escrevi um prompt que é especificação (critério + escopo), não desejo
- [ ] Recuso "funciona" — meu ou da IA — sem evidência observada

## Recursos

- *The Pragmatic Programmer* (Hunt/Thomas) — caps. sobre estimativa, "tracer bullets" (o passo 5) e debugging
- *How to Solve It* (Pólya) — o loop de 7 passos é neto do método de Pólya pra matemática (1945)
- George Miller, "The Magical Number Seven, Plus or Minus Two" — o limite da memória de trabalho (a Base)
- Anthropic — documentação de prompt engineering (especificação aplicada a IA)
- Módulos-irmãos: `01-verificar-antes-de-afirmar` (passo 6), `02-hipotese-e-refutacao` (passo 7), `05-decompor-problemas` (passo 3), `07-quando-parar` (o "parar")
