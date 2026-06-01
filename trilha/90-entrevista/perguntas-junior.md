# Banco de Perguntas — Dev Júnior

40 perguntas reais. Para cada uma: resposta defensável, onde no portfólio prova, e o que mata candidatos.

---

## JavaScript / TypeScript

### 1. O que é closure e quando ela aparece na prática?

**Resposta-base (30s):**
Closure é quando uma função interna mantém acesso ao escopo da função externa mesmo depois que a externa já terminou de executar. Aparece toda vez que você usa callbacks, event listeners, ou fábricas de função — é a base do módulo pattern.

**Onde no portfólio AG:**
PULSAR-RH — qualquer hook customizado (`useAuth`, `usePesquisa`) encapsula estado e expõe apenas o que precisa. O estado interno não vaza pro componente, mas a função retornada consegue acessá-lo. Isso é closure aplicado.

**Armadilha:**
Não confundir com "variável global". Se você disser "closure é tipo uma variável que fica salva", o entrevistador vai encerrar o raciocínio ali.

---

### 2. Hoisting: o que sobe e o que não sobe?

**Resposta-base (30s):**
`var` e declarações de função sobem ao topo do escopo com seu valor/definição. `let` e `const` também sobem, mas ficam na Temporal Dead Zone — não podem ser acessados antes da declaração. O que não sobe é a atribuição. `const f = () => {}` sobe como `undefined`, não como função.

**Onde no portfólio AG:**
No IFPB — eliminei todos os `var` do código original e aprendi exatamente por quê: `var` dentro de loop com `setTimeout` captura a variável, não o valor. Esse bug de closure+hoisting junto.

**Armadilha:**
Dizer "só `var` faz hoisting". Errado. Tudo sobe — o que muda é o estado inicial.

---

### 3. Como `this` funciona em JavaScript?

**Resposta-base (30s):**
`this` é definido em tempo de execução, não de definição — exceto em arrow functions, onde é léxico (captura o `this` de onde foi criada). Em função normal, `this` depende de quem chama: método de objeto → o objeto; função solta → `undefined` (strict) ou `window`; `.call/.apply/.bind` → o que você passar.

**Onde no portfólio AG:**
Meet Hub — manipulação de instâncias do Puppeteer onde métodos de classe perdiam o `this` ao ser passados como callbacks. Solução: arrow function nos métodos ou bind explícito no construtor.

**Armadilha:**
Dizer que arrow function "não tem `this`". Ela tem — é só léxico, não dinâmico.

---

### 4. `===` vs `==` — quando cada um é válido?

**Resposta-base (30s):**
`===` não faz coerção de tipo. `==` faz, com regras não-óbvias: `0 == false` é `true`, `null == undefined` é `true`, `"" == 0` é `true`. Em produção, sempre `===`. A única exceção legítima para `==` é checar `null || undefined` de uma vez: `valor == null` — mas prefiro `valor === null || valor === undefined` por clareza.

**Onde no portfólio AG:**
CLAUDE.md da AG define isso como regra: todo `==` vira `===`. Aplico em code review no PULSAR-RH.

**Armadilha:**
"São a mesma coisa, só que um é mais seguro." Não explica o mecanismo. O entrevistador quer saber que você entende coerção.

---

### 5. `??` vs `||` — qual a diferença real?

**Resposta-base (30s):**
`||` retorna o lado direito quando o lado esquerdo é qualquer falsy: `0`, `""`, `false`, `null`, `undefined`. `??` só considera `null` e `undefined`. Então `0 || 10` retorna `10` (errado se zero é válido), mas `0 ?? 10` retorna `0` (correto). Em formulários com campos numéricos, `??` é o certo.

**Onde no portfólio AG:**
PULSAR-RH — campos de pesquisa com pontuação: `score || 0` causava bug onde score zero era substituído. Corrigi para `score ?? 0`.

**Armadilha:**
"Uso `||` porque é mais comum." Se você não sabe quando quebraria, o entrevistador vai testar com `0` ou `false` e você cai.

---

### 6. `var`, `let`, `const` — diferença de escopo?

**Resposta-base (30s):**
`var` tem escopo de função e sofre hoisting com valor `undefined`. `let` e `const` têm escopo de bloco. `const` impede reatribuição — mas não imutabilidade: um objeto `const` tem suas propriedades mutáveis. Regra: `const` por padrão, `let` quando precisa reatribuir, `var` nunca.

