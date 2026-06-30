import type { ComponentType } from 'react';

export interface ContentFlashcard {
  readonly frente: string;
  readonly verso: string;
}

export interface ContentQuestao {
  readonly enunciado: string;
  readonly alternativas: readonly string[];
  /** índice (0-based) da alternativa correta */
  readonly correta: number;
  readonly explicacao: string;
}

export interface Topico {
  readonly id: string;
  readonly titulo: string;
  /** markdown no formato markmap: um # raiz + bullets aninhados */
  readonly mapaMental: string;
  /** resumo em markdown (Biologia). Ausente quando há Ficha visual. */
  readonly resumoCurto?: string;
  readonly resumoLongo?: string;
  /** ficha visual rica (Matemática). Quando presente, substitui o resumo markdown. */
  readonly Ficha?: ComponentType;
  readonly flashcards: readonly ContentFlashcard[];
  readonly questoes: readonly ContentQuestao[];
}

export interface Materia {
  readonly id: string;
  readonly titulo: string;
  readonly icone: string;
  readonly topicos: readonly Topico[];
}
