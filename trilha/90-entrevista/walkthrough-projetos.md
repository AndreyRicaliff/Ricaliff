# Walkthrough de Projetos AG — Como Apresentar em Entrevista

Quando o entrevistador abre seu GitHub e diz "me conta sobre esse projeto", você tem 30 segundos antes de perder a atenção. Este guia dá o pitch curto e o roteiro longo para cada projeto.

---

## PULSAR-RH

**Pitch de 30s:**
> "SaaS de People Analytics para gestores de RH. Coleta respostas de pesquisas de clima, calcula indicadores de risco psicossocial (NR-1) e gera relatórios por setor. Multi-tenant com isolamento de dados por RLS no banco — empresa A nunca vê dado da empresa B. Stack: Supabase, Chart.js, Claude API para análise, Vercel."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Pequenas e médias empresas precisam cumprir NR-1 (regulamentação federal de saúde mental no trabalho) mas não têm estrutura de RH para mapear riscos psicossociais. Contratar consultoria para isso custa caro por ciclo. PULSAR-RH automatiza a coleta de dados via pesquisa, calcula os indicadores e gera o relatório que o gestor precisa — sem depender de planilha manual ou consultoria para cada ciclo.

**2. Decisões técnicas defensáveis (90s)**

*Supabase em vez de Firebase:*
RH tem modelo de dados relacional — funcionários têm departamentos, departamentos têm gestores, pesquisas têm sub-áreas. Firebase (document store) tornaria joins e consistência um problema manual. Postgres resolve isso nativamente. Trade-off: vendor lock-in no Supabase, mas os dados ficam em Postgres padrão — exporto e migro se necessário.

*RLS no banco em vez de filtro só no backend:*
Multi-tenant com filtro só no middleware tem uma superfície de bug: qualquer falha no código vaza dados entre tenants. Com RLS, o banco bloqueia na raiz. A policy `USING (tenant_id = auth.uid())` roda em toda query, independente de quem chama. Testei diretamente via Supabase Studio com um token de outro tenant — zero acesso.

*Claude API para análise de respostas abertas:*
Perguntas de texto livre não têm resposta certa — análise qualitativa manual não escala. A API categoriza e resume respostas por tema. Trade-off: custo por análise e latência. Mitigo com cache de resultados: análise roda uma vez por ciclo de pesquisa, não a cada visualização.

**3. Desafio técnico interessante (90s)**
Encontrei um bug de O(n²) no dashboard de riscos: para cada funcionário (n), rodava uma query de riscos (n queries). Em produção com 200 funcionários = 200 queries por carregamento de página. O usuário não reclamava porque o sistema era novo e pequeno, mas eu vi no Supabase Dashboard as queries se multiplicando.

Corrigi com um JOIN que traz funcionários e riscos juntos em uma query. Depois fiz code review no restante do codebase e encontrei mais 4 variações do mesmo padrão. A lição: N+1 é silencioso em desenvolvimento (poucos dados) e destrutivo em produção (dados reais). Agora reviso todo acesso a banco com esse padrão em mente.

**4. O que aprendi (60s)**
Que segurança no banco é mais confiável que segurança no código. RLS foi a decisão mais importante do projeto — não porque é tecnicamente impressionante, mas porque remove uma categoria inteira de bugs. Também aprendi que otimização sem medição é chute: os 4 outros pontos N+1 que corrigi não teriam aparecido sem métricas do Supabase Dashboard. Meça antes de otimizar.

**Perguntas prováveis do entrevistador:**
- "Como você garante que dados de um tenant não vazam para outro?"
- "Por que não usar apenas um middleware no backend para filtrar?"
- "Como o Claude API está integrado? Você envia dados sensíveis de funcionários?"
- "Como é o modelo de preços do SaaS?"

**Não fale sobre:**
- Que o frontend tem pouca cobertura de teste (vai aparecer como fraqueza sem contexto para compensar)
- O SyntaxError de crash pós-modularização a não ser que o entrevistador pergunte sobre bugs difíceis (aí vira ativo, não passivo)

---

## CLIENTE OFICINA

