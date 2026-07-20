# 04 — Espaçamento e Grid

## O que é

Espaçamento é o sistema nervoso invisível da interface: ninguém elogia, mas todo mundo sente quando falha. Três princípios resolvem: **escala fixa**, **espaço como agrupamento** e **alinhamento como cola**.

**Escala 4/8px:** todo espaçamento (padding, margin, gap) é múltiplo de 4px — na prática, a maioria dos valores vive na sub-escala de 8 (8, 16, 24, 32, 48, 64). O Tailwind já é isso: a unidade é 0.25rem = 4px (`p-4` = 16px). O ganho é o mesmo da escala tipográfica: **elimina decisão** ("13 ou 14px de padding?" não existe — existe o degrau) e garante que elementos vizinhos batam matematicamente. Valor fora da escala (`p-[13px]`) é quase sempre sintoma de gambiarra tapando desalinhamento de outra origem.

**Espaço agrupa (Gestalt — proximidade):** o olho lê distância como relação. A regra de ouro tem uma linha: **espaço DENTRO de um grupo < espaço ENTRE grupos, sempre**. Label a 4px do seu input e 24px do campo seguinte = formulário legível sem nenhuma borda ou fundo. Vontade de adicionar borda e divisor em tudo é sintoma: borda é o band-aid do espaço mal resolvido.

**Ritmo vertical:** seções separadas por espaços consistentes e maiores que os espaços internos. Se card interno usa gap 16, entre cards use 24, entre seções 48. A progressão comunica a árvore do layout sem precisar de título em tudo.

**Alinhamento é a cola invisível:** todo elemento alinha com ALGUM outro — borda esquerda do título com a borda esquerda do conteúdo, números pela direita, ícones pela linha de base do texto. Um elemento desalinhado em 3px rebaixa a percepção de qualidade da tela inteira, mesmo que ninguém saiba apontar o porquê. Squint test pega: linhas que deveriam ser uma viram duas.

**Densidade por contexto:** não existe espaçamento "certo" universal — existe adequado à tarefa. Dashboard de operação (padrão dos painéis comerciais AG): denso — padding compacto, fonte 13–14px em tabela, mais dados por viewport, porque o usuário volta todo dia e quer comparar números. Landing/deck: generoso — whitespace largo vende clareza, porque o visitante passa 30 segundos e precisa de UM foco. Copiar densidade de landing num dashboard produz scroll infinito; copiar densidade de dashboard numa landing produz pânico visual.

### Passo a passo: auditoria de escala num projeto AG

```bash
# 1. Caçar valores arbitrários fora da escala (Tailwind)
rg -n "\-\[\d+px\]" src/ --glob "*.tsx"
# saída típica: p-[13px], mt-[7px], gap-[18px] — cada um é um suspeito

# 2. Para cada achado, perguntar ANTES de trocar:
#    por que 13 e não 12/16? Se ninguém sabe → degrau mais próximo.
#    Se há motivo real (alinhar com asset de 26px) → comentar o porquê.

# 3. Caçar margens verticais inconsistentes entre seções
rg -n "space-y-|gap-" src/components/ --glob "*.tsx" | sort
# hipótese a validar: seções irmãs usam o MESMO degrau?
```

```text
Verificação visual (evidência): overlay de grid de 8px por cima
da tela (extensão de browser ou um div com background repetindo
linhas a cada 8px). O que não senta na linha, aparece na hora.
```

O raciocínio: `p-[13px]` não é "erro" automático — é uma **afirmação sem justificativa**. Exija o porquê ou normalize; trocar às cegas também erra, pode quebrar alinhamento intencional com um asset.

## Por que cai em entrevista

Espaçamento é o teste de "olho treinado" mais barato que existe: o entrevistador mostra duas versões da mesma tela e pergunta qual é melhor e por quê. Quem responde "a segunda respira melhor" sem vocabulário reprova; quem fala escala de 8, proximidade de Gestalt e densidade por contexto mostra sistema — e sistema é o que separa pleno de júnior.

> **P:** "Como você decide os espaçamentos de uma tela? É no olho?"
>
> **R (30s):**
> "Não — escala fixa de múltiplos de 4, na prática degraus de 8: 8, 16, 24, 32, 48. O Tailwind já embute isso, então valor arbitrário tipo `p-[13px]` é red flag que eu audito com grep. A regra que mais uso é de Gestalt: espaço dentro de um grupo sempre menor que espaço entre grupos — resolve formulário e card sem precisar de borda. E densidade é decisão de contexto: dashboard que fiz pra operação é denso de propósito, o usuário compara números todo dia; landing é generosa porque o visitante precisa de um foco só."

## Checkpoint

- [ ] Sei recitar a escala prática (4/8/16/24/32/48/64) e o porquê de escala fixa
- [ ] Apliquei "dentro < entre" num formulário e removi bordas que viraram redundantes
- [ ] Rodei o grep de valores arbitrários num projeto e tratei cada achado (normalizar ou justificar)
- [ ] Encontrei e corrigi um desalinhamento de borda esquerda usando squint test
- [ ] Consigo defender densidades diferentes pra dashboard vs landing com argumento de tarefa

## Recursos

- [Refactoring UI](https://www.refactoringui.com/) — capítulos "Layout and Spacing"; o sistema de escala vem daqui
- [The Principle of Proximity — NN/g](https://www.nngroup.com/articles/gestalt-proximity/) — a base Gestalt do agrupamento
- [Tailwind CSS docs](https://tailwindcss.com/docs) — a escala de spacing como implementação de referência
- [Material Design 3](https://m3.material.io/) — seção de layout: grid, densidade e breakpoints documentados com critério
