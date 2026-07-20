# 07 — Concorrência e Locks

## O que é

Race condition é quando o resultado depende de **quem chega primeiro** — e você não controla a ordem. Dois processos leem o mesmo estado, decidem com base nele, e escrevem por cima um do outro. O bug clássico é o **check-then-act**: você verifica ("tem vaga?") e age ("reserva") em dois passos separados, e entre os dois passos outro processo fez a mesma verificação. Os dois viram "tem vaga", os dois reservam, e o limite de 120 lugares vira 122. Nenhum dos dois código está "errado" isoladamente — o erro é a janela entre ler e escrever.

Isso não é teórico. No ag-converge, o limite de assentos era furável exatamente assim: duas inscrições simultâneas passavam pela mesma checagem de vaga antes de qualquer uma gravar. No sync da AG, dois disparos concorrentes (o scheduler de 5min colidindo com um full-sync manual) processavam o mesmo lote em paralelo. Concorrência não é caso de borda — é o caso normal em qualquer sistema com mais de um cliente.

Três defesas, do mais forte ao mais leve:

**1. Deixe o banco decidir (constraint atômica).** A defesa mais robusta é não ter a janela. Um `UNIQUE` faz o banco rejeitar a segunda escrita atomicamente — sem check-then-act no seu código. É o mesmo mecanismo da idempotência (módulo 03): a corrida vira uma violação de constraint que você trata. `INSERT ... ON CONFLICT` decide no banco, onde a atomicidade é garantida, não na sua aplicação, onde há janela.

**2. Lock otimista (versão/timestamp).** Assume que conflito é raro. Você lê a linha com sua versão, e no update exige que a versão não tenha mudado: `UPDATE ... WHERE id = ? AND version = ?`. Se outro processo escreveu no meio, `version` mudou, seu update afeta 0 linhas, e você sabe que perdeu a corrida — rele e tenta de novo. Bom quando conflitos são exceção; barato porque não segura nada.

**3. Lock pessimista (trava explícita).** Assume que conflito é provável. Você tranca o recurso antes de mexer: `SELECT ... FOR UPDATE` (trava a linha no Postgres pela duração da transação) ou um lockfile/mutex de processo pra serializar jobs. Foi o fix do sync: um **lockfile** serializa o full-sync contra o incremental — o segundo espera o primeiro terminar. Mais forte e mais caro: enquanto travado, outros esperam.

### Passo-a-passo: transação com trava de linha

```sql
BEGIN;
SELECT vagas FROM evento WHERE id = 1 FOR UPDATE;  -- trava a linha até COMMIT
-- nenhum outro processo passa daqui até você soltar
UPDATE evento SET vagas = vagas - 1 WHERE id = 1 AND vagas > 0;
COMMIT;   -- solta a trava
```

O `FOR UPDATE` fecha a janela do check-then-act: entre o `SELECT` e o `UPDATE`, ninguém mais lê aquela linha. Raciocínio de trade-off: isso serializa o acesso àquela linha (mais lento sob concorrência alta no mesmo recurso), mas elimina o overbooking. Você troca vazão por correção — e num contador de vagas, correção não é negociável.

### O teste que expõe a corrida

Race condition não aparece em teste sequencial — por definição. Você tem que forçar o paralelo: dispare a operação N vezes com `Promise.all` e asserte o invariante (vagas nunca negativo, nunca 2 registros pra mesma chave). Se o teste passa com 1 e você nunca rodou com 50 em paralelo, você não testou concorrência — testou o caminho feliz de novo (módulo 08).

## Por que cai em entrevista

Concorrência é o divisor pleno/sênior. "O que é race condition e como você previne?" — quem responde com os três níveis (constraint > otimista > pessimista) e sabe *quando* cada um, passa. "Optimistic vs pessimistic locking" é pergunta direta em qualquer vaga que toca banco.

> **P:** "Duas requisições simultâneas compram o último ingresso. Como você garante que só uma leva?"
>
> **R (30s):** "O bug é check-then-act: as duas verificam 'tem vaga' antes de qualquer uma gravar. A defesa mais forte é não ter a janela — deixo o banco decidir com uma constraint ou uma transação com `SELECT ... FOR UPDATE`, que trava a linha entre ler e escrever, então a segunda requisição espera e vê vaga zero. Se conflito fosse raro, usaria lock otimista com coluna de versão e retry. Já corrigi isso na prática serializando jobs concorrentes com lockfile. E provo com teste: disparo em paralelo com Promise.all e asserto que o contador nunca fura — corrida não aparece em teste sequencial."

## Checkpoint

- [ ] Explico check-then-act e por que a janela entre ler e escrever é o bug
- [ ] Sei os 3 níveis (constraint atômica, lock otimista, lock pessimista) e quando usar cada
- [ ] Implementei `SELECT ... FOR UPDATE` numa transação e explico o que ele trava
- [ ] Explico o trade-off de serializar (correção vs vazão)
- [ ] Escrevi um teste que dispara em paralelo e asserta o invariante

## Recursos

- [PostgreSQL — Explicit Locking (FOR UPDATE)](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Martin Kleppmann — "Designing Data-Intensive Applications", cap. 7 (Transactions)](https://dataintensive.net/)
- [PostgreSQL — Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- Módulos relacionados: `82-robustez/03` (idempotência), `82-robustez/08` (teste de falha)