**Pitch de 30s:**
> "Sistema de sincronização automática de estoque e pedidos entre um ERP legado em Firebird e o banco em nuvem (Supabase) de um e-commerce. Sync incremental a cada 5 minutos com janela de overlap de 2 dias + sincronização full anual. Em produção."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Uma loja de motos usava um ERP dos anos 90 (Firebird) que não tinha API. O e-commerce precisava de dados atualizados de estoque. A solução manual era exportar planilha, importar no site — processo diário, propenso a erro, dependente de pessoa. O cliente precisava de sync automático sem trocar o ERP (custo proibitivo).

**2. Decisões técnicas defensáveis (90s)**

*Incremental com overlap em vez de full sync a cada ciclo:*
Full sync de 50k produtos a cada 5 minutos seria inviável (volume + carga no Firebird). Incremental com `WHERE updated_at > last_sync` resolve, mas tem o edge case de relógio: se o servidor do Firebird atrasou 1 minuto, itens atualizados naquele minuto somem. A janela de overlap de 2 dias garante que itens das últimas 48h são sempre re-verificados. Custo: processa mais itens que o necessário. Benefício: zero perda silenciosa de dados.

*Lockfile para o full-year:*
A sincronização anual (todas as 00:00) pode demorar horas. Se o processo for reiniciado no meio, sem lockfile ele recomeça do zero — ou pior, roda em paralelo duplicando carga. O lockfile impede execução dupla e o processo retoma de onde parou com um cursor de posição.

*Retry com backoff exponencial:*
Firebird é legado — timeouts acontecem. Retry simples em loop martela o servidor. Backoff exponencial: 1s, 2s, 4s, 8s... com jitter (componente aleatório) para evitar thundering herd quando múltiplos itens falham ao mesmo tempo.

**3. Desafio técnico interessante (90s)**
O problema mais sutil foi item-a-item vs batch: a primeira versão pegava todos os itens alterados em um array e fazia um upsert em batch no Supabase. Se qualquer item do batch falhasse, o batch inteiro falhava — e eu não sabia qual item causou o problema.

Refatorei para processar item-a-item com log de cada operação. O custo é mais queries, mas: erro em um item não cancela os outros, o log mostra exatamente qual item falhou e por quê, e o retry foca só no item com problema. Em produção com dados legados sujos (encodings misturados, datas inválidas, campos nulos onde não deveriam), isso foi a diferença entre um sistema frágil e um robusto.

**4. O que aprendi (60s)**
Que dados legados são piores do que você imagina, e seu sistema precisa sobreviver a isso. Também aprendi que "em produção" é uma categoria diferente de "funcionando no meu notebook". O overlap de 2 dias e o retry+backoff pareciam overhead desnecessário em desenvolvimento — em produção, ambos já foram acionados. Não otimize para o caminho feliz.

**Perguntas prováveis do entrevistador:**
- "Como você detecta que um item falhou sem travar o processo todo?"
- "O que acontece se o Supabase ficar fora do ar por 20 minutos?"
- "Como você testa o sync sem bagunçar os dados de produção?"
- "Por que não usar CDC (Change Data Capture) em vez de polling?"

**Não fale sobre:**
- Que o Firebird driver tem comportamentos não-documentados (parece reclamação, não aprendizado)
- Custo de infraestrutura a não ser que perguntem (detalhe operacional que distrai do técnico)

---

## CLIENTE VAREJO

**Pitch de 30s:**
> "Integração entre a API da ERP-externo (plataforma de vendas) e Supabase, com rate limit real de 350 requisições/dia. Planejei budget de 300req/dia, sync incremental a cada 10 minutos com overlap, para deixar margem de segurança. Projeto em fase de implementação."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Uma loja de celulares usava a ERP-externo como plataforma de vendas mas queria dashboards customizados e relatórios que a plataforma não oferecia. O caminho era puxar os dados via API e armazenar num banco próprio para análise. O bloqueio: API com quota restrita (350 req/dia) que inviabiliza sync ingênuo.

**2. Decisões técnicas defensáveis (90s)**

*Budget de 300req/dia com margem de segurança:*
O limite é 350. Usar 350 é apostar que nenhuma requisição vai repetir, nenhum retry vai ser necessário, nenhuma operação manual vai precisar de dados. Reservar 50req/dia (14%) como buffer é conservador e deliberado. Se ultrapassar o budget, o sistema para e notifica — não ultrapassa o limite e perde acesso por 24h.

