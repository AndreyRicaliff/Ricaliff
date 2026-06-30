import type { ReactNode } from 'react';
import { accVar } from './accents.ts';

export function FichaCard({
  cor,
  title,
  children,
}: {
  cor: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="ficha-card" style={accVar(cor)}>
      <div className="ficha-card-title">{title}</div>
      {children}
    </div>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return <div className="ficha-formula">{children}</div>;
}

export function Hl({ children }: { children: ReactNode }) {
  return <div className="ficha-hl">{children}</div>;
}

export function ShapeDemo({ children }: { children: ReactNode }) {
  return <div className="shape-demo">{children}</div>;
}

export function FichaTable({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="ficha-table">{children}</table>
    </div>
  );
}
