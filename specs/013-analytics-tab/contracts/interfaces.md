# Contracts: Вкладка «Аналітика»

Внутрішні інтерфейси модулів і UI-контракт екранів. Тіла функцій — у реалізації.

## `src/services/analytics/`

```ts
export type CalendarDate = { year: number; monthIndex: number; day: number };
export type AnalyticsPeriod = { start: CalendarDate; end: CalendarDate };
export type AnalyticsSelection =
  | { kind: 'object'; objectId: string }
  | { kind: 'all' };

// period.ts
export function getDefaultPeriod(today?: Date): AnalyticsPeriod;
export function getPeriodMonths(period: AnalyticsPeriod): MonthKey[];
export function compareDates(a: CalendarDate, b: CalendarDate): number;
export function isSameDate(a: CalendarDate, b: CalendarDate): boolean;
export function todayDate(now?: Date): CalendarDate;

// summary.ts
export function getDefaultSelection(state: LedgerState): AnalyticsSelection | null;
export function normalizeSelection(
  state: LedgerState,
  selection: AnalyticsSelection | null,
): AnalyticsSelection | null; // null — немає обʼєктів в аналітиці
export function summarizeAnalytics(
  state: LedgerState,
  selection: AnalyticsSelection,
  period: AnalyticsPeriod,
): AnalyticsSummary;
export function getAddressOptions(
  state: LedgerState,
  period: AnalyticsPeriod,
): AddressOption[]; // адреси + «Усі адреси» (лише коли адрес > 1)
export function toPercents(values: readonly number[]): number[]; // сума = 100

// format.ts
export function formatShortDate(date: CalendarDate): string;      // «1 бер 2026»
export function formatMonthShort(month: MonthKey): string;        // «Бер»
export function formatPeriodMonths(period: AnalyticsPeriod): string; // «Січень – серпень 2026»
```

Типи `AnalyticsSummary`, `AnalyticsMonth`, `AnalyticsServiceTotal`, `AddressOption` — [data-model.md](../data-model.md).

**Інваріанти** (перевіряються в quickstart):
- `summary.total === Σ months[i].total === Σ services[i].amount`.
- Для `kind: 'object'`: `months[i].total === calculateMonth(state, objectId, month).total`, якщо місяць додано, інакше 0.
- `Σ services[i].percent === 100`, якщо `total > 0`.
- Для `kind: 'all'`: `total === Σ total кожної адреси`.

## `src/providers/analytics-selection-provider.tsx`

```ts
export function AnalyticsSelectionProvider(props: PropsWithChildren): JSX.Element;
export function useAnalyticsSelection(): {
  period: AnalyticsPeriod;
  selection: AnalyticsSelection | null; // нормалізований
  setPeriod(period: AnalyticsPeriod): void;
  setSelection(selection: AnalyticsSelection): void;
};
```

## `src/views/analytics/`

```ts
AnalyticsPeriodButton({ label: 'Від' | 'До', date: CalendarDate, active: boolean,
  disabled?: boolean, onPress, testID })
DateRangeSheet({ visible, edge: 'start' | 'end', period: AnalyticsPeriod,
  onClose, onSave(date: CalendarDate) })
AddressSheet({ visible, options: AddressOption[], period: AnalyticsPeriod,
  selection: AnalyticsSelection, onClose, onSelect(selection) })
AddressRow({ option: AddressOption, onPress })          // рядок над карткою
ExpensesCard({ summary, period, onPress })               // ↗️, UAH, сума, графік, середнє, плитки
MonthBars({ months: AnalyticsMonth[] })                  // ≤ 12 останніх, підпис «Останні 12 місяців»
ServiceShareBar({ services: AnalyticsServiceTotal[] })   // смуга + легенда (деталі)
AnalyticsServiceRow({ item, variant: 'list' | 'details', index, onPress? })
AnalyticsMonthRow({ item, variant: 'list' | 'details', index, onPress? })
```

`src/views/account-data/analytics-skeleton.tsx` — `AnalyticsSkeleton()`.

## Маршрути

| Шлях | Файл | Параметри |
|---|---|---|
| `/analytics` | `src/app/(tabs)/analytics/index.tsx` | — |
| `/analytics/details` | `src/app/(tabs)/analytics/details.tsx` | `tab?: 'services' \| 'months'` (за замовчуванням `services`) |

## UI-контракт (тексти й testID)

| Елемент | Текст / підпис доступності | testID |
|---|---|---|
| Екран | заголовок «Аналітика», `barType='green'` | `analytics.screen` |
| Кнопка «Від» | «Від» + «1 січ 2026»; a11y «Початкова дата, 1 січ 2026» | `analytics.period.start` |
| Кнопка «До» | «До» + дата; a11y «Кінцева дата, …» | `analytics.period.end` |
| Рядок адреси | назва + підпис + ⌄; a11y «Обрати адресу, зараз: …» | `analytics.address` |
| Картка | «Витрати», сума, «UAH», «У середньому … на місяць», «Послуги», «Місяців заповнено» | `analytics.total` |
| Перемикач | «Послуги» / «Місяці» | `analytics.tabs.services`, `analytics.tabs.months` |
| Рядки | послуга / місяць | `analytics.service.<i>`, `analytics.month.<i>` |
| Шторка дати | «Початкова дата» / «Кінцева дата», «Скасувати», «Готово», «Попередній місяць», «Наступний місяць», «Період» | `analytics.sheet.date.{cancel,done,prev,next}`, `analytics.sheet.date.day.<d>` |
| Шторка адреси | «Адреса», «Витрати за … – …» | `analytics.sheet.address.<i>` |
| Порожньо | «Тут будуть витрати» | `analytics.empty` |
| Деталі | «Витрати 12 803,00 ₴», «Січень – серпень 2026» | `analytics.details.screen`, `analytics.details.tabs.*` |
