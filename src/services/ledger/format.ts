import type { BillingMode } from '@/constants/billing-mode';
import type { LedgerObject, LedgerService, MonthKey } from './types';

const monthNames = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
] as const;

// «у вересні», «у лютому»
const monthLocative = [
  'січні',
  'лютому',
  'березні',
  'квітні',
  'травні',
  'червні',
  'липні',
  'серпні',
  'вересні',
  'жовтні',
  'листопаді',
  'грудні',
] as const;

export const toMonthKey = (date: Date): MonthKey =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const parseMonthKey = (month: MonthKey) => {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
};

export const isMonthKey = (value: string): value is MonthKey =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export const getMonthName = (month: MonthKey) =>
  monthNames[parseMonthKey(month).monthIndex] ?? '';

export const getMonthLocative = (month: MonthKey) =>
  monthLocative[parseMonthKey(month).monthIndex] ?? '';

// «Вересень 2026»
export const formatMonthTitle = (month: MonthKey) =>
  `${getMonthName(month)} ${parseMonthKey(month).year}`;

export const getDaysInMonth = (month: MonthKey) => {
  const { year, monthIndex } = parseMonthKey(month);
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Українські форми множини: [1 адреса, 2 адреси, 5 адрес]
export const pluralize = (
  count: number,
  forms: readonly [string, string, string],
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
};

export const pluralForms = {
  address: ['адреса', 'адреси', 'адрес'],
  day: ['день', 'дні', 'днів'],
  month: ['місяць', 'місяці', 'місяців'],
} as const;

const groupThousands = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// 12535 → «12 535»
export const formatNumber = (value: number) => {
  const sign = value < 0 ? '−' : '';
  return `${sign}${groupThousands(String(Math.abs(Math.round(value))))}`;
};

// Копійки → «1 115,50 ₴»
export const formatMoney = (kopecks: number, withCurrency = true) => {
  const sign = kopecks < 0 ? '−' : '';
  const abs = Math.abs(Math.round(kopecks));
  const hryvnias = groupThousands(String(Math.floor(abs / 100)));
  const cents = String(abs % 100).padStart(2, '0');
  return `${sign}${hryvnias},${cents}${withCurrency ? ' ₴' : ''}`;
};

// «4,32» або «4.32» → 432 копійки; null, якщо введення некоректне
export const parseMoney = (text: string): number | null => {
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
};

// 432 → «4,32» для поля вводу
export const formatMoneyInput = (kopecks: number) =>
  formatMoney(kopecks, false).replace(/\s/g, '');

export const tariffSuffix = (mode: BillingMode, unit: string) => {
  switch (mode) {
    case 'meter':
      return unit;
    case 'fixed':
      return 'міс.';
    case 'day':
      return 'день';
    case 'invoice':
      return 'міс.';
  }
};

// «4,32 ₴ / кВт·год»; двозонний — «☀️ 4,32 · 🌙 2,16 ₴ / кВт·год»;
// вода — «💧 46,80 · 🚽 36,91 ₴ / м³ + 36,00 ₴ / міс.»
export const formatTariff = (
  service: Pick<
    LedgerService,
    | 'mode'
    | 'unit'
    | 'tariff'
    | 'zones'
    | 'nightTariff'
    | 'sewageTariff'
    | 'waterFee'
    | 'sewageFee'
  >,
) => {
  if (service.mode === 'invoice') return 'Сума щомісяця';
  const suffix = tariffSuffix(service.mode, service.unit);
  if (service.mode === 'meter' && service.zones === 'dayNight') {
    return `☀️ ${formatMoney(service.tariff, false)} · 🌙 ${formatMoney(service.nightTariff ?? 0)} / ${suffix}`;
  }
  if (service.mode === 'meter' && service.zones === 'water') {
    const fees = (service.waterFee ?? 0) + (service.sewageFee ?? 0);
    const rates = `💧 ${formatMoney(service.tariff, false)} · 🚽 ${formatMoney(service.sewageTariff ?? 0)} / ${suffix}`;
    return fees > 0 ? `${rates} + ${formatMoney(fees)} / міс.` : rates;
  }
  return `${formatMoney(service.tariff)} / ${suffix}`;
};

export const billingModeShortTitle: Record<BillingMode, string> = {
  meter: 'Показник',
  fixed: 'Фіксована',
  day: 'За днями',
  invoice: 'З рахунку',
};

const hasAddress = (object: LedgerObject) =>
  Boolean(object.street || object.house || object.apartment);

// «вул. Соборності, буд. 24, кв. 12»; без адреси — назва обʼєкта
export const formatAddress = (object: LedgerObject) => {
  if (!hasAddress(object)) return object.name;
  return [
    object.street && `вул. ${object.street}`,
    object.house && `буд. ${object.house}`,
    object.building && `корп. ${object.building}`,
    object.apartment && `кв. ${object.apartment}`,
  ]
    .filter(Boolean)
    .join(', ');
};

// Коротка форма для навбару: «вул. Соборності, 24, кв. 12»
export const formatShortAddress = (object: LedgerObject) => {
  if (!hasAddress(object)) return object.name;
  return [
    object.street && `вул. ${object.street}`,
    object.house,
    object.apartment && `кв. ${object.apartment}`,
  ]
    .filter(Boolean)
    .join(', ');
};

// «м. Полтава · Квартира в Полтаві»
export const formatObjectSubtitle = (object: LedgerObject) =>
  [object.city && `м. ${object.city.name}`, hasAddress(object) && object.name]
    .filter(Boolean)
    .join(' · ');
