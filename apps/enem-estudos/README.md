# ENEM Estudos

App de estudos para o ENEM, hospedado na **Vercel**. Cada tópico tem **mapa mental** (estilo MindMeister), **resumo curto e longo**, **flashcards** com repetição espaçada (SM-2) e **questões** estilo ENEM.

**Arquitetura:** conteúdo é estático (versionado em `src/content/`), o app é um SPA estático (Vite + React) servido pelo CDN da Vercel. O único estado do usuário — o agendamento SM-2 dos flashcards — fica em **SQLite no navegador** (`sql.js` + IndexedDB). Sem backend, sem login.

## Conteúdo atual

- 🧬 **Biologia**
  - Histologia Humana
  - Métodos Contraceptivos
  - Sistema Respiratório

## Setup

```bash
npm install
npm run dev
```

## Scripts

| Comando         | O que faz                                |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento              |
| `npm run build` | Build de produção (`dist/`)              |
| `npm test`      | Testes (Vitest) — cobre o algoritmo SM-2 |
| `npm run lint`  | ESLint + Prettier check                  |

## Deploy (Vercel)

O `vercel.json` já configura framework Vite, build e o rewrite de SPA (necessário pro React Router). Para publicar:

```bash
npm i -g vercel   # se não tiver
vercel login      # autenticar (interativo)
vercel            # preview
vercel --prod     # produção
```

## Como adicionar conteúdo

1. Crie um arquivo de tópico em `src/content/<materia>/<topico>.ts` exportando um `Topico` (ver `src/content/types.ts`).
2. Registre-o no índice da matéria (`src/content/<materia>/index.ts`).
3. Matéria nova: crie `src/content/<materia>/index.ts` e adicione em `src/content/index.ts`.

O **mapa mental** é só markdown: um `#` raiz + bullets aninhados (o markmap renderiza).

## Estrutura

```
src/
├── content/             # CONTEÚDO estático (versionado)
│   ├── types.ts         # Materia, Topico, ContentFlashcard, ContentQuestao
│   ├── index.ts         # registry de matérias
│   └── biologia/        # 3 tópicos + index
├── pages/               # Home, Materia, Topico (rotas)
├── features/
│   ├── flashcards/      # SM-2 + progresso (SQLite) + UI
│   ├── questoes/        # UI de questões
│   └── resumo/          # resumo curto/longo
├── components/          # MindMap (markmap), Markdown
├── db/                  # SQLite WASM: só progresso do usuário
└── lib/
```
