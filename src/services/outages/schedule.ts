import {
  type DateKey,
  type DaySchedule,
  SLOT_MINUTES,
  type SlotState,
} from './types';

const pad = (value: number) => String(value).padStart(2, '0');

export type ZonedNow = {
  date: DateKey;
  // Хвилини від початку доби
  minutes: number;
};

// Поточний час у поясі постачальника: графік опубліковано за київським
// часом, а телефон може бути в іншому поясі
export function getZonedNow(timeZone: string, now = new Date()): ZonedNow {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    return {
      date: `${get('year')}-${pad(get('month'))}-${pad(get('day'))}`,
      minutes: get('hour') * 60 + get('minute'),
    };
  } catch {
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

export function addDays(date: DateKey, days: number): DateKey {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

const monthsShort = [
  'січ.',
  'лют.',
  'берез.',
  'квіт.',
  'трав.',
  'черв.',
  'лип.',
  'серп.',
  'верес.',
  'жовт.',
  'лист.',
  'груд.',
];

// «4 лист.»
export function formatShortDate(date: DateKey) {
  const [, m = 1, d = 1] = date.split('-').map(Number);
  return `${d} ${monthsShort[m - 1] ?? ''}`;
}

// 0 → «00:00», 1440 → «24:00»
export function formatTime(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// 90 → «1 год 30 хв»
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours} год`, rest && `${rest} хв`]
    .filter(Boolean)
    .join(' ');
}

export type OutageInterval = {
  // Хвилини від початку доби
  start: number;
  // Кінець гарантованого вимкнення
  end: number;
  // Кінець перемикання після вимкнення, коли світло можуть дати будь-якої
  // миті; дорівнює end, якщо перемикання немає
  switchEnd: number;
};

// Вимкнення як суцільні проміжки: слоти off підряд разом із перемиканням
// одразу після них
export function getOutageIntervals(slots: SlotState[]): OutageInterval[] {
  const intervals: OutageInterval[] = [];
  let index = 0;
  while (index < slots.length) {
    if (slots[index] !== 'off') {
      index += 1;
      continue;
    }
    const start = index;
    while (index < slots.length && slots[index] === 'off') index += 1;
    const end = index;
    while (index < slots.length && slots[index] === 'maybe') index += 1;
    intervals.push({
      start: start * SLOT_MINUTES,
      end: end * SLOT_MINUTES,
      switchEnd: index * SLOT_MINUTES,
    });
  }
  return intervals;
}

export const getOffMinutes = (slots: SlotState[]) =>
  slots.filter((slot) => slot === 'off').length * SLOT_MINUTES;

export const findDay = (days: DaySchedule[], date: DateKey) =>
  days.find((day) => day.date === date);

export type PowerStatus =
  | { kind: 'off'; interval: OutageInterval }
  | { kind: 'switching'; interval: OutageInterval }
  | { kind: 'on'; next?: { date: DateKey; interval: OutageInterval } };

// Що зараз зі світлом у черзі і коли наступна зміна
export function getPowerStatus(
  days: DaySchedule[],
  queue: string,
  now: ZonedNow,
): PowerStatus | undefined {
  const today = findDay(days, now.date)?.queues[queue];
  if (!today) return undefined;
  const intervals = getOutageIntervals(today);
  const current = intervals.find(
    (interval) =>
      now.minutes >= interval.start && now.minutes < interval.switchEnd,
  );
  if (current) {
    return now.minutes < current.end
      ? { kind: 'off', interval: current }
      : { kind: 'switching', interval: current };
  }
  const nextToday = intervals.find((interval) => interval.start > now.minutes);
  if (nextToday) {
    return { kind: 'on', next: { date: now.date, interval: nextToday } };
  }
  const tomorrowDate = addDays(now.date, 1);
  const tomorrow = findDay(days, tomorrowDate)?.queues[queue];
  const nextTomorrow = tomorrow && getOutageIntervals(tomorrow)[0];
  return {
    kind: 'on',
    next: nextTomorrow
      ? { date: tomorrowDate, interval: nextTomorrow }
      : undefined,
  };
}

// 1 черга, 2 черги, 5 черг
export function pluralizeQueues(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'черга';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'черги';
  return 'черг';
}
