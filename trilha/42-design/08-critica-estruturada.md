# 08 — Crítica Estruturada

## O que é

Crítica de design é avaliar uma tela **contra a intenção dela**, não contra o gosto de quem avalia — e é uma habilidade de engenharia, não de "sensibilidade". A diferença entre feedback amador e crítica profissional é a mesma entre "esse código tá feio" e um code review: método, critérios nomeados e hipóteses refutáveis.

**O protocolo (3 papéis):**
1. **Autor declara a intenção primeiro.** "Essa tela serve pra X, o usuário chega vindo de Y, a informação crítica é Z." Sem intenção declarada, toda crítica vira disputa de gosto — não há contra o quê avaliar.
2. **Crítico descreve antes de julgar.** "Meu olho foi primeiro no gráfico, não no total" é observação (dado). "O gráfico chama atenção demais" já é diagnóstico. "Diminui o gráfico" é prescrição. A ordem importa: observação → diagnóstico → (só se pedido) prescrição. Pular direto pra prescrição rouba do autor o problema real.
3. **Feedback formulado como hipótese testável.** "Isso me parece confuso PORQUE há dois pontos focais — um teste de 5 segundos confirmaria" é refutável; "não gostei" não é. Crítica que não pode estar errada não é crítica, é opinião.

**O checklist dos 5 eixos** (destilado dos módulos 01–07):

| Eixo | Pergunta | Teste objetivo |
|---|---|---|
| Hierarquia | Um ponto focal? A ordem de leitura é a intencional? | 5 segundos + squint |
| Estados | Os 5 estados existem? Vazio ensina? Erro aciona? | forçar cada um |
| Consistência | Usa os tokens/padrões do sistema ou inventa? | grep de hex/valor arbitrário |
| Acessibilidade | Teclado completo? Foco visível? Contraste AA? | passada de teclado + axe |
| Respiro | Escala de espaço respeitada? "dentro < entre"? Alinhado? | overlay de 8px |

**Receber crítica sem ego:** não defenda em tempo real — anote tudo, agradeça, triagem depois. Três destinos possíveis para cada apontamento: acatar, refutar **com critério** ("denso de propósito: dashboard de operação, módulo 04") ou "não sei — vou testar". Os três são respostas válidas de engenheiro; o que não é válido é acatar tudo (vira cata-vento) ou refutar tudo (vira parede). E registrar a decisão: apontamento recorrente que você refuta toda semana merece um ADR no DECISIONS.md dizendo o porquê — a crítica repetida morre lá.

**Redesign incremental, nunca big-bang:** achou 12 problemas → corrija os 3 de maior impacto → re-teste → repita. Big-bang redesign destrói a evidência (impossível saber o que melhorou o quê) e o aprendizado do usuário junto. Uma alavanca por iteração é o mesmo princípio do módulo 01 — e do debug: mudar 5 coisas e "funcionou" não te diz nada.

### Passo a passo: autocrítica de uma tela sua (30 min)

```text
1. Escolha uma tela real (ex.: uma tela de dashboard de cliente AG).
2. ESCREVA a intenção em 2 linhas ANTES de olhar criticamente
   (senão você ajusta a intenção ao que a tela já faz — viés).
3. Rode os 5 eixos do checklist, com os testes objetivos.
   Formule cada achado como hipótese: "X porque Y — testável via Z".
4. Priorize por impacto x esforço. Top 3 apenas.
5. Corrija os 3 → rode o teste do eixo de novo (evidência do ANTES
   e DEPOIS — screenshot dos dois).
6. Registre no DECISIONS.md do projeto: o que mudou, por quê,
   e o que você deliberadamente NÃO mudou (com o critério).
```

O passo 6 é o que transforma crítica em ativo de entrevista: "melhorei a tela" não se defende; "teste de 5s falhava na métrica-chave, rebaixei dois pontos focais concorrentes, re-testei e passou — registrado no ADR de tal data" se defende sozinho.

## Por que cai em entrevista

Crítica estruturada é avaliada duas vezes: explicitamente ("critique essa tela" — exercício comum em processo com etapa de design/front) e implicitamente, em como você reage quando o entrevistador desafia sua solução. Quem responde ao desafio com critério nomeado ou "não sei, testaria assim" passa; quem defende com ego ou cede na primeira pressão, não.

> **P:** "Olha essa tela do nosso produto. O que você mudaria?"
>
> **R (30s):**
> "Antes de mudar, eu perguntaria a intenção: pra que serve a tela e qual a informação crítica — sem isso, crítica é gosto. Aí rodo cinco eixos: hierarquia — tem um ponto focal só? —, os cinco estados, consistência com o sistema, acessibilidade de teclado e contraste, e respiro do espaçamento. Formulo cada achado como hipótese testável: 'isso parece confuso porque há dois pontos focais — um teste de 5 segundos confirma'. E mudaria incrementalmente: top 3 por impacto, re-testa, repete — big-bang destrói a evidência de o que melhorou o quê."

## Checkpoint

- [ ] Rodei a autocrítica completa (6 passos) numa tela minha, com antes/depois registrado
- [ ] Meus últimos 3 feedbacks de UI seguiram observação → diagnóstico → prescrição
- [ ] Formulei ao menos 1 crítica como hipótese refutável com teste nomeado
- [ ] Refutei um feedback com critério documentado (não com "prefiro assim")
- [ ] Tenho 1 ADR de design no DECISIONS.md de um projeto real

## Recursos

- *Discussing Design* — Adam Connor & Aaron Irizarry (O'Reilly) — o livro do protocolo de crítica
- [Laws of UX](https://lawsofux.com/) — vocabulário compartilhado pra crítica sem "achismo"
- NN/g — artigos sobre design critique e cultura de feedback (nngroup.com)
- Módulos 01–07 desta trilha — o checklist dos 5 eixos é a síntese deles
