import type { ContentFlashcard, ContentQuestao } from '../../types.ts';

export const graficosTabelasData: {
  mapaMental: string;
  flashcards: ContentFlashcard[];
  questoes: ContentQuestao[];
} = {
  mapaMental: `# Gráficos e Tabelas
## Tipos de Gráfico
### Barras e Colunas
- Comparar categorias distintas
- Barras: horizontal / Colunas: vertical
- Ler a escala antes de comparar alturas
- Cuidado com eixo que nao começa em zero
### Setores (Pizza)
- Representa partes de um todo (100%)
- Angulo = porcentagem x 3,6 graus
- Ex: 25% -> 25 x 3,6 = 90 graus
- Soma de todos os angulos = 360 graus
### Linhas e Tendencia
- Mostrar evolucao ao longo do tempo
- Inclinacao indica velocidade de crescimento/queda
- Linha horizontal = estagnacao
- Cruzamento de linhas = inversao de posicao
## Tabelas de Frequencia
### Frequencia Absoluta (fi)
- Quantidade de vezes que o valor aparece
- Soma de todos fi = n (total de dados)
### Frequencia Relativa (fri)
- fri = fi dividido por n
- Representa proporcao (entre 0 e 1) ou porcentagem
### Frequencia Acumulada (Fi)
- Soma das frequencias absolutas ate aquela classe
- Usada para encontrar mediana e percentis
- Ultima Fi = n
## Medidas de Tendencia Central
### Media Aritmetica
- Simples: soma dos valores dividido por n
- Ponderada: soma de xi x fi, dividido por soma de fi
- Sensivel a valores extremos (outliers)
### Mediana
- Valor central apos ordenar os dados
- n impar: posicao (n+1)/2
- n par: media das posicoes n/2 e n/2 + 1
- Nao e afetada por outliers
### Moda
- Valor que aparece com maior frequencia
- Pode ser amodal, unimodal, bimodal ou multimodal
- Unico que pode ser calculado para dados qualitativos
## Armadilhas em Graficos
### Eixo Cortado
- Eixo Y nao comeca em zero
- Diferenca parece maior do que e na realidade
- Solucao: olhar os valores numericos, nao so as barras
### Escala Irregular
- Intervalos do eixo nao sao iguais
- Distorce a percepcao de crescimento
### Grafico 3D Enganoso
- Perspectiva distorce areas e volumes
- Setores do fundo parecem menores
### Area vs Altura
- Icones proporcionais em area crescem mais rapido que em altura
- Diferenca de 2x em altura vira 4x em area
## Variacao Percentual
- Formula: (valor final - valor inicial) / valor inicial x 100
- Resultado positivo = aumento
- Resultado negativo = reducao (queda)
- Cuidado: aumento de 50% seguido de queda de 50% NAO volta ao original`,

  flashcards: [
    {
      frente: 'Como calcular o angulo de um setor em grafico de pizza?',
      verso: 'Angulo = porcentagem x 3,6 graus. Exemplo: 40% corresponde a 40 x 3,6 = 144 graus.',
    },
    {
      frente: 'O que e frequencia absoluta?',
      verso:
        'E a contagem direta de quantas vezes um valor ou classe aparece nos dados. A soma de todas as frequencias absolutas e igual a n (total de dados).',
    },
    {
      frente: 'O que e frequencia relativa?',
      verso:
        'E a proporcao de cada classe: fri = fi / n. Pode ser expressa como decimal (0 a 1) ou porcentagem (0% a 100%). A soma de todas as frequencias relativas e 1 (ou 100%).',
    },
    {
      frente: 'Como calcular a media ponderada com tabela de frequencia?',
      verso:
        'Media = soma de (xi x fi) dividido por soma de fi. Multiplique cada valor pela sua frequencia, some tudo, depois divida pelo total de dados.',
    },
    {
      frente: 'Como encontrar a mediana em uma lista com n impar e n par?',
      verso:
        'n impar: mediana = valor na posicao (n+1)/2. n par: mediana = media dos valores nas posicoes n/2 e (n/2)+1. Sempre ordene os dados antes.',
    },
    {
      frente: 'O que e moda e quando um conjunto e bimodal?',
      verso:
        'Moda e o valor que aparece com maior frequencia. Um conjunto e bimodal quando dois valores diferentes aparecem o mesmo numero de vezes (o maior numero de repeticoes).',
    },
    {
      frente: 'O que e frequencia acumulada e para que serve?',
      verso:
        'E a soma das frequencias absolutas de todas as classes ate a classe atual. Serve para localizar a mediana e calcular percentis.',
    },
    {
      frente: 'Como calcular a variacao percentual?',
      verso:
        'Variacao % = (valor final - valor inicial) / valor inicial x 100. Resultado positivo = aumento; resultado negativo = queda.',
    },
    {
      frente: 'Por que um eixo Y cortado (que nao comeca em zero) e enganoso?',
      verso:
        'Porque exagera visualmente a diferenca entre barras/colunas. Um valor 10% maior pode parecer o dobro ou o triplo. Sempre confira os numeros reais, nao apenas a altura visual.',
    },
    {
      frente: 'Qual medida de tendencia central e mais resistente a valores extremos (outliers)?',
      verso:
        'A mediana. Ela depende apenas da posicao central dos dados ordenados, nao do valor dos extremos. A media e muito afetada por valores muito altos ou muito baixos.',
    },
    {
      frente: 'Quando usar grafico de barras, linhas ou setores?',
      verso:
        'Barras/Colunas: comparar categorias. Linhas: evolucao ao longo do tempo. Setores (pizza): mostrar partes de um todo (proporcoes que somam 100%).',
    },
    {
      frente:
        'Se uma grandeza aumenta 50% e depois cai 50%, qual e o resultado final em relacao ao valor original?',
      verso:
        'O valor final e 75% do original, ou seja, uma queda de 25%. Exemplo: 100 x 1,5 = 150; 150 x 0,5 = 75. Aumentos e quedas percentuais nao se cancelam simetricamente.',
    },
  ],

  questoes: [
    {
      enunciado:
        'Em uma pesquisa sobre meios de transporte preferidos, 120 pessoas foram entrevistadas. Os resultados foram: Onibus: 48 pessoas; Metro: 36 pessoas; Carro: 24 pessoas; Bicicleta: 12 pessoas. Qual e a frequencia relativa (em porcentagem) do Metro?',
      alternativas: ['30%', '20%', '25%', '36%', '40%'],
      correta: 0,
      explicacao:
        'Frequencia relativa do Metro = fi / n x 100 = 36 / 120 x 100 = 0,30 x 100 = 30%. Resposta: 30%.',
    },
    {
      enunciado:
        'Em um grafico de setores (pizza), a fatia referente a categoria "Alimentacao" representa 35% do orcamento familiar. Qual e o angulo central correspondente a essa fatia?',
      alternativas: ['108 graus', '120 graus', '130 graus', '126 graus', '135 graus'],
      correta: 3,
      explicacao: 'Angulo = porcentagem x 3,6 = 35 x 3,6 = 126 graus. Resposta: 126 graus.',
    },
    {
      enunciado:
        'As notas de 5 alunos em uma prova foram, em ordem crescente: 4, 6, 6, 8, 10. Assinale a alternativa que apresenta corretamente a mediana e a moda desse conjunto.',
      alternativas: [
        'Mediana = 8 e Moda = 6',
        'Mediana = 6 e Moda = 6',
        'Mediana = 6,8 e Moda = 6',
        'Mediana = 6 e Moda = 4',
        'Mediana = 7 e Moda = 6',
      ],
      correta: 1,
      explicacao:
        'Com 5 dados ordenados (4, 6, 6, 8, 10), a mediana e o valor central: posicao (5+1)/2 = 3a posicao = 6. A moda e o valor mais frequente = 6 (aparece 2 vezes). Mediana = 6 e Moda = 6.',
    },
    {
      enunciado:
        'Uma tabela de frequencia acumulada mostra os tempos de deslocamento (em minutos) de 30 trabalhadores: ate 10 min: Fi = 5; ate 20 min: Fi = 12; ate 30 min: Fi = 22; ate 40 min: Fi = 30. Em qual classe se encontra a mediana?',
      alternativas: [
        'Ate 10 minutos',
        'Ate 20 minutos',
        'Ate 40 minutos',
        'Nao e possivel determinar',
        'Ate 30 minutos',
      ],
      correta: 4,
      explicacao:
        'Com n = 30, a mediana se encontra na posicao 15 e 16 (media). A frequencia acumulada ate 20 min e 12 (nao cobre a posicao 15). A frequencia acumulada ate 30 min e 22, que ja cobre as posicoes 15 e 16. Logo, a mediana esta na classe "ate 30 minutos".',
    },
    {
      enunciado:
        'O salario de um funcionario era R$ 2.000,00 em janeiro. Em junho do mesmo ano, passou a ser R$ 2.500,00. Qual foi a variacao percentual do salario?',
      alternativas: ['20%', '25%', '22,5%', '30%', '50%'],
      correta: 1,
      explicacao:
        'Variacao % = (2500 - 2000) / 2000 x 100 = 500 / 2000 x 100 = 0,25 x 100 = 25%. O salario aumentou 25%.',
    },
    {
      enunciado:
        'Uma turma realizou uma prova e as notas foram registradas na tabela abaixo: Nota 5: 2 alunos; Nota 7: 5 alunos; Nota 9: 3 alunos. Qual e a media aritmetica ponderada da turma?',
      alternativas: ['6,8', '7,0', '7,5', '7,2', '8,0'],
      correta: 3,
      explicacao:
        'Media = soma(xi x fi) / soma(fi) = (5x2 + 7x5 + 9x3) / (2+5+3) = (10 + 35 + 27) / 10 = 72 / 10 = 7,2.',
    },
    {
      enunciado:
        'Um grafico de colunas compara as vendas de duas lojas. O eixo Y comeca em 90 (em vez de 0). A loja A vendeu 95 unidades e a loja B vendeu 100 unidades. Visualmente, a barra da loja B parece o dobro da barra da loja A. Qual armadilha grafica esta presente e qual e a diferenca real entre as vendas?',
      alternativas: [
        'Eixo cortado; diferenca real de 5 unidades',
        'Escala irregular; diferenca real de 50%',
        'Grafico 3D enganoso; diferenca real de 5 unidades',
        'Area vs altura; diferenca real de 10 unidades',
        'Eixo cortado; diferenca real de 50%',
      ],
      correta: 0,
      explicacao:
        'O eixo Y comeca em 90, nao em 0. Isso faz a barra de 100 (altura visual = 10) parecer o dobro da barra de 95 (altura visual = 5), quando a diferenca real e de apenas 5 unidades (100 - 95 = 5). A armadilha e o eixo cortado.',
    },
    {
      enunciado:
        'Os tempos (em segundos) registrados por 8 atletas em um racha foram, em ordem crescente: 3, 5, 7, 7, 8, 9, 9, 9. Qual das medidas de tendencia central tem o maior valor nesse conjunto?',
      alternativas: [
        'Media (7,125)',
        'Mediana (7,5)',
        'Moda (9)',
        'Media e mediana sao iguais',
        'Mediana e moda sao iguais',
      ],
      correta: 2,
      explicacao:
        'Media = (3+5+7+7+8+9+9+9)/8 = 57/8 = 7,125. Mediana (n=8 par): media das posicoes 4 e 5 = (7+8)/2 = 7,5. Moda = 9 (aparece 3 vezes). O maior valor e a Moda = 9.',
    },
  ],
};
