import type { KeyValueStorage } from '@/storage';
import type { OutageSchedule, OutageSettings } from './types';

// На пристрої: у локальній реалізації — усі налаштування, у хмарній — лише
// сповіщення (залежать від дозволу конкретного пристрою)
export const OUTAGE_SETTINGS_KEY = 'outageSettings';
const scheduleKey = (providerId: string) => `outageSchedule:${providerId}`;

export const emptyOutageSettings: OutageSettings = { queues: [] };

export type OutageSettingsRepository = {
  // Привʼязка до акаунта: null — вийшли (без міста й черг), uid — налаштування
  // цього акаунта; проміс завершується після першого знімка з локальної копії
  setUser(uid: string | null): Promise<void>;
  getSnapshot(): OutageSettings;
  subscribe(listener: () => void): () => void;
  save(settings: OutageSettings): Promise<void>;
  // Останній отриманий графік — щоб показати його без мережі
  loadCachedSchedule(providerId: string): Promise<OutageSchedule | undefined>;
  cacheSchedule(schedule: OutageSchedule): Promise<void>;
};

export async function readStoredOutageSettings(
  storage: KeyValueStorage,
): Promise<OutageSettings> {
  const raw = await storage.getItem(OUTAGE_SETTINGS_KEY);
  if (!raw) return emptyOutageSettings;
  try {
    return { ...emptyOutageSettings, ...JSON.parse(raw) };
  } catch {
    return emptyOutageSettings;
  }
}

// Кеш графіків постачальників — завжди на пристрої
export function createScheduleCache(storage: KeyValueStorage) {
  return {
    async loadCachedSchedule(providerId: string) {
      const raw = await storage.getItem(scheduleKey(providerId));
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as OutageSchedule;
      } catch {
        return undefined;
      }
    },
    async cacheSchedule(schedule: OutageSchedule) {
      await storage.setItem(
        scheduleKey(schedule.providerId),
        JSON.stringify(schedule),
      );
    },
  };
}

// Усе на пристрої (web)
export function createLocalOutageSettingsRepository(
  storage: KeyValueStorage,
): OutageSettingsRepository {
  let settings = emptyOutageSettings;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    async setUser(uid) {
      settings = uid
        ? await readStoredOutageSettings(storage)
        : emptyOutageSettings;
      emit();
    },
    getSnapshot: () => settings,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async save(next) {
      settings = next;
      emit();
      await storage.setItem(OUTAGE_SETTINGS_KEY, JSON.stringify(next));
    },
    ...createScheduleCache(storage),
  };
}
