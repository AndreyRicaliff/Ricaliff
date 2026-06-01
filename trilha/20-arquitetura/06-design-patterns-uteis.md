# 06 — Design Patterns Úteis

## O que é

Design patterns são soluções reutilizáveis para problemas recorrentes de design de software. O livro Gang of Four (GoF) de 1994 catalogou 23 deles. Na prática, uns 5-7 aparecem com frequência em código moderno TypeScript/Node. Os outros 16 são patrimônio histórico que você menciona em entrevista mas raramente implementa.

Os que importam:

```ts
// Factory — cria objetos sem expor a lógica de criação
// Quando: você precisa criar variantes diferentes do mesmo conceito
function createStorage(type: 'local' | 'drive' | 's3'): Storage {
  if (type === 'local') return new LocalStorage()
  if (type === 'drive') return new DriveStorage()
  return new S3Storage()
}

// Strategy — encapsula um algoritmo e permite trocar em runtime
// Quando: a mesma operação tem N formas de executar
interface TranscriptionStrategy {
  transcribe(audioPath: string): Promise<string>
}
class GeminiTranscription implements TranscriptionStrategy { ... }
class WhisperTranscription implements TranscriptionStrategy { ... }

// Observer — notifica múltiplos "assinantes" quando algo acontece
// Quando: mudança em A deve disparar reações em B, C, D desacoplados
// O Bull queue é Observer: job.on('completed', handler) — você assina eventos

// Repository — esconde detalhes de persistência atrás de interface
// Quando: você quer trocar banco ou testar sem banco
interface RecordingRepository {
  findById(id: string): Promise<Recording | null>
  list(userId: string): Promise<Recording[]>
  save(recording: Recording): Promise<Recording>
}
class PrismaRecordingRepository implements RecordingRepository { ... }
class InMemoryRecordingRepository implements RecordingRepository { ... } // para testes

// Adapter — faz duas interfaces incompatíveis conversarem
// Quando: biblioteca externa tem interface diferente da sua
// O CLIENTE OFICINA usa isso: Firebird → interface interna → Supabase
```

**Por que GoF clássico é só 30% relevante hoje:** 23 patterns foram escritos para Java com herança pesada, sem tipos avançados e sem funções de primeira classe. TypeScript com generics, higher-order functions e discriminated unions resolve nativamente o que Visitor, Command e Chain of Responsibility resolviam com hierarquias de classe. Não decorar 23 — entender os 5-7 que aparecem no seu código.

---

## Por que cai em entrevista

- "Você conhece algum design pattern? Me dá um exemplo de onde você usou."
- "O que é Strategy pattern? Quando você o usaria?"
- "Diferença entre Factory e Builder?"
- "Por que Repository pattern facilita testes?"
- "O que é Observer? Cite uma implementação que você conhece."

---

## Trade-offs (quando usar X vs Y)

| Pattern | Problema que resolve | Custo | Quando não usar |
|---|---|---|---|
| Factory | Criação com múltiplas variantes | Mais indireção | Quando há só 1 tipo concreto |
| Strategy | Trocar algoritmo em runtime | Uma interface + N implementações | Quando nunca vai trocar |
| Observer | Desacoplar produtor de consumidores | Dificulta rastrear fluxo | Quando a cadeia de efeitos precisa ser explícita |
| Repository | Esconder detalhe de persistência | Mais código, mais arquivos | CRUD simples sem testes planejados |
| Adapter | Integrar interface incompatível | Wrapper extra | Quando você controla as duas partes |

**Regra de bolso:** implemente o pattern quando o problema aparecer pela segunda vez. Na primeira, é prematura. Na terceira, é tarde demais (você vai refatorar sob pressão).

---

## Exercício aplicado (projeto AG real)

O Meet Hub usa Bull queue. Bull implementa Observer: você assina eventos (`job.on('completed', ...)`, `botQueue.process(...)`). Vamos identificar isso no código e depois identificar onde Strategy seria valioso.

### Passo a passo

1. **Identificar Observer no Bull (queue.ts):**
   ```bash
   grep -n "\.on(\|\.process(\|\.add(" ~/projetos/meet-hub/apps/api/src/services/queue.ts | head -20
   ```
   - `.process(N, handler)` = assinar o evento "chegou job" — Observer clássico
   - `.on('completed', ...)` = assinar evento de conclusão
   - `.add(data)` = publicar evento — o produtor não sabe quem está escutando

