export interface ProgressoCard {
  readonly repeticoes: number;
  readonly facilidade: number;
  readonly intervaloDias: number;
  readonly proximaRevisao: string;
}

export function progressoInicial(hoje: string): ProgressoCard {
  return { repeticoes: 0, facilidade: 2.5, intervaloDias: 0, proximaRevisao: hoje };
}

/** id estável de um flashcard: `${topicoId}:${indice}` */
export function cardId(topicoId: string, indice: number): string {
  return `${topicoId}:${indice}`;
}
