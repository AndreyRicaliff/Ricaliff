# 02 — Docker Compose: Dev vs. Prod

## O que é

Docker Compose define e roda múltiplos containers como um serviço único. `docker-compose.yml` é o mapa: quais containers existem, como se conectam, quais volumes, quais portas. O mesmo `docker-compose.yml` raramente serve para dev e prod sem ajuste — as necessidades são diferentes.

```yaml
# Dev precisa de:
# - código montado como volume (mudança reflete sem rebuild)
# - hot reload
# - portas expostas diretamente pra debugar
# - banco acessível direto (localhost:5432)

# Prod precisa de:
# - imagem buildada e fixada em versão
# - variáveis de ambiente via env_file ou secrets
# - sem portas de banco expostas externamente
# - restart automático (unless-stopped)
# - sem volumes de código (imagem é a fonte da verdade)
```

A estratégia padrão é `docker-compose.override.yml`: o Compose lê `docker-compose.yml` primeiro e depois faz merge com `docker-compose.override.yml`. Em dev, você deixa o override carregar. Em prod, você passa o arquivo explicitamente:

```bash
# Dev: carrega docker-compose.yml + docker-compose.override.yml automaticamente
docker compose up

# Prod: só o arquivo principal (sem override)
docker compose -f docker-compose.yml up -d
```

**Volumes vs Bind Mounts:**
```yaml
# Bind mount: mapeia diretório do host para o container
# Útil em dev: mudança no host reflete instantaneamente no container
volumes:
  - ./src:/app/src   # bind mount — /src do host aparece em /app/src do container

# Volume nomeado: Docker gerencia o armazenamento
# Útil em prod: banco não depende de caminho do host
volumes:
  - pg_data:/var/lib/postgresql/data  # Docker gerencia onde fica
```

---

## Por que cai em entrevista

- "Qual a diferença entre volume e bind mount?"
- "Como você gerencia variáveis de ambiente em Docker Compose?"
- "Como você faria para ter configurações diferentes de dev e prod no Compose?"
- "O que é `depends_on` e qual é a limitação dele?"
- "Qual a diferença entre `networks` no Compose e porta exposta com `ports`?"

---

## Trade-offs (quando usar X vs Y)

| Abordagem | Quando | Custo |
|---|---|---|
| Um único `docker-compose.yml` | Projeto simples sem diferença dev/prod | Configuração de dev vaza pro prod (portas abertas, bind mounts) |
| `docker-compose.override.yml` | Padrão para qualquer projeto real | Dois arquivos para manter; dev e prod ficam em sync mais difícil |
| `docker-compose.prod.yml` separado | Prod com muitas diferenças estruturais | Duplicação — o que muda em um precisa mudar no outro |
| Env var via `.env` | Segredos que o Compose lê automaticamente | `.env` não pode ser commitado |
| Env var via `env_file` | Múltiplos arquivos de ambiente (dev, test, prod) | Mais explícito; melhor para projetos com ambientes distintos |

**`depends_on` não é healthcheck:** `depends_on: [db]` garante que o container `db` *iniciou*, não que o Postgres está pronto para aceitar conexões. Seu app vai crashar tentando conectar antes do banco estar pronto. A solução é ou usar `healthcheck` no service ou implementar retry com backoff na aplicação.

**Ports vs. networks:** `ports` expõe a porta para o host (e para o mundo se o firewall permitir). `networks` permite containers se comunicarem internamente sem expor para o host. Em prod, banco e Redis não devem ter `ports` — só a API e o front expõem portas.

---

## Exercício aplicado (projeto AG real)

O Meet Hub tem `docker-compose.yml` usado tanto em dev quanto em produção no DigitalOcean. Vamos auditar.

### Passo a passo

1. **Ler o docker-compose.yml atual:**
   ```bash
   cat ~/projetos/meet-hub/docker-compose.yml
   ```

2. **Auditar cada serviço respondendo:**
   - `db`: porta 5432 está exposta com `ports`? Em prod, isso é risco — qualquer IP pode tentar conectar no Postgres.
   - `redis`: porta 6379 exposta? Mesma questão.
   - `api`: tem `restart: unless-stopped`? Em prod, se o container morrer, precisa reiniciar.
   - Algum serviço usa bind mount `./src:/app/src`? Isso é ok em dev, problemático em prod (o host precisa ter o código no caminho certo).

