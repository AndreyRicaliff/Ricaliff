import { useState } from 'react';
import type { ContentFlashcard } from '../../content/types.ts';
import { hojeISO } from '../../lib/date.ts';
import ProgressBar from '../../components/ProgressBar.tsx';
import { cardId } from './progresso.ts';
import { getProgresso, salvarProgresso } from './repo.ts';
import { revisar, type QualidadeResposta } from './sm2.ts';

interface Props {
  topicoId: string;
  flashcards: readonly ContentFlashcard[];
}

const NOTAS: ReadonlyArray<{ q: QualidadeResposta; label: string; cor: string }> = [
  { q: 0, label: 'Errei', cor: 'bg-danger/90 hover:bg-danger' },
  { q: 3, label: 'Difícil', cor: 'bg-warn/90 hover:bg-warn text-bg' },
  { q: 4, label: 'Bom', cor: 'bg-sky-500/90 hover:bg-sky-500' },
  { q: 5, label: 'Fácil', cor: 'bg-accent/90 hover:bg-accent text-bg' },
];

export default function FlashcardSection({ topicoId, flashcards }: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  async function responder(q: QualidadeResposta) {
    const id = cardId(topicoId, idx);
    const hoje = hojeISO();
    const prog = await getProgresso(id, hoje);
    await salvarProgresso(id, revisar(prog, q, hoje));
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  const card = flashcards[idx];
  if (!card) return <ConcluidoFlashcards total={flashcards.length} onReset={() => setIdx(0)} />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5 font-semibold text-warn">🃏 Flashcard</span>
        <span>
          {idx + 1} / {flashcards.length}
        </span>
      </div>
      <ProgressBar atual={idx} total={flashcards.length} cor="bg-warn" />

      <div className="flip mt-4 h-72 cursor-pointer" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-inner h-full ${flipped ? 'is-flipped' : ''}`}>
          <Face titulo="Pergunta" dica="toque para virar" texto={card.frente} />
          <Face titulo="Resposta" dica="toque para voltar" texto={card.verso} back />
        </div>
      </div>

      {flipped ? (
        <div className="mt-4">
          <p className="mb-2 text-center text-xs text-muted">Como você foi nesse cartão?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NOTAS.map((n) => (
              <button
                key={n.q}
                onClick={() => responder(n.q)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition ${n.cor}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">
          Tente responder de cabeça e toque no cartão para conferir.
        </p>
      )}
    </div>
  );
}

interface FaceProps {
  titulo: string;
  dica: string;
  texto: string;
  back?: boolean;
}

function Face({ titulo, dica, texto, back = false }: FaceProps) {
  const cor = back ? 'border-accent/40' : 'border-warn/40';
  return (
    <div
      className={`flip-face card flip-${back ? 'back' : 'front'} items-center justify-center border-2 ${cor} p-6 text-center`}
    >
      <span className="absolute top-4 left-5 text-xs font-semibold tracking-wide text-muted uppercase">
        {titulo}
      </span>
      <p className="text-lg leading-relaxed">{texto}</p>
      <span className="absolute right-5 bottom-4 text-xs text-muted">↻ {dica}</span>
    </div>
  );
}

function ConcluidoFlashcards({ total, onReset }: { total: number; onReset: () => void }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-4xl">🎉</p>
      <p className="mt-3 text-lg font-semibold">Você revisou os {total} cartões!</p>
      <p className="mt-1 text-sm text-muted">Seu progresso foi salvo neste dispositivo.</p>
      <button
        onClick={onReset}
        className="mt-5 rounded-xl bg-warn px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
      >
        Revisar de novo
      </button>
    </div>
  );
}
