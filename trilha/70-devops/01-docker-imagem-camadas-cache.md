# 01 — Docker: Imagem, Camadas e Cache

## O que é

Uma imagem Docker é uma pilha de camadas somente-leitura. Cada instrução no `Dockerfile` (`FROM`, `RUN`, `COPY`, etc.) cria uma camada. O Docker cacheia essas camadas por hash do conteúdo — se a camada não mudou, não rebuilda.

O problema clássico é a **ordem das instruções**. Se você copiar todo o código-fonte antes de instalar dependências, qualquer mudança num arquivo `.ts` invalida o cache do `npm install` — e você reinstala 200 pacotes para cada build.

```dockerfile
# Ruim: invalida cache de npm install a cada mudança de código
FROM node:20-slim
WORKDIR /app
COPY . .                    # copia tudo — qualquer mudança em .ts invalida o cache aqui
RUN npm install             # reinstala 200 pacotes toda vez

# Correto: isola dependências do código
FROM node:20-slim
WORKDIR /app
COPY package*.json ./       # só o manifesto — muda raramente
RUN npm install             # cacheia até package.json mudar
COPY . .                    # código muda sempre — mas npm install já foi cacheado
RUN npm run build
```

**Multi-stage build** vai além: usa uma imagem "builder" com todas as ferramentas de dev e copia só o artefato final para a imagem de produção.

