# Contrato do módulo v2.1 — profundidade com lastro científico

Contrato de produção de TODO módulo expandido da trilha (ondas v2). Padrão-ouro vivo:
`05-raciocinio/00-metodologia-da-ia.md` e a onda 1 (05-raciocinio + 00-fundamentos).

## Estrutura obrigatória

1. `# NN — Título` + blockquote de formato
2. **## O que é** — por que este módulo existe (curto; a §BASE é quem aprofunda)
3. **## § BASE — o fundamento** — teoria POR EXTENSO, nível científico (regras abaixo)
4. **## § ESTRUTURAÇÃO** — como o conhecimento se organiza (hierarquia, dependências, diagrama ASCII)
5. **## § METODOLOGIA** — o passo-a-passo replicável, numerado, com anti-padrões
6. **## Passo-a-passo aplicado (faça agora, ~Nmin)** — exercício em repo real
7. **## Por que cai em entrevista** + blocos P/R (30s) — preservar os existentes, +1 novo
8. **## Checkpoint** — 5-6 itens mensuráveis
9. **## Recursos** — fontes por nome de obra/capítulo/seção; NUNCA URL de memória

## Regras de rigor científico (v2.1 — exigência de 2026-07-24)

- **Todo claim central da §BASE tem dono nomeado**: o paper (autor, ano), a spec (RFC/ECMA
  por seção), o livro-texto (capítulo), ou o experimento. "Estudos mostram" sem nome = cortar.
- **Fonte primária > divulgação**: citar Miller (1956) e não um blog sobre memória; a prova
  de Gilbert & Lynch e não "o teorema CAP diz"; a RFC e não um tutorial.
- **Números com origem**: latência, retenção, percentual — só com a fonte junto (IBM Cost of
  a Data Breach 2023; DORA/Accelerate). Número órfão = cortar ou marcar como estimativa.
- **Incerteza declarada**: resultado contestado na literatura (ex: efeitos de gamificação,
  learning styles — este último é MITO documentado) entra com a controvérsia, não como fato.
- **Formalismo na medida**: notação/matemática quando ela COMPACTA o entendimento (O(log n),
  f(f(x))=f(x)); nunca como decoração. O leitor é um dev júnior subindo — material 1 degrau
  acima do nível dele, não 5 (carga cognitiva: além da zona, afoga em vez de aprofundar).
- **Nada de URL inventada**: obra citada por nome; quem procura acha. Link só quando estável
  (RFC, MDN por seção). Vale a regra anti-alucinação da casa.

## Tamanho e tom

10–16KB. Denso e direto, PT-BR, opinionado. Profundidade = teoria explicada por extenso
com as fontes na mesa — não parede de texto nem bullet raso. Repo é PÚBLICO: codinomes
sempre (Cliente Varejo, CLIENTE OFICINA, ERP-externo).

## Ordem das ondas (just-in-time: conteúdo na frente do uso, nunca estoque)

Onda 1 ✅ 05-raciocinio, 00-fundamentos · Onda 2: 12-testes, 60-seguranca · Onda 3:
35-ia-ml ("cérebros de IA") · Onda 4: 42-design, 44-motion-design · Onda 5: 25-gestao
(+ módulos de conduta profissional), 30-banco · demais conforme o avanço real na trilha.
