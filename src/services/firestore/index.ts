import {
  collection,
  doc,
  getFirestore,
  type CollectionReference,
  type DocumentReference,
} from '@react-native-firebase/firestore';
import type { MonthKey } from '@/services/ledger/types';

// Постійний кеш і черга записів нативного SDK — це локальна копія даних
// акаунта: дані видно й змінюються без інтернету, зміни відправляються, коли
// зʼявиться звʼязок. Черга ведеться окремо для кожного користувача, тож після
// виходу вона чекає на наступний вхід того самого акаунта. Тому тут ніколи не
// викликаються disableNetwork, clearPersistence, terminate і не вимикається
// persistence
export const db = getFirestore();

export type UserCollection =
  'objects' | 'services' | 'months' | 'readings' | 'dayCounts' | 'amounts';

export const USER_COLLECTIONS: UserCollection[] = [
  'objects',
  'services',
  'months',
  'readings',
  'dayCounts',
  'amounts',
];

// Профіль акаунта
export const userDoc = (uid: string): DocumentReference =>
  doc(db, 'users', uid);

export const userCollection = (
  uid: string,
  name: UserCollection,
): CollectionReference => collection(db, 'users', uid, name);

// Місто й черги «Світла» акаунта
export const outageSettingsDoc = (uid: string): DocumentReference =>
  doc(db, 'users', uid, 'settings', 'outages');

// Природний ключ запису «сутність + місяць»: повторний запис за той самий
// місяць замінює попередній
export const entryId = (key: string, month: MonthKey) => `${key}_${month}`;

export function firestoreErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

// Без звʼязку з сервером серверне читання відхиляється цим кодом
export const isUnavailable = (error: unknown) =>
  firestoreErrorCode(error) === 'firestore/unavailable';
