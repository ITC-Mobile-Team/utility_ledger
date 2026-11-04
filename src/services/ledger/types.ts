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

export type ObjectInput = Omit<LedgerObject, 'id' | 'createdAt'>;

export type ServiceInput = Omit<LedgerService, 'id' | 'createdAt'>;

export interface LedgerRepository {
  // Читає збережений стан зі сховища; повторні виклики повертають той самий проміс
  load(): Promise<void>;
  getSnapshot(): LedgerState;
  subscribe(listener: () => void): () => void;
  addObject(input: ObjectInput): Promise<LedgerObject>;
  updateObject(id: string, input: ObjectInput): Promise<void>;
  // Видаляє обʼєкт разом з послугами, місяцями, показниками, днями й сумами
  deleteObject(id: string): Promise<void>;
  addService(input: ServiceInput): Promise<LedgerService>;
  updateService(id: string, input: ServiceInput): Promise<void>;
  deleteService(id: string): Promise<void>;
  // Додає місяці обʼєкта; вже додані пропускає
  addMonths(objectId: string, months: MonthKey[]): Promise<void>;
  // Видаляє місяць обʼєкта разом з його показниками, днями й сумами
  deleteMonth(objectId: string, month: MonthKey): Promise<void>;
  setReading(reading: MeterReading): Promise<void>;
  setDayCount(dayCount: DayCount): Promise<void>;
  setAmount(amount: MonthAmount): Promise<void>;
  // Скидає внесене за місяць значення послуги: показник, кількість днів або суму
  resetEntry(serviceId: string, month: MonthKey): Promise<void>;
}
