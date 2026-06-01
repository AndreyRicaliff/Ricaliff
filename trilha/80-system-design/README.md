# 80 — System Design

## Foco
A trilha de entrevista pleno/sênior: dado um problema ("projete o Instagram", "projete um sistema de notificações"), raciocinar em voz alta sobre cache, fila, replicação, consistência e escala de forma estruturada. Para o Ricalfiff, que já implementou fila com Bull no Meet Hub e sync idempotente no OFICINA, os blocos básicos já existem na prática — essa trilha ensina o vocabulário e o framework de raciocínio para defender as decisões numa whiteboard.

## Por que cai em entrevista
- "Projete um sistema de upload de vídeo que suporte 1 milhão de usuários" — querem o processo, não a resposta certa
- "O que é o teorema CAP e onde ele se aplica no seu projeto?" — diferenciador real
- "Quando você usaria cache? Qual estratégia?" — cache-aside vs write-through com trade-offs
- "Como você escalaria esse serviço se o tráfego triplicasse amanhã?"
- "Me explica a diferença entre escalabilidade horizontal e vertical com um exemplo real"

## Pré-requisitos
- `30-banco`: índices, transactions, replicação — system design pressupõe banco sólido
- `50-backend/03-queues` e `04-idempotencia`: fila e idempotência aparecem em todo design
- `70-devops/01-docker`: container é a unidade de escala horizontal
- Essa trilha vem por último — sem as outras, é teoria sem base

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-cache-estrategias.md` | Cache-aside, write-through, write-behind, TTL, invalidação — quando cada um e custo | PULSAR-RH | 🟡 |
| 02 | `02-filas-quando-e-como.md` | Fila vs chamada síncrona, at-least-once delivery, idempotência obrigatória, dead-letter | Meet Hub | 🟡 |
| 03 | `03-replicacao-leader-follower.md` | Primary/replica no Postgres, lag de replicação, leitura de replica, failover | PULSAR-RH | 🟢 |
| 04 | `04-cap-theorem-na-pratica.md` | CP vs AP com exemplos reais, por que "CA" é mito em distribuído, onde cada banco se encaixa | CLIENTE OFICINA | 🟢 |
| 05 | `05-load-balancing.md` | Round-robin, least connections, sticky sessions (e por que evitar), health check | Meet Hub | 🟢 |
| 06 | `06-escalabilidade-horizontal-vs-vertical.md` | Quando vertical para de ser opção, stateless como pré-requisito de horizontal, sharding | AG Hub | 🟢 |
| 07 | `07-idempotencia-e-deduplicacao.md` | Chave de idempotência, upsert vs insert, deduplicação em fila, exactly-once é mito | CLIENTE OFICINA | 🟡 |
| 08 | `08-design-de-sistema-exemplo.md` | Projetar Meet Hub do zero: gravação → transcrição → armazenamento → busca, decisões documentadas | Meet Hub | 🟡 |

## Como aprender essa trilha
- Só começar depois que `30-banco`, `50-backend` e `70-devops` estiverem concluídos
- `01`, `02` e `07` têm maior retorno imediato — aparecem em entrevista júnior avançado e pleno
- `08` é o exercício integrador: projetar um sistema que o Ricalfiff construiu de verdade
- Sinal de fixação: consegue conduzir um design em voz alta por 20 minutos sem travar, com trade-offs explícitos em cada decisão
- `03`, `04`, `05`, `06` são pleno/sênior — não pressionar o prazo desses

## Conexão com decisões reais
- **Meet Hub fila Bull:** a decisão de processar gravações de forma assíncrona (bot → job → transcrição → storage) é o caso de estudo de `02` e `08` — entrevistador pergunta "por que fila aqui?" e a resposta tem custo de sincronismo + retry grátis
- **CLIENTE OFICINA sync incremental:** reprocessar a janela de 2 dias sem duplicar registros é `07` implementado; o teorema CAP aparece na decisão de priorizar consistência eventual sobre disponibilidade instantânea
- **Plano de escala Meet Hub (6 bots, Hetzner):** é o exercício real de `06` — quando o DigitalOcean vertical para de ser opção e horizontal começa a fazer sentido financeiro
