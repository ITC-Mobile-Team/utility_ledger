import {
  getDocFromServer,
  getDocsFromServer,
  waitForPendingWrites,
} from '@react-native-firebase/firestore';
import { storage } from '@/storage';
import {
  db,
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

async function withTimeout<T>(promise: Promise<T>, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), DELETE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Видаляє всі дані акаунта в хмарі й у локальній копії. Відхиляється без
// звʼязку (тоді нічого не видалено) або якщо сервер не підтвердив видалення
// вчасно (повторний виклик довидаляє решту)
export async function deleteAccountData(uid: string) {
  // Без звʼязку відхиляється одразу
  await getDocFromServer(userDoc(uid));
  // Записи, зроблені офлайн, спершу мають дійти до сервера: інакше їхніх
  // документів не буде в серверному списку нижче, і після видалення акаунта
  // вони лишилися б у хмарі
  await withTimeout(
    waitForPendingWrites(db),
    'Незбережені зміни не відправлено',
  );
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
  await withTimeout(commitInChunks(ops), 'Видалення даних не підтверджено');
  await unmarkSynced(uid).catch(() => {});
}
