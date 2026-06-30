import { useState } from 'react';
import type { ContentQuestao } from '../../content/types.ts';
import ProgressBar from '../../components/ProgressBar.tsx';
import Alternativa from './Alternativa.tsx';

interface Props {
  questoes: readonly ContentQuestao[];
}

export default function QuestoesSection({ questoes }: Props) {
  const [idx, setIdx] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);

  const q = questoes[idx];
  if (!q) return <Resultado acertos={acertos} total={questoes.length} onReset={reiniciar} />;

  function reiniciar() {
    setIdx(0);
    setSelecionada(null);
    setAcertos(0);
  }

  function escolher(i: number) {
    if (selecionada !== null || !q) return;
    setSelecionada(i);
    if (i === q.correta) setAcertos((a) => a + 1);
  }

  function proxima() {
    setSelecionada(null);
    setIdx((i) => i + 1);
  }

  const acertou = selecionada === q.correta;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5 font-semibold text-accent">📝 Questão</span>
        <span>
          {idx + 1} / {questoes.length} · ✓ {acertos}
        </span>
      </div>
      <ProgressBar atual={idx} total={questoes.length} cor="bg-accent" />

      <div className="card mt-4 p-6">
        <p className="mb-5 leading-relaxed">{q.enunciado}</p>
        <div className="flex flex-col gap-2.5">
          {q.alternativas.map((alt, i) => (
            <Alternativa
              key={i}
              texto={alt}
              indice={i}
              correta={q.correta}
              selecionada={selecionada}
              onClick={() => escolher(i)}
            />
          ))}
        </div>

        {selecionada !== null && (
          <div className="animate-pop mt-5 rounded-xl border border-border bg-surface-2 p-4">
            <p className={`mb-1 text-sm font-bold ${acertou ? 'text-accent' : 'text-danger'}`}>
              {acertou ? '✓ Acertou!' : '✗ Não foi dessa vez'}
            </p>
            <p className="text-sm text-ink/80">{q.explicacao}</p>
            <button
              onClick={proxima}
              className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
            >
              {idx + 1 < questoes.length ? 'Próxima questão' : 'Ver resultado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultadoProps {
  acertos: number;
  total: number;
  onReset: () => void;
}

function Resultado({ acertos, total, onReset }: ResultadoProps) {
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const bom = pct >= 60;
  return (
    <div className="card p-8 text-center">
      <p className="text-4xl">{bom ? '🏆' : '💪'}</p>
      <p className="mt-3 text-lg font-semibold">
        Você acertou {acertos} de {total} ({pct}%)
      </p>
      <p className="mt-1 text-sm text-muted">
        {bom ? 'Mandou bem! Bora pro próximo tópico.' : 'Revise o resumo e tente de novo.'}
      </p>
      <button
        onClick={onReset}
        className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
      >
        Refazer questões
      </button>
    </div>
  );
}
