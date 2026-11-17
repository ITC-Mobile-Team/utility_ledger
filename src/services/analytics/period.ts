import { type MonthKey, toMonthKey } from '@/services/ledger';
import type { AnalyticsPeriod, CalendarDate } from './types';

export const todayDate = (now = new Date()): CalendarDate => ({
  year: now.getFullYear(),
  monthIndex: now.getMonth(),
  day: now.getDate(),
});

// 1 січня поточного року → сьогодні
export const getDefaultPeriod = (now = new Date()): AnalyticsPeriod => {
  const today = todayDate(now);
  return { start: { year: today.year, monthIndex: 0, day: 1 }, end: today };
};

const dateKey = ({ year, monthIndex, day }: CalendarDate) =>
  year * 10000 + monthIndex * 100 + day;

export const compareDates = (a: CalendarDate, b: CalendarDate) =>
  dateKey(a) - dateKey(b);

export const isSameDate = (a: CalendarDate, b: CalendarDate) =>
  compareDates(a, b) === 0;

export const dateToMonthKey = ({ year, monthIndex }: CalendarDate): MonthKey =>
  toMonthKey(new Date(year, monthIndex, 1));

// Місяці, що перетинаються з періодом хоча б одним днем, від старого до нового
export const getPeriodMonths = ({
  start,
  end,
}: AnalyticsPeriod): MonthKey[] => {
  const months: MonthKey[] = [];
  const last = dateToMonthKey(end);
  let year = start.year;
  let monthIndex = start.monthIndex;
  for (;;) {
    const key = toMonthKey(new Date(year, monthIndex, 1));
    if (key > last) break;
    months.push(key);
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }
  return months;
};
