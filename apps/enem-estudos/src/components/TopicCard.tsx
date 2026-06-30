import { Link } from 'react-router-dom';
import type { Topico } from '../content/types.ts';

interface Props {
  materiaId: string;
  topico: Topico;
}

export default function TopicCard({ materiaId, topico }: Props) {
  return (
    <Link
      to={`/${materiaId}/${topico.id}`}
      className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-brand/20"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand to-brand-soft" />
      <p className="font-semibold text-ink group-hover:text-brand-soft">{topico.titulo}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-surface-3 px-2.5 py-1 text-muted">🗺️ Mapa mental</span>
        <span className="rounded-full bg-surface-3 px-2.5 py-1 text-muted">
          🃏 {topico.flashcards.length} cards
        </span>
        <span className="rounded-full bg-surface-3 px-2.5 py-1 text-muted">
          📝 {topico.questoes.length} questões
        </span>
      </div>
    </Link>
  );
}
