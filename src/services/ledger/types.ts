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

export type MeterZones = 'single' | 'dayNight';

export type LedgerService = {
  id: string;
  objectId: string;
  icon: string;
  name: string;
  kind: string;
  mode: BillingMode;
  // Одиниця виміру для показника ('кВт·год', 'м³')
  unit: string;
  // Тариф у копійках: за одиницю, за місяць або за день залежно від mode
  tariff: number;
  initialReading?: number;
  zones: MeterZones;
  createdAt: number;
};

export type MeterReading = {
  serviceId: string;
  month: MonthKey;
  value: number;
};

export type DayCount = {
  serviceId: string;
  month: MonthKey;
  days: number;
};

export type LedgerState = {
  objects: LedgerObject[];
  services: LedgerService[];
  readings: MeterReading[];
  dayCounts: DayCount[];
};

export type ObjectInput = Omit<LedgerObject, 'id' | 'createdAt'>;

export type ServiceInput = Omit<LedgerService, 'id' | 'createdAt'>;

export interface LedgerRepository {
  getSnapshot(): LedgerState;
  subscribe(listener: () => void): () => void;
  addObject(input: ObjectInput): Promise<LedgerObject>;
  updateObject(id: string, input: ObjectInput): Promise<void>;
  // Видаляє обʼєкт разом з послугами, показниками й днями
  deleteObject(id: string): Promise<void>;
  addService(input: ServiceInput): Promise<LedgerService>;
  updateService(id: string, input: ServiceInput): Promise<void>;
  deleteService(id: string): Promise<void>;
  setReading(reading: MeterReading): Promise<void>;
  setDayCount(dayCount: DayCount): Promise<void>;
}
