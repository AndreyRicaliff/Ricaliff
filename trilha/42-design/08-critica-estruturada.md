# 08 — Crítica Estruturada

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Crítica de design é avaliar uma tela **contra a intenção dela**, não contra o gosto de quem avalia — e é uma habilidade de engenharia, não de "sensibilidade". A diferença entre feedback amador e crítica profissional é a mesma entre "esse código tá feio" e um code review: método, critérios nomeados e hipóteses refutáveis. Este é o módulo-exame da trilha: ele sintetiza 01–07 num checklist e empresta o método científico de `05-raciocinio`. Precisa de duas bases: um **vocabulário** para descrever interface sem opinar (Norman) e um **critério de demarcação** para separar crítica de gosto (Popper).

## § BASE — o fundamento

**O vocabulário: affordances, signifiers, mapeamento (Norman, cap. 1).** Don Norman, no cap. 1 de *The Design of Everyday Things* ("The Psychopathology of Everyday Things"), dá os termos que transformam "não gostei" em diagnóstico:

- **Affordance:** a relação entre um objeto e o que ele *permite* fazer (uma superfície plana à altura do joelho *affords* sentar). Em UI, o que um elemento *pode* fazer.
- **Signifier:** o **sinal perceptível** que comunica a affordance (a aparência de botão que diz "clicável"). Norman é enfático: o problema quase nunca é falta de affordance, é falta de **signifier** — o elemento é clicável mas não *parece*.
- **Mapeamento (mapping):** a correspondência entre controle e efeito (o slider de volume que sobe = mais alto). Bom mapeamento usa analogia espacial e cultural.
- **Restrições (constraints):** limites que reduzem as ações possíveis e previnem erro (campo de data que só aceita data).
- **Feedback** e **modelo conceitual** (o cap. 2, base do módulo 05) completam o conjunto.

Com esse vocabulário, "o botão tá ruim" vira: "o elemento tem a affordance de clique mas nenhum signifier — não parece clicável; o mapeamento do ícone pro efeito é obscuro". Agora é um diagnóstico, endereçável e discutível — não gosto.

**O critério de demarcação: falseabilidade (Popper).** Karl Popper (*A Lógica da Pesquisa Científica*, 1934 — a base de `05-raciocinio/02`) definiu o que separa afirmação científica de crença: **falseabilidade** — algo é científico se existe um experimento capaz de refutá-lo. Aplicado à crítica: **"não gostei" não pode estar errado, logo não é crítica — é opinião.** "Isso me parece confuso PORQUE há dois pontos focais — um teste de 5 segundos confirmaria" *pode* estar errado (o teste pode dar certo), logo é crítica. Toda crítica profissional é formulada como **hipótese refutável com teste nomeado**. É o mesmo motor do debugging (módulo 05): o achado que produz informação é o que pode ser derrubado.

**A ordem que preserva o problema: observação → diagnóstico → prescrição.** Descrever antes de julgar não é etiqueta — é preservar a informação. "Meu olho foi primeiro no gráfico, não no total" é **observação** (dado bruto, quase irrefutável). "O gráfico chama atenção demais" é **diagnóstico** (interpretação). "Diminui o gráfico" é **prescrição** (uma solução entre várias). Pular direto para a prescrição **rouba do autor o problema real** — entrega uma solução e esconde o dado que a motivou, e talvez houvesse uma solução melhor. A ordem espelha o rigor da §BASE de `05-raciocinio`: dado primeiro, interpretação depois.

**Princípios de avaliação com lastro.** Os eixos do checklist não são inventados — cada um puxa uma base dos módulos anteriores: hierarquia (Gestalt/pré-atentivo, mód. 01), respiro (proximidade, mód. 04), contraste (fórmula WCAG, mód. 03), alvo/teclado (Fitts + WCAG 2.2, mód. 06). Some o **data-ink ratio** de Tufte (*The Visual Display of Quantitative Information*, 1983) como princípio de avaliação transversal: pergunte de cada elemento "isso carrega informação ou é ruído?".

