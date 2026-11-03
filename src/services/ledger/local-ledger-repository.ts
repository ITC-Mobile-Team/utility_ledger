import type { KeyValueStorage } from '@/storage';
import type {
  LedgerRepository,
  LedgerState,
  MeterReading,
  DayCount,
} from './types';

const KEY = 'ledgerState';

const emptyState: LedgerState = {
  objects: [],
  services: [],
  readings: [],
  dayCounts: [],
};

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isSameEntry = (
  a: Pick<MeterReading | DayCount, 'serviceId' | 'month'>,
  b: Pick<MeterReading | DayCount, 'serviceId' | 'month'>,
) => a.serviceId === b.serviceId && a.month === b.month;

export function createLocalLedgerRepository(
  storage: KeyValueStorage,
): LedgerRepository {
  // Стан незмінний: кожна мутація створює новий обʼєкт, щоб useSyncExternalStore бачив зміни
  let state = emptyState;
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const update = async (next: LedgerState) => {
    state = next;
    listeners.forEach((listener) => listener());
    await storage.setItem(KEY, JSON.stringify(next));
  };

  return {
    load() {
      loading ??= storage
        .getItem(KEY)
        .then((value) => {
          if (value) state = { ...emptyState, ...JSON.parse(value) };
        })
        .catch(() => {})
        .then(() => listeners.forEach((listener) => listener()));
      return loading;
    },
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async addObject(input) {
      const object = { ...input, id: createId(), createdAt: Date.now() };
      await update({ ...state, objects: [...state.objects, object] });
      return object;
    },
    async updateObject(id, input) {
      await update({
        ...state,
        objects: state.objects.map((object) =>
          object.id === id ? { ...object, ...input } : object,
        ),
      });
    },
    async deleteObject(id) {
      const serviceIds = new Set(
        state.services.filter((s) => s.objectId === id).map((s) => s.id),
      );
      await update({
        objects: state.objects.filter((object) => object.id !== id),
        services: state.services.filter((s) => !serviceIds.has(s.id)),
        readings: state.readings.filter((r) => !serviceIds.has(r.serviceId)),
        dayCounts: state.dayCounts.filter((d) => !serviceIds.has(d.serviceId)),
      });
    },
    async addService(input) {
      const service = { ...input, id: createId(), createdAt: Date.now() };
      await update({ ...state, services: [...state.services, service] });
      return service;
    },
    async updateService(id, input) {
      await update({
        ...state,
        services: state.services.map((service) =>
          service.id === id ? { ...service, ...input } : service,
        ),
      });
    },
    async deleteService(id) {
      await update({
        ...state,
        services: state.services.filter((s) => s.id !== id),
        readings: state.readings.filter((r) => r.serviceId !== id),
        dayCounts: state.dayCounts.filter((d) => d.serviceId !== id),
      });
    },
    async setReading(reading) {
      await update({
        ...state,
        readings: [
          ...state.readings.filter((r) => !isSameEntry(r, reading)),
          reading,
        ],
      });
    },
    async setDayCount(dayCount) {
      await update({
        ...state,
        dayCounts: [
          ...state.dayCounts.filter((d) => !isSameEntry(d, dayCount)),
          dayCount,
        ],
      });
    },
  };
}