```dockerfile
# Stage 1: build (tem TypeScript, devDependencies, tudo)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install             # instala devDeps também
COPY . .
RUN npm run build           # compila .ts → .js em dist/

# Stage 2: produção (só Node + artefato compilado)
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  # só prodDeps
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

Resultado: imagem de produção sem TypeScript, sem ts-node, sem código-fonte — menor, mais segura, deploy mais rápido.

---

## Por que cai em entrevista

- "O que é uma camada Docker e como o cache funciona?"
- "Por que você copia `package.json` antes do código-fonte?"
- "O que é multi-stage build? Qual o benefício?"
- "Como você reduziria o tamanho de uma imagem Docker?"
- "O que acontece se o `Dockerfile` mudar a ordem das instruções?"

---

## Trade-offs (quando usar X vs Y)

| Abordagem | Quando usar | Custo |
|---|---|---|
| Imagem única sem multi-stage | Protótipo, build simples sem TypeScript | Imagem grande com devDeps e código-fonte |
| Multi-stage build | Produção com compilação (TS, Go, Java, Rust) | Dockerfile mais longo; erros de path entre stages |
| Alpine como base (`node:20-alpine`) | Imagem ainda menor (5 MB vs 80 MB) | Glibc ausente pode quebrar algumas libs nativas (ex: Puppeteer) |
| `node:20-slim` como base | Compatibilidade maior que Alpine | Maior que Alpine, menor que `node:20` padrão |
| `.dockerignore` | Sempre | Sem ele, COPY copia `node_modules/` local para a imagem |

**Regra de bolso:** a ordem no Dockerfile é: o que muda raramente primeiro, o que muda sempre por último. `FROM` → `RUN apt-get` → `COPY package.json` → `RUN npm install` → `COPY .` → `RUN build`.

---

## Exercício aplicado (projeto AG real)

O Meet Hub tem Dockerfiles em `apps/api/` e `apps/web/`. O Dockerfile da API usa `node:20-slim` mas tem um problema potencial de performance de cache.

### Passo a passo

1. **Ler o Dockerfile atual da API:**
   ```bash
   cat ~/projetos/meet-hub/apps/api/Dockerfile
   ```
   Verifique a ordem:
   - `COPY package*.json ./` vem antes do `COPY . .`? Se sim, o cache de `npm install` está protegido.
   - Tem `prisma generate` antes do build? Em que estágio?

2. **Analisar o impacto do `prisma generate`:**
   ```bash
   grep -n "prisma\|generate" ~/projetos/meet-hub/apps/api/Dockerfile
   ```
   `npx prisma generate` precisa do código-fonte do schema (`prisma/schema.prisma`). Se você faz `COPY . .` antes e depois `prisma generate`, o cache é invalidado sempre que qualquer arquivo mudar. A otimização é copiar só `prisma/schema.prisma` antes de gerar.

3. **Verificar se existe `.dockerignore`:**
   ```bash
   cat ~/projetos/meet-hub/.dockerignore 2>/dev/null || cat ~/projetos/meet-hub/apps/api/.dockerignore 2>/dev/null || echo "sem .dockerignore"
   ```
   Se não existir, `COPY . .` copia `node_modules/` local para dentro da imagem — isso não quebra (o `RUN npm install` sobrescreve) mas torna o contexto de build desnecessariamente grande.

4. **Criar `.dockerignore` se não existir:**
   ```bash
   cat > ~/projetos/meet-hub/apps/api/.dockerignore << 'EOF'
   node_modules
   dist
   .env
   .env.*
   *.log
   npm-debug.log*
   EOF
   ```

5. **Propor Dockerfile otimizado com multi-stage** (para treinar, não necessariamente commitar):
   O Dockerfile atual não usa multi-stage. Pense: o build TypeScript acontece com devDependencies. A imagem final não precisa delas. Qual seria o `--from=builder` que copiaria só `dist/` e `prisma/` gerado?

6. **Verificar tamanho da imagem atual:**
   ```bash
   docker images meet-hub-api 2>/dev/null | head -5
   # ou, se a imagem tem outro nome:
   docker images | grep meet-hub
   ```

7. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [infra] Auditoria do Dockerfile da API

   **Achados:**
   - Cache de npm install: [protegido / não protegido — descreva o que você encontrou]
   - .dockerignore: [existe / não existe]
   - Multi-stage: [tem / não tem]
   **Debt identificado:** [o que precisa de melhoria]
   **Como explicar em entrevista (30s):**
   > "No Meet Hub, o Dockerfile da API copia package.json primeiro e só depois o código-fonte — isso protege o cache de npm install. Mudança em arquivo TypeScript não reexecuta npm install. Identifiquei que não tem multi-stage ainda: a imagem carrega devDependencies em produção. A otimização seria separar o stage de build do de runtime."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que copiar `package.json` antes do código-fonte no Dockerfile?"
>
> **R (30s):**
> "Por causa do cache de camadas do Docker. Cada instrução cria uma camada cacheada pelo hash do conteúdo. Se você faz `COPY . .` antes do `npm install`, qualquer mudança em qualquer arquivo do projeto invalida o cache e reinstala todas as dependências — mesmo que `package.json` não tenha mudado. Separando em `COPY package*.json ./` + `RUN npm install` + `COPY . .`, o cache de `npm install` só é invalidado quando as dependências realmente mudam. Num projeto com 200 pacotes, isso economiza 2-3 minutos por build."

> **P:** "O que é multi-stage build e por que você usaria?"
>
> **R (30s):**
> "Multi-stage usa dois `FROM` no mesmo Dockerfile. O primeiro stage compila o código — tem TypeScript, devDependencies, tudo. O segundo stage começa do zero, instala só as dependências de produção e copia o `dist/` compilado do primeiro. Resultado: imagem de produção sem TypeScript, sem código-fonte, sem devDeps — pode passar de 800 MB para 150 MB. Menor = mais seguro (menor superfície de ataque) e deploy mais rápido."

---

## Checkpoint

- [ ] Consigo explicar o cache de camadas Docker sem consultar
- [ ] Verifiquei a ordem do Dockerfile da API do Meet Hub e identifiquei se o cache está protegido
- [ ] Sei escrever um Dockerfile multi-stage para um projeto Node+TypeScript
- [ ] Criei `.dockerignore` no Meet Hub (se não existia)
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Docker imagem e cache dominado`.

---

## Recursos

- Docker docs — [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- Docker docs — [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- Código real: `~/projetos/meet-hub/apps/api/Dockerfile` — Dockerfile em uso em produção
- Código real: `~/projetos/meet-hub/apps/web/Dockerfile` — Nginx para front estático
