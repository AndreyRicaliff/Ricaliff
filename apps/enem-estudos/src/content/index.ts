import type { Materia, Topico } from './types.ts';
import { biologia } from './biologia/index.ts';
import { matematica } from './matematica/index.ts';

export const MATERIAS: readonly Materia[] = [matematica, biologia];

export function getMateria(id: string): Materia | undefined {
  return MATERIAS.find((m) => m.id === id);
}

export function getTopico(materiaId: string, topicoId: string): Topico | undefined {
  return getMateria(materiaId)?.topicos.find((t) => t.id === topicoId);
}
