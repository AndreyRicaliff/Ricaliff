# Mock Interview — Roteiro de Simulação

Como usar esse arquivo: rode sozinho na frente do espelho, ou abra o Claude e use o prompt template abaixo. Qualquer das duas formas, use o checklist de pré-entrevista antes.

---

## Como Pedir Mock ao Claude

Cole esse prompt no início de uma nova sessão:

```
Você é um entrevistador técnico sênior de uma empresa de tecnologia brasileira contratando dev júnior.
Faça uma entrevista técnica real de 45 minutos. Não avise quando vai mudar de assunto.
Foco desta sessão: [escolha um: JavaScript/TypeScript | banco de dados | arquitetura | segurança | comportamental]
Comece com aquecimento (apresentação + trajetória), depois entre no técnico.
Quando eu responder algo incompleto ou errado, aprofunde — não aceite resposta vaga.
Ao final, me dê feedback direto: o que foi bem, o que foi fraco, qual pergunta me derrubou.
Não seja gentil por gentileza — seja honesto.
```

Substitua o foco conforme o mock planejado (ver seção de 5 mocks abaixo).

---

## Estrutura de Mock Real (45 minutos)

### Warmup — 5 minutos
Entrevistador: "Me conta um pouco sobre você e o que você tem desenvolvido."
Objetivo: soltar a voz, estabelecer o tom. Não é hora de impressionar — é hora de criar ancoras para o técnico.
Regra: cite 2 projetos AG pelo nome e o problema que resolvem. Nada de "tenho vários projetos".

### Técnica — 25 minutos
3 a 4 perguntas técnicas. Cada uma pode ter aprofundamento.
Formato típico: conceito → exemplo prático → edge case → trade-off.
Se tiver com dificuldade: "Posso pensar em voz alta?" — sempre OK. Silêncio total por mais de 20 segundos não é OK.

### Comportamental — 10 minutos
2 perguntas no formato STAR (Situação, Tarefa, Ação, Resultado).
Perguntas típicas: "me conta um bug difícil", "como você aprendeu X", "descreva um conflito técnico".
Evite respostas hipotéticas ("eu faria...") — use exemplos reais dos projetos AG.

### Perguntas do Candidato — 5 minutos
Você pergunta ao entrevistador. Isso é avaliado.
Perguntas ruins: "qual o salário?" (não no mock), "quais os benefícios?"
Perguntas boas: "como é o processo de code review aqui?", "qual foi o maior desafio técnico do time nos últimos 6 meses?", "como é a relação entre júnior e sênior no time?"

---

## Checklist Pré-Entrevista

### 24 horas antes
- [ ] Leu o `walkthrough-projetos.md` de ponta a ponta
- [ ] Consegue fazer pitch de 30s de cada projeto AG sem consultar
- [ ] Revisou as perguntas das categorias do foco desta entrevista
- [ ] Sabe onde cada projeto está hospedado (URL de produção se houver)
- [ ] Pesquisou a empresa: produto, stack usada, vagas abertas, últimas notícias
- [ ] Preparou 3 perguntas para fazer ao entrevistador

### 2 horas antes
- [ ] Testou a conexão de internet (se remoto)
- [ ] Testou câmera e microfone
- [ ] Fechou Slack, Discord, notificações do browser
- [ ] Tem papel e caneta por perto (para desenhar diagrama se pedir)
- [ ] Leu os títulos das perguntas do `perguntas-junior.md` — não as respostas, só os títulos

### 15 minutos antes
- [ ] GitHub aberto no projeto mais relevante para a vaga
- [ ] Um copo d'água
- [ ] Respirou fundo — ansiedade leve é combustível, não problema
- [ ] Não está revisando nada — revisão agora só aumenta ansiedade. Confia no que sabe.

---

## Sinais que Você Falhou (e Como Recuperar)

**Você não sabe a resposta:**
Nunca invente. Diga: "Não sei de cabeça, mas raciocino assim: [aplique o que você sabe]." Melhor demonstrar raciocínio com base incerta do que parecer que sabe e estar errado.

**Você travou em silêncio:**
"Posso pensar em voz alta?" — e pense em voz alta mesmo que seja errado. Processo de raciocínio visível vale mais que resposta certa em silêncio.

**Você deu uma resposta rasa e o entrevistador aprofundou:**
Sinal que a resposta foi insuficiente. Não repita o mesmo com mais palavras. Diga: "Não tenho certeza sobre esse detalhe específico" e tente chegar na resposta por outro caminho.

**Você errou algo que sabe:**
Não se corrija de forma desesperada. Corrija com calma: "Errei aí — o correto é [X]." Mostrar que percebeu o erro é melhor que não perceber.

**Você percebeu que perdeu o fio:**
"Pode repetir a pergunta?" — sempre OK. Melhor que responder a pergunta errada.

**O entrevistador ficou em silêncio depois da sua resposta:**
Não preencha o silêncio com nervosismo. Silêncio não é julgamento — às vezes está anotando. Espere.

---

## Sinais que Você Foi Bem

- Entrevistador aprofundou a pergunta (está interessado, não desistindo)
- Entrevistador anotou algo enquanto você falou
- Perguntas ficaram mais difíceis ao longo da conversa (está testando seus limites)
- Entrevistador usou seu exemplo para fazer outra pergunta
- Entrevistador explicou detalhes da empresa sem você perguntar
- Você usou um projeto AG como exemplo e ele perguntou mais sobre o projeto

---

