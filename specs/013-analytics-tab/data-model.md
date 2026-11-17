# Data Model: Вкладка «Аналітика»

Нових збережених даних немає: усе обчислюється з наявного `LedgerState` (обʼєкти, послуги, місяці, показники, дні, суми). Нижче — сутності в памʼяті.

## AnalyticsPeriod

| Поле | Тип | Правила |
|---|---|---|
| `start` | `CalendarDate` (`{ year, monthIndex, day }`) | ≤ `end` |
| `end` | `CalendarDate` | ≥ `start`, ≤ сьогодні |

- За замовчуванням: `{ поточний рік, 0, 1 }` → сьогодні.
- `getPeriodMonths(period)` → `MonthKey[]` від `toMonthKey(start)` до `toMonthKey(end)` включно (місяць входить, якщо перетинається з періодом хоч одним днем).

## AnalyticsSelection

`{ kind: 'object'; objectId: string } | { kind: 'all' }`

- За замовчуванням — `object` з першим обʼєктом `getAnalyticsObjects` у порядку списку «Обʼєкти» (активні, потім архівовані з аналітикою).
- `all` доступний лише коли обʼєктів в аналітиці > 1.
- Якщо обраний обʼєкт зник з `getAnalyticsObjects` (видалено, виключено) — повертається до першого доступного; якщо обʼєктів 0 — стан «порожньо».

## AnalyticsSelectionState (провайдер)

| Поле | Тип |
|---|---|
| `period` | `AnalyticsPeriod` |
| `selection` | `AnalyticsSelection` (вже нормалізований до доступних обʼєктів) |
| `setPeriod(period)` | — |
| `setSelection(selection)` | — |

Живе в `analytics/_layout.tsx`; скидається при холодному запуску й виході з акаунта.

## AnalyticsSummary (результат `summarizeAnalytics`)

| Поле | Тип | Опис |
|---|---|---|
| `total` | `number` (копійки) | сума місяців періоду |
| `months` | `AnalyticsMonth[]` | усі місяці періоду, від старого до нового |
| `services` | `AnalyticsServiceTotal[]` | від найбільшої суми; лише з `amount > 0` |
| `average` | `number \| null` | `total / кількість місяців з нарахуванням`; `null`, якщо таких немає |
| `serviceCount` | `number` | `services.length` |
| `filledMonthCount` | `number` | місяці зі статусом `filled` (для «Усіх адрес» — місяць заповнено, якщо заповнено в усіх адресах, де його додано) |
| `isEmpty` | `boolean` | жодного нарахування в періоді |

### AnalyticsMonth

| Поле | Тип | Опис |
|---|---|---|
| `month` | `MonthKey` | |
| `total` | `number` | сума нарахувань адрес(и) за місяць (0, якщо місяць не додано) |
| `share` | `number` | частка від `total` періоду, цілий відсоток (найбільші залишки) |
| `ratio` | `number` 0…1 | відносно найбільшого місяця (смужка, висота стовпчика) |

### AnalyticsServiceTotal

| Поле | Тип | Опис |
|---|---|---|
| `key` | `string` | `service.id` (одна адреса) або `name|icon` (усі адреси) |
| `name`, `icon` | `string` | з першої послуги групи |
| `amount` | `number` | сума за період |
| `percent` | `number` | цілий, сума по всіх = 100 |
| `recordCount` | `number` | кількість пар (послуга, місяць) з нарахуванням |
| `addressCount` | `number` | скільки адрес у групі |
| `consumption` | `{ value: number; unit: string; fractionDigits: number } \| null` | лише для `meter` з однаковою одиницею в групі |
| `accent` | `AppColor` | колір у смузі розподілу (R10) |

## AddressOption (шторка «Адреса»)

| Поле | Тип |
|---|---|
| `selection` | `AnalyticsSelection` |
| `title` | коротка адреса або «Усі адреси» |
| `subtitle` | «2 послуги · м. Полтава» (без міста — «2 послуги») / «2 адреси · 3 види послуг» |
| `total` | сума за поточний період |
| `ratio` | `total / total(усі)` для смужки |

## Переходи

- Зміна `period` або `selection` → перерахунок `summarizeAnalytics` при наступному рендері.
- Зміна `LedgerState` (підписка `useLedgerState`) → перерахунок одразу (FR-010).
- Деталі отримують у параметрі маршруту лише `tab: 'services' | 'months'`; період і адресу читають із провайдера.
