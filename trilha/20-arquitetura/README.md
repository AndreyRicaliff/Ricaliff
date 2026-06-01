# 20 — Arquitetura de Software

## Foco
Decisões estruturais que separam quem "faz funcionar" de quem "sabe por que funciona". Cobre os princípios SOLID no código real, organização em camadas, padrões de comunicação entre módulos e o momento certo de separar ou unir serviços. Para o Ricalfiff, que já tem projetos em produção, essa trilha transforma escolhas instintivas ("fiz assim e deu certo") em argumentos defensáveis ("fiz assim porque X, o trade-off é Y").

## Por que cai em entrevista
- "Como você estruturaria esse sistema do zero?" — esperam layered/hexagonal, não spaghetti
- "Me explica SOLID com exemplo real" — não querem definição, querem código antes/depois
- "Monolito ou microsserviço para esse caso?" — querem raciocínio, não resposta certa
- "Como você toma decisões técnicas que afetam o time?" — ADR na mão fecha a pergunta
- "Você já refatorou código de outro? O que guiou suas decisões?"

## Pré-requisitos
- `00-fundamentos`: funções puras, imutabilidade, complexidade básica
- `10-codigo-limpo`: extrair função, guard clause, naming — sem isso SOLID vira teoria

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-solid-na-pratica.md` | SRP, OCP, LSP, ISP, DIP com exemplos TypeScript reais | PULSAR-RH | 🔴 |
| 02 | `02-camadas-controller-service-repository.md` | Separação de responsabilidades, fluxo de dado por camada, o que não pode cruzar | Meet Hub | 🔴 |
| 03 | `03-monolito-vs-microsservico.md` | Quando separar tem custo maior que benefício; monolito modular como sweet spot | CLIENTE OFICINA | 🔴 |
| 04 | `04-padroes-comunicacao.md` | REST síncrono, webhook, queue assíncrona, SSE — quando cada um resolve melhor | Meet Hub | 🟡 |
| 05 | `05-adrs-architecture-decision-records.md` | Formato de ADR, quando escrever, como vincular ao código | AG Hub | 🟡 |
| 06 | `06-design-patterns-uteis.md` | Factory, Strategy, Observer, Repository — só os que aparecem em projetos reais | PULSAR-RH | 🟡 |
| 07 | `07-modularidade-pacotes.md` | Monorepo, packages compartilhados, limites de módulo, como evitar acoplamento silencioso | AG Hub | 🟢 |

## Como aprender essa trilha
- Comece por `01-solid` e `02-camadas` — são pré-requisito dos outros
- Para cada padrão: primeiro identifica no código AG existente, depois escreve exemplo isolado
- Sinal de fixação: consegue desenhar no papel o fluxo de uma feature nova antes de codificar
- `03-monolito` pode ser lido junto com `80-system-design/06-escalabilidade` para comparação
- ADRs: não estudar isolado — escrever um ADR real para uma decisão do PULSAR-RH

## Conexão com decisões reais
- **PULSAR-RH modularização (2026-05):** extrair arquivos grandes em módulos separados é SRP aplicado — essa trilha ensina a nomear o que foi feito
- **CLIENTE OFICINA monolito:** a decisão de manter sync como processo único em vez de microsserviço separado tem justificativa em `03` — custo operacional vs. benefício zero nessa escala
- **Meet Hub camadas:** Express routes → service → Prisma → Bull é o padrão `02` aplicado — entrevista pede exatamente isso como exemplo de "arquitetura que você implementou"