**Incerteza declarada — rejeite pseudo-critério.** Crítica estruturada é também **filtro de pseudociência**. Se alguém justifica uma decisão com "usuários visuais preferem assim", isso não é critério — é o **mito dos estilos de aprendizagem**, documentado por Pashler et al. (2008, ver módulo 01). Critério válido é refutável e ancorado em percepção/norma; "estilo de aprendiz", "número mágico de 3 cliques", "dobra da página" sem dado são folclore. A crítica profissional distingue o eixo com lastro (Fitts, Gestalt, contraste) da regra-de-bolso repetida sem prova.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O protocolo tem três papéis e uma ordem inviolável; o checklist tem cinco eixos, cada um com um teste objetivo (não uma opinião).

```
PROTOCOLO (3 papéis)
  1. AUTOR declara a intenção ──► "serve pra X, usuário vem de Y, crítico é Z"
              │                     (sem isto, toda crítica vira disputa de gosto)
              ▼
  2. CRÍTICO descreve → diagnostica → (se pedido) prescreve
              │           observação    interpretação      solução
              ▼           (dado)                           (uma entre várias)
  3. FEEDBACK como hipótese refutável + teste nomeado  ←── Popper

CHECKLIST (5 eixos — síntese dos módulos 01–07)
  Eixo          Pergunta                              Teste objetivo        Base
  ───────────────────────────────────────────────────────────────────────────────
  Hierarquia    um ponto focal? ordem intencional?    5 segundos + squint   mód.01
  Estados       os 5 existem? vazio ensina? erro age? forçar cada um        mód.05
  Consistência  usa tokens/padrões ou inventa?        grep de hex/arbitrário mód.07
  Acessibilid.  teclado? foco visível? contraste AA?  teclado + axe          mód.06
  Respiro       escala? "dentro < entre"? alinhado?   overlay de 8px         mód.04
```

Dependências: os cinco eixos **são** os módulos 01, 04, 05, 06 e 07; o método de hipótese refutável é `05-raciocinio/02`; o vocabulário é Norman. Este módulo pressupõe os sete anteriores — é o exame da trilha.

## § METODOLOGIA — o passo-a-passo replicável

**1. EXIJA a intenção declarada primeiro.** Sem "pra que serve / quem usa / o que é crítico", não há contra o quê avaliar. Autocrítica: escreva a intenção *antes* de olhar criticamente (senão você ajusta a intenção ao que a tela já faz — viés de confirmação, módulo 01 da trilha 05).

**2. DESCREVA antes de julgar.** Observação → diagnóstico → prescrição, nessa ordem. Use o vocabulário de Norman (affordance/signifier/mapeamento) para descrever sem opinar.

**3. RODE os 5 eixos com os testes objetivos.** Cada achado vira hipótese: "X porque Y — testável via Z". Descarte achados que você não consegue formular assim — são gosto.

**4. PRIORIZE por impacto × esforço. Top 3 apenas.** Achou 12? Corrija os 3 de maior impacto, re-teste, repita.

**5. RE-TESTE o eixo (evidência antes/depois).** Screenshot do antes e do depois. "Melhorou" não se afirma sem o teste que falhava agora passar.

**6. REGISTRE no `DECISIONS.md`:** o que mudou, por quê, e o que você **deliberadamente não mudou** (com critério). Apontamento recorrente que você refuta toda semana merece um ADR — a crítica repetida morre lá.

**Anti-padrões:**
- **Prescrever direto:** rouba o problema do autor; esconde o dado que motivou.
- **Crítica não-refutável:** "não gostei", "tá poluído" sem teste — opinião fantasiada de crítica.
- **Big-bang redesign:** mudar 12 coisas de uma vez destrói a evidência (impossível saber o que melhorou o quê) e o aprendizado do usuário junto. Uma alavanca por iteração (módulos 01 e 05).
- **Receber com ego:** acatar tudo (cata-vento) ou refutar tudo (parede). Os três destinos válidos: acatar, refutar **com critério**, ou "não sei — vou testar".
- **Pseudo-critério:** justificar por "estilo de aprendiz" e afins (mito) em vez de eixo com lastro.

