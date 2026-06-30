const DB_NAME = 'enem-estudos';
const STORE = 'sqlite';
const KEY = 'db';

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Falha ao abrir IndexedDB'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openStore();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('Falha na transação IndexedDB'));
    });
  } finally {
    db.close();
  }
}

export function loadBlob(): Promise<Uint8Array | undefined> {
  return withStore<Uint8Array | undefined>('readonly', (s) => s.get(KEY));
}

export async function saveBlob(bytes: Uint8Array): Promise<void> {
  await withStore('readwrite', (s) => s.put(bytes, KEY));
}