*Sync incremental com overlap em vez de full sync:*
Full sync com 350 req/dia seria viável apenas 1 vez por dia — sem incrementalidade. Com incremental (só dados alterados desde o último sync), posso rodar a cada 10 minutos e usar apenas o necessário. O overlap garante que dados na janela de clock skew não somem.

*Contador de requisições persistido no banco:*
Se o contador ficasse só em memória, um restart do processo zerava o contador — e o dia seguinte poderia ultrapassar o limite sem saber. O contador persiste no Supabase com timestamp de reset às 00:00.

**3. Desafio técnico interessante (90s)**
O desafio de design foi entender que rate limit por dia tem janela deslizante vs janela fixa. A ERP-externo usa janela fixa (resetar à meia-noite). Isso significa que às 23:59, você tem X requests restantes — e às 00:00, voltam 350. Um sistema ingênuo que usa as últimas requests perto da meia-noite pode travar até o reset. O sistema que estou implementando rastreia o timestamp de reset e trata a janela corretamente — não conta requests de dias anteriores.

**4. O que aprendi (60s)**
Que constraint é uma fonte de design, não só um problema a contornar. O rate limit forçou decisões que tornaram o sistema mais eficiente: incremental em vez de full, budget em vez de "usa tudo", persistência do contador. Um sistema sem restrições tende a ser ingênuo. Restrições reais fazem você pensar.

**Perguntas prováveis do entrevistador:**
- "O que acontece quando o budget de 300req/dia é atingido antes de acabar o dia?"
- "Como você garante que o contador não fica dessincronizado em caso de falha?"
- "Você considerou cache agressivo para reduzir o número de requests?"
- "Por que 10 minutos e não 1 hora?"

**Não fale sobre:**
- Que o projeto foi travado/com problemas de inconsistência (frame como "desafio que motivou o design cuidadoso")
- Detalhes do cliente sem permissão explícita

---

## MEET HUB

**Pitch de 30s:**
> "Plataforma de gravação e transcrição automática de reuniões. Um bot (Puppeteer+Docker) entra nas reuniões, grava, envia para o Gemini transcrever. Fila com Bull+Redis para processar múltiplas gravações em paralelo. Backend Node+Express+Prisma, deploy em DigitalOcean."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Consultores da AG Consultoria participam de reuniões com clientes e precisam de registro das decisões tomadas. Fazer anotações durante a reunião divide atenção. Gravar manualmente e transcrever depois é processo manual que ninguém faz de forma consistente. Meet Hub automatiza: o bot entra sozinho, grava, transcreve e disponibiliza o registro sem intervenção humana.

**2. Decisões técnicas defensáveis (90s)**

*Puppeteer em Docker em vez de SDK nativo das plataformas:*
As plataformas (Meet, Teams, Zoom) têm APIs de gravação, mas com restrições pesadas: necessidade de conta enterprise, aprovação de aplicativo, limites de uso. Puppeteer controla o browser como um humano — sem dependência de API proprietária. O custo é fragilidade: se a interface mudar, o seletor quebra. Mas a flexibilidade de suportar qualquer plataforma sem negociação com fornecedor valeu.

*Bull+Redis para a fila de processamento:*
Gravação e transcrição demoram minutos. HTTP não espera minutos. Sem fila, o usuário esperaria o request aberto ou a tarefa seria perdida em caso de timeout. Bull dá retry automático, dead letter queue para falhas persistentes, e visibilidade de status. Redis foi escolhido sobre banco de dados para a fila por performance e porque o dado da fila é temporário — não precisa de durabilidade de Postgres.

*Gemini em vez de Whisper local:*
Whisper local exigiria GPU ou seria lento demais em CPU. Gemini via API tem latência controlável e qualidade superior para múltiplos sotaques. Trade-off: custo por transcrição e dado enviado para terceiro. Para uso interno da AG, aceitável.