**Onde no portfólio AG:**
CLAUDE.md define isso como padrão. Qualquer `var` encontrado em code review é corrigido imediatamente, incluindo os scripts de sync do CLIENTE OFICINA.

**Armadilha:**
"const é imutável." Se o entrevistador perguntar se você pode fazer `const arr = []; arr.push(1)`, você precisa responder que sim — e saber por quê.

---

### 7. Como async/await funciona por baixo?

**Resposta-base (30s):**
`async/await` é açúcar sintático sobre Promises. Uma função `async` sempre retorna uma Promise. `await` pausa a execução daquela função (não do processo inteiro) até a Promise resolver. Por baixo, o engine transforma em encadeamento de `.then`. O event loop continua rodando outras coisas enquanto espera.

**Onde no portfólio AG:**
CLIENTE OFICINA — sync incremental com `await` em série causava lentidão. Refatorei para `Promise.all` onde os fetches eram independentes. Reduziu tempo de ciclo.

**Armadilha:**
Dizer que `await` "bloqueia o servidor". Não bloqueia — suspende a coroutine, libera o event loop.

---

### 8. Quando usar `type` vs `interface` em TypeScript?

**Resposta-base (30s):**
`interface` para forma de objetos e classes — é extensível via `extends` e declaration merging. `type` para tudo que `interface` não faz: unions, intersections, tipos primitivos, tuplas. Quando tenho dúvida em objeto simples, uso `interface`. Quando preciso de union ou tipo calculado, `type`.

**Onde no portfólio AG:**
PULSAR-RH — `type SyncStatus = 'idle' | 'running' | 'error'` é discriminated union com `type`. O shape de `Funcionario` é `interface` porque precisei estender em `FuncionarioComRisco`.

**Armadilha:**
"São iguais, uso qualquer um." O entrevistador vai perguntar sobre declaration merging ou union e você não vai ter resposta.

---

### 9. `any` vs `unknown` — quando usar cada um?

**Resposta-base (30s):**
`any` desliga o TypeScript — você perde toda checagem. `unknown` é "qualquer coisa, mas você precisa verificar antes de usar." Com `unknown`, o compilador força narrowing: `if (typeof x === 'string')`. Regra: `unknown` em boundary (dados de API, `JSON.parse`), `any` nunca — se precisar escapar do sistema de tipos, uso `as` com type guard.

**Onde no portfólio AG:**
PULSAR-RH — retorno da Supabase para dados dinâmicos de pesquisa chegava como `unknown`, fiz narrowing antes de usar. Eliminei todos os `any` do codebase em uma refatoração.

**Armadilha:**
"any e unknown são a mesma coisa, unknown é só mais seguro." Não é — `unknown` sem narrowing não compila. A diferença é se o compilador te ajuda ou não.

---

### 10. O que é prototype chain?

**Resposta-base (30s):**
Todo objeto em JS tem um `[[Prototype]]` interno que aponta para outro objeto. Quando você acessa uma propriedade, o engine procura no objeto, depois no prototype, depois no prototype do prototype, até `null`. `class` em JS é açúcar sobre prototype. `Array.prototype.map` existe uma vez — todos os arrays acessam via chain, não têm cópia.

**Onde no portfólio AG:**
IFPB — estudos de OOP em TypeScript. Entender que `class` compila para função construtora + prototype explica por que métodos de classe não precisam ser redefinidos por instância.

**Armadilha:**
"Prototype é tipo herança de classe." É herança, mas por delegação — não por cópia. Se você não souber essa distinção, o entrevistador vai explorar.

---

## HTTP / REST

### 11. Diferença entre GET, POST, PUT, PATCH, DELETE?

**Resposta-base (30s):**
GET: leitura, sem body, idempotente, cacheável. POST: criação ou ação, não idempotente. PUT: substituição total do recurso, idempotente. PATCH: atualização parcial, geralmente não idempotente. DELETE: remoção, idempotente. A distinção crítica: GET e DELETE não têm body semântico. PUT vs PATCH: PUT envia tudo, PATCH só o que muda.

