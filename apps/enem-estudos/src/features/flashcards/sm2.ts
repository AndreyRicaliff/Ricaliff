import type { ProgressoCard } from './progresso.ts';

export type QualidadeResposta = 0 | 1 | 2 | 3 | 4 | 5;

const FACILIDADE_MINIMA = 1.3;

function novaFacilidade(atual: number, q: QualidadeResposta): number {
  const ajuste = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return Math.max(FACILIDADE_MINIMA, atual + ajuste);
}

function proximoIntervalo(repeticoes: number, intervaloAtual: number, ef: number): number {
  if (repeticoes === 0) return 1;
  if (repeticoes === 1) return 6;
  return Math.round(intervaloAtual * ef);
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function revisar(prog: ProgressoCard, q: QualidadeResposta, hoje: string): ProgressoCard {
  const facilidade = novaFacilidade(prog.facilidade, q);
  if (q < 3) {
    return { repeticoes: 0, facilidade, intervaloDias: 1, proximaRevisao: somarDias(hoje, 1) };
  }
  const intervaloDias = proximoIntervalo(prog.repeticoes, prog.intervaloDias, facilidade);
  return {
    repeticoes: prog.repeticoes + 1,
    facilidade,
    intervaloDias,
    proximaRevisao: somarDias(hoje, intervaloDias),
  };
}
