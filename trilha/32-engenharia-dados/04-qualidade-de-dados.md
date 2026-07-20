# 04 — Qualidade de Dados

## O que é

Dado do mundo real chega sujo, e pipeline que assume o contrário quebra em produção de madrugada. Casos famosos: a sonda Mars Climate Orbiter (1999) se perdeu por unidades trocadas entre equipes (newton vs libra-força) — dado numericamente válido, semanticamente errado; e em 2020 a genética RENOMEOU ~27 genes porque o Excel convertia silenciosamente nomes como SEPT1 em datas, corrompendo milhares de planilhas de pesquisa. A lição comum: **o dado não avisa que está errado; quem valida é o boundary.**

Boundary = o ponto onde dado de terceiro entra no seu sistema (a Edge Function que recebe o payload do ERP-externo). Validar ali, uma vez, com schema explícito — e não validar de novo lá dentro. Validação espalhada é a versão de dados da fórmula duplicada (módulo 03): duas regras homônimas que divergem.

O trio clássico de sujeira em integração:

1. **JSON inválido/mutante do fornecedor:** campo que era number vira string ("1.234,56"), campo some, array vira objeto quando tem um item só. Contrato de API de ERP é aspiracional.
2. **Encoding:** origem em latin1/cp1252, destino UTF-8 — "São João" vira "SÃ£o JoÃ£o". Detectar no boundary e corrigir na conversão; nunca com replace no front.
3. **Datas UTC vs local:** o ERP manda `2026-07-18` sem fuso. Meia-noite de onde? Gravar `timestamptz` sempre e converter explicitando o fuso do negócio (`America/Sao_Paulo`). Data sem fuso interpretada como UTC desloca venda noturna para o dia seguinte — e o faturamento diário diverge de novo.

### Quarentena vs rejeição fail-closed

Decisão de engenharia, não de gosto:

- **Fail-closed (rejeitar o lote):** quando o erro indica quebra de contrato que contamina tudo — campo crítico sumiu do payload inteiro, endpoint de auth respondendo HTML. Melhor dashboard desatualizado com alarme do que número errado com cara de certo.
- **Quarentena (isolar a linha):** quando a sujeira é pontual. A linha inválida vai para `sync_quarentena` com o payload cru + motivo; o resto do lote segue. Depois do fix, reprocessa-se a quarentena.

### Passo a passo

```ts
import { z } from 'zod';

const Venda = z.object({
  id: z.number().int().positive(),
  loja: z.string().min(1),
  valor: z.coerce.number().nonnegative(),        // aceita "123.45" string
  emitida_em: z.string().datetime({ offset: true }),
});

const ok: unknown[] = [], ruim: unknown[] = [];
for (const item of lote) {
  const r = Venda.safeParse(item);
  r.success ? ok.push(r.data)
            : ruim.push({ payload: item, erro: r.error.flatten() });
}
if (ok.length === 0 && lote.length > 0)
  throw new Error(`lote inteiro inválido — contrato quebrou (${lote.length} itens)`);
if (ruim.length) await db.from('sync_quarentena').insert(ruim);
await db.from('vendas_raw').upsert(ok.map(mapear), { onConflict: 'erp_id' });
```

Dois raciocínios sênior embutidos: a quarentena preserva o payload CRU — evidência para investigar, não só um flag de erro; e o caso "100% inválido" promove quarentena a fail-closed, porque aí a hipótese "sujeira pontual" foi refutada pelos próprios dados.

## Por que cai em entrevista

"Como você lida com dado ruim do fornecedor?" separa quem já operou integração de quem só leu sobre. A resposta esperada tem estrutura: onde valido (boundary), o que faço com o inválido (quarentena vs rejeição, com critério explícito) e como não perco evidência para o diagnóstico.

> **P:** "O fornecedor mudou o formato de um campo e seu pipeline quebrou de madrugada. Como evitar?"
>
> **R (30s):**
> "Não dá para evitar o fornecedor mudar; dá para escolher COMO quebra. Valido com schema Zod no boundary: linha pontualmente inválida vai para quarentena com o payload cru e o motivo, e o lote segue; se o lote INTEIRO falha, é quebra de contrato — paro fail-closed e alarmo, porque prefiro dado atrasado a dado errado. Datas gravo sempre em timestamptz com fuso explícito — data sem fuso desloca venda noturna de dia e o faturamento diverge. E a quarentena é evidência: saiu o fix, reprocesso dali, sem re-extrair nada."

## Checkpoint

- [ ] Explico validação em boundary e por que revalidar "por garantia" lá dentro é anti-padrão
- [ ] Cito de cabeça os 3 tipos de sujeira (contrato, encoding, fuso) com um exemplo cada
- [ ] Sei o critério que decide quarentena vs fail-closed — e o caso que promove um a outro
- [ ] Escrevi um `safeParse` com quarentena preservando o payload cru
- [ ] Explico por que `timestamptz` + fuso explícito, com o cenário da venda noturna

## Recursos

- [Zod](https://zod.dev/) — schema validation no boundary em TypeScript
- [Postgres — date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html) — timestamp vs timestamptz
- "Falsehoods programmers believe about time" — lista clássica de suposições falsas; buscar pelo título
- Caso dos genes renomeados por causa do Excel (2020) — buscar "HGNC gene renaming Excel"
