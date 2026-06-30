import { ACC } from '../../../features/ficha/accents.ts';
import FichaSection from '../../../features/ficha/FichaSection.tsx';
import { FichaCard, Formula, Hl, FichaTable } from '../../../features/ficha/parts.tsx';

const R = ACC.roxo;

export default function RazaoFicha() {
  return (
    <div className="ficha">
      <FichaSection cor={R} num="Seção 01" icon="÷" title="Razão, Proporção e Regra de Três">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FichaCard cor={R} title="⚖️ Razão">
            <Formula>razão = a / b = a ÷ b</Formula>
            <ul>
              <li>
                Compara duas grandezas de <strong>mesma espécie</strong>
              </li>
              <li>Ex.: razão 3:5 = 3/5 = 0,6</li>
              <li>Porcentagem é razão de denominador 100</li>
              <li>Escala de mapa: 1:50000</li>
            </ul>
          </FichaCard>

          <FichaCard cor={R} title="= Proporção">
            <Formula>a / b = c / d</Formula>
            <Formula>a × d = b × c</Formula>
            <ul>
              <li>Igualdade entre duas razões</li>
              <li>
                <strong>Produto dos meios = produto dos extremos</strong>
              </li>
            </ul>
          </FichaCard>

          <FichaCard cor={R} title="📏 Regra de Três Simples">
            <Formula>a → b · c → x ⟹ x = (b × c) / a</Formula>
            <ul>
              <li>
                <strong>Direta:</strong> uma sobe, a outra sobe
              </li>
              <li>
                <strong>Inversa:</strong> uma sobe, a outra desce
              </li>
              <li>No inverso: x = (a × b) / c</li>
            </ul>
          </FichaCard>

          <FichaCard cor={R} title="📐 Regra de Três Composta">
            <p>Envolve 3 ou mais grandezas ao mesmo tempo.</p>
            <ul>
              <li>Monte a tabela com todas as grandezas</li>
              <li>Diretas: multiplica normal</li>
              <li>Inversas: inverte a coluna antes</li>
              <li>Multiplique as razões em cadeia</li>
            </ul>
          </FichaCard>

          <FichaCard cor={R} title="% Porcentagem">
            <Formula>% = (parte / total) × 100</Formula>
            <Formula>valor = (taxa / 100) × total</Formula>
            <ul>
              <li>Aumento de x%: × (1 + x/100)</li>
              <li>Desconto de x%: × (1 − x/100)</li>
              <li>
                +20% seguido de −20% <strong>não</strong> volta ao valor original!
              </li>
            </ul>
          </FichaCard>

          <FichaCard cor={R} title="📊 Grandezas Proporcionais">
            <FichaTable>
              <thead>
                <tr>
                  <th>Diretamente</th>
                  <th>Inversamente</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Preço × Quantidade</td>
                  <td>Trabalhadores × Dias</td>
                </tr>
                <tr>
                  <td>Consumo × Km</td>
                  <td>Velocidade × Tempo</td>
                </tr>
                <tr>
                  <td>Receita × Ingredientes</td>
                  <td>Torneiras × Tempo</td>
                </tr>
              </tbody>
            </FichaTable>
          </FichaCard>
        </div>

        <Hl>
          <strong>⚡ Dica ENEM:</strong> Antes de montar a regra de três, decida se é direta ou
          inversa. Mais operários = menos dias (inversa). Não confunda!
        </Hl>
      </FichaSection>
    </div>
  );
}
