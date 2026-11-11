import { onSnapshot } from '@react-native-firebase/firestore';
import { outageSettingsDoc } from '@/services/firestore';
import {
  applyWrites,
  logWriteError,
  withoutUndefined,
} from '@/services/firestore/batch';
import type { KeyValueStorage } from '@/storage';
import {
  createScheduleCache,
  emptyOutageSettings,
  OUTAGE_SETTINGS_KEY,
  readStoredOutageSettings,
  type OutageSettingsRepository,
} from './settings-repository';
import type { OutageSettings, QueueSettings } from './types';

type AccountOutageSettings = { city?: string; queues: QueueSettings[] };

// Місто й черги — в акаунті (Firestore), сповіщення — на пристрої, бо
// залежать від дозволу саме цього пристрою
export function createFirestoreOutageSettingsRepository(
  storage: KeyValueStorage,
): OutageSettingsRepository {
  let uid: string | null = null;
  let account: AccountOutageSettings = emptyOutageSettings;
  let notifications: OutageSettings['notifications'];
  let settings: OutageSettings = emptyOutageSettings;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const rebuild = () => {
    settings = notifications ? { ...account, notifications } : { ...account };
    listeners.forEach((listener) => listener());
  };

  return {
    async setUser(next) {
      unsubscribe?.();
      unsubscribe = null;
      uid = next;
      account = emptyOutageSettings;
      notifications = (await readStoredOutageSettings(storage)).notifications;
      rebuild();
      if (!next || uid !== next) return;

      await new Promise<void>((resolve) => {
        unsubscribe = onSnapshot(
          outageSettingsDoc(next),
          (snapshot) => {
            if (uid !== next) return;
            const data = snapshot.data() as
              Partial<AccountOutageSettings> | undefined;
            account = data
              ? { city: data.city, queues: data.queues ?? [] }
              : emptyOutageSettings;
            rebuild();
            resolve();
          },
          (error) => {
            logWriteError(error);
            resolve();
          },
        );
      });
    },
    getSnapshot: () => settings,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async save(next) {
      if (!uid) throw new Error('Користувач не ввійшов');
      const changedAccount =
        next.city !== account.city || next.queues !== account.queues;
      account = { city: next.city, queues: next.queues };
      notifications = next.notifications;
      rebuild();
      if (changedAccount) {
        applyWrites([
          {
            kind: 'set',
            ref: outageSettingsDoc(uid),
            data: withoutUndefined(account),
          },
        ]);
      }
      await storage.setItem(
        OUTAGE_SETTINGS_KEY,
        JSON.stringify(notifications ? { notifications } : {}),
      );
    },
    ...createScheduleCache(storage),
  };
}
