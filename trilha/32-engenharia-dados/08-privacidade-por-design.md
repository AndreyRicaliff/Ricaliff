# 08 — Privacidade por Design

## O que é

Privacy by Design: privacidade como propriedade ARQUITETURAL, decidida no desenho — não como política colada depois. A LGPD (Lei 13.709/2018) codifica os princípios no art. 6º; os dois mais acionáveis para engenharia:

- **Minimização (necessidade):** coletar o mínimo para a finalidade declarada. Campo "pode ser útil um dia" é passivo de vazamento sem receita.
- **Retenção limitada:** dado tem prazo de vida. Agregou, apaga o cru (ou anonimiza de verdade).

Vocabulário técnico que entrevistador testa:

- **Anonimização:** irreversível; o dado deixa de ser pessoal e SAI do escopo da LGPD. Difícil de verdade — grupo pequeno re-identifica.
- **Pseudonimização:** troca o identificador por token/hash, MAS a reversão é possível — continua dado pessoal, continua na lei. Hash NÃO é anonimização (dicionário reverte).
- **Unlinkability:** impossibilidade de LIGAR dois registros à mesma pessoa. É aqui que anonimato real se ganha ou se perde.

Casos famosos de "anonimização" quebrada: a AOL (2006) publicou 20 milhões de buscas "anônimas" — a usuária 4417749 foi identificada pela imprensa em dias, só pelo conteúdo das buscas; o dataset do prêmio Netflix (2007) foi desanonimizado cruzando notas e datas com o IMDb. Remover o nome não anonimiza; o padrão de comportamento identifica.

### O caso real: pesquisa anônima no PULSAR-RH

Requisitos em tensão: a resposta da pesquisa de clima deve ser ANÔNIMA, mas o RH precisa saber QUEM já participou (lembrete e adesão). A solução ingênua — `respostas (user_id, resposta)` com promessa de "ninguém olha" — é anonimato por política: dura até o primeiro select curioso. O desenho do PULSAR-RH: **duas tabelas sem chave de ligação** — ledger de participação separado da resposta.

```sql
-- QUEM participou (ledger) — sem conteúdo
create table pesquisa_participacao (
  pesquisa_id   uuid not null,
  user_id       uuid not null,
  participou_em date not null default current_date,  -- date, não timestamp
  primary key (pesquisa_id, user_id)
);

-- O QUE foi respondido — sem identidade
create table pesquisa_respostas (
  id          uuid primary key default gen_random_uuid(),
  pesquisa_id uuid not null,
  resposta    jsonb not null
  -- deliberadamente: sem user_id, sem created_at preciso
);
```

A escrita insere nas duas na mesma transação, mas nenhuma coluna liga uma à outra. Unlinkability por CONSTRUÇÃO: nem admin com acesso total ao banco reconstrói quem respondeu o quê.

Raciocínio sênior — atacar o próprio design antes do auditor: timestamp preciso nas duas tabelas permitiria correlação temporal (participou 14:03:27 ↔ resposta 14:03:27), por isso `date` no ledger e nada de timestamp fino na resposta. Recorte pequeno também vaza: "a resposta da única pessoa do setor X" identifica sem nome — k-anonimato: não exibir agregado com menos de k respostas (k=5 é piso comum). Hipótese de ataque, refutação no schema.

### Checklist de projeto novo (antes de codar)

1. Que finalidade justifica CADA campo pessoal? (minimização)
2. Prazo e mecanismo de descarte do dado cru? (retenção)
3. O que precisa ser inlinkável — o schema IMPEDE o join ou só promete?
4. Todo agregado exibido respeita o k mínimo?

## Por que cai em entrevista

Privacidade deixou de ser tema só jurídico: "como você faria uma pesquisa anônima?" caiu no colo do engenheiro. Responder com schema — separação física, sem chave de ligação — em vez de "a gente não olha" demonstra o salto de implementador para projetista.

> **P:** "Como você garante anonimato numa pesquisa interna, sabendo que admin tem acesso total ao banco?"
>
> **R (30s):**
> "Por construção, não por política. No PULSAR-RH separei em duas tabelas sem chave de ligação: o ledger de participação — quem respondeu, para lembrete e adesão — e a tabela de respostas, sem user_id. A escrita é uma transação nas duas, mas não existe join possível: nem eu reconstruo quem disse o quê. E ataquei o próprio design: timestamp preciso permitiria correlação temporal, então o ledger guarda só a data; recorte pequeno identifica sem nome, então agregado respeita k mínimo. Hash não bastaria — pseudonimização revertível continua dado pessoal perante a LGPD."

## Checkpoint

- [ ] Explico minimização e retenção com exemplo de campo que eu me recusaria a coletar
- [ ] Diferencio anonimização de pseudonimização e sei qual sai do escopo da LGPD
- [ ] Conto AOL 2006 ou o caso Netflix como prova de que remover o nome não anonimiza
- [ ] Desenho o padrão das duas tabelas sem chave de ligação e a transação de escrita
- [ ] Cito dois vazamentos indiretos (correlação temporal, recorte pequeno) e a defesa de cada

## Recursos

- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) — ler os arts. 5º e 6º
- Guias orientativos da ANPD — buscar no portal gov.br
- Paper "Robust De-anonymization of Large Sparse Datasets" (caso Netflix) — buscar pelo título
- "Privacy by Design — the 7 Foundational Principles" — buscar pelo título
