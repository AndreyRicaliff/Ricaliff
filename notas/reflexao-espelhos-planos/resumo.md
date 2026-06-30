# Reflexão e Espelhos Planos — resumo eficiente

## 1. Reflexão da luz

Quando a luz atinge uma superfície e retorna ao mesmo meio.

- **Regular (especular):** superfície polida, raios paralelos continuam paralelos → forma imagem.
- **Difusa:** superfície rugosa, raios espalham → não forma imagem.

Espelhos planos = reflexão regular sobre superfície plana.

## 2. Leis da Reflexão

**1ª Lei** — Raio incidente, normal e raio refletido são coplanares.

**2ª Lei** — O ângulo de incidência é igual ao ângulo de reflexão:

$$\theta_i = \theta_r$$

> Os ângulos são medidos sempre a partir da **normal** (perpendicular à superfície), nunca da superfície.

## 3. Espelho Plano — características da imagem

| Propriedade | Valor |
|---|---|
| Natureza | virtual (atrás do espelho) |
| Orientação | direita (não invertida verticalmente) |
| Tamanho | igual ao objeto |
| Distância | $d_{imagem} = d_{objeto}$ (simetria) |
| Lateralidade | enantiomorfa (esquerda ↔ direita) |

A imagem é virtual porque é formada pelo prolongamento dos raios refletidos — não pode ser projetada em tela.

## 4. Associação de Espelhos Planos

Dois espelhos formando ângulo $\alpha$ entre si geram múltiplas imagens.

$$N = \frac{360°}{\alpha} - 1$$

**Validade da fórmula:**
- Sempre válida quando $360°/\alpha$ é par.
- Quando $360°/\alpha$ é ímpar: válida apenas se o objeto está sobre a bissetriz do ângulo.

### Casos clássicos

| α | 360°/α | N | Observação |
|---|---|---|---|
| 180° | 2 | 1 | espelhos paralelos invertidos |
| 120° | 3 | 2 | ímpar — exige bissetriz |
| 90° | 4 | 3 | canto reto |
| 72° | 5 | 4 | ímpar — exige bissetriz |
| 60° | 6 | 5 | caleidoscópio simples |
| 45° | 8 | 7 | — |
| 30° | 12 | 11 | caleidoscópio rico |
| 0° (paralelos) | ∞ | ∞ | reflexões infinitas |

## 5. Translação do Espelho

### Espelho desloca, objeto fixo

Se o espelho se desloca uma distância $d$ perpendicular ao seu plano, a imagem se desloca $2d$ no **mesmo sentido**:

$$\Delta x_{imagem} = 2 \cdot \Delta x_{espelho}$$

Em velocidade:

$$v_{imagem} = 2 \cdot v_{espelho}$$

### Objeto desloca, espelho fixo

Se o objeto se aproxima do espelho com velocidade $v$, a imagem também se aproxima do espelho com velocidade $v$ (sentido oposto, mesma magnitude).

**Velocidade relativa entre objeto e imagem:**

$$v_{rel} = 2v$$

### Ambos em movimento (perpendiculares ao plano)

Adotando um sentido como positivo:

$$v_{imagem} = 2 v_{espelho} - v_{objeto}$$

## 6. Princípio unificador

Tudo decorre de uma única ideia:

> **A imagem é o reflexo simétrico do objeto em relação ao plano do espelho.**

Distâncias, velocidades e número de imagens são consequências dessa simetria.

## 7. Erros comuns em provas

- Medir o ângulo a partir da superfície (errado — é da normal).
- Esquecer que a imagem do espelho plano é **virtual** (não real).
- Aplicar $N = 360/\alpha - 1$ sem verificar se 360/α é par ou se o objeto está na bissetriz.
- Confundir velocidade da imagem com velocidade relativa imagem-objeto (são $2v_e$ vs $2v_o$ em casos diferentes).
- Achar que a inversão do espelho é "vertical" — ela é perpendicular ao plano do espelho.

## Veja também

- `apresentacao.html` — versão visual com diagramas SVG (abra no navegador).
