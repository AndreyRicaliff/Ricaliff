# 01 — Fundamentos sem IA

## Tese

O que você consegue explicar SEM consultar é o seu conhecimento real. O resto é leitura. Autocompletar não passa na entrevista de quadro branco — você passa. Se fechar o Claude hoje e não conseguir implementar um debounce, inverter uma lista ligada ou explicar o que é closure, você não sabe essas coisas: você sabe pedí-las. Isso não é júnior ruim, é júnior que ainda tem trabalho a fazer. O problema é fingir que não é assim.

---

## Por que isso te diferencia

Entrevistas técnicas sérias ainda têm quadro branco. O entrevistador não quer o código perfeito — quer ver você raciocinar. Quem treina sem IA chega com vocabulário, explica trade-off, pergunta clarificação. Quem nunca treinou congela nos primeiros 30 segundos. A diferença é percebida em menos de 3 minutos, independente de quanto código você gerou no dia anterior.

Fundamento sólido também te dá velocidade com IA: quem não entende `async/await` aceita código errado do Claude sem perceber. Quem entende, corrige na hora e segue.

---

## Rotina/Método/Hábito

**30 minutos sem IA, todo dia. Sem exceção.**

Protocolo:
1. Escolha 1 tópico de `00-fundamentos` ou `10-codigo-limpo` (ou da lista abaixo)
2. Feche Claude, feche Google, feche Stack Overflow
3. Escreva num `scratch.md` local ou caderno de papel: definição, 1 exemplo de código, trade-off, 1 pergunta de entrevista respondida
4. Abra Claude/MDN **só depois** — corrija o que errou, anote a diferença
5. Versão corrigida vai pro `_sem-ia.md` com data e `[ ]` vira `[x]` na lista de conceitos

**Lista de tópicos (em ordem sugerida):**
- Closure e escopo léxico
- Event loop e fila de microtasks
- Prototype chain
- Promises vs async/await — o que acontece em runtime
- Debounce e throttle (implementar do zero)
- Estruturas: lista ligada, fila, pilha
- Busca binária
- Recursão com memoization
- CSS: especificidade e cascata (regras sem framework)
- HTTP: diferença entre 4xx e 5xx, quando usar cada método

**Exercício semanal — algoritmo do zero:**
- Implementar 1 algoritmo clássico em arquivo TypeScript sem autocompletar
- Push para GitHub público (repo `algoritmos-sem-ia` ou similar)
- Commit message descreve o que aprendeu, não o que fez

---

## Exercícios

**Diário (30min):**
Protocolo acima. Registrar em `_sem-ia.md`.

**Semanal:**
Implementar 1 desses sem ajuda no primeiro round:
- `debounce(fn, ms)` com testes manuais
- `deepClone(obj)` sem JSON.parse/stringify
- `groupBy(arr, key)` sem lodash
- `LinkedList` com insert, delete, reverse
- `binarySearch(arr, target)` iterativo
- `memoize(fn)` genérico
- `EventEmitter` com on/off/emit
- `curry(fn)` para função de 2 a 3 argumentos

Depois de implementar: abrir Claude e pedir review. Corrigir. Push com ambas as versões comentadas.

**Mensal:**
Escolher 1 conceito da lista e fazer uma explicação escrita de 200-300 palavras como se fosse para um colega que nunca viu. Publicar como post LinkedIn ou gist público.

---

## Pergunta de entrevista esperada + resposta exemplar

**"Implementa um debounce sem biblioteca."**

Resposta recitável em 30s:
> "Debounce atrasa a execução de uma função até que pare de ser chamada por um tempo determinado. Internamente, guardo um timer. Cada chamada cancela o timer anterior e agenda um novo. Só executa quando o timer expira sem ser interrompido."

```typescript
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
```

Diferencial: mencionar que `this` pode ser perdido se não usar arrow function ou bind. Poucas pessoas falam isso sem treinar.

---

## Checkpoint

- [ ] Explico closure oralmente sem pausar (>30s sem hesitar)
- [ ] Explico event loop com fila de microtasks (Promise resolve antes de setTimeout)
- [ ] Implementei debounce do zero sem consulta
- [ ] Implementei lista ligada com reverse sem consulta
- [ ] Implementei busca binária sem consulta
- [ ] Tenho repo público `algoritmos-sem-ia` com >=5 commits
- [ ] `_sem-ia.md` tem >=20 entradas com data
- [ ] Consegui explicar um conceito para alguém sem abrir computador
- [ ] Fiz 1 post/gist explicando 1 conceito em português técnico
- [ ] 10 conceitos marcados como `[x]` na lista acima

---

## Recursos

- MDN Web Docs — fonte primária, não tutorial
- YDKJS (You Don't Know JS) — livro livre, capítulo por capítulo
- Exercism.io — exercícios com feedback humano, sem IA
- CS50 (Harvard) — fundamentos que não envelhecem
- LeetCode — começar por Easy, sem IA no primeiro round
