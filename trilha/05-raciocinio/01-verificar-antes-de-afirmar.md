# 01 — Verificar Antes de Afirmar

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

A diferença mais mensurável entre júnior e sênior não é conhecimento — é a **taxa de afirmações falsas**. "Funciona", "corrigido", "deployado", "o banco tem essa coluna" são afirmações verificáveis sobre o estado de um sistema; o sênior só as pronuncia depois de verificar, e quando não verificou, diz isso em voz alta. O nome disso na indústria é **evidence-based engineering**: nenhuma afirmação de estado circula sem um selo que diz de onde veio a confiança. Este é o módulo mais barato de aplicar e o que mais evita desastre — porque quem ouve "está pronto" **decide em cima da tua palavra**, e o custo de uma palavra inflada não é teu, é do próximo na cadeia.

---

## § BASE — o fundamento

**O que é, tecnicamente, uma afirmação de estado.** "O sync funciona" não é opinião — é uma **proposição com valor-verdade**: ou corresponde ao estado real do sistema, ou não corresponde. Essa é a teoria da verdade por *correspondência*: a frase é verdadeira quando bate com o mundo, e falsa quando não bate, independentemente de quanto você acredite nela. Verificar é o ato de conferir a correspondência. Programar é uma cadeia dessas proposições ("essa função retorna Y", "essa coluna existe", "esse deploy chegou nos 8 servidores"), e um sistema em produção é só a soma de proposições que ou foram conferidas ou foram assumidas. **Bug em produção é quase sempre uma proposição assumida que era falsa.**

**Por que o cérebro produz certeza sem evidência.** Aqui a base é cognitiva, e Daniel Kahneman (*Thinking, Fast and Slow*, 2011) nomeou o mecanismo. O **Sistema 1** — rápido, automático, intuitivo — constrói a **história mais coerente possível com a informação que tem à mão**, e o princípio que ele batizou de **WYSIATI ("What You See Is All There Is")** diz o essencial: o Sistema 1 não sinaliza o que está faltando. Ele avalia a coerência do que vê, não a completude. Por isso "funciona na minha cabeça" *sente-se* como fato: a história é coerente, e coerência gera confiança **na mesma intensidade** com pouca ou muita evidência. Somado a isso vem o **viés de confirmação**: uma vez formada a hipótese "meu fix resolveu", o cérebro caça evidência que confirma e desconta a que contraria. A sensação de certeza, portanto, **não é sinal de correspondência com o mundo** — é sinal de coerência interna. Verificar existe justamente porque a sensação mente.

**Os três selos.** Toda afirmação de estado carrega um destes carimbos — e nomear o selo é metade da disciplina:

| Selo | Critério | Frase honesta |
|---|---|---|
| **Verificado** | Rodei o comando/teste E li o output | "Rodei X, o output mostra Y" |
| **Acredito** | Tenho base (doc, experiência) sem prova nesta instância | "Acredito que sim, pela doc — não confirmei aqui" |
| **Não sei** | Sem base suficiente | "Não sei. Verifico em N min fazendo X" |

"Não sei" e "não verifiquei" são respostas **profissionais**. O amador é a confiança artificial, porque quem ouve não consegue distinguir teu chute do teu fato — e trata os dois como fato.

**A prova mínima.** É o menor experimento que transforma "acho" em "sei": rodar o código, um `curl` no endpoint, um `select` no banco, ler o log. A regra dura: **se a prova custa menos de 2 minutos, ela é obrigatória antes de afirmar.** Abaixo desse limiar, assumir não é economia de tempo — é aposta com o dinheiro dos outros.

**O preço histórico de pular a prova.** **Knight Capital, 2012:** deploy de código novo em 8 servidores; o técnico esqueceu 1. Ninguém verificou que o deploy chegou em todos — *assumiram*. O servidor com código velho reativou uma flag antiga e a firma perdeu **US$ 440 milhões em 45 minutos**; a empresa quebrou. O erro não foi o código — foi afirmar "deployado" sem prova. Mesmo padrão na **Mars Climate Orbiter, 1999:** dois times trocaram dados sem ninguém verificar a suposição de unidade (newton-segundo vs libra-força-segundo); a sonda de US$ 327 milhões entrou fundo demais na atmosfera de Marte e desintegrou. Em ambos, a ação estava dentro do razoável; a **suposição não conferida** foi a bomba.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As fontes de confiança não são iguais — elas se ordenam numa **hierarquia de evidência**, do mais forte pro mais fraco:

