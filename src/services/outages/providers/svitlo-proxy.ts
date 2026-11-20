import {
  type DaySchedule,
  type OutageProvider,
  type OutageSchedule,
  SCHEDULE_TTL_MS,
  SLOT_MINUTES,
  SLOTS_PER_DAY,
  type SlotState,
} from '../types';
import { type SvitloRegionConfig, svitloRegions } from './svitlo-regions';

// Неофіційний агрегатор сайту svitlo.live: один JSON з графіками всіх
// областей — черга → дата → 48 слотів «HH:MM» з кодами 0/1/2/3
const ENDPOINT = 'https://svitlo-proxy.svitlo-proxy.workers.dev/';

type Payload = { payload: unknown; receivedAt: Date };

// 1 — світло є, 2 — вимкнено, 3 — проміжний стан (трапляється на
// Миколаївщині, вважаємо можливим вимкненням). 0 — даних немає: черга, у якої
// весь день 0, не потрапляє в графік («Графік … не опубліковано»), а окремий 0
// серед інших кодів, як і будь-що невідоме, — можливе вимкнення, щоб не
// обіцяти світло
const slotByCode: Record<number, SlotState> = { 1: 'on', 2: 'off', 3: 'maybe' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const slotIndex = (key: string) => {
  const match = key.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes % SLOT_MINUTES === 0 ? minutes / SLOT_MINUTES : -1;
};

// Слоти однієї черги на один день; undefined — даних на цей день немає
const parseSlots = (raw: unknown): SlotState[] | undefined => {
  if (!isRecord(raw)) return undefined;
  const codes: unknown[] = Array.from({ length: SLOTS_PER_DAY });
  for (const [key, code] of Object.entries(raw)) {
    const index = slotIndex(key);
    if (index >= 0 && index < SLOTS_PER_DAY) codes[index] = code;
  }
  if (codes.every((code) => code === 0 || code === undefined)) return undefined;
  return codes.map((code) =>
    typeof code === 'number' ? (slotByCode[code] ?? 'maybe') : 'maybe',
  );
};

// Графік одного регіону з відповіді svitlo-proxy. Чиста функція: без мережі
// й глобального стану, щоб її можна було перевірити на збереженій відповіді
export function parseSvitloRegion(
  payload: unknown,
  config: SvitloRegionConfig,
  receivedAt: Date,
): OutageSchedule {
  const regions = isRecord(payload) ? payload.regions : undefined;
  if (!Array.isArray(regions)) {
    throw new Error('svitlo-proxy: немає regions');
  }
  const region = regions.find(
    (item) => isRecord(item) && item.cpu === config.cpu,
  );
  const schedule = isRecord(region) ? region.schedule : undefined;
  if (!isRecord(schedule)) {
    throw new Error(`svitlo-proxy: регіон ${config.cpu} без графіка`);
  }

  const byDate = new Map<string, DaySchedule['queues']>();
  for (const queue of config.queues) {
    const dates = schedule[queue];
    if (!isRecord(dates)) continue;
    for (const [date, raw] of Object.entries(dates)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const slots = parseSlots(raw);
      if (!slots) continue;
      const queues = byDate.get(date) ?? {};
      queues[queue] = slots;
      byDate.set(date, queues);
    }
  }

  return {
    providerId: `svitlo-${config.cpu}`,
    days: [...byDate]
      .map(([date, queues]) => ({ date, queues }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    fetchedAt: receivedAt.toISOString(),
  };
}

// Одна відповідь на всі міста: остання — в памʼяті на SCHEDULE_TTL_MS, а
// запит у польоті ділять усі, хто питає одночасно
let memory: Payload | undefined;
let inFlight: Promise<Payload> | null = null;

async function request(): Promise<Payload> {
  const response = await fetch(ENDPOINT);
  if (!response.ok) {
    throw new Error(`svitlo-proxy responded with ${response.status}`);
  }
  const next = { payload: await response.json(), receivedAt: new Date() };
  memory = next;
  return next;
}

function loadPayload(force = false): Promise<Payload> {
  if (inFlight) return inFlight;
  if (
    !force &&
    memory &&
    Date.now() - memory.receivedAt.getTime() < SCHEDULE_TTL_MS
  ) {
    return Promise.resolve(memory);
  }
  inFlight = request().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// Скасування перестає чекати, але спільний запит доходить до кінця й лишається
// в памʼяті для інших міст
// (DOMException у Hermes може не бути — звичайна Error з name)
const abortError = () =>
  Object.assign(new Error('Aborted'), { name: 'AbortError' });

function waitFor<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

export function createSvitloProvider(
  config: SvitloRegionConfig,
): OutageProvider {
  return {
    id: `svitlo-${config.cpu}`,
    name: config.name,
    cities: [config.city],
    queues: config.queues,
    timeZone: 'Europe/Kyiv',
    lookupUrl: config.lookupUrl,
    dataSource: { name: 'svitlo.live', url: 'https://svitlo.live/' },
    async fetchSchedule(signal, options) {
      const { payload, receivedAt } = await waitFor(
        loadPayload(options?.force),
        signal,
      );
      return parseSvitloRegion(payload, config, receivedAt);
    },
  };
}

export const svitloProviders = svitloRegions.map(createSvitloProvider);
