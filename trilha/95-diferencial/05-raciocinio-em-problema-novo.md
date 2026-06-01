# 05 — Raciocínio em problema novo

## Tese

Claude resolve o que já foi resolvido. Sua carreira é resolver o que ainda não foi. Cada problema com solução no Stack Overflow vai ser resolvido por qualquer júnior com acesso ao ChatGPT — inclusive seu concorrente. O que separa pleno de júnior permanente é o que você faz quando não tem resposta pronta: você tem método, ou você congela? Entrevista sênior existe exatamente pra testar isso. Problema novo, sem precedente, pra ver o raciocínio ao vivo.

---

## Por que isso te diferencia

Você já resolveu problemas sem resposta pronta nos projetos AG:

- **Cliente Varejo:** quota da API ERP-externo estourava de forma inconsistente. Nenhum tutorial resolve isso — você precisou entender o rate limiting específico daquele fornecedor e redesenhar a fila de sincronização.
- **CLIENTE OFICINA:** overlap de janela de sync gerava duplicatas silenciosas. O problema não era óbvio, não tinha solução pronta, precisava de raciocínio sobre idempotência em contexto específico.
- **PULSAR-RH:** O(n*m) apareceu em produção sem alarme. Você precisou identificar onde estava, por que acontecia, e resolver sem quebrar o contrato da função.

Você já fez isso. Ainda não tem método explícito. Esse módulo é transformar o que você faz intuitivamente em algo ensinável — e repetível.

---

## Rotina/Método/Hábito

**Método de 5 passos para problema novo:**

### Passo 1 — Definir em 1 frase
Antes de qualquer código, escrever: "Dado X, quero Y, com restrição Z."

Se não consegue escrever em 1 frase, o problema ainda não está definido. Codar agora é perder tempo.

Exemplo OFICINA: "Dado registro Firebird com timestamp inconsistente, quero sync incremental sem duplicata, com janela de overlap de 2 dias."

### Passo 2 — Restringir entrada, saída e restrições
- Que formato é a entrada? Tem casos impossíveis?
- Que formato é a saída esperada? Tem casos de borda (vazio, null, overflow)?
- Qual é a restrição real? (Tempo, memória, latência, API externa, DB scheme)

Anotar antes de codar. Isso parece burocrático — só parece.

### Passo 3 — Resolver com força bruta primeiro
Existe sempre. `O(n²)` é solução. Loop dentro de loop é solução. Hardcode é solução.

Implementar a versão mais simples possível que funciona. Sem otimização. Só pra ter algo concreto na mão.

Motivo: força bruta explicita o problema. Você não sabe o que está otimizando enquanto não tem a versão lenta funcionando.

### Passo 4 — Identificar o que dói
Com a versão lenta rodando, perguntar: "Onde está o trabalho redundante?"
- Recalcula a mesma coisa em loop? → cache
- Percorre estrutura toda para encontrar 1 item? → índice
- Faz I/O em loop? → batch
- Chama API N vezes quando poderia ser 1? → agrupa

Só 1 gargalo por vez. Não otimizar 3 coisas ao mesmo tempo.

### Passo 5 — Otimizar 1 dimensão por vez
Tempo OU memória OU clareza. Escolher. Documentar a troca.

Se melhorou velocidade mas ficou mais complexo: registrar em `DECISIONS.md`. Complexidade tem custo de manutenção.

---

## Exercícios

**Diário:**
1 LeetCode Medium ou 1 problema de System Design (HighScalability.com, Designing Data-Intensive Applications exercícios).

Protocolo:
1. Primeiro round sem Claude — usar o método de 5 passos, anotar cada passo
2. Pode ficar preso — anota onde travou
3. Depois de 30min ou de resolver: abrir Claude e pedir "review do meu raciocínio" — não "me dá a solução"
4. Registrar no `_sem-ia.md`

**Semanal:**
Revisitar 1 problema antigo resolvido com Claude e reimplementar sozinho. Medir diferença de tempo e clareza.

**Mensal:**
Pegar 1 problema real dos projetos AG que foi resolvido com ajuda e reconstruir o caminho de raciocínio. Documentar como entrada no `DECISIONS.md` do projeto. Isso serve de portfólio técnico — é evidência de raciocínio, não só de resultado.

---

## Casos AG com método explícito

**PULSAR-RH — O(n*m) em resultados:**
- Definição: dado N respondentes e M áreas, quero calcular médias sem loop dentro de loop
- Força bruta: `areas.forEach(area => respondentes.filter(r => r.area === area.id))`
- Gargalo: `.filter` percorre tudo pra cada área
- Otimização: mapear respondentes por `area_id` primeiro (`O(n)`), depois acessar por chave (`O(1)` por área)
- Resultado: `O(n + m)` em vez de `O(n*m)`

**CLIENTE OFICINA — overlap de sync:**
- Definição: dado sync incremental com janela de 2 dias, quero idempotência sem duplicata
- Força bruta: reprocessar tudo e deletar duplicatas depois
- Gargalo: deletar duplicatas em tabela grande é lento e arriscado
- Otimização: lockfile + upsert por chave única — nunca insere o que já existe
- Trade-off: mais lento no insert, zero risco de duplicata

---

## Pergunta de entrevista esperada + resposta exemplar

**"Como você abordaria um sistema de notificação em tempo real para 100k usuários simultâneos?"**

Recrutador quer ver MÉTODO, não resposta perfeita.

Resposta que passa:
> "Primeiro defino o problema com precisão: o que é 'notificação', qual é a latência aceitável, quantas notificações por segundo. Depois implemento a versão mais simples — polling a cada 5 segundos. Funciona, mas escala mal. O gargalo é connection por usuário. Aí avalio WebSocket vs SSE vs pub/sub dependendo do padrão de leitura/escrita. 100k simultâneos provavelmente precisam de broker como Redis Pub/Sub com múltiplos workers. Cada passo dessas eu consigo justificar o trade-off."

O que o recrutador escuta: você tem método, você não chuta solução premium antes de entender o problema, você sabe falar de trade-off.

---

## Checkpoint

- [ ] Método de 5 passos documentado e praticado >=10 vezes
- [ ] 30 problemas resolvidos com primeiro round sem Claude em 90 dias (registrado em `_sem-ia.md`)
- [ ] Consigo recitar o método de 5 passos em 60 segundos sem consultar
- [ ] 3 casos AG documentados com o método explícito
- [ ] Consigo dizer "onde estava o gargalo" em qualquer problema AG que já resolvi
- [ ] Fiz >=1 exercício de System Design por semana em 4 semanas seguidas
- [ ] Em live coding consigo pensar em voz alta sem silêncio prolongado (>20s)

---

## Recursos

- LeetCode (Medium, sem hints)
- HighScalability.com — casos reais de sistema em escala
- "Designing Data-Intensive Applications" (Martin Kleppmann) — o livro de System Design
- "Cracking the Coding Interview" — método de entrevista, cap. 1-3
- Seus próprios projetos AG — cada problema resolvido é case válido