**Onde no portfólio AG:**
Meet Hub (Node+Express) — API REST com todos os verbos corretos. PATCH `/sessions/:id/status` para atualizar só o status, sem reenviar o objeto inteiro.

**Armadilha:**
"POST é para criar e PUT para atualizar." Incompleto — PUT substitui, não atualiza. E idempotência importa para retry logic.

---

### 12. O que significa idempotência em HTTP?

**Resposta-base (30s):**
Uma operação idempotente produz o mesmo resultado independente de quantas vezes for executada. GET, PUT, DELETE são idempotentes. POST não é — chamar duas vezes cria dois recursos. Prático: se uma requisição falha e o cliente não sabe se chegou, pode retentar PUT/DELETE com segurança. POST precisa de idempotency key.

**Onde no portfólio AG:**
CLIENTE OFICINA — o sync retry+backoff funciona porque o upsert no Supabase é idempotente: se o registro já existe com aquele ID, atualiza; se não, cria. Nunca duplica.

**Armadilha:**
Confundir com "sem efeito colateral". Idempotente pode ter efeito colateral — só precisa ter o mesmo resultado na segunda chamada.

---

### 13. O que é CORS e por que existe?

**Resposta-base (30s):**
CORS é o mecanismo que permite (ou bloqueia) que o browser faça requisições cross-origin. Sem CORS, um site malicioso poderia fazer requests autenticados para sua API usando os cookies do usuário. O browser bloqueia por padrão e a API precisa retornar os headers `Access-Control-Allow-Origin` corretos. CORS é proteção do browser — não existe em server-to-server.

**Onde no portfólio AG:**
PULSAR-RH + Vercel — configurei CORS explicitamente nas Edge Functions para aceitar só as origens do domínio AG. Erro de CORS em desenvolvimento me ensinou a diferença entre preflight e request real.

**Armadilha:**
"CORS é um problema de segurança do meu servidor." Não — é proteção do browser. Desabilitar no servidor com `*` resolve o erro mas remove a proteção.

---

### 14. Status codes — quais você sabe de cabeça?

**Resposta-base (30s):**
200 OK, 201 Created, 204 No Content. 301 Moved Permanently, 302 Found. 400 Bad Request (input inválido), 401 Unauthorized (não autenticado), 403 Forbidden (autenticado mas sem permissão), 404 Not Found, 409 Conflict, 422 Unprocessable Entity (validação). 500 Internal Server Error, 503 Service Unavailable. A distinção 401 vs 403 é a que mais cai em entrevista.

**Onde no portfólio AG:**
PULSAR-RH — autenticação multi-portal: 401 quando token expirado (precisa re-logar), 403 quando usuário logado tenta acessar tenant que não é o dele (RLS bloqueou).

**Armadilha:**
Usar 200 para tudo ou retornar 500 para erro de validação. Entrevistadores de API testam isso diretamente.

---

### 15. Como funciona cache HTTP?

**Resposta-base (30s):**
O cliente (ou CDN) armazena a resposta e evita nova requisição. Os headers principais: `Cache-Control` define tempo e estratégia (`max-age`, `no-cache`, `no-store`), `ETag` é hash do conteúdo para validação condicional, `Last-Modified` é alternativa por data. `no-cache` não significa sem cache — significa revalidar antes de usar. `no-store` é sem cache de verdade.

**Onde no portfólio AG:**
AG Hub no Vercel — assets estáticos com `Cache-Control: max-age=31536000, immutable` (hash no nome do arquivo). API responses com `no-cache` para dados de RH que mudam com frequência.

**Armadilha:**
"Coloco no-cache quando não quero cache." Correto, mas não saber a diferença entre no-cache e no-store vai aparecer como lacuna.

---

## Banco de Dados

### 16. O que é um JOIN e quais tipos existem?

**Resposta-base (30s):**
JOIN combina linhas de duas tabelas com base em uma condição. INNER JOIN retorna só o que existe nos dois lados. LEFT JOIN retorna todos da esquerda + correspondências da direita (null onde não há). RIGHT JOIN é o espelho. FULL OUTER JOIN retorna tudo dos dois. Em 90% dos casos uso INNER ou LEFT. RIGHT JOIN é LEFT com as tabelas trocadas — evito por clareza.

