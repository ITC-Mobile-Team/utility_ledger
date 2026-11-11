import {
  getDocFromServer,
  getDocsFromServer,
} from '@react-native-firebase/firestore';
import { storage } from '@/storage';
import {
  isUnavailable,
  outageSettingsDoc,
  USER_COLLECTIONS,
  userCollection,
  userDoc,
} from '@/services/firestore';
import { commitInChunks, type WriteOp } from '@/services/firestore/batch';

export type AccountDataStatus = 'loading' | 'offline' | 'ready';

export { isUnavailable };
export { migrateLegacyData } from './migrate-legacy';

// Пристрій хоч раз отримав дані цього акаунта з сервера: далі вони є в
// локальній копії, і скелетони не потрібні
const syncedKey = (uid: string) => `accountDataSynced:${uid}`;

export async function isSynced(uid: string) {
  try {
    return (await storage.getItem(syncedKey(uid))) === '1';
  } catch {
    return false;
  }
}

export const markSynced = (uid: string) => storage.setItem(syncedKey(uid), '1');
export const unmarkSynced = (uid: string) => storage.removeItem(syncedKey(uid));

// Серверне читання всіх даних акаунта (наповнює й локальну копію). Без
// звʼязку відхиляється з кодом firestore/unavailable
export async function fetchFromServer(uid: string) {
  const [, outage, ...collections] = await Promise.all([
    getDocFromServer(userDoc(uid)),
    getDocFromServer(outageSettingsDoc(uid)),
    ...USER_COLLECTIONS.map((name) =>
      getDocsFromServer(userCollection(uid, name)),
    ),
  ]);
  const objects = collections[USER_COLLECTIONS.indexOf('objects')];
  // Акаунт порожній — у нього можна перенести дані попередньої версії
  return { isEmpty: (objects?.empty ?? true) && !outage.exists() };
}

const DELETE_TIMEOUT_MS = 20_000;

// Видаляє всі дані акаунта в хмарі й у локальній копії. Відхиляється без
// звʼязку (тоді нічого не видалено) або якщо сервер не підтвердив видалення
// вчасно (повторний виклик довидаляє решту)
export async function deleteAccountData(uid: string) {
  await getDocFromServer(userDoc(uid));
  const snapshots = await Promise.all(
    USER_COLLECTIONS.map((name) =>
      getDocsFromServer(userCollection(uid, name)),
    ),
  );
  const ops: WriteOp[] = [
    ...snapshots.flatMap((snapshot) =>
      snapshot.docs.map((item) => ({
        kind: 'delete' as const,
        ref: item.ref,
      })),
    ),
    { kind: 'delete', ref: outageSettingsDoc(uid) },
    { kind: 'delete', ref: userDoc(uid) },
  ];
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      commitInChunks(ops),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Видалення даних не підтверджено')),
          DELETE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  await unmarkSynced(uid).catch(() => {});
}
