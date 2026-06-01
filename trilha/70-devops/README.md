# 70 — DevOps

## Foco
Infraestrutura suficiente para um dev júnior não ser dependente de ops: empacotar aplicação em Docker sem surpresa em produção, automatizar deploy com GitHub Actions, e ler logs quando algo explode às 2h da manhã. Para o Ricalfiff, que já tem Meet Hub em Docker no DigitalOcean e PULSAR-RH no Vercel, essa trilha é mais formalização do que descoberta — o objetivo é virar fluente na linguagem, não aprender do zero.

## Por que cai em entrevista
- "Me explica como você faria o deploy dessa aplicação" — querem Docker + CI/CD, não "subo o zip"
- "O que é uma imagem Docker e como você otimizaria o tamanho dela?"
- "Como você estruturaria um pipeline de CI/CD básico?"
- "Como você investigaria um problema em produção sem acesso direto ao servidor?"

## Pré-requisitos
- `50-backend`: aplicação funcionando localmente antes de containerizar
- `30-banco`: migrations e variáveis de ambiente antes de CI/CD
- Familiaridade básica com terminal Linux — comandos de container pressupõem isso

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-docker-imagem-camadas-cache.md` | Layers, cache de build, multi-stage build, imagem pequena = deploy rápido | Meet Hub | 🟡 |
| 02 | `02-docker-compose-dev-vs-prod.md` | Compose para dev local, variáveis de ambiente, volumes, diferença para prod | Meet Hub | 🟡 |
| 03 | `03-ci-cd-github-actions.md` | Workflow YAML, lint + test + build + deploy, secrets no GitHub, quando falha deve bloquear | PULSAR-RH | 🟡 |
| 04 | `04-deploy-vercel-edge.md` | Edge Functions, environment variables, preview vs production, rollback | PULSAR-RH | 🟡 |
| 05 | `05-observabilidade-logs-e-metricas.md` | Estruturar logs para busca, alertas básicos, o que monitorar numa aplicação pequena | Meet Hub | 🟢 |
| 06 | `06-iac-introducao-terraform.md` | O que é IaC, declarativo vs imperativo, provisionar um servidor básico, quando vale o investimento | AG Hub | 🟢 |

## Como aprender essa trilha
- `01` e `02` em sequência com o Meet Hub como cobaia — modificar o Dockerfile existente
- `03` depois de ter Docker funcionando — pipeline sem imagem estável é frustrante
- `04` é o mais fácil se PULSAR-RH já está no Vercel — documentar o que já existe
- `05` e `06` têm prioridade baixa: vêm depois que fundamentos e banco estiverem sólidos
- Sinal de fixação: consegue fazer o deploy de uma aplicação nova do zero sem consultar tutorial

## Conexão com decisões reais
- **Meet Hub Docker + DigitalOcean:** container em produção já existente — `01` e `02` são formalização do que funciona; o caso particular do OFICINA (Windows manual, sem Docker) é o anti-exemplo que reforça o valor
- **PULSAR-RH Vercel:** Edge Functions e preview deployments já em uso — `04` fecha esse conhecimento com os detalhes que ainda são modo cargo cult (rollback, logs de edge)
- **Escala Meet Hub (plano 6 bots):** a decisão de ir para Hetzner e provisionar múltiplos containers é onde `06` vai importar — estudar antes do crescimento, não durante