**Onde no portfólio AG:**
PULSAR-RH — relatório de funcionários com departamentos: `LEFT JOIN departments` para manter funcionários sem departamento atribuído (que existem durante onboarding).

**Armadilha:**
Só saber INNER. Se o entrevistador perguntar "e se um funcionário não tiver departamento?", você precisa responder LEFT JOIN sem hesitar.

---

### 17. O que é um índice e quando criar um?

**Resposta-base (30s):**
Índice é uma estrutura auxiliar (normalmente B-tree) que acelera buscas evitando full table scan. Criar em colunas de WHERE frequente, colunas de JOIN, colunas de ORDER BY em tabelas grandes. O custo: índice ocupa espaço e desacelera writes (INSERT/UPDATE/DELETE precisam atualizar o índice). Não crie em todas as colunas — analise o query plan primeiro.

**Onde no portfólio AG:**
CLIENTE OFICINA — tabela de sincronização com coluna `external_id` sem índice causava full scan na cada ciclo de 5min. Adicionei o índice e o tempo de query caiu de ~800ms para ~12ms.

**Armadilha:**
"Coloco índice em tudo para ficar mais rápido." O entrevistador vai perguntar sobre o custo em writes e você cai.

---

### 18. O que é o problema N+1?

**Resposta-base (30s):**
N+1 acontece quando você busca N registros e faz 1 query adicional para cada um. Exemplo: buscar 100 posts (1 query) e para cada post buscar o autor (100 queries) = 101 queries. Solução: eager loading com JOIN ou include (`select * from posts join users`) — traz tudo em 1 query. ORMs como Prisma têm `include` exatamente para isso.

**Onde no portfólio AG:**
PULSAR-RH — detectei N+1 em um relatório que buscava funcionários e para cada um fazia query de riscos separada. Corrigi com join + refatoração da query para trazer tudo junto. Um dos 5 pontos O(n²)→O(n) da revisão.

**Armadilha:**
Confundir com "muitas queries". O problema não é o número absoluto — é a estrutura proporcional ao dado.

---

### 19. O que é uma transaction e quando usar?

**Resposta-base (30s):**
Transaction agrupa operações que devem ser atômicas: ou todas acontecem, ou nenhuma. Se você move saldo de A para B, precisa de transaction — se o crédito em B falhar, o débito em A precisa ser revertido (rollback). Usar quando múltiplas escritas formam uma operação de negócio indivisível.

**Onde no portfólio AG:**
CLIENTE OFICINA — sync de itens: inserção + atualização de metadados de controle precisam ser atômicas. Se o sync do item inserir mas a atualização do `last_sync` falhar, o próximo ciclo vai re-sincronizar o mesmo item. Transaction resolve.

**Armadilha:**
Deixar transactions abertas por muito tempo — isso segura locks e derruba a performance. Transaction deve ser curta e focada.

---

### 20. O que é ACID?

**Resposta-base (30s):**
Atomicity: tudo ou nada. Consistency: a operação leva o banco de um estado válido para outro válido. Isolation: transactions concorrentes não interferem — cada uma vê um snapshot consistente. Durability: depois do commit, o dado não some mesmo com crash. Postgres garante ACID. Muitos NoSQL sacrificam Isolation ou Consistency por performance (eventual consistency).

**Onde no portfólio AG:**
Supabase (Postgres) em todos os projetos AG. A escolha de Postgres sobre NoSQL foi deliberada: os dados de RH do PULSAR-RH têm relações complexas que precisam de consistency garantida.

**Armadilha:**
Decorar o acrônimo sem saber o que cada letra significa na prática. O entrevistador vai perguntar "o que significa consistency aqui?" e você precisa de um exemplo.

---

### 21. Quando normalizar e quando desnormalizar?

**Resposta-base (30s):**
Normalizar elimina redundância e garante consistência — dados de referência em tabelas separadas com FK. Desnormalizar duplica dado para evitar joins em leituras críticas de performance. Regra: comece normalizado. Desnormalize só com evidência de problema de performance (medir antes). Em OLTP (transacional), normalizar. Em OLAP (analytics), desnormalizar ou usar materialized views.

**Onde no portfólio AG:**
PULSAR-RH — schema normalizado para operações. Para o dashboard de riscos, uma view materializada desnormaliza os dados calculados. Não desnormalizei as tabelas base.

