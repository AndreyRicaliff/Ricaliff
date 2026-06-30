import type { Materia } from '../types.ts';
import { areasFigurasPlanas } from './areas-figuras-planas.tsx';
import { razaoProporcao } from './razao-proporcao.tsx';
import { graficosTabelas } from './graficos-tabelas.tsx';

export const matematica: Materia = {
  id: 'matematica',
  titulo: 'Matemática',
  icone: '📐',
  topicos: [areasFigurasPlanas, razaoProporcao, graficosTabelas],
};
