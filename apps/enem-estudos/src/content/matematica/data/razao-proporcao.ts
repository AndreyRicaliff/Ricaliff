import type { ContentFlashcard, ContentQuestao } from '../../types.ts';

export const razaoProporcaoData: {
  mapaMental: string;
  flashcards: ContentFlashcard[];
  questoes: ContentQuestao[];
} = {
  mapaMental: `# Razão, Proporção e Regra de Três

## Razão
- Comparação entre duas grandezas: a/b ou a:b
- Resultado sempre um número (inteiro, fracionário ou decimal)
- Exemplo: 3 meninos para 5 meninas → razão 3/5

## Proporção
- Igualdade entre duas razões: a/b = c/d
- ### Propriedade fundamental
  - Produto dos meios = produto dos extremos
  - a/b = c/d → a × d = b × c
- ### Quarto proporcional
  - Encontrar x: a/b = c/x → x = (b × c) / a

## Regra de Três Simples
- ### Direta
  - Grandezas crescem/decrescem juntas
  - Mais trabalhadores → mais produção
  - Montagem: regra em tabela, produtos cruzados
- ### Inversa
  - Uma cresce, a outra decresce
  - Mais trabalhadores → menos dias
  - Montagem: inverte um dos lados antes de cruzar

## Regra de Três Composta
- Mais de duas grandezas relacionadas
- Identificar cada relação como direta ou inversa
- Montar fração produto para achar o valor desejado
- Verificar cada grandeza separadamente antes de operar

## Porcentagem
- ### Conceito básico
  - Parte por cem: p% = p/100
  - Parte = (p/100) × total
  - % = (parte / total) × 100
- ### Fator multiplicativo
  - Aumento de p% → multiplicar por (1 + p/100)
  - Desconto de p% → multiplicar por (1 - p/100)
- ### Porcentagem composta
  - Aplicar fatores sequencialmente
  - Aumento 30% e desconto 25% → × 1,3 × 0,75 = × 0,975
  - Resultado: redução líquida de 2,5%
- ### Grandezas
  - Diretamente proporcionais: razão constante
  - Inversamente proporcionais: produto constante
`,

  flashcards: [
    {
      frente: 'O que é razão entre dois números a e b?',
      verso:
        'É o quociente a/b (ou a:b), que compara as duas grandezas. Exemplo: razão de 6 para 9 é 6/9 = 2/3.',
    },
    {
      frente: 'Qual é a propriedade fundamental da proporção a/b = c/d?',
      verso:
        'O produto dos meios é igual ao produto dos extremos: b × c = a × d. Usada para encontrar o valor desconhecido.',
    },
    {
      frente: 'Como identificar grandezas diretamente proporcionais?',
      verso:
        'Quando uma aumenta, a outra também aumenta na mesma proporção. A razão entre elas é constante: a/b = k.',
    },
    {
      frente: 'Como identificar grandezas inversamente proporcionais?',
      verso:
        'Quando uma aumenta, a outra diminui proporcionalmente. O produto entre elas é constante: a × b = k.',
    },
    {
      frente: 'Como montar uma regra de três simples direta?',
      verso:
        'Alinhar os pares em colunas, manter a mesma ordem e multiplicar em cruz: x = (valor2 × referência1) / referência2.',
    },
    {
      frente: 'Como montar uma regra de três simples inversa?',
      verso:
        'Alinhar os pares, inverter um lado e multiplicar em cruz. Ex.: 6 oper. → 12 dias; 9 oper. → x: x = (6 × 12) / 9 = 8 dias.',
    },
    {
      frente: 'O que é fator multiplicativo em porcentagem?',
      verso:
        'Número pelo qual se multiplica o valor original. Aumento de 20%: fator 1,20. Desconto de 20%: fator 0,80.',
    },
    {
      frente: 'Como calcular porcentagem composta (aumento seguido de desconto)?',
      verso:
        'Multiplica os fatores em sequência. Aumento 30% e desconto 25%: 1,30 × 0,75 = 0,975 (redução de 2,5% no total).',
    },
    {
      frente: 'Como calcular a porcentagem que uma parte representa do total?',
      verso: 'Porcentagem = (parte / total) × 100. Exemplo: 30 de 120 → (30/120) × 100 = 25%.',
    },
    {
      frente: 'Em uma regra de três composta, como definir se cada relação é direta ou inversa?',
      verso:
        'Analisa cada grandeza separadamente em relação ao resultado: se cresce junto, é direta; se decresce, é inversa. Depois monta a fração produto.',
    },
    {
      frente: 'Como encontrar o valor original se souber o valor após um desconto de 15%?',
      verso:
        'O valor com desconto = original × 0,85. Logo: original = valor com desconto / 0,85. Ex.: R$170 → 170 / 0,85 = R$200.',
    },
    {
      frente: 'Qual a diferença entre razão e proporção?',
      verso:
        'Razão é uma única comparação (a/b). Proporção é a igualdade entre duas razões (a/b = c/d), formando uma equação a resolver.',
    },
  ],

  questoes: [
    {
      enunciado:
        'Em uma escola, a razão entre o número de meninos e o número de meninas é 3:5. Se há 240 alunos no total, quantas meninas estudam nessa escola?',
      alternativas: ['90 meninas', '120 meninas', '150 meninas', '160 meninas', '180 meninas'],
      correta: 2,
      explicacao:
        'A razão 3:5 divide os alunos em 3 + 5 = 8 partes iguais. Cada parte vale 240 / 8 = 30 alunos. Meninas = 5 × 30 = 150.',
    },
    {
      enunciado:
        'Um mapa foi elaborado na escala 1:200.000. Duas cidades que aparecem a 4,5 cm de distância no mapa estão separadas, na realidade, por quantos quilômetros?',
      alternativas: ['4,5 km', '45 km', '4,5 km', '9 km', '90 km'],
      correta: 3,
      explicacao:
        'Distância real = distância no mapa × escala = 4,5 × 200.000 = 900.000 cm. Convertendo: 900.000 cm ÷ 100.000 = 9 km.',
    },
    {
      enunciado:
        'Uma fábrica produz 8 peças em 3 horas. Mantendo o mesmo ritmo de produção, em quantas horas serão produzidas 120 peças?',
      alternativas: ['30 horas', '45 horas', '48 horas', '60 horas', '96 horas'],
      correta: 1,
      explicacao:
        'Grandezas diretamente proporcionais. Regra de três: 8 peças → 3 h; 120 peças → x h. x = (120 × 3) / 8 = 360 / 8 = 45 horas.',
    },
    {
      enunciado:
        'Seis trabalhadores constroem um muro em 12 dias. Quantos dias serão necessários para 9 trabalhadores construírem o mesmo muro, trabalhando no mesmo ritmo?',
      alternativas: ['8 dias', '9 dias', '10 dias', '18 dias', '24 dias'],
      correta: 0,
      explicacao:
        'Grandezas inversamente proporcionais: mais trabalhadores, menos dias. Produto constante: 6 × 12 = 9 × x → x = 72 / 9 = 8 dias.',
    },
    {
      enunciado:
        'Quatro máquinas, trabalhando 6 horas por dia durante 5 dias, produzem 200 peças. Quantos dias serão necessários para 6 máquinas, trabalhando 8 horas por dia, produzirem 400 peças?',
      alternativas: ['2 dias', '3 dias', '4 dias', '6 dias', '5 dias'],
      correta: 4,
      explicacao:
        'Taxa de produção: 200 / (4 × 6 × 5) = 200 / 120 = 5/3 peças por máquina·hora·dia. Para 400 peças com 6 máquinas e 8 h/dia: x = 400 / (6 × 8 × 5/3) = 400 / 80 = 5 dias.',
    },
    {
      enunciado:
        'Uma loja oferece desconto de 20% em um produto que custa R$ 350,00. Qual é o valor final a pagar?',
      alternativas: ['R$ 250,00', 'R$ 280,00', 'R$ 300,00', 'R$ 315,00', 'R$ 330,00'],
      correta: 1,
      explicacao:
        'Fator multiplicativo de desconto de 20%: 1 - 0,20 = 0,80. Valor final = 350 × 0,80 = R$ 280,00.',
    },
    {
      enunciado:
        'O salário de um funcionário sofreu aumento de 30% em janeiro e, em julho do mesmo ano, sofreu desconto de 25%. Qual foi a variação percentual líquida do salário em relação ao valor original?',
      alternativas: [
        'Aumento de 5%',
        'Aumento de 2,5%',
        'Sem variação',
        'Redução de 2,5%',
        'Redução de 5%',
      ],
      correta: 3,
      explicacao:
        'Fator composto: 1,30 × 0,75 = 0,975. O salário final é 97,5% do original, ou seja, houve uma redução líquida de 2,5%. Os percentuais não se somam diretamente.',
    },
    {
      enunciado:
        'Em um concurso público, 480 candidatos foram aprovados, o que corresponde a 60% do total de inscritos. Quantas pessoas se inscreveram no concurso?',
      alternativas: ['288 pessoas', '576 pessoas', '800 pessoas', '960 pessoas', '1200 pessoas'],
      correta: 2,
      explicacao:
        '480 representa 60% do total. Seja T o total: 0,60 × T = 480 → T = 480 / 0,60 = 800 pessoas.',
    },
  ],
};
