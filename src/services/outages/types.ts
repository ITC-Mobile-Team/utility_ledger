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

// За скільки хвилин до вимкнення попереджати
export const NOTIFICATION_LEADS = [5, 10, 15] as const;
export type NotificationLead = (typeof NOTIFICATION_LEADS)[number];

export type OutageNotificationSettings = {
  enabled: boolean;
  leadMinutes: NotificationLead;
  // Черги, для яких попереджати; без поля — для всіх обраних
  queues?: QueueId[];
};

export const defaultNotificationSettings: OutageNotificationSettings = {
  enabled: false,
  leadMinutes: 10,
};

// Збережені раніше налаштування можуть мати час, якого вже немає у виборі
// (15/30/60 хв) — такий замінюємо на типовий
export function normalizeNotificationSettings(
  value: OutageNotificationSettings | undefined,
): OutageNotificationSettings {
  if (!value) return defaultNotificationSettings;
  const leadMinutes = NOTIFICATION_LEADS.includes(value.leadMinutes)
    ? value.leadMinutes
    : defaultNotificationSettings.leadMinutes;
  return { ...value, leadMinutes };
}

export type OutageSettings = {
  city?: string;
  queues: QueueSettings[];
  notifications?: OutageNotificationSettings;
};
