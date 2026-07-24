# 06 — TDD: Quando Vale

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

TDD (Test-Driven Development) é escrever o teste **antes** do código, no ciclo **red → green → refactor**. Mas a definição mecânica esconde o ponto: TDD é uma disciplina de **design**, não de teste. E, ao contrário do que o converso empolgado prega, não é obrigação universal — tem uma zona onde rende e uma onde atrapalha. O que separa pleno de júnior aqui não é praticar TDD; é saber **onde a ferramenta funciona e onde não**, e defender essa fronteira com critério.

---

## § BASE — o fundamento

**A fonte e o ciclo.** TDD foi formalizado por **Kent Beck** em *Test-Driven Development: By Example* (2002). O ciclo tem três fases curtas — minutos, não horas:

- **Red:** escreva um teste pequeno que **falha**, e **veja falhar**. Ver o vermelho é a prova de que o teste testa algo (o mesmo princípio de refutação dos módulos 02 e do `05-raciocinio`).
- **Green:** escreva o código **mais simples** que passa, mesmo feio — Beck admite explicitamente "fake it" (retornar a constante) até um segundo caso forçar a generalização.
- **Refactor:** limpe com a rede verde armada.

**O que o TDD realmente compra — e raramente é dito com precisão.** Não é "cobertura". Escrever o teste primeiro te obriga a **decidir a interface antes da implementação**: você escreve `comissao(vendas)` como *usuário* da função antes de escrevê-la como autor, e interface desenhada pelo consumidor sai melhor. Cobertura e refactor destravado são **efeitos colaterais**; o produto principal é o design da interface e o feedback em passos minúsculos.

**A polêmica — e o saldo maduro.** Em 2014 **DHH** (David Heinemeier Hansson) publicou *TDD is dead. Long live testing.* e a keynote da RailsConf, disparando a série de conversas gravadas com **Kent Beck** e **Martin Fowler** (*Is TDD Dead?*, hospedada em martinfowler.com). O saldo não foi "TDD morreu"; foi o amadurecimento: **TDD é ferramenta com zona de aplicação, não identidade.** DHH atacou o dogma (test-first sempre, mock de tudo, cobertura como fim); Beck e Fowler defenderam a prática onde ela cabe. Um sênior sai desse debate sabendo dizer onde a ferramenta funciona — e onde atrapalha.

**A evidência empírica é contestada — declare isso.** A crença "TDD melhora a qualidade" tem suporte fraco e disputado, e honestidade exige dizer isso. O estudo de **Nagappan et al.** (Microsoft Research + IBM, 2008, *Realizing quality improvement through test driven development*) reportou **40–90% menos defeitos** em times que adotaram TDD, ao custo de **15–35% mais tempo** de desenvolvimento inicial — mas eram estudos de caso, sem grupo de controle randomizado. Replicações controladas posteriores, como as de **Fucci et al.** (2016), encontraram que o **ordenamento test-first em si** teve efeito pequeno; o que parecia importar era trabalhar em **passos pequenos e uniformes** — algo que teste-depois disciplinado também entrega. Conclusão calibrada: o valor do TDD provavelmente vem do *ritmo de passos curtos e do design pela interface*, não da ordem literal "teste antes". Trate ganho de qualidade como **plausível mas não provado**, não como fato.

**A economia por trás de "testar cedo" — e sua própria incerteza.** O argumento clássico do "shift-left" é a curva de custo de **Barry Boehm** (*Software Engineering Economics*, 1981): quanto mais tarde um defeito é pego, mais caro sair dele. É a motivação econômica de prender o bug num teste antes do fix. Porém — e isto é rigor, não nota de rodapé — os multiplicadores exatos (o famoso "1:10:100") têm base empírica frágil; **Laurent Bossavit** (*The Leprechauns of Software Engineering*, 2015) rastreou essas citações e mostrou que muitas se apoiam em fontes circulares ou inexistentes. Use a *direção* (pegar cedo tende a custar menos) com confiança; desconfie dos *números precisos*.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O ciclo é um loop curto; a decisão de *usar* o ciclo depende de uma variável: o requisito é estável?

```
   O CICLO (minutos, não horas)
        ┌──────────────┐
        │  RED  ◄───────┼──── veja falhar (prova que o teste testa algo)
        │   │           │
        │   ▼           │
        │ GREEN         │──── o mínimo que passa, mesmo feio ("fake it")
        │   │           │
        │   ▼           │
        │ REFACTOR ──────┘──── limpe com a rede verde armada
        └──────────────┘

   A ZONA DE APLICAÇÃO (a pergunta que decide)
                    requisito ESTÁVEL?
            SIM ────────────────────► NÃO
   ┌────────────────────┐   ┌──────────────────────────┐
   │ cálculo com regra  │   │ UI exploratória           │
   │ bugfix (bug→red)   │   │ API que você não conhece  │
   │ parser de contrato │   │ (spike descartável antes) │
   │ → TDD RENDE        │   │ → TDD ATRAPALHA           │
   └────────────────────┘   └──────────────────────────┘
```

A regra estrutural: **TDD pressupõe requisito estável.** Onde o requisito está claro (a tabela de casos do módulo 03 JÁ É o red), o ciclo flui. Onde você ainda está *descobrindo* o requisito, o teste escrito antes congela um chute que vai mudar — e você paga red-green só pra jogar o teste fora.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CLASSIFICAR a tarefa: o requisito é estável?** Regra conhecida (comissão, faixa, DRE) ou bug reproduzível → TDD. Descoberta de layout ou de contrato desconhecido → não.