**3. Desafio técnico interessante (90s)**
O teste end-to-end foi o maior desafio de infraestrutura. O bot precisa de browser com áudio, que precisa de display virtual (Xvfb), que precisa de configuração específica de Docker. Em desenvolvimento local funciona diferente de produção (DigitalOcean sem GPU). O ambiente de CI quebrava porque o container não tinha o codec certo para a gravação de áudio.

Resolvi documentando o Dockerfile com cada camada justificada e adicionando healthcheck que verifica se o browser consegue iniciar antes de aceitar jobs. A lição: testes de integração que dependem de hardware/ambiente precisam rodar no ambiente mais próximo de produção possível — não só local.

**4. O que aprendi (60s)**
Que fila de jobs resolve uma categoria de problemas que async/await não resolve: trabalho que demora mais que uma requisição HTTP, que pode falhar e precisa de retry, e que tem concorrência natural. Bull+Redis parecia overengineering antes de implementar — depois de ver o primeiro retry automático funcionar em produção, entendi o valor. Infraestrutura não é overhead, é feature.

**Perguntas prováveis do entrevistador:**
- "O que acontece se o bot for bloqueado pela plataforma por parecer automação?"
- "Como você garante que a gravação não perde nada se o container reiniciar no meio?"
- "Quantas gravações simultâneas o sistema suporta?"
- "Como você protege o dado gravado — quem pode acessar?"

**Não fale sobre:**
- Limitações legais de gravação sem consentimento (complexidade jurídica que distrai — mencione só se diretamente perguntado)
- Que ainda está em fase de escala planejada (frame como "próximos passos", não como "incompleto")

---

## AG CONVERGE

**Pitch de 30s:**
> "Plataforma de eventos para a AG Consultoria. Primeiro evento: RH em Xeque (beneficente, ACCP). Começou como HTML+localStorage, migrou para Supabase quando precisou de múltiplos dispositivos. Tem extrator de leads em .xlsx para pós-evento."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
A AG Consultoria organiza eventos presenciais de networking para profissionais de RH. Precisava de: página de inscrição, gestão de lista de presença na entrada, e exportação de contatos pós-evento para follow-up. Ferramentas de evento padrão (Eventbrite, etc.) têm custo por inscrição e não integram com o processo de follow-up interno.

**2. Decisões técnicas defensáveis (90s)**

*Começar com localStorage, migrar para Supabase:*
Para o primeiro evento, localStorage era suficiente — um único dispositivo gerenciando inscrições. O erro seria Supabase desde o início para um MVP de evento único. Quando o caso de uso de múltiplos dispositivos (tablet na entrada + notebook para gestão) apareceu, a migração foi necessária. Essa sequência foi deliberada: não adicionei complexidade antes de provar necessidade.

*Extrator .xlsx em vez de exportar CSV:*
O time que usa os contatos pós-evento usa Excel. CSV abre com formatação errada em Excel no Windows (problema de separador e encoding). XLSX abre direto, formatado, pronto para usar. Biblioteca SheetJS resolve em 10 linhas. O custo de uma dependência a mais é menor que o custo de suporte para "o arquivo não abre certo".

*HTML sem framework em vez de React:*
Evento tem ciclo de vida curto — não justifica overhead de setup de projeto React, bundle, build pipeline. HTML simples carrega instantaneamente, é fácil de hospedar em qualquer lugar, e o código é lido sem transpilação. Se fosse um produto contínuo, React. Para evento pontual, HTML.

**3. Desafio técnico interessante (90s)**
A migração localStorage→Supabase no meio do ciclo do evento foi o desafio real. Havia inscrições já no localStorage quando decidimos que precisávamos de múltiplos dispositivos. A migração precisava ser: sem perda de dados existentes, sem downtime durante o evento ativo, e reversível se o Supabase tivesse problema de conectividade no dia.

Resolvi com uma camada de abstração sobre o storage: o código não chama localStorage ou Supabase diretamente — chama `dataStore.save()` e `dataStore.get()`. Trocar a implementação por baixo não quebra o restante. Isso foi o Open/Closed na prática.

**4. O que aprendi (60s)**
Que a decisão correta de stack depende do ciclo de vida do produto. Escolha de tecnologia para MVP de evento ≠ escolha para SaaS contínuo. E que abstrair storage desde o início (mesmo que simples) tornou a migração trivial. Uma linha de separação de responsabilidade pode evitar uma refatoração grande.

