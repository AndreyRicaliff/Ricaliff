import { describe, it, expect } from 'vitest';
import { revisar } from './sm2.ts';
import { progressoInicial, type ProgressoCard } from './progresso.ts';

const base: ProgressoCard = progressoInicial('2026-06-06');

describe('revisar (SM-2)', () => {
  it('primeira revisão acertada agenda para 1 dia', () => {
    const r = revisar(base, 5, '2026-06-06');
    expect(r.repeticoes).toBe(1);
    expect(r.intervaloDias).toBe(1);
    expect(r.proximaRevisao).toBe('2026-06-07');
  });

  it('segunda revisão acertada agenda para 6 dias', () => {
    const r = revisar({ ...base, repeticoes: 1 }, 4, '2026-06-06');
    expect(r.intervaloDias).toBe(6);
    expect(r.proximaRevisao).toBe('2026-06-12');
  });

  it('resposta ruim (q<3) reseta repetições e volta para 1 dia', () => {
    const r = revisar({ ...base, repeticoes: 5, intervaloDias: 40 }, 1, '2026-06-06');
    expect(r.repeticoes).toBe(0);
    expect(r.intervaloDias).toBe(1);
  });

  it('facilidade nunca cai abaixo de 1.3', () => {
    const r = revisar({ ...base, facilidade: 1.3 }, 0, '2026-06-06');
    expect(r.facilidade).toBeGreaterThanOrEqual(1.3);
  });
});
