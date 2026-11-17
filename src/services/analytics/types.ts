import type { AppColor } from '@/constants/colors';
import type { MonthKey } from '@/services/ledger';

// Календарна дата без часу; monthIndex — з нуля
export type CalendarDate = { year: number; monthIndex: number; day: number };

export type AnalyticsPeriod = { start: CalendarDate; end: CalendarDate };

export type AnalyticsSelection =
  { kind: 'object'; objectId: string } | { kind: 'all' };

export type AnalyticsMonth = {
  month: MonthKey;
  // Копійки; 0 — місяць не додано або без нарахувань
  total: number;
  // Цілий відсоток від суми періоду (найбільші залишки)
  share: number;
  // Відносно найбільшого місяця періоду, 0…1
  ratio: number;
};

export type AnalyticsConsumption = {
  value: number;
  unit: string;
  fractionDigits: number;
};

export type AnalyticsServiceTotal = {
  // service.id (одна адреса) або «назва|іконка» (усі адреси)
  key: string;
  name: string;
  icon: string;
  amount: number;
  // Цілий; сума по всіх послугах — 100
  percent: number;
  // Пари (послуга, місяць) з нарахуванням
  recordCount: number;
  addressCount: number;
  // Лише для послуг за показником з однаковою одиницею в групі
  consumption: AnalyticsConsumption | null;
  accent: AppColor;
};

export type AnalyticsSummary = {
  total: number;
  // Усі місяці періоду, від старого до нового
  months: AnalyticsMonth[];
  // Від найбільшої суми; лише з amount > 0
  services: AnalyticsServiceTotal[];
  // null — у періоді немає місяців з нарахуванням
  average: number | null;
  serviceCount: number;
  filledMonthCount: number;
  isEmpty: boolean;
};

export type AddressOption = {
  selection: AnalyticsSelection;
  title: string;
  subtitle: string;
  total: number;
  // Частка від суми всіх адрес, 0…1
  ratio: number;
};