**Perguntas prováveis do entrevistador:**
- "Por que não usou uma plataforma de eventos pronta?"
- "Como você gerencia a migração de dados locais para o banco?"
- "O evento foi beneficente — como você lidou com dados pessoais dos inscritos (LGPD)?"

**Não fale sobre:**
- Que o localStorage foi um "erro inicial" — não foi, foi uma decisão adequada ao momento

---

## CAFÉ COM AG

**Pitch de 30s:**
> "Sistema de calendário editorial para o programa de YouTube da AG. Single-file HTML com Google OAuth restrito ao domínio @agconsultorialtda.com. Histórico imutável de episódios — nenhuma edição apaga registro."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
A equipe de conteúdo da AG Consultoria produz episódios de YouTube mas não tinha um lugar centralizado para planejar o calendário editorial, registrar o que foi feito e manter histórico. Planilhas no Drive funcionavam mas não tinham histórico imutável — qualquer pessoa podia editar e apagar registros antigos.

**2. Decisões técnicas defensáveis (90s)**

*Google OAuth com hd=agconsultorialtda.com em vez de senha:*
A ferramenta é exclusivamente interna. Criar sistema de usuário+senha seria overhead sem benefício — a equipe já está autenticada no Google Workspace. O parâmetro `hd` (hosted domain) restringe o OAuth a contas do domínio da AG. Ninguém de fora pode logar mesmo com link direto. Simples e seguro para o contexto.

*Histórico imutável como append-only:*
Episódios publicados não devem ser editados — isso é auditoria editorial. Se houve mudança de data ou título, o registro correto é uma entrada nova, não edição da antiga. Implementei como append-only: nenhum registro tem botão de editar ou deletar depois de publicado. O custo é que erros de digitação ficam no histórico — aceitável para o caso de uso.

*Single-file HTML em vez de projeto separado:*
Ferramenta interna pequena não justifica projeto separado com npm, build, CI/CD. Um arquivo HTML com tudo inline: fácil de compartilhar, sem dependências de infra, funciona offline para leitura. Se precisar de feature que não cabe em um arquivo, aí cria projeto separado.

**3. Desafio técnico interessante (90s)**
A restrição de domínio no OAuth tem um edge case: conta Google pessoal com o mesmo email que a conta Workspace. O Google OAuth pode retornar o `hd` correto mas o usuário estar logado na conta pessoal em paralelo. Resolvi verificando o `hd` no token além do email — o `hd` só aparece em contas Workspace, não pessoais. Sem essa verificação, alguém com email similar poderia passar.

**4. O que aprendi (60s)**
Que menos é mais quando o contexto justifica. Não cada problema precisa de um SaaS com banco de dados e autenticação própria. A ferramenta mais simples que resolve o problema é a certa. O critério é o ciclo de vida e o número de usuários — não a tecnologia disponível.

**Perguntas prováveis do entrevistador:**
- "Como você garante que só pessoas do domínio AG acessam?"
- "O que é append-only na prática — como você implementou?"
- "E se precisar corrigir um erro num episódio publicado?"

**Não fale sobre:**
- Que é um projeto pequeno/simples (parece que você está se desculpando — frame as decisões com confiança)

---

## AG HUB

**Pitch de 30s:**
> "Dashboard centralizado da AG Consultoria no Vercel. Agrega status dos projetos, links úteis e métricas internas. Frontend com localStorage para estado local, deploy estático."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Com múltiplos projetos AG rodando simultaneamente (PULSAR-RH, Meet Hub, OFICINA, Varejo, etc.), não havia uma visão centralizada de status, links e métricas. O hub é a página de entrada: tudo em um lugar, sem precisar lembrar URLs ou checar cada projeto separadamente.

**2. Decisões técnicas defensáveis (90s)**

*Vercel + estático em vez de servidor:*
Dashboard de status não precisa de processamento server-side por requisição. Assets estáticos no Vercel têm CDN global, zero configuração de servidor, deploy em segundos. Para um dashboard interno que muda raramente, é o certo.

*localStorage para estado em vez de banco:*
Preferências de visualização, filtros, ordem dos cards — tudo é estado de UI que não precisa persistir no servidor. Um usuário diferente em outro browser começa do zero — e isso é correto para um dashboard de trabalho pessoal.

