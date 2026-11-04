// Стан півгодинного слоту графіка
// on — світло є, off — вимкнення, maybe — перемикання (світла може не бути)
export type SlotState = 'on' | 'off' | 'maybe';

export const SLOTS_PER_DAY = 48;
export const SLOT_MINUTES = 30;

// Черга відключень у термінах постачальника, напр. «1.1»
export type QueueId = string;

// День у часовому поясі постачальника, формат YYYY-MM-DD
export type DateKey = string;

export type DaySchedule = {
  date: DateKey;
  // Для кожної черги рівно SLOTS_PER_DAY слотів, від 00:00
  queues: Record<QueueId, SlotState[]>;
};

export type OutageSchedule = {
  providerId: string;
  days: DaySchedule[];
  // Коли постачальник оновив графік (як він сам це пише), якщо відомо
  updatedLabel?: string;
  // Коли ми отримали графік, ISO
  fetchedAt: string;
};

// Постачальник графіків (обленерго). Щоб підключити нове місто, досить
// реалізувати цей інтерфейс і додати постачальника в registry.ts
export type OutageProvider = {
  id: string;
  name: string;
  // Назви міст з src/constants/cities.ts, які обслуговує постачальник
  cities: readonly string[];
  queues: readonly QueueId[];
  // IANA-пояс, у якому опубліковано графік
  timeZone: string;
  // Сторінка, де можна дізнатися свою чергу за адресою
  lookupUrl?: string;
  fetchSchedule(signal?: AbortSignal): Promise<OutageSchedule>;
};

export type QueueSettings = {
  id: QueueId;
  name?: string;
};

export type OutageSettings = {
  city?: string;
  queues: QueueSettings[];
};
