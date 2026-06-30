import type { ContentFlashcard, ContentQuestao } from '../../types.ts';

export const areasFigurasPlanasData: {
  mapaMental: string;
  flashcards: ContentFlashcard[];
  questoes: ContentQuestao[];
} = {
  mapaMental: `# Áreas de Figuras Planas
- Triângulos
  - Fórmula geral
    - A = base x altura / 2
    - h = altura relativa à base escolhida
  - Fórmula de Heron
    - s = (a + b + c) / 2  (semiperímetro)
    - A = raiz(s(s-a)(s-b)(s-c))
    - Útil quando só se conhecem os três lados
  - Triângulo equilátero
    - A = l² x raiz(3) / 4
    - l = medida do lado
  - Triângulo retângulo
    - catetos são a base e a altura
    - A = (cateto1 x cateto2) / 2
- Quadriláteros
  - Quadrado
    - A = l²
    - P = 4l
  - Retângulo
    - A = base x altura
    - P = 2(b + h)
  - Paralelogramo
    - A = base x altura
    - h = altura perpendicular à base
  - Losango
    - A = D x d / 2
    - D = diagonal maior  d = diagonal menor
  - Trapézio
    - A = (B + b) x h / 2
    - B = base maior  b = base menor  h = altura
- Círculos e Setores
  - Círculo
    - Área = pi x r²
    - Circunferência = 2 x pi x r
  - Setor circular
    - A = (angulo / 360) x pi x r²
    - angulo em graus
  - Coroa circular
    - A = pi x (R² - r²)
    - R = raio externo  r = raio interno`,

  flashcards: [
    {
      frente: 'Qual é a fórmula da área de um triângulo qualquer?',
      verso: 'A = (base × altura) / 2. A altura deve ser perpendicular à base escolhida.',
    },
    {
      frente: 'Como calcular a área de um triângulo equilátero de lado l?',
      verso: 'A = l² × √3 / 4. Para l = 4: A = 16 × 1,732 / 4 = 6,93 cm².',
    },
    {
      frente: 'O que é a fórmula de Heron e quando usá-la?',
      verso:
        'Usada quando só se conhecem os três lados (a, b, c). Calcula s = (a+b+c)/2, depois A = √(s·(s−a)·(s−b)·(s−c)).',
    },
    {
      frente: 'Qual é a fórmula da área do losango?',
      verso: 'A = (D × d) / 2, onde D é a diagonal maior e d é a diagonal menor.',
    },
    {
      frente: 'Como calcular a área do trapézio?',
      verso:
        'A = (B + b) × h / 2, onde B é a base maior, b é a base menor e h é a altura entre as bases.',
    },
    {
      frente: 'Qual a diferença entre área do quadrado e do retângulo?',
      verso:
        'Quadrado: A = l² (todos os lados iguais). Retângulo: A = base × altura (lados opostos iguais).',
    },
    {
      frente: 'A área do paralelogramo usa qual fórmula?',
      verso:
        'A = base × altura. Atenção: a altura é a distância perpendicular entre as bases, não o lado oblíquo.',
    },
    {
      frente: 'Como calcular a área de um círculo de raio r?',
      verso: 'A = π × r². Usando π ≈ 3,14. Exemplo: r = 3 → A = 3,14 × 9 = 28,26 cm².',
    },
    {
      frente: 'Qual é a fórmula da circunferência (perímetro do círculo)?',
      verso: 'C = 2 × π × r. Não confundir com área. Exemplo: r = 5 → C = 2 × 3,14 × 5 = 31,4 cm.',
    },
    {
      frente: 'Como calcular a área de um setor circular com ângulo θ?',
      verso: 'A = (θ / 360) × π × r². Um setor de 90° equivale a 1/4 do círculo.',
    },
    {
      frente: 'O que é coroa circular e qual sua área?',
      verso:
        'Região entre dois círculos concêntricos. A = π × (R² − r²), onde R é o raio externo e r o interno.',
    },
    {
      frente: 'Qual fórmula usar para área de triângulo retângulo?',
      verso:
        'A = (cateto1 × cateto2) / 2. Os próprios catetos são base e altura, pois são perpendiculares entre si.',
    },
  ],

  questoes: [
    {
      enunciado:
        'Um terreno triangular tem base de 8 m e altura de 5 m. Qual é a área desse terreno?',
      alternativas: ['20 m²', '40 m²', '13 m²', '80 m²', '10 m²'],
      correta: 0,
      explicacao:
        'Fórmula: A = (base × altura) / 2. Substituindo: A = (8 × 5) / 2 = 40 / 2 = 20 m².',
    },
    {
      enunciado:
        'Um azulejo tem formato de losango com diagonais medindo 12 cm e 8 cm. Qual é a área desse azulejo?',
      alternativas: ['96 cm²', '20 cm²', '48 cm²', '24 cm²', '64 cm²'],
      correta: 2,
      explicacao:
        'Fórmula do losango: A = (D × d) / 2. Substituindo: A = (12 × 8) / 2 = 96 / 2 = 48 cm².',
    },
    {
      enunciado:
        'Um canteiro tem formato de trapézio com base maior de 10 m, base menor de 6 m e altura de 4 m. Qual é a área do canteiro?',
      alternativas: ['40 m²', '24 m²', '60 m²', '32 m²', '16 m²'],
      correta: 3,
      explicacao:
        'Fórmula do trapézio: A = (B + b) × h / 2. Substituindo: A = (10 + 6) × 4 / 2 = 16 × 4 / 2 = 64 / 2 = 32 m².',
    },
    {
      enunciado:
        'Uma piscina circular tem raio de 5 m. Usando π = 3,14, qual é a área da superfície da água?',
      alternativas: ['31,4 m²', '15,7 m²', '78,5 m²', '314 m²', '62,8 m²'],
      correta: 2,
      explicacao:
        'Fórmula da área do círculo: A = π × r². Substituindo: A = 3,14 × 5² = 3,14 × 25 = 78,5 m².',
    },
    {
      enunciado:
        'Uma placa de sinalização tem formato de triângulo equilátero com lado de 6 cm. Usando √3 ≈ 1,73, qual é a área da placa?',
      alternativas: ['9 cm²', '15,57 cm²', '18 cm²', '10,38 cm²', '36 cm²'],
      correta: 1,
      explicacao:
        'Fórmula do triângulo equilátero: A = l² × √3 / 4. Substituindo: A = 6² × 1,73 / 4 = 36 × 1,73 / 4 = 62,28 / 4 = 15,57 cm².',
    },
    {
      enunciado: 'Um paralelogramo tem base de 9 m e altura de 4 m. Qual é sua área?',
      alternativas: ['13 m²', '26 m²', '18 m²', '72 m²', '36 m²'],
      correta: 4,
      explicacao: 'Fórmula do paralelogramo: A = base × altura. Substituindo: A = 9 × 4 = 36 m².',
    },
    {
      enunciado:
        'Uma tampa de cano tem formato de coroa circular com raio externo R = 7 cm e raio interno r = 4 cm. Usando π = 3,14, qual é a área da coroa?',
      alternativas: ['153,86 cm²', '50,24 cm²', '103,62 cm²', '131,88 cm²', '78,5 cm²'],
      correta: 2,
      explicacao:
        'Fórmula da coroa circular: A = π × (R² − r²). Substituindo: A = 3,14 × (7² − 4²) = 3,14 × (49 − 16) = 3,14 × 33 = 103,62 cm².',
    },
    {
      enunciado:
        'Uma fatia de pizza representa um setor circular de raio 6 cm e ângulo central de 90°. Usando π = 3,14, qual é a área dessa fatia?',
      alternativas: ['9,42 cm²', '113,04 cm²', '56,52 cm²', '28,26 cm²', '18,84 cm²'],
      correta: 3,
      explicacao:
        'Fórmula do setor circular: A = (θ / 360) × π × r². Substituindo: A = (90 / 360) × 3,14 × 6² = (1/4) × 3,14 × 36 = (1/4) × 113,04 = 28,26 cm².',
    },
  ],
};
