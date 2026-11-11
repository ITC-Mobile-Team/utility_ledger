import {
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from '@react-native-firebase/firestore';
import { db, firestoreErrorCode } from './index';

export type WriteOp =
  | { kind: 'set'; ref: DocumentReference; data: DocumentData }
  | { kind: 'delete'; ref: DocumentReference };

// Ліміт операцій в одному батчі Firestore
const BATCH_LIMIT = 500;

// Застосовує операції батчами по ≤ 500. Проміс завершується лише після
// підтвердження сервера — без інтернету він висить, тож чекати його треба
// лише там, де потрібне саме підтвердження (видалення акаунта)
export function commitInChunks(ops: WriteOp[]): Promise<void> {
  const commits: Promise<void>[] = [];
  for (let start = 0; start < ops.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const op of ops.slice(start, start + BATCH_LIMIT)) {
      if (op.kind === 'set') batch.set(op.ref, op.data);
      else batch.delete(op.ref);
    }
    commits.push(batch.commit());
  }
  return Promise.all(commits).then(() => {});
}

// Запис без очікування сервера: локальний кеш і слухачі бачать зміну одразу,
// а на сервер вона піде, коли буде звʼязок
export function applyWrites(ops: WriteOp[]) {
  if (ops.length === 0) return;
  commitInChunks(ops).catch(logWriteError);
}

export function logWriteError(error: unknown) {
  if (__DEV__) console.warn('[firestore]', firestoreErrorCode(error) ?? error);
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

// Firestore не приймає undefined: прибираємо такі ключі, у т.ч. вкладені
export function withoutUndefined<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => withoutUndefined(item)) as T;
  }
  if (!isPlainObject(data)) return data;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) result[key] = withoutUndefined(value);
  }
  return result as T;
}
