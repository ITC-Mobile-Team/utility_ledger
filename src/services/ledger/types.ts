import type { BillingMode } from '@/constants/billing-mode';

// Місяць у форматі 'YYYY-MM'
export type MonthKey = `${number}-${string}`;

export type City = {
  name: string;
  region: string;
};

export type LedgerObject = {
  id: string;
  name: string;
  city?: City;
  street?: string;
  house?: string;
  apartment?: string;
  building?: string;
  createdAt: number;
  // В архіві: прихований зі списку «Обʼєкти», лише перегляд. Немає поля — ні
  archived?: boolean;
  // Час останнього архівування (ms) — сортування на екрані «Архів».
  // Після повернення з архіву не видаляється
  archivedAt?: number;
  // Чи враховувати архівований обʼєкт в «Аналітиці». Немає поля — так;
  // для обʼєкта не в архіві не має значення (він враховується завжди)
  includeInAnalytics?: boolean;
};

// 'water' — лічильник води з водовідведенням (стоками) та абонплатами
// 'gas' — лічильник газу, рахується як однозонний: спожито × ціна за 1 м³
export type MeterZones = 'single' | 'dayNight' | 'water' | 'gas';

export type LedgerService = {
  id: string;
  objectId: string;
  icon: string;
  name: string;
  mode: BillingMode;
  // Одиниця виміру для показника ('кВт·год', 'м³')
  unit: string;
  // Тариф у копійках: за одиницю, за місяць або за день залежно від mode.
  // Для 'invoice' не використовується (0) — сума вноситься щомісяця.
  // Для двозонного лічильника — денний тариф, для води — водопостачання
  tariff: number;
  // Нічний тариф у копійках, лише для zones === 'dayNight'
  nightTariff?: number;
  // Лише для zones === 'water', у копійках: стоки за одиницю
  // та щомісячні абонплати за воду й стоки
  sewageTariff?: number;
  waterFee?: number;
  sewageFee?: number;
  initialReading?: number;
  initialNightReading?: number;
  zones: MeterZones;
  createdAt: number;
};

export type MeterReading = {
  serviceId: string;
  month: MonthKey;
  // Показник однозонного лічильника або денна зона двозонного
  value: number;
  // Нічна зона двозонного лічильника
  night?: number;
};

export type DayCount = {
  serviceId: string;
  month: MonthKey;
  days: number;
};

// Сума за місяць для послуги 'invoice', у копійках
export type MonthAmount = {
  serviceId: string;
  month: MonthKey;
  amount: number;
};

// Місяць, який користувач додав до обʼєкта
export type ObjectMonth = {
  objectId: string;
  month: MonthKey;
};

export type LedgerState = {
  objects: LedgerObject[];
  services: LedgerService[];
  months: ObjectMonth[];
  readings: MeterReading[];
  dayCounts: DayCount[];
  amounts: MonthAmount[];
};

// Поля форми обʼєкта. Архівних полів тут немає, тож редагування їх не
// перезаписує — вони змінюються лише через setObjectArchive
export type ObjectInput = Omit<
  LedgerObject,
  'id' | 'createdAt' | 'archived' | 'archivedAt' | 'includeInAnalytics'
>;

export type ObjectArchivePatch = {
  archived: boolean;
  includeInAnalytics?: boolean;
};

export type ServiceInput = Omit<LedgerService, 'id' | 'createdAt'>;

export interface LedgerRepository {
  // Привʼязка до акаунта. null — вийшли: знімок порожній (локальна копія
  // акаунта на диску лишається). uid — читати дані цього акаунта; проміс
  // завершується, коли є перший знімок з локального сховища (і без інтернету)
  setUser(uid: string | null): Promise<void>;
  getSnapshot(): LedgerState;
  subscribe(listener: () => void): () => void;
  addObject(input: ObjectInput): Promise<LedgerObject>;
  updateObject(id: string, input: ObjectInput): Promise<void>;
  // Видаляє обʼєкт разом з послугами, місяцями, показниками, днями й сумами
  deleteObject(id: string): Promise<void>;
  // Архівує (archived: true), повертає з архіву (archived: false) або змінює
  // «враховувати в аналітиці» архівованого обʼєкта. Без очікування сервера
  setObjectArchive(id: string, patch: ObjectArchivePatch): Promise<void>;
  addService(input: ServiceInput): Promise<LedgerService>;
  updateService(id: string, input: ServiceInput): Promise<void>;
  deleteService(id: string): Promise<void>;
  // Додає місяці обʼєкта; вже додані пропускає
  addMonths(objectId: string, months: MonthKey[]): Promise<void>;
  // Видаляє місяць обʼєкта разом з його показниками, днями й сумами
  deleteMonth(objectId: string, month: MonthKey): Promise<void>;
  // Переносить місяць обʼєкта на інший разом з показниками, днями й сумами
  moveMonth(objectId: string, from: MonthKey, to: MonthKey): Promise<void>;
  setReading(reading: MeterReading): Promise<void>;
  setDayCount(dayCount: DayCount): Promise<void>;
  setAmount(amount: MonthAmount): Promise<void>;
  // Скидає внесене за місяць значення послуги: показник, кількість днів або суму
  resetEntry(serviceId: string, month: MonthKey): Promise<void>;
}
