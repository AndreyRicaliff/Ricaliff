import { useState } from 'react';
import Markdown from '../../components/Markdown.tsx';

interface Props {
  curto: string;
  longo: string;
}

type Modo = 'curto' | 'longo';

const OPCOES: ReadonlyArray<{ id: Modo; label: string }> = [
  { id: 'curto', label: '⚡ Resumo rápido' },
  { id: 'longo', label: '📚 Resumo completo' },
];

export default function ResumoSection({ curto, longo }: Props) {
  const [modo, setModo] = useState<Modo>('curto');
  return (
    <div>
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
        {OPCOES.map((o) => (
          <button
            key={o.id}
            onClick={() => setModo(o.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              modo === o.id ? 'bg-sky-500 text-white shadow' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="card border-l-4 border-l-sky-500 p-6">
        <Markdown>{modo === 'curto' ? curto : longo}</Markdown>
      </div>
    </div>
  );
}
