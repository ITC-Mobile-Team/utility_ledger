import { getDaysInMonth, toMonthKey } from './format';
import type {
  LedgerService,
  LedgerState,
  MeterReading,
  MonthKey,
} from './types';

export type ZoneBill = {
  previous: number;
  current?: number;
  consumption?: number;
};

export type ServiceBill = {
  service: LedgerService;
  // null — суму ще неможливо порахувати (немає показника)
  amount: number | null;
  previous?: number;
  current?: number;
  consumption?: number;
  // Нічна зона, лише для двозонного лічильника; поля вище тоді — денна зона
  night?: ZoneBill;
  days?: number;
};

export type MonthBill = {
  items: ServiceBill[];
  total: number;
  calculatedCount: number;
};

export type MonthStatus = 'new' | 'filled';

const compareMonths = (a: MonthKey, b: MonthKey) => a.localeCompare(b);

const shiftMonth = (month: MonthKey, delta: number): MonthKey => {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  return toMonthKey(new Date(year, monthNumber - 1 + delta, 1));
};

export const getCurrentMonth = () => toMonthKey(new Date());

export const getObjectServices = (state: LedgerState, objectId: string) =>
  state.services.filter((service) => service.objectId === objectId);

// Послуги, що вже існували в цьому місяці
export const getMonthServices = (
  state: LedgerState,
  objectId: string,
  month: MonthKey,
) =>
  getObjectServices(state, objectId).filter(
    (service) =>
      compareMonths(toMonthKey(new Date(service.createdAt)), month) <= 0,
  );

// Місяці від першої послуги до поточного, найновіший першим
export const getObjectMonths = (
  state: LedgerState,
  objectId: string,
  currentMonth: MonthKey = getCurrentMonth(),
): MonthKey[] => {
  const services = getObjectServices(state, objectId);
  if (services.length === 0) return [];
  const firstCreatedAt = Math.min(...services.map((s) => s.createdAt));
  const first = toMonthKey(new Date(firstCreatedAt));
  const months: MonthKey[] = [];
  for (
    let month = currentMonth;
    compareMonths(month, first) >= 0;
    month = shiftMonth(month, -1)
  ) {
    months.push(month);
  }
  return months;
};

export const isDayNight = (service: Pick<LedgerService, 'mode' | 'zones'>) =>
  service.mode === 'meter' && service.zones === 'dayNight';

export const getReading = (
  state: LedgerState,
  serviceId: string,
  month: MonthKey,
): MeterReading | undefined =>
  state.readings.find((r) => r.serviceId === serviceId && r.month === month);

// Двозонному лічильнику потрібні обидві зони; показник, внесений до
// перемикання на «День / Ніч», вважається невнесеним
const isReadingComplete = (
  service: LedgerService,
  reading: MeterReading | undefined,
): reading is MeterReading =>
  reading !== undefined &&
  (!isDayNight(service) || reading.night !== undefined);

export const hasReading = (
  state: LedgerState,
  service: LedgerService,
  month: MonthKey,
) => isReadingComplete(service, getReading(state, service.id, month));

// Останній показник до цього місяця або початковий показник послуги
export const getPreviousReading = (
  state: LedgerState,
  service: LedgerService,
  month: MonthKey,
) => {
  const previous = state.readings
    .filter(
      (r) => r.serviceId === service.id && compareMonths(r.month, month) < 0,
    )
    .sort((a, b) => compareMonths(b.month, a.month))[0];
  return previous?.value ?? service.initialReading ?? 0;
};

// Останній нічний показник до цього місяця або початковий нічний показник
export const getPreviousNightReading = (
  state: LedgerState,
  service: LedgerService,
  month: MonthKey,
) => {
  const previous = state.readings
    .filter(
      (r) =>
        r.serviceId === service.id &&
        r.night !== undefined &&
        compareMonths(r.month, month) < 0,
    )
    .sort((a, b) => compareMonths(b.month, a.month))[0];
  return previous?.night ?? service.initialNightReading ?? 0;
};

export const getDayCount = (
  state: LedgerState,
  serviceId: string,
  month: MonthKey,
) =>
  state.dayCounts.find((d) => d.serviceId === serviceId && d.month === month)
    ?.days ?? getDaysInMonth(month);

export const calculateService = (
  state: LedgerState,
  service: LedgerService,
  month: MonthKey,
): ServiceBill => {
  switch (service.mode) {
    case 'meter': {
      const previous = getPreviousReading(state, service, month);
      const reading = getReading(state, service.id, month);
      const nightPrevious = isDayNight(service)
        ? getPreviousNightReading(state, service, month)
        : undefined;
      if (!isReadingComplete(service, reading)) {
        return {
          service,
          amount: null,
          previous,
          ...(nightPrevious !== undefined && {
            night: { previous: nightPrevious },
          }),
        };
      }
      const consumption = reading.value - previous;
      const dayAmount = consumption * service.tariff;
      if (nightPrevious === undefined || reading.night === undefined) {
        return {
          service,
          amount: dayAmount,
          previous,
          current: reading.value,
          consumption,
        };
      }
      const nightConsumption = reading.night - nightPrevious;
      return {
        service,
        amount: dayAmount + nightConsumption * (service.nightTariff ?? 0),
        previous,
        current: reading.value,
        consumption,
        night: {
          previous: nightPrevious,
          current: reading.night,
          consumption: nightConsumption,
        },
      };
    }
    case 'fixed':
      return { service, amount: service.tariff };
    case 'day': {
      const days = getDayCount(state, service.id, month);
      return { service, amount: days * service.tariff, days };
    }
  }
};

export const calculateMonth = (
  state: LedgerState,
  objectId: string,
  month: MonthKey,
): MonthBill => {
  const items = getMonthServices(state, objectId, month).map((service) =>
    calculateService(state, service, month),
  );
  const calculated = items.filter((item) => item.amount !== null);
  return {
    items,
    total: calculated.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    calculatedCount: calculated.length,
  };
};

// «Новий», поки хоча б один лічильник місяця без показника
export const getMonthStatus = (
  state: LedgerState,
  objectId: string,
  month: MonthKey,
): MonthStatus => {
  const missing = getMonthServices(state, objectId, month).some(
    (service) => service.mode === 'meter' && !hasReading(state, service, month),
  );
  return missing ? 'new' : 'filled';
};
