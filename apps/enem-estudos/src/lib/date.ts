export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