**Armadilha:**
"Desnormalizo para ficar mais rápido." Sem medir, você só adicionou complexidade.

---

### 22. O que é RLS (Row Level Security)?

**Resposta-base (30s):**
RLS é segurança no nível de linha no banco de dados. Você define policies que filtram automaticamente quais linhas cada usuário pode ver ou modificar. Em vez de confiar só no backend para filtrar dados, o banco bloqueia na raiz. No Postgres/Supabase, `CREATE POLICY` define as regras. Essencial em multi-tenant: garante que empresa A nunca veja dados da empresa B mesmo com bug no backend.

**Onde no portfólio AG:**
PULSAR-RH — RLS é a fundação do multi-tenant. Cada tabela tem policy `USING (tenant_id = auth.uid())`. Testei manualmente que um usuário de tenant B não acessa dados do tenant A mesmo chamando a API diretamente.

**Armadilha:**
"Filtro no backend, é suficiente." Não é — se tiver bug no middleware ou bypass de rota, o dado vaza. RLS é defense in depth.

---

### 23. `PRIMARY KEY` vs `UNIQUE` constraint — diferença?

**Resposta-base (30s):**
PRIMARY KEY = NOT NULL + UNIQUE + índice implícito + identifica a linha. Só pode ter uma por tabela. UNIQUE = garante unicidade, mas permite NULL (múltiplos NULLs em Postgres são considerados distintos). Uma tabela pode ter múltiplas constraints UNIQUE. Use PRIMARY KEY para o identificador principal, UNIQUE para outros campos que precisam ser únicos (email, CPF).

**Onde no portfólio AG:**
CLIENTE OFICINA — tabela de produtos tem `id` como PRIMARY KEY (serial) e `external_id` com UNIQUE constraint para o ID do Firebird. O sync usa `external_id` para o upsert idempotente.

**Armadilha:**
"Uso UNIQUE no lugar de PRIMARY KEY, é a mesma coisa." Não é — PRIMARY KEY não aceita NULL e tem semântica de identidade.

---

## Arquitetura / Boas Práticas

### 24. O que é o princípio SOLID?

**Resposta-base (30s):**
S: Single Responsibility — uma classe/função tem um motivo para mudar. O: Open/Closed — aberto para extensão, fechado para modificação. L: Liskov Substitution — subtipos substituem o tipo pai sem quebrar. I: Interface Segregation — interfaces pequenas e específicas. D: Dependency Inversion — dependa de abstrações, não de implementações concretas. Na prática, S e D são os que mais aparecem em code review.

**Onde no portfólio AG:**
PULSAR-RH — modularização pós-revisão: extraí `auth.ts`, `pesquisas.ts`, `relatorios.ts` de um arquivo god object de 600 linhas. Cada módulo tem uma responsabilidade (S). Injeção de dependência no cliente Supabase (D).

**Armadilha:**
Recitar o acrônimo sem exemplo. O entrevistador vai perguntar "me dá um exemplo de violação de SRP no seu código" e você precisa ter um real.

---

### 25. Monolito vs microsserviços — quando escolher cada um?

**Resposta-base (30s):**
Monolito primeiro — é mais simples de desenvolver, testar, fazer deploy e debugar. Microsserviços fazem sentido quando: diferentes partes do sistema têm necessidades de escala radicalmente diferentes, times distintos precisam de autonomia de deploy, ou quando o monolito criou coupling insuportável. O custo de microsserviços é real: rede, latência, distributed tracing, eventual consistency, infra complexa.

**Onde no portfólio AG:**
PULSAR-RH é monolito modular no Vercel — separação por módulos no código, não por serviço. Meet Hub foi separado porque o Puppeteer precisa de Docker e não roda no serverless. Essa foi uma razão técnica real, não moda.

**Armadilha:**
"Microsserviços são melhores porque escalam." Escalar monolito horizontalmente é trivial. Microsserviços mal feitos escalam o problema, não a solução.

---

### 26. O que é DRY e quando violar é correto?