3. **Verificar se existe override:**
   ```bash
   ls ~/projetos/meet-hub/docker-compose*.yml
   ```
   Se só existe um arquivo, dev e prod estão usando a mesma config — provável que haja configurações de dev vazando pra prod.

4. **Propor um `docker-compose.override.yml` mínimo para dev:**
   Crie um arquivo que adiciona as portas de banco para dev e um bind mount para hot reload:
   ```bash
   cat > ~/projetos/meet-hub/docker-compose.override.yml << 'EOF'
   # Só para dev local — NÃO usar em produção
   services:
     db:
       ports:
         - "5432:5432"   # expõe pra localhost em dev
     redis:
       ports:
         - "6379:6379"
     api:
       volumes:
         - ./apps/api/src:/app/src  # hot reload via ts-node-dev
       environment:
         NODE_ENV: development
   EOF
   ```
   Com isso, `docker compose up` (dev) carrega os dois arquivos. `docker compose -f docker-compose.yml up -d` (prod) ignora o override.

5. **Verificar variáveis de ambiente:**
   ```bash
   grep -n "env_file\|environment\|\.env" ~/projetos/meet-hub/docker-compose.yml
   ```
   A API usa `env_file: .env` — correto. Confirme que `.env` está no `.gitignore`:
   ```bash
   grep "\.env" ~/projetos/meet-hub/.gitignore
   ```

6. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [infra] Auditoria docker-compose dev vs. prod

   **Achados:**
   - override.yml: [existia / não existia]
   - Portas de banco expostas: [sim/não — risco em prod]
   - restart policy: [configurado / ausente]
   **Debt identificado:** separar configurações dev/prod com override.yml
   **Como explicar em entrevista (30s):**
   > "O Meet Hub usava um único docker-compose.yml para dev e prod. Auditar mostrou que portas de banco estavam expostas — ok em dev, risco em prod. Criei docker-compose.override.yml para dev com portas e bind mounts. Prod usa só o arquivo principal com -f. Isso é o padrão recomendado pelo Docker."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre volume e bind mount no Docker?"
>
> **R (30s):**
> "Bind mount mapeia um diretório do host para dentro do container. Em dev, uso bind mount para montar o código-fonte: mudança no editor reflete instantaneamente no container sem rebuild. O problema é que o container depende do caminho do host existir — não é portável.
>
> Volume nomeado é gerenciado pelo Docker. Ótimo para banco em produção: os dados ficam num namespace do Docker, independente do sistema de arquivos do host. Mais portável, mais seguro. Para banco em prod, sempre volume nomeado. Para código em dev, bind mount."

> **P:** "Como você diferencia configuração de dev e prod no Docker Compose?"
>
> **R (30s):**
> "Com `docker-compose.override.yml`. O Compose faz merge automático: `docker-compose.yml` tem a base que serve para prod; `override.yml` adiciona o que é só de dev — portas de banco expostas para localhost, bind mounts para hot reload, variáveis de debug. Em dev, rodo `docker compose up` e carrega os dois. Em prod, `docker compose -f docker-compose.yml up -d` ignora o override. Isso evita ter dois arquivos que divergem e garante que config de dev não vaza pra prod."

---

## Checkpoint

- [ ] Sei a diferença entre bind mount e volume nomeado com caso de uso de cada
- [ ] Li o `docker-compose.yml` do Meet Hub e identifiquei o que é dev-only vs. prod-safe
- [ ] Criei ou planejei um `docker-compose.override.yml` para o Meet Hub
- [ ] Entendo por que `depends_on` não garante que o serviço está pronto
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Docker Compose dev vs. prod dominado`.

---

## Recursos

- Docker docs — [Compose file reference](https://docs.docker.com/compose/compose-file/)
- Docker docs — [Use Compose in production](https://docs.docker.com/compose/production/)
- Docker docs — [Volumes vs bind mounts](https://docs.docker.com/storage/)
- Código real: `~/projetos/meet-hub/docker-compose.yml` — Compose em uso em produção
