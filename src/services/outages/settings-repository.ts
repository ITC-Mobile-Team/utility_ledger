import type { KeyValueStorage } from '@/storage';
import { outageProviders } from './registry';
import type { OutageSchedule, OutageSettings } from './types';

const SETTINGS_KEY = 'outageSettings';
const scheduleKey = (providerId: string) => `outageSchedule:${providerId}`;

const emptySettings: OutageSettings = { queues: [] };

export type OutageSettingsRepository = {
  load(): Promise<void>;
  getSnapshot(): OutageSettings;
  subscribe(listener: () => void): () => void;
  save(settings: OutageSettings): Promise<void>;
  // Останній отриманий графік — щоб показати його без мережі
  loadCachedSchedule(providerId: string): Promise<OutageSchedule | undefined>;
  cacheSchedule(schedule: OutageSchedule): Promise<void>;
  // Стерти налаштування й кеш графіків усіх постачальників
  clear(): Promise<void>;
};

export function createOutageSettingsRepository(
  storage: KeyValueStorage,
): OutageSettingsRepository {
  let settings = emptySettings;
  const listeners = new Set<() => void>();

  return {
    async load() {
      const raw = await storage.getItem(SETTINGS_KEY);
      if (!raw) return;
      try {
        settings = { ...emptySettings, ...JSON.parse(raw) };
      } catch {
        settings = emptySettings;
      }
    },
    getSnapshot: () => settings,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async save(next) {
      settings = next;
      listeners.forEach((listener) => listener());
      await storage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    async clear() {
      settings = emptySettings;
      listeners.forEach((listener) => listener());
      await Promise.all([
        storage.removeItem(SETTINGS_KEY),
        ...outageProviders.map((provider) =>
          storage.removeItem(scheduleKey(provider.id)),
        ),
      ]);
    },
    async loadCachedSchedule(providerId) {
      const raw = await storage.getItem(scheduleKey(providerId));
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as OutageSchedule;
      } catch {
        return undefined;
      }
    },
    async cacheSchedule(schedule) {
      await storage.setItem(
        scheduleKey(schedule.providerId),
        JSON.stringify(schedule),
      );
    },
  };
}