### Passo a passo aplicado: autocrítica de uma tela sua (faça agora, ~30min)

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

Crítica estruturada é avaliada duas vezes: explicitamente ("critique essa tela" — exercício comum em processo com etapa de design/front) e implicitamente, em como você reage quando o entrevistador desafia sua solução. Quem responde ao desafio com critério nomeado ou "não sei, testaria assim" passa; quem defende com ego ou cede na primeira pressão, não. Usar o vocabulário de Norman e formular achados como hipótese refutável é o que separa "tenho opinião" de "tenho método".

> **P:** "Olha essa tela do nosso produto. O que você mudaria?"
>
> **R (30s):**
> "Antes de mudar, eu perguntaria a intenção: pra que serve a tela e qual a informação crítica — sem isso, crítica é gosto. Aí rodo cinco eixos: hierarquia — tem um ponto focal só? —, os cinco estados, consistência com o sistema, acessibilidade de teclado e contraste, e respiro do espaçamento. Formulo cada achado como hipótese testável: 'isso parece confuso porque há dois pontos focais — um teste de 5 segundos confirma'. E mudaria incrementalmente: top 3 por impacto, re-testa, repete — big-bang destrói a evidência de o que melhorou o quê."

> **P:** "Qual a diferença entre dar sua opinião sobre uma tela e criticá-la de verdade?"
>
> **R (30s):**
> "A diferença é falseabilidade — é Popper. 'Não gostei' não pode estar errado, então não é crítica, é opinião. Crítica de verdade é formulada como hipótese refutável com teste nomeado: 'isso parece confuso porque há dois pontos focais — um teste de 5 segundos confirmaria'; se o teste der certo, minha crítica cai, e tudo bem. E eu respeito a ordem observação → diagnóstico → prescrição, com o vocabulário do Norman: 'meu olho foi no gráfico antes do total' é dado, 'o gráfico é figura demais' é diagnóstico, 'diminui o gráfico' é prescrição. Pular pro 'diminui' rouba o problema do autor e esconde o dado que motivou. Um cuidado extra: rejeito pseudo-critério tipo 'usuário visual prefere', que é o mito dos estilos de aprendizagem — critério tem que ter lastro em percepção ou norma."

## Checkpoint

- [ ] Uso o vocabulário de Norman (affordance/signifier/mapeamento) para descrever antes de julgar
- [ ] Sei explicar por que "não gostei" não é crítica (falseabilidade de Popper)
- [ ] Respeito a ordem observação → diagnóstico → prescrição e sei por que pular rouba o problema
- [ ] Rodei a autocrítica completa (6 passos) numa tela minha, com antes/depois registrado
- [ ] Formulei ao menos 1 crítica como hipótese refutável com teste nomeado, e refutei outra com critério
- [ ] Tenho 1 ADR de design no DECISIONS.md e sei distinguir eixo com lastro de pseudo-critério

## Recursos

- *The Design of Everyday Things* — Don Norman (1988; rev. 2013), cap. 1 "The Psychopathology of Everyday Things": affordances, signifiers, mapeamento, restrições — o vocabulário da crítica
- *A Lógica da Pesquisa Científica* — Karl Popper (1934): falseabilidade — o critério que separa crítica de opinião (base de `05-raciocinio/02`)
- *The Visual Display of Quantitative Information* — Edward Tufte (1983): data-ink ratio como princípio de avaliação (informação × ruído)
- *Discussing Design* — Adam Connor & Aaron Irizarry (O'Reilly): o protocolo de crítica (3 papéis, receber sem ego)
- *Learning Styles: Concepts and Evidence* — Pashler et al. (2008): por que "usuário visual" é pseudo-critério a rejeitar
- Módulos 01–07 desta trilha — o checklist dos 5 eixos é a síntese deles; `05-raciocinio/02` é o método de hipótese refutável
