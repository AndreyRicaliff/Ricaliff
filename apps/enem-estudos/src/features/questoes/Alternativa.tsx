interface Props {
  texto: string;
  indice: number;
  correta: number;
  selecionada: number | null;
  onClick: () => void;
}

function estilo(indice: number, correta: number, selecionada: number | null): string {
  if (selecionada === null)
    return 'border-border bg-surface-2 hover:border-brand-soft hover:bg-surface-3';
  if (indice === correta) return 'border-accent bg-accent/15 text-ink';
  if (indice === selecionada) return 'border-danger bg-danger/15 text-ink';
  return 'border-border bg-surface-2 opacity-50';
}

function badge(indice: number, correta: number, selecionada: number | null): string {
  if (selecionada === null) return 'bg-surface-3 text-brand-soft';
  if (indice === correta) return 'bg-accent text-bg';
  if (indice === selecionada) return 'bg-danger text-white';
  return 'bg-surface-3 text-muted';
}

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export default function Alternativa({ texto, indice, correta, selecionada, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={selecionada !== null}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${estilo(indice, correta, selecionada)}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badge(indice, correta, selecionada)}`}
      >
        {LETRAS[indice]}
      </span>
      <span>{texto}</span>
    </button>
  );
}
