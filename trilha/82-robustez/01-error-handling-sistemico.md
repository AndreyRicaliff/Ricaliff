# 01 — Error Handling Sistêmico

## O que é

Tratamento de erro não é `try/catch` espalhado por instinto — é uma **política de sistema**. Cada camada declara de antemão o que faz quando algo quebra: a fronteira de entrada **falha rápido** (fail-fast: valida, rejeita, não deixa dado podre entrar), o miolo **propaga com contexto**, e a borda de saída (UI, resposta HTTP) **degrada com controle** (fail-safe). Erro sem política vira o pior dos mundos: quebra longe da causa, sem evidência.

Um erro útil responde três perguntas: **o quê** falhou (a operação, não a exceção crua), **onde** (camada, função, tenant), **com que dado** (o input, sanitizado — nunca senha/token). Desde ES2022 existe `Error.cause` pra encadear contexto sem perder a stack original:

```js
try {
  await syncPagina(loja, pagina);
} catch (err) {
  throw new Error(`sync ERP-externo: página ${pagina} da loja ${loja} falhou`, { cause: err });
}
```

**Never swallow.** `catch {}` vazio é dívida com juros compostos: o custo não é o erro perdido hoje, é o bug que reaparece semanas depois, longe da causa, sem stack, com dado corrompido já persistido. Pegadinha real dos projetos AG: `supabase-js` **não lança** em erro — retorna `{ data, error }`. Ignorar o campo `error` é um catch vazio que o linter não vê: o sync "passa" gravando dado incompleto. Regra: ou trata (com ação concreta), ou propaga com contexto. "Logar e seguir" só vale pra operação declaradamente opcional — e o log diz isso.

### Fail-fast vs fail-safe: decisão por camada, não por gosto

| Camada | Política | Por quê |
|---|---|---|
| Validação de input (API, webhook) | fail-fast | dado inválido barrado na porta custa 1 request; no banco custa migração |
| Regra de negócio (pipeline DRE/DFC do Pulsar Finance) | fail-fast | número financeiro "aproximado" é pior que ausente |
| Segurança (RLS, credencial) | fail-closed sempre | na dúvida, negar — detalhado no módulo 05 |
| UI (React) | fail-safe com error boundary | um widget quebrado não pode derrubar o app |

### Passo-a-passo: error boundary limitando o raio da explosão

Exceção durante render no React desmonta a árvore inteira — tela branca. Boundary por região isola:

```jsx
class Boundary extends React.Component {
  state = { erro: null };
  static getDerivedStateFromError(erro) { return { erro }; }
  componentDidCatch(erro, info) {
    console.error(JSON.stringify({ evento: 'render_crash', stack: info.componentStack }));
  }
  render() { return this.state.erro ? <CardErro /> : this.props.children; }
}
// dashboard do Cliente Varejo: um <Boundary> por card de KPI —
// gráfico que quebrar vira <CardErro/>, o resto do painel continua vivo
```

Teste que prova: force um `throw` num card e verifique que os outros seguem renderizando. Sem esse teste, o boundary é fé, não engenharia — evidência antes de "pronto".

## Por que cai em entrevista

Diferencia júnior de pleno em 30 segundos: júnior fala "eu uso try/catch"; pleno fala em política por camada, contexto no erro e raio de explosão. É também a pergunta favorita pra medir se o candidato já operou sistema em produção — quem já caçou bug sem stack trace nunca mais escreve catch vazio.

> **P:** "Como você trata erros numa aplicação real? Me dá um exemplo concreto."
>
> **R (30s):** "Por política de camada, não caso a caso. Na entrada eu falho rápido — validação rejeita dado inválido na porta. No miolo eu propago com contexto usando `Error.cause`: a mensagem diz qual operação, qual tenant e qual dado falhou. Na UI eu degrado: error boundary por região, então um card de dashboard quebrado vira um card de erro, não uma tela branca. E catch vazio eu trato como dívida: no sync de ERP que mantenho, o client retorna erro em campo em vez de lançar — se eu ignorasse, o sync 'passaria' gravando dado incompleto."

## Checkpoint

- [ ] Explico fail-fast vs fail-safe e digo qual camada usa qual, com justificativa
- [ ] Escrevi um erro com `Error.cause` e li a cadeia completa no console
- [ ] Encontrei (ou provoquei) um `{ data, error }` ignorado e corrigi com propagação com contexto
- [ ] Implementei um error boundary por região e provei com `throw` forçado que o resto sobrevive
- [ ] Defendo por que "logar e seguir" só vale pra operação declaradamente opcional

## Recursos

- [MDN — Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [React — Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Node.js Best Practices (goldbergyoni) — seção Error Handling](https://github.com/goldbergyoni/nodebestpractices)
- "Making reliable distributed systems in the presence of software errors" — thesis de Joe Armstrong (filosofia "let it crash" do Erlang)
