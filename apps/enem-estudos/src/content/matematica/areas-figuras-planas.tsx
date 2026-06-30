import type { Topico } from '../types.ts';
import AreasFicha from './fichas/AreasFicha.tsx';
import { areasFigurasPlanasData } from './data/areas-figuras-planas.ts';

export const areasFigurasPlanas: Topico = {
  id: 'areas-figuras-planas',
  titulo: 'Áreas de Figuras Planas',
  mapaMental: areasFigurasPlanasData.mapaMental,
  Ficha: AreasFicha,
  flashcards: areasFigurasPlanasData.flashcards,
  questoes: areasFigurasPlanasData.questoes,
};
