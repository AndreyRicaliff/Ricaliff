interface Barra {
  label: string;
  pct: number;
}

export function BarChart({ caption, barras }: { caption: string; barras: Barra[] }) {
  return (
    <div className="graph-box">
      <div className="graph-cap">{caption}</div>
      <div className="bar-chart">
        {barras.map((b, i) => (
          <div
            key={b.label}
            className="bar"
            style={{ height: `${b.pct}%`, ['--delay']: `${i * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {barras.map((b) => (
          <div key={b.label} className="mono flex-1 text-center text-[10px] text-muted">
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  caption,
  cor,
  pontos,
}: {
  caption: string;
  cor: string;
  pontos: number[];
}) {
  const w = 200;
  const h = 80;
  const max = Math.max(...pontos, 1);
  const coords = pontos.map((p, i) => {
    const x = 10 + (i * (w - 20)) / (pontos.length - 1);
    const y = h - 12 - (p / max) * (h - 24);
    return [x, y] as const;
  });
  const path = coords.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <div className="graph-box">
      <div className="graph-cap">{caption}</div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <line
          x1="10"
          y1={h - 10}
          x2={w - 5}
          y2={h - 10}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
        <polyline
          className="draw-line"
          points={path}
          fill="none"
          stroke={cor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={cor} />
        ))}
      </svg>
    </div>
  );
}

interface Fatia {
  label: string;
  pct: number;
}

function arco(cx: number, cy: number, r: number, ini: number, fim: number): string {
  const ponto = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = ponto(ini);
  const [x2, y2] = ponto(fim);
  const grande = fim - ini > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${grande} 1 ${x2},${y2} Z`;
}

export function PieChart({ cor, fatias }: { cor: string; fatias: Fatia[] }) {
  let ang = -Math.PI / 2;
  return (
    <svg width="130" height="130" viewBox="0 0 110 110">
      {fatias.map((f, i) => {
        const ini = ang;
        ang += (f.pct / 100) * 2 * Math.PI;
        return (
          <path
            key={f.label}
            d={arco(55, 55, 46, ini, ang)}
            fill={cor}
            fillOpacity={0.75 - i * 0.16}
          />
        );
      })}
      <circle cx="55" cy="55" r="46" fill="none" stroke={cor} strokeWidth="1.5" />
    </svg>
  );
}
