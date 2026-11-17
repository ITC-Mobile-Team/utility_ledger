import { pickServiceAccents } from '@/constants/service-icons';
import {
  calculateMonth,
  formatShortAddress,
  getActiveObjects,
  getAnalyticsObjects,
  getMeterFormat,
  getMonthStatus,
  getObjectServices,
  isObjectReadOnly,
  type LedgerObject,
  type LedgerState,
  type MonthKey,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import { getPeriodMonths } from './period';
import type {
  AddressOption,
  AnalyticsMonth,
  AnalyticsPeriod,
  AnalyticsSelection,
  AnalyticsServiceTotal,
  AnalyticsSummary,
} from './types';

// Цілі відсотки методом найбільших залишків: сума рівно 100 (0 для нулів)
export const toPercents = (values: readonly number[]): number[] => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((value) => (value / total) * 100);
  const floors = raw.map(Math.floor);
  let rest = 100 - floors.reduce((sum, value) => sum + value, 0);
  raw
    .map((value, index) => ({ fraction: value - (floors[index] ?? 0), index }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (rest > 0) {
        floors[index] = (floors[index] ?? 0) + 1;
        rest -= 1;
      }
    });
  return floors;
};

// Обʼєкти «Аналітики» в порядку списку «Обʼєкти»: активні, потім архівовані
// з «Враховувати в аналітиці»
export const getOrderedAnalyticsObjects = (state: LedgerState) => {
  const allowed = new Set(getAnalyticsObjects(state).map((o) => o.id));
  return [
    ...getActiveObjects(state),
    ...state.objects.filter(isObjectReadOnly),
  ].filter((object) => allowed.has(object.id));
};

export const getDefaultSelection = (
  state: LedgerState,
): AnalyticsSelection | null => {
  const first = getOrderedAnalyticsObjects(state)[0];
  return first ? { kind: 'object', objectId: first.id } : null;
};

// Вибір, доступний у поточних даних: зниклий обʼєкт → перший доступний,
// «Усі адреси» лише коли адрес більше однієї, немає адрес → null
export const normalizeSelection = (
  state: LedgerState,
  selection: AnalyticsSelection | null,
): AnalyticsSelection | null => {
  const objects = getOrderedAnalyticsObjects(state);
  if (!selection) return getDefaultSelection(state);
  if (selection.kind === 'all') {
    return objects.length > 1 ? selection : getDefaultSelection(state);
  }
  return objects.some((o) => o.id === selection.objectId)
    ? selection
    : getDefaultSelection(state);
};

const selectedObjects = (state: LedgerState, selection: AnalyticsSelection) => {
  const objects = getOrderedAnalyticsObjects(state);
  return selection.kind === 'all'
    ? objects
    : objects.filter((o) => o.id === selection.objectId);
};

const addedMonths = (state: LedgerState, objectId: string) =>
  new Set(
    state.months.filter((m) => m.objectId === objectId).map((m) => m.month),
  );

type ServiceGroup = {
  key: string;
  name: string;
  icon: string;
  amount: number;
  recordCount: number;
  objectIds: Set<string>;
  units: Set<string>;
  isMeterOnly: boolean;
  consumption: number;
  fractionDigits: number;
};

