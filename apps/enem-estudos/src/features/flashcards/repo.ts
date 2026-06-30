import { getDb, persist } from '../../db/client.ts';
import { progressoInicial, type ProgressoCard } from './progresso.ts';

function mapRow(row: Record<string, unknown>): ProgressoCard {
  return {
    repeticoes: Number(row.repeticoes),
    facilidade: Number(row.facilidade),
    intervaloDias: Number(row.intervalo_dias),
    proximaRevisao: String(row.proxima_revisao),
  };
}

export async function getProgresso(id: string, hoje: string): Promise<ProgressoCard> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM progresso_flashcard WHERE card_id = ?');
  stmt.bind([id]);
  const prog = stmt.step() ? mapRow(stmt.getAsObject()) : progressoInicial(hoje);
  stmt.free();
  return prog;
}

export async function salvarProgresso(id: string, prog: ProgressoCard): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO progresso_flashcard (card_id, repeticoes, facilidade, intervalo_dias, proxima_revisao)
     VALUES (?,?,?,?,?)
     ON CONFLICT(card_id) DO UPDATE SET
       repeticoes=excluded.repeticoes,
       facilidade=excluded.facilidade,
       intervalo_dias=excluded.intervalo_dias,
       proxima_revisao=excluded.proxima_revisao`,
    [id, prog.repeticoes, prog.facilidade, prog.intervaloDias, prog.proximaRevisao]
  );
  await persist(db);
}
