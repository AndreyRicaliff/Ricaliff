import type { Materia } from '../types.ts';
import { histologiaHumana } from './histologia-humana.ts';
import { metodosContraceptivos } from './metodos-contraceptivos.ts';
import { sistemaRespiratorio } from './sistema-respiratorio.ts';

export const biologia: Materia = {
  id: 'biologia',
  titulo: 'Biologia',
  icone: '🧬',
  topicos: [histologiaHumana, metodosContraceptivos, sistemaRespiratorio],
};
