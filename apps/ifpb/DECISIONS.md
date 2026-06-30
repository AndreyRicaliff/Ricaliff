# DECISIONS — IFPB

Registro de decisões técnicas datadas, em primeira pessoa. Material de defesa em entrevista.

> Regra (CLAUDE.md §ENSINAR EM CONTEXTO): toda mudança não-trivial vira entrada aqui no mesmo commit da feature.
>
> Decisões marcadas **[reconstruído]** vieram de evidência. Decisões com `[reconstruir com Ricalfiff]` precisam de sessão dedicada — não decorar, é fato observado sem motivação confirmada.

---

## 2026-05-12 — [linguagem] TypeScript 5 em vez de JavaScript puro

**Problema:** Projeto de estudos do curso IFPB. A linguagem ensinada no curso é JavaScript. Usar TypeScript adiciona complexidade — vale a pena num projeto de estudo?

**Opções consideradas:**
- A — JavaScript puro
  - Pró: exatamente o que o curso ensina, sem overhead de tipos, sem configuração extra
  - Contra: não treina habilidade que o mercado exige; erros de tipo só aparecem em runtime; exercícios sem tipos ficam difíceis de defender em entrevista
- B — TypeScript 5 com `strict: true`
  - Pró: treina a habilidade real; erros de tipo em compile time; código mais fácil de revisar e defender; prepara para projetos reais (todos os projetos AG usam TS)
  - Contra: curva de aprendizado adicional; tsconfig para configurar; ts-node para rodar sem compilar

**Decisão:** TypeScript 5 com `strict: true` habilitado no `tsconfig.json`.

**Por quê:** Projeto de estudo é o melhor lugar para aprender TypeScript porque o custo de erro é zero — não tem usuário em produção. Usar JS puro seria treinar uma habilidade que não é o que o mercado contrata. `strict: true` força lidar com `null`, tipos explícitos e erros reais desde o início. **[reconstruído]** — evidência: `tsconfig.json` com `"strict": true`, `package.json` com `typescript: ^5.4.0`, `ts-node`.

**Consequências:** Todo exercício produz código com tipos explícitos — mais fácil de revisar em sessão com Claude, mais fácil de defender em entrevista. `ts-node` permite rodar `src/index.ts` direto sem compilar. Dívida: exercícios mais antigos podem ter `any` implícito — revisar quando retomar cada disciplina.

**Como explicar em entrevista (30s):**
> "No projeto de estudos do IFPB escolhi TypeScript com `strict: true` em vez de JavaScript puro, mesmo sendo um projeto pessoal. A lógica foi: projeto de estudo é o lugar de menor custo para aprender TypeScript — sem usuário em produção, sem pressão de entrega. Habilidade com tipos é o que o mercado contrata. Quando entro numa base de código em TS, já sei o que `Partial`, `Readonly` e discriminated unions significam porque pratiquei aqui."

**Fonte da reconstrução:** `tsconfig.json` + `package.json` + `project_ifpb.md`.

---

## 2026-05-12 — [testes] Jest + ts-jest em vez de Vitest ou sem testes

**Problema:** Projeto de estudos precisa de testes? Se sim, qual framework?

**Opções consideradas:**
- A — Sem testes
  - Pró: menos configuração, foco no exercício em si
  - Contra: não treina hábito de testar; exercícios sem teste são impossíveis de defender em entrevista; um dos objetivos declarados do projeto é aprender a testar
- B — Vitest
  - Pró: mais rápido que Jest, ESM-nativo, API compatível com Jest, melhor DX
  - Contra: ecossistema menos maduro que Jest; a maioria dos projetos no mercado ainda usa Jest; treinar em Jest primeiro dá base para Vitest depois
- C — Jest + ts-jest
  - Pró: padrão de mercado amplamente adotado; integração madura com TypeScript via ts-jest; documentação abundante
  - Contra: configuração mais verbosa que Vitest; mais lento em watch mode

**Decisão:** Jest 29 + ts-jest.

**Por quê:** Jest é o framework que aparece na maioria das vagas e bases de código que vou encontrar. Treinar em Jest primeiro cria base para aprender Vitest depois — a transição é trivial porque a API é compatível. Treinar em Vitest primeiro sem conhecer Jest é atalho que pode cobrar mais tarde. **[reconstruído]** — evidência: `package.json` com `jest: ^29.0.0`, `ts-jest: ^29.0.0`, script `"test": "jest"`.

**Consequências:** Cada exercício pode ter arquivo de teste correspondente. Hábito de `arrange / act / assert` treinado desde o início. `pnpm test` roda todos os testes do projeto.

