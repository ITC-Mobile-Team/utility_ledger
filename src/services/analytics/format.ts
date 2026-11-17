import { getMonthName, type MonthKey, parseMonthKey } from '@/services/ledger';
import { dateToMonthKey } from './period';
import type { AnalyticsPeriod, CalendarDate } from './types';

const monthShort = [
  'січ',
  'лют',
  'бер',
  'кві',
  'тра',
  'чер',
  'лип',
  'сер',
  'вер',
  'жов',
  'лис',
  'гру',
] as const;

const capitalize = (text: string) =>
  text.charAt(0).toLocaleUpperCase('uk') + text.slice(1);

// «1 бер 2026»
export const formatShortDate = ({ year, monthIndex, day }: CalendarDate) =>
  `${day} ${monthShort[monthIndex] ?? ''} ${year}`;

// «Бер» — підпис стовпчика графіка
export const formatMonthShort = (month: MonthKey) =>
  capitalize(monthShort[parseMonthKey(month).monthIndex] ?? '');

// «Січень – серпень 2026», «Листопад 2025 – березень 2026», «Серпень 2026»
export const formatPeriodMonths = ({ start, end }: AnalyticsPeriod) => {
  const from = dateToMonthKey(start);
  const to = dateToMonthKey(end);
  const toName = getMonthName(to);
  if (from === to) return `${toName} ${end.year}`;
  const fromName = getMonthName(from);
  const lowerTo = toName.toLocaleLowerCase('uk');
  return start.year === end.year
    ? `${fromName} – ${lowerTo} ${end.year}`
    : `${fromName} ${start.year} – ${lowerTo} ${end.year}`;
};
