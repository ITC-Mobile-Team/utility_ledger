import {
  type DateKey,
  type DaySchedule,
  type OutageProvider,
  type OutageSchedule,
  SLOTS_PER_DAY,
  type SlotState,
} from '../types';

const ENDPOINT = 'https://www.poe.pl.ua/customs/dynamicgpv-info.php';
const PROVIDER_ID = 'poltavaoblenergo';

const months: Record<string, number> = {
  січня: 1,
  лютого: 2,
  березня: 3,
  квітня: 4,
  травня: 5,
  червня: 6,
  липня: 7,
  серпня: 8,
  вересня: 9,
  жовтня: 10,
  листопада: 11,
  грудня: 12,
};

// Класи клітинок таблиці POE: s1 — «Увімкнено», s2 — «Вимкнено»,
// s3 — час на перемикання, електроенергії може не бути
const slotByClass: Record<string, SlotState> = {
  'gpv-s1': 'on',
  'gpv-s2': 'off',
  'gpv-s3': 'maybe',
};

const pad = (value: number) => String(value).padStart(2, '0');

const parseDate = (block: string): DateKey | undefined => {
  const match = block.match(/<b>\s*(\d{1,2})\s+([а-яіїєґʼ']+)\s+(\d{4})/iu);
  if (!match) return undefined;
  const [, day = '', monthName = '', year = ''] = match;
  const month = months[monthName.toLocaleLowerCase('uk')];
  if (!month) return undefined;
  return `${year}-${pad(month)}-${pad(Number(day))}`;
};

const parseDay = (block: string): DaySchedule | undefined => {
  const date = parseDate(block);
  // У блоці дві таблиці з тими самими даними (горизонтальна й вертикальна);
  // беремо горизонтальну: рядок — черга, 48 клітинок по 30 хв
  const table = block.match(
    /<table class="gpv-table">([\s\S]*?)<\/table>/,
  )?.[1];
  if (!date || !table) return undefined;

  const queues: DaySchedule['queues'] = {};
  const rowPattern =
    /<td class="gpv-q"[^>]*>\s*([\d.]+)\s*<\/td>([\s\S]*?)<\/tr>/g;
  for (const [, queue = '', cells = ''] of table.matchAll(rowPattern)) {
    const slots = [...cells.matchAll(/<td class="gpv-c ([^"]*)"/g)].map(
      ([, classes = '']): SlotState => {
        const state = classes
          .split(/\s+/)
          .map((name) => slotByClass[name])
          .find(Boolean);
        return state ?? 'on';
      },
    );
    if (queue && slots.length === SLOTS_PER_DAY) queues[queue] = slots;
  }
  return Object.keys(queues).length > 0 ? { date, queues } : undefined;
};

// Розбирає HTML-фрагмент з dynamicgpv-info.php: по блоку gpvinfodetail на
// кожен опублікований день (зазвичай сьогодні й, увечері, завтра)
export function parsePoltavaSchedule(
  html: string,
  fetchedAt = new Date(),
): OutageSchedule {
  const days = html
    .split('class="gpvinfodetail"')
    .slice(1)
    .map(parseDay)
    .filter((day): day is DaySchedule => Boolean(day))
    .sort((a, b) => a.date.localeCompare(b.date));
  // «Оновлено» є в кожному дні; останнє — найсвіжіше
  const updated = [...html.matchAll(/Оновлено:\s*([^<]+)</g)].at(-1);
  return {
    providerId: PROVIDER_ID,
    days,
    updatedLabel: updated?.[1]?.trim(),
    fetchedAt: fetchedAt.toISOString(),
  };
}

const queues = ['1', '2', '3', '4', '5', '6'].flatMap((queue) => [
  `${queue}.1`,
  `${queue}.2`,
]);

export const poltavaoblenergo: OutageProvider = {
  id: PROVIDER_ID,
  name: 'Полтаваобленерго',
  cities: ['Полтава', 'Кременчук'],
  queues,
  timeZone: 'Europe/Kyiv',
  lookupUrl: 'https://www.poe.pl.ua/',
  async fetchSchedule(signal) {
    const response = await fetch(ENDPOINT, { signal });
    if (!response.ok) {
      throw new Error(`POE responded with ${response.status}`);
    }
    const schedule = parsePoltavaSchedule(await response.text());
    if (schedule.days.length === 0) {
      throw new Error('POE schedule has no days');
    }
    return schedule;
  },
};
