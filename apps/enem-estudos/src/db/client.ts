import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SCHEMA_SQL } from './schema.ts';
import { loadBlob, saveBlob } from './persist.ts';

let dbPromise: Promise<Database> | null = null;

async function create(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = await loadBlob();
  const db = saved ? new SQL.Database(saved) : new SQL.Database();
  db.run(SCHEMA_SQL);
  await persist(db);
  return db;
}

export function getDb(): Promise<Database> {
  if (!dbPromise) dbPromise = create();
  return dbPromise;
}

export async function persist(db: Database): Promise<void> {
  await saveBlob(db.export());
}