**Como explicar em entrevista (30s):**
> "No IFPB escolhi Jest sobre Vitest deliberadamente. Vitest é mais rápido e tem DX melhor, mas Jest ainda é o padrão em 80% das bases de código que vou encontrar. Preferi treinar no padrão de mercado e aprender Vitest depois — a migração é trivial porque a API é compatível. A decisão foi sobre onde construir fluência primeiro."

**Fonte da reconstrução:** `package.json`.

---

## 2026-05-12 — [estrutura] Sem banco, sem auth — foco em conceito, não em infra

**Problema:** Como estruturar um projeto de estudos sem deixar que a infraestrutura roube foco do que realmente importa aprender?

**Opções consideradas:**
- A — Replicar stack AG (Supabase + Auth + deploy) em cada exercício
  - Pró: prática de infra real
  - Contra: setup demora mais que o exercício em si; cada disciplina vira problema de infra em vez de problema de programação
- B — Sem banco, sem auth — TypeScript puro rodando local
  - Pró: cada exercício é isolado, roda com `ts-node src/index.ts`, foco no código
  - Contra: não treina integração com banco ou serviços externos (mas esses são outros projetos)

**Decisão:** Sem banco, sem auth, sem deploy. Projeto roda 100% local. Integração com serviços externos é aprendida nos projetos reais (AG Converge, PULSAR-RH, etc).

**Por quê:** Projetos de estudos devem ter fricção zero para começar a escrever código. Se para fazer um exercício de estrutura de dados eu precisar configurar Supabase, vou procrastinar o exercício. A separação é clara: IFPB = conceitos de programação. Projetos AG = integração com serviços reais. **[reconstruído]** — evidência: `project_ifpb.md` "Não aplicar padrões AG (sem auth @agconsultorialtda.com, sem bot, sem infra de produção)".

**Consequências:** Qualquer exercício começa com `pnpm dev` sem setup prévio. Os projetos AG são o lugar onde integração, auth e banco são praticados com contexto real.

**Como explicar em entrevista (30s):**
> "O projeto IFPB tem zero infra por decisão consciente — sem banco, sem auth, sem deploy. A justificativa é separação de contextos: conceitos de programação (algoritmos, estruturas de dados, TypeScript) são aprendidos sem fricção de infraestrutura. Integração com banco e serviços externos é aprendida nos projetos reais AG, onde tem usuário, dado de verdade e prazo. Misturar os dois torna o aprendizado mais lento nos dois lados."

**Fonte da reconstrução:** `project_ifpb.md` + README do projeto.

---

## 2026-05-12 — [organização] Pastas `src/`, `exercicios/`, `anotacoes/` em vez de arquivo único por aula

**Problema:** Como organizar o material do curso sem que vire um caos de arquivos depois de 20 aulas?

**Opções consideradas:**
- A — Um arquivo por aula: `aula01.ts`, `aula02.ts`, etc.
  - Pró: simples, linear
  - Contra: código de experimento misturado com código de exercício e anotações; difícil de achar algo depois de 10 aulas; sem separação de propósito
- B — Pastas por propósito: `src/` (experimentos), `exercicios/` (exercícios formais), `anotacoes/` (resumos)
  - Pró: cada tipo de artefato tem lugar próprio; `exercicios/` pode ter subpastas por disciplina; `src/` é o playground livre
  - Contra: levemente mais overhead ao criar arquivo (decidir onde vai)

**Decisão:** Três pastas por propósito. `src/` para código principal e experimentos, `exercicios/` por disciplina, `anotacoes/` para resumos em markdown.

**Por quê:** Depois de 3 meses de estudos, a separação por propósito evita que o repositório vire um arquivo de arqueologia. Quando precisar revisar exercícios de estrutura de dados, sei exatamente onde olhar. **[reconstruído]** — evidência: README do projeto + estrutura de diretórios atual (`src/estruturas-de-dados/`).

**Consequências:** `tsconfig.json` inclui `exercicios/**/*` no `include` — exercícios são verificados pelo compilador automaticamente. Novas disciplinas viram subpastas em `exercicios/`.

**Como explicar em entrevista (30s):**
> "No projeto IFPB separei por propósito em vez de por aula. `src/` é playground de experimentos, `exercicios/` é material formal por disciplina, `anotacoes/` são resumos. Essa separação parece trivial no início mas importa depois de 3 meses — sem ela, o repo vira arquivo de arqueologia onde mistura código bom com rascunho. A mesma lógica de separação de responsabilidades que uso em código apliquei na estrutura de pastas."

**Fonte da reconstrução:** README + estrutura de diretórios + `tsconfig.json`.
