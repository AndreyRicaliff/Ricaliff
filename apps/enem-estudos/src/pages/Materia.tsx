import { Link, useParams } from 'react-router-dom';
import { getMateria } from '../content/index.ts';
import TopicCard from '../components/TopicCard.tsx';

export default function Materia() {
  const { materiaId = '' } = useParams();
  const materia = getMateria(materiaId);

  if (!materia) {
    return (
      <p className="text-muted">
        Matéria não encontrada.{' '}
        <Link className="text-brand-soft" to="/">
          Voltar
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link to="/" className="text-sm text-muted transition hover:text-brand-soft">
        ← Matérias
      </Link>
      <h2 className="mt-2 mb-5 flex items-center gap-3 text-2xl font-bold">
        <span>{materia.icone}</span>
        {materia.titulo}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {materia.topicos.map((topico) => (
          <TopicCard key={topico.id} materiaId={materia.id} topico={topico} />
        ))}
      </div>
    </div>
  );
}
