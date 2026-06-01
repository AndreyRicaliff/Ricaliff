# 02 — Camadas: Controller / Service / Repository

## O que é

A arquitetura em camadas divide o código em responsabilidades que mudam por razões diferentes. O padrão mais comum em APIs Node tem três camadas: **Controller** (HTTP), **Service** (regra de negócio) e **Repository** (persistência). A regra é simples: dado flui de fora para dentro, dependência aponta para dentro.

```
Request HTTP
     ↓
┌─────────────────┐
│   Controller    │  só sabe de HTTP: parseia req, monta res, trata status
│  (routes/*.ts)  │  NÃO contém lógica de negócio, NÃO sabe de SQL
└────────┬────────┘
         ↓
┌─────────────────┐
│    Service      │  sabe de negócio: valida, calcula, coordena
│ (services/*.ts) │  NÃO sabe de HTTP (sem req/res), NÃO escreve SQL direto
└────────┬────────┘
         ↓
┌─────────────────┐
│  Repository     │  só sabe de banco: queries, transações, mapeamento
│  (Prisma/ORM)   │  NÃO contém regra de negócio
└─────────────────┘
```

```ts
// Controller: só HTTP
recordingsRouter.post('/', async (req: AuthRequest, res) => {
  const input = RecordingSchema.parse(req.body)          // parseia e valida entrada
  const recording = await recordingService.create(input, req.userId!) // delega pro service
  res.status(201).json(recording)                        // monta resposta HTTP
})

// Service: só negócio
async function create(input: RecordingInput, userId: string): Promise<Recording> {
  const activeCount = await recordingRepo.countActive(userId)
  if (activeCount >= MAX_CONCURRENT) throw new BusinessError('limite de gravações atingido')
  return recordingRepo.insert({ ...input, userId, status: 'PENDING' })
}
```

---

## Por que cai em entrevista

É a pergunta clássica de "sabe arquitetura ou só coloca tudo na rota".

- "Como você organiza o código de uma API REST?"
- "O que vai no Controller e o que vai no Service?"
- "Por que é um problema colocar query de banco direto na rota?"
- "O que é Repository Pattern? Quando vale usar?"
- "Já ouviu falar em Onion Architecture ou Hexagonal? Qual a diferença pra camadas simples?"
- "Como você testaria essa camada sem banco de dados?"

---

## Trade-offs (quando usar X vs Y)

| Abordagem | Quando faz sentido | Custo |
|---|---|---|
| Controller + Service + Repository | Projeto médio/grande com testes; time > 1 pessoa | Mais arquivos, mais indireção |
| Controller direto no banco (sem Service) | Script simples, CRUD puro, sem regra de negócio | Dívida: lógica acumula na rota, impossível testar sem HTTP |
| Onion / Hexagonal | Quando regra de negócio é o core do produto e infra muda com frequência | Alta complexidade inicial; overkill para 90% das APIs |
| Monolito sem camadas ("scripts em rota") | Nunca — isso é o anti-padrão | Impossível testar, escala horizontal vira pesadelo |

**Regra de bolso:** se você não consegue testar a lógica de negócio sem subir o servidor e o banco, você não tem camadas de verdade.

**Onion / Hexagonal** vale quando: a lógica de negócio é tão rica que a infra (banco, fila, e-mail) é detalhe intercambiável. Para uma API CRUD de SaaS pequeno, é YAGNI. O Meet Hub não precisa de Hexagonal — precisa de Controller/Service separados.

---

## Exercício aplicado (projeto AG real)

O Meet Hub tem separação de arquivos (`routes/`, `services/`), mas há violação real: a rota `recordings.ts` importa `prisma` diretamente em vez de delegar para um service.

### Passo a passo

1. **Identificar violações na rota:**
   ```bash
   grep -n "prisma\." ~/projetos/meet-hub/apps/api/src/routes/recordings.ts | wc -l
   ```
   Esse número mostra quantas queries estão direto na rota — cada uma é uma violação: o Controller está fazendo papel de Repository.

