import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTopico } from '../content/index.ts';
import ResumoSection from '../features/resumo/ResumoSection.tsx';
import FlashcardSection from '../features/flashcards/FlashcardSection.tsx';
import QuestoesSection from '../features/questoes/QuestoesSection.tsx';

const MindMap = lazy(() => import('../components/MindMap.tsx'));

type Secao = 'mapa' | 'resumo' | 'flashcards' | 'questoes';

const SECOES: ReadonlyArray<{ id: Secao; label: string; icon: string; active: string }> = [
  { id: 'mapa', label: 'Mapa mental', icon: '🗺️', active: 'bg-brand text-white shadow-brand/40' },
  { id: 'resumo', label: 'Resumo', icon: '📄', active: 'bg-sky-500 text-white shadow-sky-500/40' },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: '🃏',
    active: 'bg-warn text-bg shadow-warn/40',
  },
  {
    id: 'questoes',
    label: 'Questões',
    icon: '📝',
    active: 'bg-accent text-bg shadow-accent/40',
  },
];

export default function Topico() {
  const { materiaId = '', topicoId = '' } = useParams();
  const [secao, setSecao] = useState<Secao>('mapa');
  const topico = getTopico(materiaId, topicoId);

  if (!topico) {
    return (
      <p className="text-muted">
        Tópico não encontrado.{' '}
        <Link className="text-brand-soft" to="/">
          Voltar
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link to={`/${materiaId}`} className="text-sm text-muted transition hover:text-brand-soft">
        ← Tópicos
      </Link>
      <h2 className="mt-2 mb-5 text-2xl font-bold">{topico.titulo}</h2>

      <nav className="mb-6 flex flex-wrap gap-2">
        {SECOES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSecao(s.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              secao === s.id
                ? `${s.active} shadow-lg`
                : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-ink'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="animate-pop">
        {secao === 'mapa' && (
          <Suspense fallback={<p className="text-muted">Carregando mapa…</p>}>
            <MindMap markdown={topico.mapaMental} />
          </Suspense>
        )}
        {secao === 'resumo' &&
          (topico.Ficha ? (
            <topico.Ficha />
          ) : (
            <ResumoSection curto={topico.resumoCurto ?? ''} longo={topico.resumoLongo ?? ''} />
          ))}
        {secao === 'flashcards' && (
          <FlashcardSection topicoId={topico.id} flashcards={topico.flashcards} />
        )}
        {secao === 'questoes' && <QuestoesSection questoes={topico.questoes} />}
      </div>
    </div>
  );
}
