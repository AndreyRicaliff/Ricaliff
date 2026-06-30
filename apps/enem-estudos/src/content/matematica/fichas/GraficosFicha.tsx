import { ACC } from '../../../features/ficha/accents.ts';
import FichaSection from '../../../features/ficha/FichaSection.tsx';
import { FichaCard, Formula, Hl, ShapeDemo, FichaTable } from '../../../features/ficha/parts.tsx';
import { BarChart, LineChart, PieChart } from '../../../features/ficha/charts.tsx';

const G = ACC.laranja;

const BARRAS = [
  { label: 'Jan', pct: 60 },
  { label: 'Fev', pct: 85 },
  { label: 'Mar', pct: 45 },
  { label: 'Abr', pct: 95 },
  { label: 'Mai', pct: 70 },
  { label: 'Jun', pct: 55 },
];

export default function GraficosFicha() {
  return (
    <div className="ficha">
      <FichaSection cor={G} num="Seção 01" icon="📊" title="Gráficos e Tabelas">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FichaCard cor={G} title="📊 Barras / Colunas">
            <BarChart caption="Exemplo: vendas por mês" barras={BARRAS} />
            <ul className="mt-2.5">
              <li>Compare alturas para achar maior/menor</li>
              <li>Leia o eixo Y com atenção (escala!)</li>
              <li>Soma das barras = total</li>
            </ul>
          </FichaCard>

          <FichaCard cor={G} title="🥧 Setores (Pizza)">
            <ShapeDemo>
              <PieChart
                cor={G}
                fatias={[
                  { label: 'a', pct: 40 },
                  { label: 'b', pct: 25 },
                  { label: 'c', pct: 20 },
                  { label: 'd', pct: 15 },
                ]}
              />
            </ShapeDemo>
            <Formula>ângulo da fatia = % × 3,6°</Formula>
            <ul>
              <li>Cada fatia = proporção do total (soma 100%)</li>
              <li>Cuidado com pizza 3D distorcida</li>
            </ul>
          </FichaCard>

          <FichaCard cor={G} title="📈 Linhas">
            <LineChart caption="Evolução no tempo" cor={G} pontos={[20, 45, 35, 70, 60, 85]} />
            <ul className="mt-2.5">
              <li>
                Mostra <strong>tendência</strong> ao longo do tempo
              </li>
              <li>Subida = crescimento; descida = queda</li>
              <li>Cruzamento de linhas = valores iguais</li>
            </ul>
          </FichaCard>

          <FichaCard cor={G} title="🗂️ Tabela de Frequência">
            <FichaTable>
              <thead>
                <tr>
                  <th>Conceito</th>
                  <th>O que é</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Freq. absoluta (fᵢ)</td>
                  <td>nº de vezes que o valor ocorre</td>
                </tr>
                <tr>
                  <td>Freq. relativa</td>
                  <td>fᵢ ÷ total (% ou decimal)</td>
                </tr>
                <tr>
                  <td>Freq. acumulada</td>
                  <td>soma das freq. até o ponto</td>
                </tr>
                <tr>
                  <td>Moda</td>
                  <td>valor mais frequente</td>
                </tr>
                <tr>
                  <td>Mediana</td>
                  <td>valor central (ordenado)</td>
                </tr>
                <tr>
                  <td>Média</td>
                  <td>Σ(xᵢ·fᵢ) ÷ Σfᵢ</td>
                </tr>
              </tbody>
            </FichaTable>
          </FichaCard>

          <FichaCard cor={G} title="🧮 Tendência Central">
            <Formula>Média = Σxᵢ / n</Formula>
            <Formula>Mediana = valor central (ordenado)</Formula>
            <ul className="mt-1.5">
              <li>Moda: valor que mais se repete</li>
              <li>Média sofre com valores extremos</li>
              <li>Mediana é mais robusta a outliers</li>
            </ul>
          </FichaCard>

          <FichaCard cor={G} title="⚠️ Armadilhas">
            <ul>
              <li>
                <strong>Eixo Y cortado:</strong> exagera diferenças
              </li>
              <li>
                <strong>Escala irregular:</strong> distorce a tendência
              </li>
              <li>
                <strong>Gráfico 3D:</strong> engana a proporção
              </li>
              <li>
                <strong>Sem título/unidade:</strong> leia o contexto
              </li>
            </ul>
          </FichaCard>
        </div>

        <Hl>
          <strong>⚡ Dica ENEM:</strong> O ENEM adora dois gráficos juntos pedindo variação
          percentual. Leia título, eixos e legenda — e desconfie da escala (a pegadinha).
        </Hl>
      </FichaSection>
    </div>
  );
}
