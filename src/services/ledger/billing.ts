import { toMonthKey } from './format';
import { getMeterFormat, subtractReadings } from './meter-format';
import type {
  LedgerObject,
  LedgerService,
  LedgerState,
  ObjectArchivePatch,
  MeterReading,
  MonthKey,
} from './types';

export type ZoneBill = {
  previous: number;
  current?: number;
  consumption?: number;
};

export type WaterBill = {
  supply: number;
  sewage: number;
  fees: number;
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
  // Лише для лічильника води
  water?: WaterBill;
  days?: number;
};

export type MonthBill = {
  items: ServiceBill[];
  total: number;
  calculatedCount: number;
};

export type MonthStatus = 'new' | 'filled';

const compareMonths = (a: MonthKey, b: MonthKey) => a.localeCompare(b);

export const getCurrentMonth = () => toMonthKey(new Date());

export const getObjectServices = (state: LedgerState, objectId: string) =>
  state.services.filter((service) => service.objectId === objectId);

// Архівований обʼєкт доступний лише для перегляду
export const isObjectReadOnly = (object: Pick<LedgerObject, 'archived'>) =>
  object.archived === true;

// Обʼєкти списку «Обʼєкти» — без архівованих
export const getActiveObjects = (state: LedgerState) =>
  state.objects.filter((object) => !isObjectReadOnly(object));

// Обʼєкти екрана «Архів», останні заархівовані першими
export const getArchivedObjects = (state: LedgerState) =>
  state.objects
    .filter(isObjectReadOnly)
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));

// Єдине джерело обʼєктів для «Аналітики»: активні та архівовані з
// увімкненим «Враховувати в аналітиці»
export const getAnalyticsObjects = (state: LedgerState) =>
  state.objects.filter(
    (object) =>
      !isObjectReadOnly(object) || object.includeInAnalytics !== false,
  );

// Нові значення архівних полів обʼєкта для setObjectArchive
export const applyArchivePatch = (
  object: LedgerObject,
  patch: ObjectArchivePatch,
): LedgerObject => {
  if (!patch.archived) {
    return { ...object, archived: false, includeInAnalytics: true };
  }
  // Уже в архіві — змінюється лише перемикач аналітики
  if (isObjectReadOnly(object)) {
    return {
      ...object,
      includeInAnalytics:
        patch.includeInAnalytics ?? object.includeInAnalytics ?? true,
    };
  }
  return {
    ...object,
    archived: true,
    archivedAt: Date.now(),
    includeInAnalytics: patch.includeInAnalytics ?? true,
  };
};

// Додані місяці обʼєкта, найновіший першим
export const getObjectMonths = (
  state: LedgerState,
  objectId: string,
): MonthKey[] =>
  state.months
    .filter((m) => m.objectId === objectId)
    .map((m) => m.month)
    .sort((a, b) => compareMonths(b, a));

export const isDayNight = (service: Pick<LedgerService, 'mode' | 'zones'>) =>
  service.mode === 'meter' && service.zones === 'dayNight';

export const isWater = (service: Pick<LedgerService, 'mode' | 'zones'>) =>
  service.mode === 'meter' && service.zones === 'water';

// Сума = спожито × водопостачання + спожито × стоки + абонплати
export const calculateWater = (
  service: Pick<
    LedgerService,
    'tariff' | 'sewageTariff' | 'waterFee' | 'sewageFee'
  >,
  consumption: number,
): WaterBill => ({
  // Споживання дробове (3 знаки), тож суми округлюємо до цілих копійок
  supply: Math.round(consumption * service.tariff),
  sewage: Math.round(consumption * (service.sewageTariff ?? 0)),
  fees: (service.waterFee ?? 0) + (service.sewageFee ?? 0),
});

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

// Кількість днів вносить користувач щомісяця; без запису — не внесено
export const getDayCount = (
  state: LedgerState,
  serviceId: string,
  month: MonthKey,
) =>
  state.dayCounts.find((d) => d.serviceId === serviceId && d.month === month)
    ?.days;

export const getAmount = (
  state: LedgerState,
  serviceId: string,
  month: MonthKey,
) =>
  state.amounts.find((a) => a.serviceId === serviceId && a.month === month)
    ?.amount;

// Остання внесена сума з рахунку до цього місяця (не обовʼязково за попередній)
export const getLastAmountBefore = (
  state: LedgerState,
  serviceId: string,
  month: MonthKey,
) =>
  state.amounts
    .filter((a) => a.serviceId === serviceId && a.month < month)
    .reduce<(typeof state.amounts)[number] | undefined>(
      (last, a) => (!last || a.month > last.month ? a : last),
      undefined,
    );

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
      const format = getMeterFormat(service);
      const consumption = subtractReadings(reading.value, previous, format);
      if (isWater(service)) {
        const water = calculateWater(service, consumption);
        return {
          service,
          amount: water.supply + water.sewage + water.fees,
          previous,
          current: reading.value,
          consumption,
          water,
        };
      }
      const dayAmount = Math.round(consumption * service.tariff);
      if (nightPrevious === undefined || reading.night === undefined) {
        return {
          service,
          amount: dayAmount,
          previous,
          current: reading.value,
          consumption,
        };
      }
      const nightConsumption = subtractReadings(
        reading.night,
        nightPrevious,
        format,
      );
      return {
        service,
        amount:
          dayAmount + Math.round(nightConsumption * (service.nightTariff ?? 0)),
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
      return days === undefined
        ? { service, amount: null }
        : { service, amount: days * service.tariff, days };
    }
    case 'invoice':
      return { service, amount: getAmount(state, service.id, month) ?? null };
  }
};

export const calculateMonth = (
  state: LedgerState,
  objectId: string,
  month: MonthKey,
): MonthBill => {
  const items = getObjectServices(state, objectId).map((service) =>
    calculateService(state, service, month),
  );
  const calculated = items.filter((item) => item.amount !== null);
  return {
    items,
    total: calculated.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    calculatedCount: calculated.length,
  };
};

// Послуга, для якої щомісяця треба щось внести вручну
const isMissing = (
  state: LedgerState,
  service: LedgerService,
  month: MonthKey,
) => {
  if (service.mode === 'meter') return !hasReading(state, service, month);
  if (service.mode === 'invoice')
    return getAmount(state, service.id, month) === undefined;
  if (service.mode === 'day')
    return getDayCount(state, service.id, month) === undefined;
  return false;
};

// «Новий», поки хоча б один лічильник без показника, сума з рахунку чи кількість днів не внесені
export const getMonthStatus = (
  state: LedgerState,
  objectId: string,
  month: MonthKey,
): MonthStatus => {
  const missing = getObjectServices(state, objectId).some((service) =>
    isMissing(state, service, month),
  );
  return missing ? 'new' : 'filled';
};
