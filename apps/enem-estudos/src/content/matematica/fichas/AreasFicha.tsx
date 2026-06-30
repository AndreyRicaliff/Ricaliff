import { ACC } from '../../../features/ficha/accents.ts';
import FichaSection from '../../../features/ficha/FichaSection.tsx';
import { FichaCard, Formula, Hl, ShapeDemo, FichaTable } from '../../../features/ficha/parts.tsx';

const A = ACC.amarelo;
const Q = ACC.rosa;
const C = ACC.teal;

function Triangulos() {
  return (
    <FichaSection cor={A} num="Seção 01" icon="▲" title="Área de Triângulos">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <FichaCard cor={A} title="📐 Fórmula Geral">
          <ShapeDemo>
            <svg width="120" height="96" viewBox="0 0 120 100">
              <polygon
                points="60,8 110,82 10,82"
                fill="rgba(247,201,72,0.15)"
                stroke={A}
                strokeWidth="2"
              />
              <line
                x1="60"
                y1="8"
                x2="60"
                y2="82"
                stroke={A}
                strokeWidth="1"
                strokeDasharray="4,3"
                opacity="0.6"
              />
              <text x="64" y="48" fontSize="10" fill={A} className="mono">
                h
              </text>
              <line x1="10" y1="88" x2="110" y2="88" stroke={A} strokeWidth="1" opacity="0.4" />
              <text x="55" y="98" fontSize="10" fill={A} className="mono">
                b
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = (b × h) / 2</Formula>
          <p className="mt-2">
            Base × altura ÷ 2. A altura é <strong>perpendicular</strong> à base.
          </p>
        </FichaCard>

        <FichaCard cor={A} title="📏 Fórmula de Heron">
          <p>Quando só se conhecem os três lados a, b, c:</p>
          <Formula>s = (a + b + c) / 2</Formula>
          <Formula>A = √(s·(s−a)·(s−b)·(s−c))</Formula>
          <p className="mt-2">s = semiperímetro. Útil quando não há altura explícita.</p>
        </FichaCard>

        <FichaCard cor={A} title="📐 Triângulo Retângulo">
          <Formula>a² = b² + c² (Pitágoras)</Formula>
          <Formula>A = (cateto₁ × cateto₂) / 2</Formula>
          <ul>
            <li>Hipotenusa = maior lado (oposto ao ângulo reto)</li>
            <li>Ângulos: 90° e dois complementares</li>
          </ul>
        </FichaCard>

        <FichaCard cor={A} title="📐 Triângulo Equilátero">
          <Formula>A = (l² × √3) / 4</Formula>
          <ul>
            <li>Todos os lados iguais (l)</li>
            <li>Todos os ângulos = 60°</li>
            <li>Altura: h = (l√3) / 2</li>
          </ul>
        </FichaCard>
      </div>

      <Hl>
        <strong>⚡ Dica ENEM:</strong> Triângulos em malha quadriculada — conte as linhas para achar
        base e altura. O equilátero aparece muito em pavimentação e origami.
      </Hl>

      <FichaTable>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Ângulos</th>
            <th>Lados</th>
            <th>Área</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Equilátero</td>
            <td>3 × 60°</td>
            <td>a = b = c</td>
            <td>(l²√3)/4</td>
          </tr>
          <tr>
            <td>Isósceles</td>
            <td>2 iguais + 1</td>
            <td>a = b ≠ c</td>
            <td>(b×h)/2</td>
          </tr>
          <tr>
            <td>Escaleno</td>
            <td>todos diferentes</td>
            <td>a ≠ b ≠ c</td>
            <td>Heron</td>
          </tr>
          <tr>
            <td>Retângulo</td>
            <td>90° + 2 agudos</td>
            <td>hip. + 2 catetos</td>
            <td>(c₁×c₂)/2</td>
          </tr>
        </tbody>
      </FichaTable>
    </FichaSection>
  );
}

