import { MATERIAS } from '../content/index.ts';
import TopicCard from '../components/TopicCard.tsx';

export default function Home() {
  return (
    <div className="space-y-10">
      {MATERIAS.map((materia) => (
        <section key={materia.id}>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-xl">
              {materia.icone}
            </span>
            <h2 className="text-xl font-bold">{materia.titulo}</h2>
            <span className="ml-auto text-sm text-muted">{materia.topicos.length} tópicos</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {materia.topicos.map((topico) => (
              <TopicCard key={topico.id} materiaId={materia.id} topico={topico} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