**Resposta-base (30s):**
DRY (Don't Repeat Yourself) diz que conhecimento deve ter uma representação única no sistema. A violação saudável: código que parece igual mas muda por razões diferentes (coincidência estrutural). Abstrair código que muda junto é correto. Abstrair código que parece igual mas vai divergir cria coupling acidental. Regra prática: abstraio na terceira repetição, nunca na primeira.

**Onde no portfólio AG:**
PULSAR-RH — funções de formatação de data repetidas em 3 componentes foram extraídas para `utils/date.ts`. Mas dois formulários com campos parecidos não foram abstraídos porque cada um tem validações e comportamentos diferentes.

**Armadilha:**
"Abstrair sempre que tiver código repetido." WET (Write Everything Twice) às vezes é mais seguro que abstração prematura.

---

### 27. Quando usar uma fila (queue)?

**Resposta-base (30s):**
Fila quando: o trabalho demora mais que o timeout de uma requisição HTTP, falha deve ser retentada com backoff, o sistema receptor é mais lento que o produtor (backpressure), ou a operação pode ser assíncrona sem o usuário esperar. Exemplos: envio de email, geração de relatório, processamento de video, sync com sistema legado.

**Onde no portfólio AG:**
Meet Hub — gravações do Puppeteer são enfileiradas com Bull+Redis. Se o bot cai no meio, a tarefa volta para a fila. O usuário não fica esperando HTTP — recebe confirmação imediata e o resultado chega por notificação.

**Armadilha:**
"Uso fila para tudo que é lento." Fila adiciona complexidade operacional (Redis, worker, dead letter queue). Para operações simples, async/await com timeout resolve.

---

### 28. Como você pensa em cache para uma aplicação?

**Resposta-base (30s):**
Primeiro pergunto: qual é o custo de dado stale? Se alto (dados financeiros), sem cache ou TTL curto. Se baixo (lista de países), cache longo. Camadas: HTTP cache (CDN, browser), in-memory (Redis), memoização em processo. Invalidação é o problema difícil: por TTL (simples, pode servir stale), por evento (complexo, mais correto), cache-aside (o app gerencia), write-through (escreve no cache junto com o banco).

**Onde no portfólio AG:**
PULSAR-RH — dados de configuração de tenant (nome, logo, plano) em cache in-memory com TTL de 5min. Dados de pesquisa em andamento: sem cache (cada acesso deve refletir o estado atual).

**Armadilha:**
"Coloco Redis em tudo." Redis é infraestrutura com custo operacional. Justifique antes de adicionar.

---

### 29. O que é idempotência em design de API?

**Resposta-base (30s):**
Uma API idempotente retorna o mesmo resultado e estado do sistema para chamadas repetidas com os mesmos parâmetros. Para operações não naturalmente idempotentes (criar recurso), usa-se idempotency key: o cliente gera um UUID por tentativa e o servidor deduplica. Se receber a mesma key duas vezes, retorna o resultado da primeira sem criar duplicata.

**Onde no portfólio AG:**
CLIENTE OFICINA — upsert com `external_id` como idempotency key natural. O sync pode rodar N vezes e o resultado é sempre o mesmo — sem duplicatas. Planejado para Cliente Varejo também.

**Armadilha:**
Confundir idempotência com "não faz nada na segunda chamada". Pode fazer algo — só não pode mudar o resultado.

---

### 30. Quando extrair um componente/função em vez de adicionar parâmetro?

**Resposta-base (30s):**
Quando um parâmetro a mais muda o comportamento de forma estrutural (não só configuração), é sinal de duas responsabilidades. Se você adiciona `if (mode === 'edit')` em toda a função, crie dois componentes. Se adiciona `maxItems = 10`, é configuração — parâmetro está certo. Regra: parâmetro configura, extração separa responsabilidade.

**Onde no portfólio AG:**
PULSAR-RH — `Modal` com parâmetro `variant="confirm"|"form"|"alert"` tinha 3 fluxos internos distintos. Extraí para `ConfirmModal`, `FormModal`, `AlertModal` com interface compartilhada.

**Armadilha:**
"Prefiro parâmetro porque fica num lugar só." Um componente com 8 parâmetros condicionais é um god component esperando para quebrar.

---

## Segurança

### 31. O que é XSS e como prevenir?

**Resposta-base (30s):**
XSS (Cross-Site Scripting) é injeção de JavaScript malicioso em páginas servidas para outros usuários. Tipos: stored (salvo no banco e servido para todos), reflected (via URL), DOM-based (manipulação do DOM sem passar pelo servidor). Prevenção: nunca usar `innerHTML` com dado do usuário — usar `textContent`. Bibliotecas como React escapam por padrão. Para HTML rich text, usar sanitizador (DOMPurify).

**Onde no portfólio AG:**
PULSAR-RH — bug real encontrado na revisão: parâmetros de URL eram inseridos via `innerHTML`. Corrigi para `textContent` e adicionei DOMPurify onde HTML era necessário. Registrado no CLAUDE.md como padrão.

**Armadilha:**
"React já protege." Protege no JSX — mas `dangerouslySetInnerHTML` e manipulação direta de DOM bypassam a proteção.

---

### 32. O que é SQL Injection e como prevenir?

**Resposta-base (30s):**
SQL Injection é inserção de código SQL via input do usuário que altera a query. `' OR '1'='1` clássico. Prevenção: nunca concatenar strings em queries. Usar prepared statements (parameterized queries) ou ORMs que fazem isso automaticamente. Prisma, Supabase client e pg-parameterized são seguros. Query crua com concatenação é vulnerabilidade.

**Onde no portfólio AG:**
Todos os projetos AG usam Supabase client ou Prisma — nunca concatenação de SQL. Meet Hub com Prisma: queries tipadas que não permitem injeção por construção.

**Armadilha:**
"Uso ORM, então estou seguro." Raw queries em ORMs (`$queryRaw` no Prisma, `.rpc()` no Supabase) ainda precisam de parâmetros corretos.

---

### 33. O que é CSRF e quando é relevante?

**Resposta-base (30s):**
CSRF (Cross-Site Request Forgery) força um usuário autenticado a executar ações indesejadas em outro site. Um site malicioso faz POST para sua API usando os cookies da vítima. Relevante quando: autenticação via cookies (não Authorization header). Prevenção: CSRF token (validado no servidor), SameSite=Strict nos cookies, verificar Origin header. SPAs com JWT em header não são vulneráveis a CSRF clássico.

**Onde no portfólio AG:**
PULSAR-RH usa JWT via Supabase com Authorization header — não usa cookies para auth, então CSRF clássico não se aplica. Mas configurei SameSite=Strict nos cookies de sessão como defense in depth.

**Armadilha:**
"Não preciso me preocupar porque uso React." O framework não determina o mecanismo de autenticação.

---

### 34. Como gerenciar secrets em produção?

**Resposta-base (30s):**
Nunca no código — nem comentados, nem em arquivos de config commitados. Em desenvolvimento: `.env` no `.gitignore`. Em produção: variáveis de ambiente via plataforma (Vercel env vars, Railway secrets, etc.) ou serviço dedicado (Vault, AWS Secrets Manager). Rotacionar chaves quando desenvolvedor sai do projeto. Verificar histórico git antes de publicar repositório.

**Onde no portfólio AG:**
Todos os projetos AG: `.env.example` sem valores + `.env` no `.gitignore`. Vercel secrets para PULSAR-RH e AG Hub. Nunca commitei uma chave real — existe audit no histórico.

**Armadilha:**
"Está no `.env`, não vai pro git." Se alguém não configurar o `.gitignore` ou usar `git add .` sem pensar, vai. `.env` no `.gitignore` é necessário mas não suficiente — o processo precisa garantir.

---

### 35. Quais são os principais itens do OWASP Top 10?

**Resposta-base (30s):**
Os mais relevantes para dev júnior: A01 Broken Access Control (acesso a recursos sem autorização — o mais comum), A02 Cryptographic Failures (dados sensíveis sem criptografia), A03 Injection (SQL, NoSQL, Command), A05 Security Misconfiguration (default passwords, directory listing), A07 Auth/Session failures (senhas fracas, tokens sem expiração), A10 SSRF (servidor fazendo requests para URLs do atacante).

**Onde no portfólio AG:**
PULSAR-RH aborda A01 via RLS, A03 via Supabase client, A07 via Supabase Auth com tokens JWT com expiração. Não é só "usei um framework seguro" — sei o que cada camada previne.

**Armadilha:**
Decorar a lista sem saber o que cada item significa na prática. O entrevistador vai perguntar "como você preveniu A01 no seu projeto?" e você precisa de resposta concreta.

---

## Soft + Portfólio

### 36. Me conta um bug difícil que você resolveu.

**Resposta-base (30s):**
"No PULSAR-RH, tinha um bug de sincronização entre máquinas que não aparecia nos logs. Passei horas olhando para o código do frontend antes de perceber que o schema do Supabase não tinha sido aplicado no ambiente. O dado existia localmente mas as migrations não tinham rodado em prod. Aprendi a verificar o banco primeiro antes de debugar o código — a maioria dos bugs de 'não sincroniza' são de infra, não de lógica."

**Onde no portfólio AG:**
Registrado em memory: PULSAR-RH sync silencioso — "não sincroniza entre máquinas" = schema Supabase não aplicado.

**Armadilha:**
Contar bug trivial ("errei a variável") ou bug que não teve aprendizado real. O entrevistador quer ver processo de investigação e o que você mudou depois.

---

### 37. Por que você escolheu a stack X no seu projeto?

**Resposta-base (30s):**
Template de resposta para qualquer escolha: "Escolhi [X] porque [problema específico que resolve], com o trade-off de [custo real]. Considerei [alternativa Y] mas [razão concreta de rejeição]. Se fosse hoje com mais informação, [mudaria ou manteria] porque [razão]."

**Onde no portfólio AG:**
PULSAR-RH: Supabase porque multi-tenant com RLS no banco elimina uma classe inteira de bugs de permissão. Trade-off: vendor lock-in. Alternativa considerada: Firebase (rejeitado por modelo de dados relacional do RH). Vercel porque serverless casa com o padrão de uso (picos durante horário comercial).

**Armadilha:**
"Escolhi porque é moderno/popular." Sem trade-off, parece que você seguiu tutorial. O entrevistador quer ver raciocínio, não lista de tecnologias.

---

### 38. Como você aprende uma tecnologia nova?

**Resposta-base (30s):**
"Documentação oficial primeiro para entender os conceitos do criador, não de terceiro. Depois construo algo pequeno com o problema real que estou tentando resolver — não o tutorial de todo mundo. Quando trava, leio issues no GitHub antes de Stack Overflow. O que aprendo fica documentado: ou em código com comentário de 'por quê', ou no meu NKB pessoal. Não acumulo tabs — resolvo e fecho."

**Onde no portfólio AG:**
Padrão demonstrado na prática: Supabase RLS aprendido construindo PULSAR-RH (não em curso isolado). Bull/Redis aprendido resolvendo o problema real do Meet Hub.

**Armadilha:**
"Faço cursos na Udemy." Não é errado — mas sem mostrar que transformou curso em código real, parece passivo.

---

### 39. Qual é seu ponto fraco técnico?

**Resposta-base (30s):**
Escolha algo real mas não fatal, e mostre que você está trabalhando nisso. Template: "Meu ponto mais fraco hoje é [área específica]. Sei identificar quando é problema, mas ainda demoro mais do que quero para resolver. Estou [ação concreta que está tomando]. Minha evidência de melhora é [algo concreto]."

**Onde no portfólio AG:**
Resposta honesta: testes automatizados — os projetos AG têm pouca cobertura de teste. Sei escrever testes unitários mas não tenho o hábito de TDD. Estou construindo a trilha de estudos justamente para resolver isso de forma sistemática.

**Armadilha:**
"Sou muito perfeccionista." Clichê que não responde a pergunta e soa desonesto. O entrevistador quer maturidade, não performance.

---

### 40. O que você estudou ou aprendeu nos últimos 30 dias?

**Resposta-base (30s):**
Responda com coisa específica e explique o contexto. Template: "Aprendi [conceito específico] quando precisei resolver [problema real]. O que me surpreendeu foi [insight não-óbvio]. Agora uso em [projeto] da seguinte forma: [aplicação concreta]."

**Onde no portfólio AG:**
Exemplo real: estudei RLS no Postgres com profundidade quando implementei multi-tenant no PULSAR-RH. O insight que me surpreendeu: RLS pode usar funções como `auth.uid()` que são resolvidas em tempo de query, não de definição da policy. Isso permite policies dinâmicas sem código no backend.

**Armadilha:**
"Estou estudando de tudo um pouco." Amplitude sem profundidade parece falta de foco. Um tópico com história real vale mais que cinco superficiais.