export const summarizeAnalytics = (
  state: LedgerState,
  selection: AnalyticsSelection,
  period: AnalyticsPeriod,
): AnalyticsSummary => {
  const objects = selectedObjects(state, selection);
  const periodMonths = getPeriodMonths(period);
  const isAll = selection.kind === 'all';
  const monthTotals = new Map<MonthKey, number>(
    periodMonths.map((month) => [month, 0]),
  );
  // Місяць заповнено, якщо заповнений у кожній адресі, до якої його додано
  const monthFilled = new Map<MonthKey, boolean>();
  const groups = new Map<string, ServiceGroup>();

  for (const object of objects) {
    const added = addedMonths(state, object.id);
    for (const month of periodMonths) {
      // Рахуються лише додані місяці: інакше фіксовані послуги давали б
      // нарахування за кожен місяць періоду
      if (!added.has(month)) continue;
      const bill = calculateMonth(state, object.id, month);
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + bill.total);
      const filled = getMonthStatus(state, object.id, month) === 'filled';
      monthFilled.set(month, (monthFilled.get(month) ?? true) && filled);

      for (const item of bill.items) {
        if (item.amount === null) continue;
        const { service } = item;
        const key = isAll
          ? `${service.name.trim().toLocaleLowerCase('uk')}|${service.icon}`
          : service.id;
        const group = groups.get(key) ?? {
          key,
          name: service.name,
          icon: service.icon,
          amount: 0,
          recordCount: 0,
          objectIds: new Set<string>(),
          units: new Set<string>(),
          isMeterOnly: true,
          consumption: 0,
          fractionDigits: 0,
        };
        group.amount += item.amount;
        group.recordCount += 1;
        group.objectIds.add(object.id);
        if (service.mode === 'meter') {
          group.units.add(service.unit);
          group.consumption +=
            (item.consumption ?? 0) + (item.night?.consumption ?? 0);
          group.fractionDigits = Math.max(
            group.fractionDigits,
            getMeterFormat(service).fractionDigits,
          );
        } else {
          group.isMeterOnly = false;
        }
        groups.set(key, group);
      }
    }
  }

  const totals = periodMonths.map((month) => monthTotals.get(month) ?? 0);
  const total = totals.reduce((sum, value) => sum + value, 0);
  const max = Math.max(0, ...totals);
  const shares = toPercents(totals);
  const months: AnalyticsMonth[] = periodMonths.map((month, index) => ({
    month,
    total: totals[index] ?? 0,
    share: shares[index] ?? 0,
    ratio: max > 0 ? (totals[index] ?? 0) / max : 0,
  }));

  const sorted = [...groups.values()]
    .filter((group) => group.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const percents = toPercents(sorted.map((group) => group.amount));
  const accents = pickServiceAccents(sorted.map((group) => group.icon));
  const services: AnalyticsServiceTotal[] = sorted.map((group, index) => {
    const unit = [...group.units][0];
    return {
      key: group.key,
      name: group.name,
      icon: group.icon,
      amount: group.amount,
      percent: percents[index] ?? 0,
      recordCount: group.recordCount,
      addressCount: group.objectIds.size,
      consumption:
        group.isMeterOnly && group.units.size === 1 && unit !== undefined
          ? {
              value: group.consumption,
              unit,
              fractionDigits: group.fractionDigits,
            }
          : null,
      accent: accents[index] ?? 'purple',
    };
  });

  const monthsWithCharges = totals.filter((value) => value > 0).length;
  return {
    total,
    months,
    services,
    average: monthsWithCharges > 0 ? total / monthsWithCharges : null,
    serviceCount: services.length,
    filledMonthCount: [...monthFilled.values()].filter(Boolean).length,
    isEmpty: total === 0,
  };
};

const objectSubtitle = (state: LedgerState, object: LedgerObject) => {
  const count = getObjectServices(state, object.id).length;
  const services = `${count} ${pluralize(count, pluralForms.service)}`;
  return object.city ? `${services} · м. ${object.city.name}` : services;
};

const serviceKindCount = (state: LedgerState, objects: LedgerObject[]) => {
  const ids = new Set(objects.map((o) => o.id));
  return new Set(
    state.services
      .filter((service) => ids.has(service.objectId))
      .map((s) => `${s.name.trim().toLocaleLowerCase('uk')}|${s.icon}`),
  ).size;
};

// Варіанти шторки «Адреса»: адреси й останнім «Усі адреси» (коли адрес > 1)
export const getAddressOptions = (
  state: LedgerState,
  period: AnalyticsPeriod,
): AddressOption[] => {
  const objects = getOrderedAnalyticsObjects(state);
  const options = objects.map((object) => {
    const selection: AnalyticsSelection = {
      kind: 'object',
      objectId: object.id,
    };
    return {
      selection,
      title: formatShortAddress(object),
      subtitle: objectSubtitle(state, object),
      total: summarizeAnalytics(state, selection, period).total,
    };
  });
  const allTotal = options.reduce((sum, option) => sum + option.total, 0);
  const withRatio = options.map((option) => ({
    ...option,
    ratio: allTotal > 0 ? option.total / allTotal : 0,
  }));
  if (objects.length < 2) return withRatio;
  const kinds = serviceKindCount(state, objects);
  return [
    ...withRatio,
    {
      selection: { kind: 'all' },
      title: 'Усі адреси',
      subtitle: `${objects.length} ${pluralize(objects.length, pluralForms.address)} · ${kinds} ${pluralize(kinds, pluralForms.serviceKind)}`,
      total: allTotal,
      ratio: allTotal > 0 ? 1 : 0,
    },
  ];
};
