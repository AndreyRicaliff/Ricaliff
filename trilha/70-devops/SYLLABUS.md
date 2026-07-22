# Syllabus — DevOps para quem não é ops

> **Disciplina:** empacotar, automatizar e observar uma aplicação sem depender de ninguém de infra.
> **Carga horária alvo: 40h** — aulas 3h · bibliografia 16h · labs 13h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Escrever um Dockerfile multi-stage que produz imagem pequena, e explicar como o cache de camadas decide o que rebuilda.
2. Montar um pipeline de CI que roda lint + teste + build e **bloqueia** o merge quando falha — com secret fora do código.
3. Fazer o deploy de uma aplicação nova do zero (container ou edge) e reverter para a versão anterior sem tutorial.
4. Investigar um incidente em produção só pelos logs estruturados, sem acesso ao shell do servidor.
5. Decidir quando IaC (Terraform) paga o custo dele e quando é cerimônia prematura.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 docker-imagem-camadas-cache | Docker docs — *Get started* (Building images: camadas e cache de build) + *Multi-stage builds* | 3h |
| 02 docker-compose-dev-vs-prod | Docker docs — *Get started* (Using Docker Compose) + *Compose file reference* (services, env, volumes) | 2.5h |
| 03 ci-cd-github-actions | GitHub Actions docs — *Understanding GitHub Actions* + *Building and testing* + *Using secrets in GitHub Actions*; Google SRE Book — cap. "Release Engineering" [gratuito em sre.google] | 3h |
| 04 deploy-vercel-edge | Vercel docs — *Environments* (Preview vs Production) + *Edge Functions* + *Instant Rollback* | 2h |
| 05 observabilidade-logs-e-metricas | Google SRE Book — cap. "Monitoring Distributed Systems" (Four Golden Signals) + cap. "Practical Alerting" [gratuito em sre.google] | 3h |
| 06 iac-introducao-terraform | HashiCorp — *Terraform: Get Started* (tutoriais) + Terraform docs *What is Infrastructure as Code?* (declarativo vs imperativo) | 2.5h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele já existe (ou falta) num app próprio (Meet Hub em Docker, PULSAR-RH no Vercel, o hub estático). Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `dockerize-and-shrink` (5h):** um serviço HTTP mínimo em Node do zero (um endpoint `/health`), empacotado em Dockerfile **multi-stage**: stage de build com devDependencies, stage final só com o runtime e `node_modules` de produção.
*Pronto quando:* `docker build` roda, a imagem final está documentada com tamanho antes (single-stage ingênuo) e depois (multi-stage), e o README explica qual mudança de ordem no Dockerfile invalida o cache de qual camada.

**Lab 2 — `ci-pipeline-do-zero` (5h):** repositório público com workflow GitHub Actions que roda `lint` + `test` + `build` em cada push, usa um secret (ex.: token fake em `secrets.API_TOKEN`) sem imprimi-lo no log, e uma branch protection que **impede o merge** quando o job falha.
*Pronto quando:* um PR com teste quebrado fica vermelho e bloqueado; um PR verde libera o merge; o secret nunca aparece em texto claro no log da run.

**Lab 3 — `structured-logs` (3h):** serviço HTTP (node puro) que emite log **estruturado em JSON** por requisição — `request_id`, rota, status, latência em ms — e um script `grep`/`jq` que responde "quais requests passaram de 500ms na última hora" sem abrir o código.
*Pronto quando:* dá pra reconstruir o que aconteceu num request específico só pelo `request_id`, e a consulta de latência roda sobre o arquivo de log sem tocar no servidor.

## Critério de formatura

- [ ] 6/6 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps próprios)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — deploy de um app novo do zero: Dockerfile + pipeline de CI + rollback demonstrado

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, o conteúdo não. SRE Book é gratuito em sre.google.*
