import type { LedgerService } from './types';

// Барабан лічильника послуги: скільки клітинок і скільки з них червоних.
// Червоні клітинки — дробова частина показника
export type MeterFormat = {
  length: number;
  fractionDigits: number;
};

// Світло (однозонний і день/ніч) — 7 клітинок, 2 червоні: 5 цілих цифр,
// до 99 999,99 кВт·год (spec 011). Вода — 8 клітинок, 3 червоні: 5 цілих,
// до 99 999,999 м³; газ — 8 клітинок, 3 червоні
export const getMeterFormat = (
  service: Pick<LedgerService, 'zones'>,
): MeterFormat => {
  switch (service.zones) {
    case 'water':
    case 'gas':
      return { length: 8, fractionDigits: 3 };
    default:
      return { length: 7, fractionDigits: 2 };
  }
};

const roundTo = (value: number, fractionDigits: number) => {
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
};

// Рядок цифр барабана → показник в одиницях з дробовою частиною
export const digitsToReading = (digits: string, format: MeterFormat) =>
  roundTo(Number(digits) / 10 ** format.fractionDigits, format.fractionDigits);

// Збережений показник → цифри барабана, доповнені нулями зліва. Старі цілі
// значення (до spec 010) валідні: їхня дробова частина — нулі
export const readingToDigits = (
  value: number | undefined,
  format: MeterFormat,
) =>
  value === undefined
    ? ''
    : String(Math.round(value * 10 ** format.fractionDigits))
        .padStart(format.length, '0')
        .slice(-format.length);

// Споживання різницею показників без хвостів плаваючої коми
export const subtractReadings = (
  current: number,
  previous: number,
  format: MeterFormat,
) => roundTo(current - previous, format.fractionDigits);

const groupThousands = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Показник чи споживання з комою й рівно fractionDigits знаками: «1 234,56»
export const formatReading = (value: number, fractionDigits: number) => {
  const sign = value < 0 ? '−' : '';
  const [whole = '0', fraction] = Math.abs(value)
    .toFixed(fractionDigits)
    .split('.');
  return `${sign}${groupThousands(whole)}${fraction ? `,${fraction}` : ''}`;
};

// Поле «Початковий показник»: цифри й одна кома (крапка стає комою), цілих —
// не більше, ніж цілих клітинок барабана, дробових — не більше червоних
export const sanitizeReadingInput = (text: string, format: MeterFormat) => {
  const [whole = '', ...rest] = text.replace('.', ',').split(',');
  const wholeDigits = whole
    .replace(/\D/g, '')
    .slice(0, format.length - format.fractionDigits);
  if (rest.length === 0) return wholeDigits;
  const fraction = rest
    .join('')
    .replace(/\D/g, '')
    .slice(0, format.fractionDigits);
  return `${wholeDigits},${fraction}`;
};

export const parseReadingInput = (text: string, format: MeterFormat) => {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? roundTo(value, format.fractionDigits) : 0;
};

// Збережений показник у полі редагування: «123,45», ціле — без коми
export const formatReadingInput = (value: number) =>
  String(value).replace('.', ',');
