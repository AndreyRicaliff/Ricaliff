export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS progresso_flashcard (
  card_id         TEXT PRIMARY KEY,
  repeticoes      INTEGER NOT NULL DEFAULT 0,
  facilidade      REAL NOT NULL DEFAULT 2.5,
  intervalo_dias  INTEGER NOT NULL DEFAULT 0,
  proxima_revisao TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_progresso_revisao ON progresso_flashcard(proxima_revisao);
`;
