# 01 — O que é Machine Learning de verdade

## O que é

Na programação tradicional, **você** escreve as regras. Você olha o problema, pensa na lógica e digita `if/else`. O computador só executa o que você mandou.

```ts
// detectar email de spam à mão: você escreve cada regra
function isSpam(email: string): boolean {
  if (email.includes('viagra')) return true
  if (email.includes('grátis') && email.includes('clique')) return true
  if (email.match(/\$\$\$|R\$ ?\d{4,}/)) return true
  return false
}
```

O problema: spam tem milhares de variações, muda toda semana, e você nunca termina de escrever regras. Cada `if` novo quebra outro.

**Machine learning (ML)** vira o jogo de cabeça pra baixo. Em vez de você escrever as regras, você dá **exemplos** (milhares de emails já marcados como "spam" / "não spam") e a máquina **infere as regras sozinha**. A saída do processo é um **modelo (model)**: uma função que você não escreveu à mão, mas que aprendeu o padrão dos exemplos.

```text
Programação tradicional:   REGRAS + DADOS  → RESULTADO
Machine learning:          DADOS + RESULTADO → REGRAS (o "modelo")
```

A analogia que gruda: ensinar uma criança a reconhecer um cachorro. Você não dá uma definição formal ("4 patas, focinho, late"). Você aponta para cães na rua dezenas de vezes — "isso é um cachorro" — e o cérebro dela extrai o padrão sozinho, a ponto de reconhecer uma raça que nunca viu. ML é isso, com matemática no lugar do cérebro.

## A regra continua existindo — só não foi você quem escreveu

Um equívoco comum é achar que ML é "mágica sem lógica". Não. O modelo **é** uma função com regras internas (números chamados pesos, ver módulo 04). A diferença é que essas regras foram **ajustadas automaticamente** a partir dos dados, não digitadas por você. Você troca "pensar a lógica" por "juntar bons exemplos".

## Quando vale a pena usar ML (e quando NÃO)

ML não é melhor que código normal — é melhor para uma **classe específica** de problemas. A pergunta-chave: *"eu consigo escrever as regras à mão?"*

| Situação | Use código normal | Use ML |
|---|---|---|
| Regras claras e estáveis (cálculo de imposto, validar CPF) | ✅ | ❌ overkill |
| Padrão existe mas é complexo/fuzzy demais pra escrever (reconhecer rosto, traduzir texto, detectar fraude) | ❌ impossível na mão | ✅ |
| Você tem MUITOS exemplos rotulados | — | ✅ alimenta o modelo |
| Você precisa de explicação exata e auditável de cada decisão | ✅ determinístico | ⚠️ modelo é caixa-preta |
| O custo de errar às vezes é aceitável | — | ✅ ML é probabilístico, erra |

Regra de bolso: **se você consegue escrever o `if`, escreva o `if`.** ML entra quando o padrão é real mas escapa de qualquer `if` que você tente — ou quando escrever as regras na mão custaria 10 mil linhas que ninguém consegue manter.

Outra pegadinha: ML **não é determinístico** como código comum. Dois treinos podem dar modelos levemente diferentes, e o modelo erra por design (acerta 97%, não 100%). Se seu domínio não tolera o erro do modelo, ou exige justificar cada decisão num tribunal, pense duas vezes.

**Em entrevista:** "Programação tradicional é DADOS + REGRAS → resultado; ML é DADOS + RESULTADO → regras. Em vez de escrever a lógica, eu dou exemplos e o modelo infere o padrão. Uso ML quando o padrão existe mas é complexo demais pra codar à mão — tipo detectar spam ou fraude — e quando tenho muitos exemplos rotulados."
