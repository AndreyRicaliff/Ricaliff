# 08 — Teste de Falha

## O que é

Quase todo teste prova que o **caminho feliz** funciona: dado bom entra, resultado certo sai. Mas em produção o que derruba você é o caminho infeliz — a API que cai, a credencial que expira, o disco que enche, o JSON malformado do fornecedor. Teste de falha é injetar essas falhas **de propósito**, num ambiente controlado, para descobrir se o seu plano de degradação (módulo 05), seu retry (módulo 02) e seus timeouts (módulo 04) realmente funcionam — ou se são teoria que nunca foi exercitada.

O princípio, emprestado do **chaos engineering** (Netflix, com o Chaos Monkey que mata instâncias em produção de propósito): **um plano de falha que nunca foi testado é ficção.** Você acha que o fallback funciona. Você acha que o retry para depois de 3 tentativas. Você acha que o timeout dispara. "Acho" não é "sei" — e a diferença entre os dois é ter derrubado a dependência de propósito e olhado o que aconteceu. Toda a trilha `05-raciocinio` mora aqui: evidência antes de afirmar, "não testei" como resposta honesta.

Você não precisa do Chaos Monkey em produção pra começar. **Chaos caseiro** é suficiente e você faz hoje:

- **Derrube a dependência:** aponte o `SUPABASE_URL` pra uma porta morta e veja se o app degrada ou explode. Deveria mostrar erro acionável, não tela branca.
- **Expire a credencial:** troque a service key por uma inválida. O gate fail-closed (módulo 05) recusa, ou vaza uma chamada sem auth?
- **Estrague o dado:** injete o JSON malformado que o ERP-externo realmente manda (o `\` solto no meio de um campo de texto). Seu parser resiliente segura, ou a loja inteira some?
- **Atrase a resposta:** ponha um `sleep(10s)` no mock da API externa. Seu timeout de 4s dispara e faz fallback, ou o request fica pendurado?
- **Encha o caminho:** simule o retorno de 10.000 registros onde você esperava 100. Paginação segura, ou estoura memória?

### Passo-a-passo: teste que injeta a falha

```ts
it('degrada quando o ERP não responde', async () => {
  const fetchLento = () => new Promise((_, rej) =>
    setTimeout(() => rej(new Error('ETIMEDOUT')), 50)); // simula timeout
  const resultado = await sincronizarComFallback(fetchLento);
  expect(resultado.status).toBe('degradado');   // fallback disparou
  expect(resultado.dados).toEqual(cacheAnterior); // serviu cache, não quebrou
});

it('não duplica quando o webhook reentrega', async () => {
  const payload = { id: 'evt_1' };
  await Promise.all([processar(payload), processar(payload)]); // corrida real
  expect(await contar('webhook_eventos')).toBe(1);  // idempotência provada
});
```

Cada teste desses vale mais que dez do caminho feliz, porque testa a decisão que você tomou sob pressão de design — e a maioria dos bugs de produção mora exatamente aí, no caminho que ninguém exercitou.

### A hierarquia da confiança

"Compila" < "passa no teste feliz" < "passa no teste de falha" < "sobreviveu à falha real em staging". Cada degrau é uma afirmação mais forte sobre robustez. Dizer "é robusto" parando no segundo degrau é o erro clássico. Robustez é uma propriedade que você **prova exercitando a falha**, não que você declara escrevendo o try/catch.

## Por que cai em entrevista

"Como você testa o que acontece quando X falha?" separa quem pensa em robustez de quem só pensa em feature. Chaos engineering é palavra que impressiona, mas o que importa é você demonstrar que testa o caminho infeliz — porque é lá que produção quebra, e o entrevistador sabe disso.

> **P:** "Você diz que seu sistema é resiliente a falha do serviço externo. Como você sabe que é, de verdade?"
>
> **R (30s):** "Porque eu derrubei o serviço de propósito e olhei. Resiliência que nunca viu a falha acontecer é suposição, não fato. No mínimo eu injeto a falha em teste: mock que dá timeout pra provar que o fallback dispara, payload duplicado em paralelo pra provar idempotência, JSON malformado que o fornecedor real manda pra provar que o parser segura. A régua que eu uso: 'compila' e 'passa no teste feliz' não são robustez — robustez é ter exercitado o caminho infeliz e visto o sistema degradar como planejado, não explodir."

## Checkpoint

- [ ] Explico por que teste de caminho feliz não prova robustez
- [ ] Sei descrever chaos engineering e por que "plano de falha não testado é ficção"
- [ ] Fiz chaos caseiro: derrubei uma dependência de propósito e observei o comportamento
- [ ] Escrevi teste que injeta timeout/erro e asserta o fallback
- [ ] Sei recitar a hierarquia da confiança (compila < feliz < falha < staging)

## Recursos

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Netflix — Chaos Monkey](https://netflix.github.io/chaosmonkey/)
- "Chaos Engineering" — Rosenthal & Jones (O'Reilly), capítulos iniciais gratuitos
- Módulos relacionados: `82-robustez/02` (retry), `04` (timeouts), `05` (degradação), `12-testes/01` (pirâmide)
