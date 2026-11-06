# Contract: ProfileRepository

Шар між екранами й сховищем профілю. Зараз — локальна реалізація на `KeyValueStorage`; пізніше — Firestore (`users/{uid}`) з тим самим інтерфейсом. Екрани й провайдер від реалізації не залежать.

```ts
// src/services/profile/types.ts
export type UserProfile = {
  userId: string;
  name: string | null;
  nameSource: 'provider' | 'user';
  email: string | null;
  method: SignInMethod | null;
};

export interface ProfileRepository {
  /** Прочитати збережений профіль; викликається один раз на старті. */
  load(): Promise<void>;
  /** Поточний знімок (незмінний обʼєкт, новий після кожної зміни) або null. */
  getSnapshot(): UserProfile | null;
  subscribe(listener: () => void): () => void;
  /** Створити або оновити профіль з даних входу; імʼя від користувача не перезаписує. */
  syncFromAuth(user: AuthUser): Promise<void>;
  /** Зберегти імʼя (trim, 1–40 символів). Кидає помилку, якщо значення невалідне або запис не вдався; знімок тоді не змінюється. */
  setName(name: string): Promise<void>;
  /** Стерти профіль (вихід / видалення акаунта). */
  clear(): Promise<void>;
}
```

## Гарантії

- Після `setName` слухачі отримують новий знімок до завершення промісу запису; якщо запис упав — знімок повертається до попереднього, і промис відхиляється.
- `syncFromAuth` ідемпотентний: повторний виклик з тими самими даними не змінює знімок і не будить слухачів.
- `clear()` після завершення: `getSnapshot() === null`, ключ `userProfile` відсутній.

## Повʼязані зміни інтерфейсів

- `LedgerRepository.clear(): Promise<void>` — порожній стан у памʼяті й видалення `ledgerState`.
- `OutageSettingsRepository.clear(): Promise<void>` — порожні налаштування й видалення `outageSettings` та `outageSchedule:<id>` для постачальників з реєстру.
- `cancelOutageNotifications(): Promise<void>` у `src/services/outages/notifications.ts`.
- `useOnboarding().resetOnboarding(): Promise<void>`.
- `wipeLocalData(): Promise<void>` у `src/services/account` — порядок кроків у [research.md](../research.md#r4-вихід-і-видалення-акаунта-стирання-локальних-даних).
- `useOutageNotificationToggle(): { enabled: boolean; setEnabled(next: boolean): Promise<void> }`.
