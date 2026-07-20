# 05 — Degradação Graciosa

## O que é

Degradação graciosa é o app **piorar de forma controlada** em vez de cair. Quando uma dependência falha, você já decidiu de antemão o que acontece: some um pedaço não-essencial, mostra dado em cache, exibe um estado de erro acionável — mas o núcleo continua de pé. O oposto é a falha catastrófica: uma feature secundária quebra e leva a tela inteira junto.

O conceito central é uma decisão binária que você toma POR OPERAÇÃO: **fail-closed ou fail-open?**

**Fail-closed (negar por padrão) — para segurança e dinheiro.** Na dúvida, recusa. Se não dá pra confirmar a credencial do tenant, o sync NÃO roda — melhor não sincronizar do que sincronizar pro cliente errado. Se a RLS não consegue avaliar a policy, o registro NÃO aparece — melhor sumir um dado do que vazar pro tenant vizinho. É o default de tudo que, ao falhar aberto, causa dano irreversível: autorização, isolamento multi-tenant, cobrança. O adaptador do segundo provedor no Pulsar Finance é fail-closed exatamente por isso: sem mapeamento validado, ele recusa em vez de gravar dado financeiro parcial.

**Fail-open (permitir por padrão) — para conveniência não-crítica.** Na dúvida, deixa passar degradado. Se o serviço de "produtos recomendados" cai, a loja mostra a home sem a esteira de recomendação — ninguém perde a compra por causa disso. Se o avatar não carrega, mostra as iniciais. O critério: a falha causa inconveniência, não dano. Fechar aqui seria pior que abrir — bloquear a compra inteira porque a recomendação caiu é auto-sabotagem.

**A regra de ouro: o default nunca é acidente.** O modo de falha errado quase sempre nasce de "não pensei nesse caso". Segurança que falha aberta e conveniência que falha fechada são os dois bugs clássicos — e os dois vêm do mesmo lugar: ninguém decidiu, então o código decidiu por omissão.

### Passo-a-passo: feature flag como interruptor de degradação

O jeito de degradar sem deploy é ter o interruptor pronto ANTES da falha:

```ts
async function getRecomendacoes(userId: string) {
  if (!flags.recomendacoesAtivas) return [];        // interruptor manual
  try {
    return await comPrazo(fetchRecs(userId), 800);  // orçamento apertado (módulo 04)
  } catch {
    return [];   // fail-open: esteira vazia, loja intacta
  }
}
```

Duas camadas de degradação: a flag que você desliga na mão quando o serviço está com problema conhecido, e o `catch` que degrada sozinho no erro pontual. O componente que consome trata `[]` como estado vazio legítimo (módulo 42/05: os 5 estados), não como erro.

### Fallback declarado, não improvisado

Fallback bom é o que você **escolheu e documentou**: "se o cálculo ao vivo falhar, mostro o último snapshot com um selo 'dados de HH:MM'". O usuário vê que está degradado — isso é honestidade, não bug. Fallback ruim é o `catch(() => {})` que finge que deu certo: esconde a falha e transforma degradação em mentira silenciosa. A diferença é o selo visível dizendo "estou degradado".

## Por que cai em entrevista

"Fail-open vs fail-closed" é pergunta de arquitetura e de segurança ao mesmo tempo — poucos júniors sabem que a resposta é *depende da operação*, e sabem justificar qual escolher onde. E "como seu app se comporta quando o serviço X cai?" testa se você projeta pra falha ou só pro caminho feliz.

> **P:** "A API de pagamento fica intermitente. E a de recomendação de produtos também. Como cada uma deve falhar?"
>
> **R (30s):** "Direções opostas, de propósito. Pagamento é fail-closed: na dúvida eu recuso a transação — cobrar errado ou duplicado é dano irreversível, melhor falhar visível e deixar o usuário tentar de novo. Recomendação é fail-open: se cair, escondo a esteira e a loja segue vendendo — bloquear a compra porque a recomendação falhou seria auto-sabotagem. A regra que aplico: segurança e dinheiro negam por padrão, conveniência permite degradado. E o default é sempre uma decisão explícita, nunca omissão — o modo de falha errado quase sempre é 'ninguém pensou nesse caso'."

## Checkpoint

- [ ] Explico fail-closed vs fail-open e dou um exemplo real de cada
- [ ] Sei classificar uma operação nova em qual dos dois modos ela deve falhar
- [ ] Implementei degradação em 2 camadas (flag manual + catch automático)
- [ ] Diferencio fallback declarado (com selo visível) de catch que mente
- [ ] Reconheço o bug clássico: segurança que falha aberta / conveniência que falha fechada

## Recursos

- [Google SRE Book — Handling Overload / Graceful Degradation](https://sre.google/sre-book/handling-overload/)
- [Martin Fowler — FeatureToggle](https://martinfowler.com/articles/feature-toggles.html)
- "Fail fast vs fail safe" — discussão clássica de design de confiabilidade
- Módulos relacionados: `82-robustez/01` (error handling), `42-design/05` (estados da interface)
