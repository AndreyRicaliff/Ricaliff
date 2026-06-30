export const ACC = {
  amarelo: '#f7c948',
  rosa: '#ff6f91',
  teal: '#4ecdc4',
  roxo: '#a78bfa',
  laranja: '#fb923c',
} as const;

export type Accent = (typeof ACC)[keyof typeof ACC];

/** estilo que injeta a cor de acento no escopo via CSS var */
export function accVar(cor: string): React.CSSProperties {
  return { ['--acc' as string]: cor };
}
