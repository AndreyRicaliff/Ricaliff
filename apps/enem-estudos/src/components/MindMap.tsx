import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { deriveOptions, Markmap } from 'markmap-view';

interface Props {
  markdown: string;
}

const transformer = new Transformer();

const PALETTE = ['#9b6eff', '#08c16a', '#ffbc7d', '#5eb0ff', '#ff8fab', '#4dd6c1', '#c084fc'];

const OPTIONS = {
  ...deriveOptions({ color: PALETTE, colorFreezeLevel: 2 }),
  initialExpandLevel: 3,
  maxWidth: 240,
  paddingX: 8,
  spacingHorizontal: 100,
  spacingVertical: 14,
  duration: 400,
  fitRatio: 0.9,
};

const SURFACE = '#0f1829';

/** dá a cada nó a aparência de card colorido com a cor do seu ramo */
function pintarCards(svg: SVGSVGElement): void {
  svg.querySelectorAll<SVGGElement>('g.markmap-node').forEach((no) => {
    const cor = no.querySelector('line')?.getAttribute('stroke') ?? '#9b6eff';
    const card = no.querySelector<HTMLElement>('.markmap-foreign');
    if (!card) return;
    card.style.backgroundColor = `color-mix(in srgb, ${cor} 20%, ${SURFACE})`;
    card.style.boxShadow = `inset 0 0 0 1.5px color-mix(in srgb, ${cor} 60%, transparent), 0 2px 10px rgba(0,0,0,0.35)`;
  });
}

export default function MindMap({ markdown }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.style.setProperty('--markmap-text-color', '#e8eeff');

    const { root } = transformer.transform(markdown);
    const mm = Markmap.create(svg, OPTIONS, root);
    mmRef.current = mm;
    void mm.fit();

    let raf = 0;
    const repintar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => pintarCards(svg));
    };
    repintar();
    const obs = new MutationObserver(repintar);
    obs.observe(svg, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      mm.destroy();
      mmRef.current = null;
    };
  }, [markdown]);

  const rescale = (f: number) => () => void mmRef.current?.rescale(f);
  const fit = () => void mmRef.current?.fit();

  return (
    <div className="relative">
      <div className="card h-[72vh] w-full overflow-hidden bg-surface">
        <svg ref={svgRef} className="h-full w-full [font-family:Inter,sans-serif]" />
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5">
        <ToolBtn onClick={rescale(1.25)} label="Aumentar">
          ＋
        </ToolBtn>
        <ToolBtn onClick={rescale(0.8)} label="Diminuir">
          －
        </ToolBtn>
        <ToolBtn onClick={fit} label="Ajustar à tela">
          ⤢
        </ToolBtn>
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        Arraste para mover · role para dar zoom · clique nos nós para expandir
      </p>
    </div>
  );
}

function ToolBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2/90 text-ink backdrop-blur transition hover:bg-surface-3"
    >
      {children}
    </button>
  );
}