*Gamificação como mecanismo de engajamento:*
Sistema de XP e conquistas para operações completadas (feat, bugfix, deploy, etc.). Não é feature decorativa — é feedback loop que torna o trabalho progressivo visível. O ag-hub-sync.sh registra XP automaticamente ao final de operações. Isso mantém o histórico de trabalho de forma orgânica.

**3. Desafio técnico interessante (90s)**
A integração com múltiplos projetos para status em tempo real sem criar dependência acoplada: cada projeto reporta seu status via script (ag-hub-sync.sh) — o hub é passivo, não faz polling ativo. Isso inverte a dependência: o hub não precisa saber a estrutura de cada projeto. Cada projeto sabe como reportar para o hub. Se um projeto parar de reportar, o hub mostra o último estado conhecido — não quebra.

**4. O que aprendi (60s)**
Que infraestrutura de desenvolvedor tem os mesmos requisitos que produto de usuário: precisa ser confiável, visível e não atrapalhar. Um hub que fica fora do ar ou que precisa de manutenção constante vira overhead. Simples e estável vale mais que rico em features e frágil.

**Perguntas prováveis do entrevistador:**
- "Como você mantém o status dos projetos atualizado sem polling?"
- "O localStorage não perde dados se o usuário limpar o browser?"
- "Quem usa isso além de você?"

**Não fale sobre:**
- Que é uso pessoal/interno se não perguntado (frame como "infraestrutura de desenvolvedor" — mais profissional)

---

## IFPB (Estudos)

**Pitch de 30s:**
> "Repositório de estudos do curso de programação do IFPB. TypeScript, sem framework, sem banco — foco em fundamentos: algoritmos, estrutura de dados, OOP. Projeto pessoal de aprendizado com código bem estruturado."

**Roteiro de 5min:**

**1. Problema de negócio (40s)**
Não é produto — é aprendizado deliberado. O objetivo é consolidar fundamentos que projetos com framework escondem: como closures funcionam de fato, como implementar estrutura de dados do zero, como TypeScript se comporta sem abstrações de ORM ou biblioteca. Ter o código versionado no GitHub serve como evidência de progresso e processo de pensamento.

**2. Decisões técnicas defensáveis (90s)**

*TypeScript sem framework:*
Aprender TypeScript com React/Next esconde o sistema de tipos atrás de abstrações. Implementando estruturas de dados diretamente, o compilador te obriga a pensar em tipos de forma explícita — não há `any` implícito de biblioteca. O custo é ter menos código "impressionante" para mostrar. O benefício é base sólida.

*Sem banco, sem auth, sem infra:*
Estudos de lógica não precisam de banco. Adicionar Supabase aqui seria distração. O princípio é: cada projeto tem o stack mínimo para o problema que resolve.

*Commits granulares por conceito:*
Cada commit é um conceito, não uma sessão de estudo. Isso torna o histórico navegável — dá para ver o raciocínio progressivo. É documentação através de git.

**3. Desafio técnico interessante (90s)**
Implementar Promise de forma simplificada manualmente — sem usar a built-in — foi o exercício que consolidou async/await. Quando você implementa o `.then` e o encadeamento, entende por que `await` dentro de `forEach` não funciona: o forEach não espera a Promise retornada pelo callback. Não é bug do JavaScript — é comportamento correto de uma função síncrona.

**4. O que aprendi (60s)**
Que fundamentos se aprende construindo, não lendo. Implementar uma linked list em TypeScript ensina mais sobre ponteiros e referência que qualquer tutorial. O IFPB forçou exercícios que eu teria pulado se estivesse só construindo produtos — e esses exercícios aparecem diretamente em perguntas de entrevista.

**Perguntas prováveis do entrevistador:**
- "Por que TypeScript em vez de JavaScript para estudos?"
- "Me mostra um algoritmo que você implementou — como ele funciona?"
- "Como você escolhe o que estudar?"

**Não fale sobre:**
- Que "é só estudo" (frame como aprendizado deliberado com propósito claro)
- Que o código "não é produção" (todo código no GitHub é amostra de como você pensa)