function Quadrilateros() {
  return (
    <FichaSection cor={Q} num="Seção 02" icon="⬛" title="Área de Quadriláteros">
      <div className="grid gap-3.5 sm:grid-cols-3">
        <FichaCard cor={Q} title="Quadrado">
          <ShapeDemo>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <rect
                x="10"
                y="10"
                width="60"
                height="60"
                fill="rgba(255,111,145,0.15)"
                stroke={Q}
                strokeWidth="2"
              />
              <text x="34" y="44" fontSize="11" fill={Q} className="mono">
                l
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = l²</Formula>
          <p>4 lados iguais, 4 ângulos de 90°</p>
        </FichaCard>

        <FichaCard cor={Q} title="Retângulo">
          <ShapeDemo>
            <svg width="100" height="70" viewBox="0 0 100 70">
              <rect
                x="5"
                y="10"
                width="90"
                height="50"
                fill="rgba(255,111,145,0.15)"
                stroke={Q}
                strokeWidth="2"
              />
              <text x="42" y="38" fontSize="10" fill={Q} className="mono">
                b×h
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = b × h</Formula>
          <p>Lados opostos iguais, ângulos de 90°</p>
        </FichaCard>

        <FichaCard cor={Q} title="Paralelogramo">
          <ShapeDemo>
            <svg width="110" height="70" viewBox="0 0 110 70">
              <polygon
                points="20,60 90,60 95,10 25,10"
                fill="rgba(255,111,145,0.15)"
                stroke={Q}
                strokeWidth="2"
              />
              <line
                x1="57"
                y1="10"
                x2="57"
                y2="60"
                stroke={Q}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <text x="60" y="38" fontSize="10" fill={Q} className="mono">
                h
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = b × h</Formula>
          <p>h é a altura perpendicular</p>
        </FichaCard>

        <FichaCard cor={Q} title="Losango">
          <ShapeDemo>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <polygon
                points="45,8 80,45 45,82 10,45"
                fill="rgba(255,111,145,0.15)"
                stroke={Q}
                strokeWidth="2"
              />
              <line
                x1="10"
                y1="45"
                x2="80"
                y2="45"
                stroke={Q}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <line
                x1="45"
                y1="8"
                x2="45"
                y2="82"
                stroke={Q}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <text x="48" y="42" fontSize="9" fill={Q} className="mono">
                D,d
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = (D × d) / 2</Formula>
          <p>D = diagonal maior, d = menor</p>
        </FichaCard>

        <FichaCard cor={Q} title="Trapézio">
          <ShapeDemo>
            <svg width="110" height="75" viewBox="0 0 110 75">
              <polygon
                points="20,65 90,65 75,10 35,10"
                fill="rgba(255,111,145,0.15)"
                stroke={Q}
                strokeWidth="2"
              />
              <text x="48" y="24" fontSize="9" fill={Q} className="mono">
                b
              </text>
              <text x="48" y="60" fontSize="9" fill={Q} className="mono">
                B
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = ((B + b) × h) / 2</Formula>
          <p>B = base maior, b = menor</p>
        </FichaCard>

        <FichaCard cor={Q} title="Resumo Rápido">
          <ul>
            <li>Todo quadrado é retângulo</li>
            <li>Todo losango é paralelogramo</li>
            <li>Trapézio: só 1 par de lados paralelos</li>
            <li>
              Soma dos ângulos internos = <strong>360°</strong>
            </li>
          </ul>
        </FichaCard>
      </div>

      <Hl>
        <strong>⚡ Dica ENEM:</strong> O trapézio é campeão de questões (terrenos!). A altura é
        sempre perpendicular às bases, nunca os lados oblíquos.
      </Hl>
    </FichaSection>
  );
}

function Circulos() {
  return (
    <FichaSection cor={C} num="Seção 03" icon="●" title="Área de Círculos">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <FichaCard cor={C} title="🔵 Círculo Completo">
          <ShapeDemo>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r="46"
                fill="rgba(78,205,196,0.1)"
                stroke={C}
                strokeWidth="2"
              />
              <line x1="55" y1="55" x2="101" y2="55" stroke={C} strokeWidth="1.5" />
              <circle cx="55" cy="55" r="3" fill={C} />
              <text x="72" y="51" fontSize="11" fill={C} className="mono">
                r
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = π × r²</Formula>
          <Formula>C = 2 × π × r</Formula>
          <p className="mt-2">Use π ≈ 3,14 no ENEM salvo instrução contrária.</p>
        </FichaCard>

        <FichaCard cor={C} title="🥧 Setor Circular">
          <ShapeDemo>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <path
                d="M55,55 L101,55 A46,46 0 0,0 55,9 Z"
                fill="rgba(78,205,196,0.2)"
                stroke={C}
                strokeWidth="2"
              />
              <circle
                cx="55"
                cy="55"
                r="46"
                fill="none"
                stroke={C}
                strokeWidth="1.5"
                strokeDasharray="6,4"
                opacity="0.3"
              />
              <text x="70" y="45" fontSize="10" fill={C} className="mono">
                θ
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = (θ/360) × π × r²</Formula>
          <Formula>arco = (θ/360) × 2πr</Formula>
          <p className="mt-2">θ = ângulo central em graus. "Fatia de pizza".</p>
        </FichaCard>

        <FichaCard cor={C} title="🍩 Coroa Circular">
          <ShapeDemo>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r="46"
                fill="rgba(78,205,196,0.12)"
                stroke={C}
                strokeWidth="2"
              />
              <circle
                cx="55"
                cy="55"
                r="26"
                fill="#0a0f1a"
                stroke={C}
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              <line x1="55" y1="55" x2="101" y2="55" stroke={C} strokeWidth="1.2" />
              <text x="82" y="51" fontSize="9" fill={C} className="mono">
                R
              </text>
              <text x="62" y="51" fontSize="9" fill="#fff" className="mono">
                r
              </text>
            </svg>
          </ShapeDemo>
          <Formula>A = π × (R² − r²)</Formula>
          <p className="mt-2">Diferença entre o círculo grande (R) e o furo (r).</p>
        </FichaCard>

        <FichaCard cor={C} title="💡 Relações Importantes">
          <ul>
            <li>
              <strong>Diâmetro</strong> d = 2r
            </li>
            <li>Circunferência = perímetro do círculo</li>
            <li>Área do semicírculo = πr²/2</li>
            <li>Círculo inscrito no quadrado: r = l/2</li>
            <li>Círculo circunscrito: r = l√2/2</li>
          </ul>
        </FichaCard>
      </div>

      <Hl>
        <strong>⚡ Dica ENEM:</strong> Rodas, pistas, relógios e embalagens usam setor circular e
        comprimento de arco. Veja se a questão pede <em>área</em> ou <em>comprimento</em>!
      </Hl>
    </FichaSection>
  );
}

export default function AreasFicha() {
  return (
    <div className="ficha">
      <Triangulos />
      <Quadrilateros />
      <Circulos />
    </div>
  );
}