```
FORTE   runtime observado no alvo certo   "rodei em prod e li o estado mudar"   → Verificado
  │     teste automatizado que exercita   "o teste que reproduz o bug passa"    → Verificado
  │     leitura de código                 "o código diz que deveria fazer X"    → Acredito
  │     doc / memória / experiência        "a lib documenta esse comportamento"  → Acredito
FRACO   suposição / coerência interna      "faz sentido que funcione"            → Não sei
```

Duas leis saem desse desenho:

1. **Código descreve intenção; só runtime descreve realidade.** Ler o código te diz o que ele *deveria* fazer — é o selo *acredito*, nunca *verificado*. Caso real AG: a animação de um deck 3D "estava certa no código", mas em máquina acessada via RDP o Windows força `prefers-reduced-motion` e a animação **congela**. Duas vezes o "funciona" foi afirmado lendo código; a verdade só apareceu lendo `matchMedia('(prefers-reduced-motion: reduce)').matches` em runtime. O código estava certo e a tela estava parada — as duas coisas ao mesmo tempo, porque descrevem planos diferentes.

2. **O selo tem que casar com a fonte.** Chamar leitura de código de "testado" é inflar um selo *acredito* em *verificado* — e é exatamente o movimento que produz Knight Capital. A disciplina inteira cabe numa frase: **nunca reporte um selo mais forte do que a evidência que você tem.**

Há ainda um segundo eixo, que o módulo 06 desenvolve: mesmo com runtime observado, você pode ter observado o **alvo errado** (branch, ambiente, tabela, cache velho). Verificar tem duas perguntas — *"li a realidade?"* (este módulo) e *"li a realidade do lugar certo?"* (módulo 06). As duas juntas são a prova completa.

---

## § METODOLOGIA — o passo-a-passo replicável

O protocolo de prova de um fix, em cinco passos, nenhum opcional:

**1. REPRODUZIR o bug ANTES.** Se você não consegue disparar o sintoma sob demanda, você não vai conseguir provar que sumiu (módulo 04). Reduza ao menor comando que falha.

**2. APLICAR o fix.** Um delta pequeno, isolado — pra que a prova do passo 4 aponte pra causa certa.

**3. RODAR a mesma reprodução do passo 1.** A *mesma*, não uma parecida. Variar a entrada entre antes e depois invalida a comparação.

**4. LER o output mudar** — contra o critério, não "rodou sem erro". "Sem exceção" e "produz o resultado certo" são proposições diferentes; um `catch` silencioso faz o programa passar sem fazer nada.

**5. CONFERIR o estado final no alvo certo** — banco, não log; prod, não local. A prova final de um sync não é a mensagem "sync ok", é o `max(updated_at)` mudando na tabela.

**Anti-padrões que produzem "verificado" falso:**
- **"Rodou sem erro" = "funciona".** Não. Ausência de exceção ≠ presença do resultado correto.
- **Ler o código e dizer "testado".** É *acredito*, no máximo. Runtime é outro plano (a lei 1 acima).
- **Provar no alvo errado.** Runtime observado em staging não prova prod (módulo 06).
- **Afirmar "resolvido" sem ter reproduzido antes.** Sem o "antes", você não tem baseline — o sintoma pode nunca ter dependido do que você mexeu.

**Aplicado — provar um fix de sync (CLIENTE OFICINA):** fix na edge function que sincroniza o ERP-externo. Antes de dizer "resolvido":

```bash
# 1. O deploy realmente subiu? (não assumir — Knight Capital)
npx supabase functions list --project-ref $PROJ
#    ler a coluna VERSION e o updated_at da função

# 2. A função executa e responde 200?
curl -s -i -X POST "$SUPABASE_URL/functions/v1/sync-erp" \
  -H "Authorization: Bearer $ANON_KEY"

# 3. O dado mudou no banco? (a prova final é o ESTADO, não o log)
#    select count(*), max(updated_at) from pedidos_erp;

# 4. Só agora: "verificado — sync rodou às HH:MM, 132 linhas,
#    max(updated_at) de hoje"
```

