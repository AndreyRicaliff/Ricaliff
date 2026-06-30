import type { Topico } from '../types.ts';
import GraficosFicha from './fichas/GraficosFicha.tsx';
import { graficosTabelasData } from './data/graficos-tabelas.ts';

export const graficosTabelas: Topico = {
  id: 'graficos-tabelas',
  titulo: 'Gráficos e Tabelas',
  mapaMental: graficosTabelasData.mapaMental,
  Ficha: GraficosFicha,
  flashcards: graficosTabelasData.flashcards,
  questoes: graficosTabelasData.questoes,
};
