import type { ReactNode } from 'react';
import Reveal from './Reveal.tsx';
import { accVar } from './accents.ts';

interface Props {
  cor: string;
  num: string;
  icon: string;
  title: string;
  children: ReactNode;
}

export default function FichaSection({ cor, num, icon, title, children }: Props) {
  return (
    <Reveal className="mb-12">
      <section style={accVar(cor)}>
        <header className="mb-6 flex items-center gap-4">
          <div className="ficha-sec-icon">{icon}</div>
          <div>
            <div className="mono text-[10px] tracking-widest text-muted uppercase">{num}</div>
            <h3 className="display text-2xl" style={{ color: cor }}>
              {title}
            </h3>
          </div>
        </header>
        {children}
      </section>
    </Reveal>
  );
}