Repare que os passos 1 e 3 são exatamente contra os dois desastres da §Base: o passo 1 confere que o deploy *chegou* (Knight Capital), o passo 3 confere o *estado*, não a mensagem de sucesso.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Pegue a última coisa que você chamou de "pronto" ou "funcionando" nesta semana:

1. Escreva a afirmação exata que você fez ("o sync está funcionando").
2. Marque o **selo real**: você *rodou e leu o output*, ou *leu o código*, ou *supôs*? Seja honesto — a maioria vai descobrir que era *acredito* fantasiado de *verificado*.
3. Se não for *verificado*, execute a prova mínima agora (< 2 min) e leia o estado no alvo certo.
4. Reescreva a afirmação com o selo correto e o alvo explícito ("verificado — 132 linhas em prod, `max(updated_at)` de hoje").
5. Anote quantas vezes o selo caiu de nível ao ser conferido. Esse número é a tua taxa de afirmação falsa — e o objetivo do módulo é levá-la a zero por hábito, não por sorte.

## Por que cai em entrevista

Entrevistador experiente testa isso **de propósito**: faz uma pergunta cuja resposta você não sabe e observa se você inventa. Quem responde "não sei, mas verificaria assim" ganha ponto duplo — honestidade + método. Quem inventa e é pego perde a entrevista inteira, porque toda resposta anterior entra sob suspeita retroativa: se mentiu aqui, o que mais foi chute?

> **P:** "Como você sabe que o seu fix realmente resolveu o bug?"
>
> **R (30s):** "Só digo 'resolvido' com três provas: reproduzi o bug antes do fix, rodei a mesma reprodução depois e li o output mudar, e conferi o estado final no alvo certo — banco, não log; prod, não local. Se não deu tempo de rodar, falo 'implementei mas não verifiquei' — é informação diferente de 'resolvido', e quem decide o deploy precisa saber a diferença. O custo de assumir tem caso famoso: a Knight Capital perdeu 440 milhões de dólares em 45 minutos por um 'deployado' sem prova."

> **P:** "Você afirma coisas com muita segurança. Como sei que posso confiar?"
>
> **R (30s):** "Porque eu marco a fonte da confiança em cada afirmação. Se eu digo 'verificado', rodei e li o output; se digo 'acredito', tenho base na doc mas não confirmei nesta instância; e eu falo 'não sei' sem enfeitar quando não tenho base. Isso não é falsa modéstia — é que quem decide em cima da minha palavra precisa saber se é fato ou hipótese. O Kahneman explica por que isso é difícil: o cérebro gera a mesma sensação de certeza com pouca e com muita evidência, então a sensação não serve de prova — só o experimento serve."

## Checkpoint

- [ ] Sei enunciar os três selos e usei os três em frases reais esta semana
- [ ] Respondi "não sei" pelo menos 1x sem completar com chute
- [ ] Provei um fix com a sequência reproduzir → rodar → ler output → conferir estado
- [ ] Sei explicar WYSIATI: por que a sensação de certeza não mede a evidência
- [ ] Sei contar Knight Capital em 30s como argumento pró-verificação
- [ ] Me peguei chamando leitura de código de "testado" — e corrigi para "acredito"

## Recursos

- *Thinking, Fast and Slow* — Daniel Kahneman (2011): Parte 1 (Sistema 1 vs Sistema 2) e cap. "A Machine for Jumping to Conclusions" (WYSIATI) — a base cognitiva da certeza sem evidência
- SEC — ordem administrativa sobre a Knight Capital (2013): buscar "SEC Knight Capital order 2013"
- NASA — *Mars Climate Orbiter Mishap Investigation Board Report* (1999)
- *Debugging: The 9 Indispensable Rules* — David J. Agans: Regra 3, "Quit Thinking and Look" (a evidência vence a teoria)
- Módulo-irmão `06-verificar-o-alvo-certo` — a segunda metade da prova: li a realidade **do lugar certo**?