2. **Comparar com um endpoint que usa service:**
   ```bash
   grep -n "service\|Service\|queue\|botQueue" ~/projetos/meet-hub/apps/api/src/routes/recordings.ts | head -10
   ```
   Algumas operações delegam para `queue.ts` (que é um service). Outras vão direto pro Prisma. Esse contraste é a prova concreta de violação parcial de camadas.

3. **Identificar o problema de testabilidade:**
   ```bash
   cat ~/projetos/meet-hub/apps/api/src/routes/recordings.ts | grep -A 10 "recordingsRouter.get\('\/',"
   ```
   Esse endpoint busca gravações direto com `prisma.recording.findMany`. Para testar essa lógica, você precisa de banco. Se estivesse num service, você mockaria o service nos testes sem banco.

4. **Esboçar a extração (sem commitar):**
   Pense em como ficaria um `RecordingService` com:
   - `list(userId: string)` — encapsularia o `findMany`
   - `create(input, userId)` — encapsularia o `create` + lógica de setor
   - `delete(id, userId)` — encapsularia a verificação de ownership + `delete`

5. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Violação de camadas em recordings.ts identificada

   **Problema:** rota recordings.ts usa prisma direto em ~15 queries — Controller fazendo papel de Repository.
   **Impacto:** impossível testar lógica de negócio sem banco; mudança no schema Prisma exige editar rota.
   **Opções:**
   - Extrair RecordingService com métodos list/create/delete — Service lida com negócio, rota só com HTTP
   - Manter como está (custo: cada feature nova acumula mais lógica na rota)
   **Decisão:** registrar como dívida; extrair RecordingService na próxima sessão de refatoração.
   **Como explicar em entrevista (30s):**
   > "No Meet Hub identifiquei que a rota de gravações tinha 15 queries diretas no banco — o Controller fazendo papel de Repository. O custo é que não dá testar sem banco e qualquer mudança no schema exige editar a rota. A correção é extrair RecordingService: rota só parseia HTTP, service contém a lógica, e o acesso ao banco fica isolado."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que vai no Controller e o que vai no Service? Me dá um exemplo."
>
> **R (30s):**
> "Controller sabe só de HTTP: pega a requisição, valida o formato de entrada com Zod, chama o service, monta a resposta com o status correto. Não contém regra de negócio nem sabe que banco existe.
>
> Service sabe de negócio: valida que o usuário tem permissão, calcula o que precisa, coordena múltiplas operações. Não sabe que existe HTTP — não recebe `req`/`res`, não retorna JSON.
>
> Exemplo real: no Meet Hub, a lógica de 'gravações simultâneas por usuário' deveria estar no service, não na rota. Quando está na rota, você não consegue testar essa lógica sem subir servidor."

> **P:** "Qual a diferença entre Controller/Service/Repository e Hexagonal Architecture?"
>
> **R (30s):**
> "Camadas simples são sequenciais: Controller → Service → Repository, e as dependências apontam sempre para dentro. Hexagonal vai além: coloca a lógica de negócio no centro como 'domínio', e define portas — interfaces que o domínio expõe. Banco, HTTP, fila são adaptadores que implementam essas portas. A ideia é que o domínio não sabe que existe banco ou HTTP.
>
> Para a maioria das APIs de SaaS pequeno, Hexagonal é YAGNI — Controller/Service/Repository resolve bem. Hexagonal compensa quando a lógica de negócio é tão complexa que você quer testá-la 100% sem infra."

---

## Checkpoint

- [ ] Consigo explicar o que vai em cada camada sem consultar anotação
- [ ] Contei quantas queries diretas existem em `recordings.ts` e entendo por que é problema
- [ ] Consegui desenhar no papel o fluxo Controller → Service → Repository de um endpoint real
- [ ] Sei a diferença entre camadas simples e Hexagonal com exemplo
- [ ] Recitei a resposta de entrevista em voz alta em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Camadas Controller/Service/Repository dominado`.

---

## Recursos

- Martin Fowler — [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html) (5 min de leitura)
- Martin Fowler — [Repository](https://martinfowler.com/eaaCatalog/repository.html)
- Código real: `~/projetos/meet-hub/apps/api/src/routes/recordings.ts` — violação de camadas (prisma direto)
- Código real: `~/projetos/meet-hub/apps/api/src/services/queue.ts` — exemplo de service bem isolado
