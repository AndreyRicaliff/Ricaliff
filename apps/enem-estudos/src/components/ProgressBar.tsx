interface Props {
  atual: number;
  total: number;
  cor?: string;
}

export default function ProgressBar({ atual, total, cor = 'bg-brand' }: Props) {
  const pct = total > 0 ? Math.round((atual / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className={`h-full rounded-full transition-all duration-300 ${cor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