2. **Identificar onde Strategy seria natural (transcription):**
   ```bash
   grep -n "gemini\|Gemini\|transcri" ~/projetos/meet-hub/apps/api/src/services/queue.ts | head -10
   ```
   A transcrição está hardcoded para Gemini. Se amanhã você quiser testar com Whisper ou outro modelo, vai editar `queue.ts` — violação de OCP. Com Strategy:
   ```ts
   // Antes: hardcoded
   const result = await transcribeWithGemini(audioPath)
   
   // Depois: Strategy
   const transcriber = createTranscriber(process.env.TRANSCRIPTION_PROVIDER)
   const result = await transcriber.transcribe(audioPath)
   ```

3. **Identificar Adapter no CLIENTE OFICINA:**
   ```bash
   grep -n "firebird\|Firebird" ~/projetos/cliente-oficina-backend/src/services/firebird.ts | head -10
   ```
   O `firebird.ts` é um Adapter: transforma a interface do Firebird (driver legado) em dados que o sistema entende. A lógica de sync não sabe que o banco de origem é Firebird — só sabe que recebe dados num formato.

4. **Escrever um exemplo mínimo de Repository** para treinar o conceito:
   ```ts
   // Interface — o contrato
   interface RecordingRepo {
     findById(id: string): Promise<Recording | null>
   }
   
   // Implementação de produção
   class PrismaRecordingRepo implements RecordingRepo {
     async findById(id: string) {
       return prisma.recording.findUnique({ where: { id } })
     }
   }
   
   // Implementação de teste — sem banco
   class FakeRecordingRepo implements RecordingRepo {
     private store: Recording[] = []
     async findById(id: string) {
       return this.store.find(r => r.id === id) ?? null
     }
   }
   ```
   Esse padrão permite testar o service sem banco. O prisma direto na rota torna isso impossível.

5. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Bull como implementação de Observer pattern

   **Observação:** Bull implementa Observer: `.process()` é o subscriber, `.add()` é o publisher.
   O produtor (rota) não sabe quantos workers estão escutando. O worker (queue.ts) não sabe qual rota gerou o job.
   **Por que isso importa:** desacoplamento real — posso ter 10 workers em paralelo sem mudar a rota.
   **Debt identificado:** Strategy para transcrição — hoje está hardcoded no Gemini. Trocar precisaria editar queue.ts.
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Me dê um exemplo de design pattern que você usa ou já usou."
>
> **R (30s):**
> "O Meet Hub usa Observer com a biblioteca Bull. A rota que inicia uma gravação chama `botQueue.add(data)` — ela não sabe quem vai processar nem quando. O worker em `queue.ts` chama `botQueue.process(N, handler)` para assinar esse evento. Isso é Observer: produtor publica, consumidor escuta, os dois desacoplados. O benefício prático é que posso ter N workers em paralelo só ajustando o número no `process` — sem mudar a rota."

> **P:** "Por que Repository pattern facilita testes?"
>
> **R (30s):**
> "Repository esconde o banco atrás de uma interface. O service depende da interface, não do Prisma diretamente. Para testar, crio uma implementação fake da interface que guarda dados em memória — sem banco, sem I/O, testes rápidos. O problema de ter Prisma direto na rota é que não tem interface: não tem como substituir por fake nos testes sem subir banco real."

---

## Checkpoint

- [ ] Sei identificar Observer, Strategy, Repository e Adapter no código sem dica
- [ ] Encontrei no código do Meet Hub onde Bull implementa Observer (com grep)
- [ ] Escrevi um exemplo mínimo de Repository com interface + fake de teste
- [ ] Sei quais dos 23 GoF aparecem em TypeScript moderno vs. quais são Java puro
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Design Patterns dominado`.

---

## Recursos

- Refactoring.Guru — [Design Patterns](https://refactoring.guru/design-patterns) (exemplos em TypeScript, visual)
- Gang of Four — *Design Patterns* (referência histórica — cap. 1 para contexto; o resto é consulta)
- Khalil Stemmler — [Domain-Driven Design Patterns in TypeScript](https://khalilstemmler.com/articles/typescript-domain-driven-design/) (Repository, Factory aplicados)
- Código real: `~/projetos/meet-hub/apps/api/src/services/queue.ts` — Observer (Bull), Strategy (oportunidade)
- Código real: `~/projetos/cliente-oficina-backend/src/services/firebird.ts` — Adapter