## 5 Mock Interviews Planejados

### Mock 1 — JavaScript Profundo

**Foco:** Closures, hoisting, this, prototype, async/await, Promises
**Duração:** 45min
**Prompt para Claude:** use o template base com foco `JavaScript/TypeScript`
**Critério de aprovação:** Consegue explicar closure com exemplo de portfólio AG + sabe a diferença entre `any` e `unknown` + consegue resolver "await dentro de forEach" sem consultar

**Perguntas esperadas:**
- O que é closure? Me dá um exemplo do seu código
- O que acontece se você usar await dentro de forEach?
- Qual a diferença entre Promise.all e Promise.allSettled?
- Como você tiparia o retorno de uma função que pode falhar?

**O que estudar antes se travar:** perguntas 1-10 do `perguntas-junior.md`

---

### Mock 2 — Banco de Dados

**Foco:** JOIN, índices, N+1, transactions, ACID, RLS
**Duração:** 45min
**Prompt para Claude:** use o template base com foco `banco de dados`
**Critério de aprovação:** Consegue explicar N+1 com o exemplo real do PULSAR-RH + sabe quando criar índice e quando não criar + explica RLS sem ler do papel

**Perguntas esperadas:**
- O que é N+1 e como você resolveu no seu projeto?
- Quando você criaria um índice composto em vez de dois índices simples?
- O que é uma transaction? Me dá um exemplo onde deixar de usar causaria bug
- O que é RLS? Por que colocar no banco em vez de no backend?

**O que estudar antes se travar:** perguntas 16-23 do `perguntas-junior.md`

---

### Mock 3 — Arquitetura e Boas Práticas

**Foco:** SOLID, DRY, quando usar fila, monolito vs microsserviço, cache
**Duração:** 45min
**Prompt para Claude:** use o template base com foco `arquitetura`
**Critério de aprovação:** Consegue defender por que não usou microsserviços nos projetos AG + explica Bull+Redis como decisão de negócio, não só técnica + sabe quando DRY vira problema

**Perguntas esperadas:**
- Por que seus projetos não usam microsserviços?
- Me explica o princípio S do SOLID com um exemplo do seu código
- Quando você usaria uma fila em vez de async/await direto?
- Como você pensaria em cache para o PULSAR-RH?

**O que estudar antes se travar:** perguntas 24-30 do `perguntas-junior.md`

---

### Mock 4 — Segurança

**Foco:** XSS, SQLi, CSRF, secrets, OWASP A01/A03
**Duração:** 45min
**Prompt para Claude:** use o template base com foco `segurança`
**Critério de aprovação:** Consegue contar o bug real de XSS que corrigiu no PULSAR-RH + explica RLS como A01 mitigation + sabe a diferença entre CORS e CSRF

**Perguntas esperadas:**
- Me conta um bug de segurança que você encontrou e corrigiu
- O que é XSS? Como você prevenindo no PULSAR-RH?
- Qual a diferença entre CORS e CSRF?
- Onde estão as chaves de API dos seus projetos em produção?

**O que estudar antes se travar:** perguntas 31-35 do `perguntas-junior.md`

---

### Mock 5 — Comportamental + Portfólio

**Foco:** Apresentação de projetos, tomada de decisão, aprendizado, pontos fracos
**Duração:** 45min
**Prompt para Claude:** use o template base com foco `comportamental`
**Critério de aprovação:** Pitch de 30s de qualquer projeto AG sem hesitar + consegue explicar uma decisão técnica com trade-offs reais + responde ponto fraco com honestidade e ação concreta

**Perguntas esperadas:**
- Me conta sobre o projeto mais complexo que você fez
- Por que você escolheu Supabase em vez de [alternativa]?
- Qual foi o bug mais difícil que você resolveu?
- Qual é o seu ponto fraco técnico hoje?

**O que estudar antes se travar:** perguntas 36-40 + `walkthrough-projetos.md`

---

## Pós-Mortem de Entrevista Real

Faça isso em até 24h depois da entrevista. Não espera o resultado.

### Template de pós-mortem

```
Data: 
Empresa:
Nível da vaga:
Duração:

Perguntas que me fizeram:
1. ...
2. ...
3. ...

Onde fui bem:
- ...

Onde vacilei:
- ...

O que eu disse que estava errado (verifique depois):
- ...

O que aprendi com essa entrevista específica:
- ...

O que vou estudar antes da próxima:
- ...

O que vou adicionar ao walkthrough ou perguntas:
- ...
```

### Como tratar uma recusa

Recusa não é fim — é dado. Você precisa saber em qual categoria foi reprovado:

**Se feedback foi fornecido:**
Trate como bug report. O entrevistador disse "você não soube X" → X vai para sua lista de estudo antes do próximo mock. Não é pessoal.

**Se feedback não foi fornecido (maioria dos casos):**
Reconstrua pelo que você sentiu durante a entrevista. Onde você travou? Onde a resposta foi rasa? Onde você viu o entrevistador perder interesse? Isso é seu feedback.

**O que não fazer:**
- Não peça feedback detalhado para a empresa (raramente respondem e gasta energia)
- Não analise se "foi justo" — não importa
- Não deixe passar uma semana antes de fazer o próximo mock

**O que fazer:**
- Preencher o template de pós-mortem em 24h
- Identificar 1 a 2 pontos concretos de melhora
- Agendar o próximo mock antes de dormir

Uma recusa com aprendizado concreto é progresso. Uma aprovação sem entender por que é sorte.
