import type { KeyValueStorage } from '@/storage';
import { toMonthKey } from './format';
import type {
  LedgerRepository,
  LedgerState,
  MeterReading,
  DayCount,
  MonthAmount,
  MonthKey,
  ObjectMonth,
} from './types';

const KEY = 'ledgerState';

const emptyState: LedgerState = {
  objects: [],
  services: [],
  months: [],
  readings: [],
  dayCounts: [],
  amounts: [],
};

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isSameEntry = (
  a: Pick<MeterReading | DayCount | MonthAmount, 'serviceId' | 'month'>,
  b: Pick<MeterReading | DayCount | MonthAmount, 'serviceId' | 'month'>,
) => a.serviceId === b.serviceId && a.month === b.month;

// Раніше місяці не зберігались, а показувались від першої послуги до поточного.
// Для старих даних відтворюємо цей список, щоб місяці не зникли
const legacyMonths = (state: LedgerState): ObjectMonth[] => {
  const now = new Date();
  return state.objects.flatMap((object) => {
    const createdAt = state.services
      .filter((service) => service.objectId === object.id)
      .map((service) => service.createdAt);
    if (createdAt.length === 0) return [];
    const months: ObjectMonth[] = [];
    for (
      let date = new Date(Math.min(...createdAt));
      date <= now;
      date = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    ) {
      months.push({ objectId: object.id, month: toMonthKey(date) });
    }
    return months;
  });
};

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
          if (!value) return;
          const stored: Partial<LedgerState> = JSON.parse(value);
          state = { ...emptyState, ...stored };
          if (!stored.months) state = { ...state, months: legacyMonths(state) };
        })
        .catch(() => {})
        .then(() => listeners.forEach((listener) => listener()));
      return loading;
    },
    getSnapshot: () => state,
    async clear() {
      state = emptyState;
      listeners.forEach((listener) => listener());
      await storage.removeItem(KEY);
    },
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
        months: state.months.filter((m) => m.objectId !== id),
        readings: state.readings.filter((r) => !serviceIds.has(r.serviceId)),
        dayCounts: state.dayCounts.filter((d) => !serviceIds.has(d.serviceId)),
        amounts: state.amounts.filter((a) => !serviceIds.has(a.serviceId)),
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
        amounts: state.amounts.filter((a) => a.serviceId !== id),
      });
    },
    async addMonths(objectId, months) {
      const existing = new Set(
        state.months.filter((m) => m.objectId === objectId).map((m) => m.month),
      );
      const added = [...new Set(months)]
        .filter((month) => !existing.has(month))
        .map((month) => ({ objectId, month }));
      if (added.length === 0) return;
      await update({ ...state, months: [...state.months, ...added] });
    },
    async deleteMonth(objectId, month) {
      const serviceIds = new Set(
        state.services.filter((s) => s.objectId === objectId).map((s) => s.id),
      );
      const belongs = (entry: { serviceId: string; month: MonthKey }) =>
        entry.month === month && serviceIds.has(entry.serviceId);
      await update({
        ...state,
        months: state.months.filter(
          (m) => !(m.objectId === objectId && m.month === month),
        ),
        readings: state.readings.filter((r) => !belongs(r)),
        dayCounts: state.dayCounts.filter((d) => !belongs(d)),
        amounts: state.amounts.filter((a) => !belongs(a)),
      });
    },
    async moveMonth(objectId, from, to) {
      const isAdded = (month: MonthKey) =>
        state.months.some((m) => m.objectId === objectId && m.month === month);
      // Цільовий місяць уже має свої дані — не перезаписуємо їх
      if (from === to || !isAdded(from) || isAdded(to)) return;
      const serviceIds = new Set(
        state.services.filter((s) => s.objectId === objectId).map((s) => s.id),
      );
      const move = <T extends { serviceId: string; month: MonthKey }>(
        entry: T,
      ): T =>
        entry.month === from && serviceIds.has(entry.serviceId)
          ? { ...entry, month: to }
          : entry;
      await update({
        ...state,
        months: state.months.map((m) =>
          m.objectId === objectId && m.month === from ? { ...m, month: to } : m,
        ),
        readings: state.readings.map(move),
        dayCounts: state.dayCounts.map(move),
        amounts: state.amounts.map(move),
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
    async setAmount(amount) {
      await update({
        ...state,
        amounts: [
          ...state.amounts.filter((a) => !isSameEntry(a, amount)),
          amount,
        ],
      });
    },
    async resetEntry(serviceId, month) {
      const entry = { serviceId, month };
      await update({
        ...state,
        readings: state.readings.filter((r) => !isSameEntry(r, entry)),
        dayCounts: state.dayCounts.filter((d) => !isSameEntry(d, entry)),
        amounts: state.amounts.filter((a) => !isSameEntry(a, entry)),
      });
    },
  };
}
