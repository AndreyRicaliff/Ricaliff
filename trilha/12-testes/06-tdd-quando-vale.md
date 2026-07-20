# 06 — TDD: Quando Vale

## O que é

TDD (Test-Driven Development, formalizado por Kent Beck em *Test-Driven Development: By Example*, 2002) é uma disciplina de **design**, não de teste: escrever o teste ANTES do código, no ciclo **red → green → refactor**. Red: escreva um teste pequeno que falha (e veja falhar — é a prova de que o teste testa algo). Green: escreva o código mais simples que passa, mesmo que feio. Refactor: limpe com a rede verde armada. Ciclos de minutos, não de horas.

O que o TDD realmente compra — e raramente é dito com precisão: escrever o teste primeiro te obriga a **decidir a interface antes da implementação**. Você escreve `comissao(vendas)` como *usuário* da função antes de escrevê-la como autor — e interface desenhada pelo consumidor sai melhor. Efeitos colaterais: cobertura de graça e o refactor destravado.

O que o TDD **não** é: religião de 100% de cobertura, nem obrigação universal. A polêmica "TDD is dead" (DHH, 2014, seguida dos debates com Kent Beck e Martin Fowler) deixou um saldo maduro: TDD é ferramenta com zona de aplicação, não identidade. Um sênior sabe dizer onde a ferramenta funciona — e onde atrapalha.

### A zona onde TDD brilha — e onde atrapalha

| Situação | TDD? | Por quê |
|---|---|---|
| Cálculo com regra conhecida (comissão, faixa, DRE) | **Sim** | requisito claro = teste escrevível antes; a tabela de casos (módulo 03) JÁ É o red |
| Bugfix | **Sim** | reproduzir o bug num teste vermelho antes do fix — prova o fix e vira regressão pra sempre |
| Parser de payload do ERP-externo | Sim | contrato conhecido (fixture real), bordas abundantes |
| UI exploratória ("como seria esse dashboard?") | **Não** | você está *descobrindo* o requisito; teste antes congela um chute — você paga red-green pra jogar o teste fora a cada iteração de layout |
| Integração com API que você ainda não conhece | Não | primeiro um spike descartável pra APRENDER o contrato; teste vem depois do aprendizado |

O caso da UI merece o raciocínio explícito, porque é o erro clássico do convertido a TDD: teste pressupõe **requisito estável**. Dashboard em fase de "será que o cliente prefere card ou tabela?" muda de forma três vezes por dia — cada teste escrito antes é aposta em requisito que vai morrer. A sequência honesta: explorar sem teste → cliente aprovou → *aí* extrair a lógica que sobrou pra função pura e testar. Teste-depois com a regra estabilizada não é pecado — é timing correto.

### Passo a passo: um ciclo real (streak do hub)

Regra do hub: streak = dias consecutivos com commit; dia sem commit zera.

```ts
// RED — escrever primeiro, rodar, VER falhar:
it('dia sem commit zera o streak', () => {
  expect(streak(['2026-07-15', '2026-07-17'], hoje('2026-07-17'))).toBe(1);
});
// → ReferenceError: streak is not defined  ← red honesto

// GREEN — o mínimo que passa (sem generalizar ainda)
// REFACTOR — nomes, extrair diffDias(), rede verde protege
```

Disciplina anti-autoengano: se o teste novo **nasce verde**, pare — ou o caso já era coberto, ou o teste não testa o que você pensa. Red primeiro é o mecanismo de refutação embutido no ciclo: você prova que o teste é capaz de falhar antes de confiar nele. É o mesmo princípio de "quebrar o teste de propósito" do módulo 02, só que de graça.

## Por que cai em entrevista

"Você usa TDD?" é pergunta-armadilha dupla: o "sim" dogmático soa como quem nunca sentiu o atrito em UI; o "não" seco soa como quem nunca experimentou. A resposta forte demonstra a prática E o critério de quando não usar — critério é o que separa pleno de júnior.

> **P:** "Você pratica TDD? Sempre?"
>
> **R (30s):** "Pratico onde ele rende: lógica de negócio com regra conhecida e bugfix — bug vira teste vermelho antes do fix, o que prova o fix e me dá regressão de graça. Em UI exploratória eu deliberadamente não uso: ali estou descobrindo o requisito, e teste escrito antes congela um chute que vai mudar três vezes no dia — escrevo o teste quando a regra estabiliza e extraio a lógica pra função pura. O que considero inegociável não é a ordem, é ver o teste falhar em algum momento: teste que nasceu verde e nunca ficou vermelho não provou nada."

## Checkpoint

- [ ] Fiz 1 ciclo red-green-refactor completo numa função real, vendo o red antes do green
- [ ] Transformei 1 bug real em teste vermelho ANTES de corrigir
- [ ] Sei explicar por que TDD pressupõe requisito estável (e por que UI exploratória viola isso)
- [ ] Sei explicar o que o red prova (que o teste é capaz de falhar) em 1 frase
- [ ] Consigo defender teste-depois como decisão legítima, com critério, em entrevista

## Recursos

- Kent Beck — *Test-Driven Development: By Example* (livro, 2002)
- [Is TDD Dead? — série de conversas Beck/Fowler/DHH (martinfowler.com)](https://martinfowler.com/articles/is-tdd-dead/)
- [Canon TDD — Kent Beck (Substack)](https://tidyfirst.substack.com/p/canon-tdd) — o autor corrigindo as distorções da prática
- Ian Cooper — talk "TDD, Where Did It All Go Wrong" (buscar pelo título)