**2. RED:** escreva o menor teste que falha e **veja o vermelho**. Se nasce verde, pare — ou o caso já era coberto, ou o teste não testa o que você pensa.

**3. GREEN:** o mínimo que passa, sem generalizar antes da hora. "Fake it" é legítimo.

**4. REFACTOR:** limpe nomes, extraia funções, com a rede verde protegendo.

**5. REPETIR** em ciclos de minutos até a regra estar completa.

**Para UI/descoberta:** explore **sem** teste → cliente aprovou a forma → *aí* extraia a lógica que sobrou pra função pura e teste-a. Teste-depois com a regra estabilizada é **timing correto**, não pecado.

**Anti-padrões:**
- **TDD em UI exploratória:** congela um requisito que ainda muda três vezes por dia — você escreve teste pra jogar fora.
- **Teste que nasce verde:** não provou nada; ou já era coberto, ou está errado. Red primeiro é o mecanismo de refutação embutido.
- **Generalizar no green:** escrever a implementação "esperta" antes de um segundo caso forçá-la; some com o feedback de passos curtos.
- **TDD como identidade:** transformar em dogma de 100% cobertura. É ferramenta com zona, não religião (o saldo do "Is TDD Dead?").

---

## Passo-a-passo aplicado (faça agora, ~25min)

Regra do **hub**: streak = dias consecutivos com commit; dia sem commit zera.

```ts
// RED — escrever primeiro, rodar, VER falhar:
it('dia sem commit zera o streak', () => {
  expect(streak(['2026-07-15', '2026-07-17'], hoje('2026-07-17'))).toBe(1);
});
// → ReferenceError: streak is not defined  ← red honesto

// GREEN — o mínimo que passa (sem generalizar ainda)
// REFACTOR — nomes, extrair diffDias(), rede verde protege
```

Faça o ciclo completo numa função real, sentindo o red antes do green. Depois pegue **um bug real** que você resolveu: reconstrua-o como teste vermelho ANTES do fix — o teste prova o fix e vira **regressão pra sempre** (o gancho para o módulo 07). Disciplina anti-autoengano: se o teste novo nasce verde, pare e descubra por quê. Red primeiro é o "quebrar o teste de propósito" do módulo 02, só que de graça.

## Por que cai em entrevista

"Você usa TDD?" é pergunta-armadilha dupla: o "sim" dogmático soa como quem nunca sentiu o atrito em UI; o "não" seco soa como quem nunca experimentou. A resposta forte demonstra a prática E o critério de quando não usar — critério é o que separa pleno de júnior.

> **P:** "Você pratica TDD? Sempre?"
>
> **R (30s):** "Pratico onde ele rende: lógica de negócio com regra conhecida e bugfix — bug vira teste vermelho antes do fix, o que prova o fix e me dá regressão de graça. Em UI exploratória eu deliberadamente não uso: ali estou descobrindo o requisito, e teste escrito antes congela um chute que vai mudar três vezes no dia — escrevo o teste quando a regra estabiliza e extraio a lógica pra função pura. O que considero inegociável não é a ordem, é ver o teste falhar em algum momento: teste que nasceu verde e nunca ficou vermelho não provou nada."

> **P:** "Tem evidência de que TDD melhora a qualidade do código?"
>
> **R (30s):** "A evidência é mista, e eu prefiro ser honesto sobre isso. O estudo da Microsoft e IBM do Nagappan em 2008 achou de 40 a 90% menos defeitos com TDD, mas ao custo de mais tempo inicial e sem grupo de controle. Replicações controladas depois, tipo o Fucci em 2016, sugerem que o ordenamento 'teste primeiro' em si tem efeito pequeno — o que parece render é trabalhar em passos pequenos e uniformes, que teste-depois disciplinado também dá. Então eu trato o ganho de qualidade como plausível, não provado, e vendo o TDD pelo que ele comprovadamente entrega: me obriga a desenhar a interface antes da implementação e me dá regressão de graça. O que eu não faço é vender TDD como bala de prata baseado em número de multiplicador que nem o Boehm original sustenta direito."

## Checkpoint

- [ ] Fiz 1 ciclo red-green-refactor completo numa função real, vendo o red antes do green
- [ ] Transformei 1 bug real em teste vermelho ANTES de corrigir
- [ ] Sei explicar por que TDD pressupõe requisito estável (e por que UI exploratória viola isso)
- [ ] Sei explicar o que o red prova (que o teste é capaz de falhar) em 1 frase
- [ ] Sei declarar a incerteza da evidência de TDD (Nagappan × Fucci) em vez de vendê-la como fato
- [ ] Consigo defender teste-depois como decisão legítima, com critério, em entrevista

## Recursos

- Kent Beck — *Test-Driven Development: By Example* (2002): Parte I (o exemplo Money, o ciclo red-green-refactor) — leitura obrigatória do módulo (SYLLABUS)
- *Is TDD Dead?* — série de conversas Beck / Fowler / DHH (martinfowler.com/articles/is-tdd-dead): o debate que amadureceu a prática
- Kent Beck — *Canon TDD* (tidyfirst.substack.com): o autor corrigindo as distorções da prática
- Nagappan et al. — *Realizing quality improvement through test driven development* (Microsoft Research/IBM, 2008) e Fucci et al. (2016): a evidência empírica e suas ressalvas
- Laurent Bossavit — *The Leprechauns of Software Engineering* (2015): a base frágil dos multiplicadores "1:10:100" da curva de custo de Boehm
- Ian Cooper — talk *TDD, Where Did It All Go Wrong* (buscar pelo título): testar comportamento pela API pública, não implementação
