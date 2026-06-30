import type { Topico } from '../types.ts';
import RazaoFicha from './fichas/RazaoFicha.tsx';
import { razaoProporcaoData } from './data/razao-proporcao.ts';

export const razaoProporcao: Topico = {
  id: 'razao-proporcao',
  titulo: 'Razão, Proporção e Regra de Três',
  mapaMental: razaoProporcaoData.mapaMental,
  Ficha: RazaoFicha,
  flashcards: razaoProporcaoData.flashcards,
  questoes: razaoProporcaoData.questoes,
};
