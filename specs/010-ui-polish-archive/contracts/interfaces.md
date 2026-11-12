# Contract: інтерфейси, що змінюються

## LedgerRepository (`src/services/ledger/types.ts`)

```ts
// Архівує, повертає з архіву або змінює «враховувати в аналітиці».
// Запис без очікування сервера, як інші мутації
setObjectArchive(
  id: string,
  patch: { archived: boolean; includeInAnalytics?: boolean },
): Promise<void>;
```

- `archived: true` → ставить `archivedAt = Date.now()` і `includeInAnalytics: true`, якщо його не передали.
- `archived: false` → `includeInAnalytics: true`.
- Реалізують `firestore-ledger-repository.ts` і `local-ledger-repository.ts` (web/тести).

## Селектори (`src/services/ledger/`)

```ts
getActiveObjects(state: LedgerState): LedgerObject[];
getArchivedObjects(state: LedgerState): LedgerObject[];   // archivedAt desc
getAnalyticsObjects(state: LedgerState): LedgerObject[];  // єдине джерело для «Аналітики»
isObjectReadOnly(object: LedgerObject): boolean;          // = archived === true
getMeterFormat(service: LedgerService): { length: number; fractionDigits: number };
readingToDigits(value: number | undefined, format): string;
digitsToReading(digits: string, format): number;
formatReading(value: number, fractionDigits: number): string; // «123,45»
```

## UI-компоненти

| Компонент | Зміна пропсів |
|---|---|
| `MeterReadingInput` (`src/views/meter/`) | `+ fractionDigits: number`; червоні — останні `fractionDigits` клітинок; `length` вже є |
| `MeterDigit` | `isLast` → `isFraction` (фарбування) + `isLast` (підсвічування «стерти») |
| `ObjectCard` | без змін API; показує всі `services` з переносом |
| `ThemeOptionCard` | без змін API; усередині `LogoScene` замість `ThemePreview`, без позначки-радіо |
| `LogoScene` (новий, `src/views/brand/`) | `variant: 'day' \| 'night' \| 'split'`, `animated: boolean`, `size`; спільний з `AppSplash` |
| `StartQueueRow` (новий, `src/views/outages/start-queue-row{,.ios,.android}.tsx`) | `queues: QueueSettings[]`, `value: QueueId`, `onChange(id)` — нативне меню як `StartTabRow` |
| `ThemeTransition` | знімок кореня (`captureRef`) з запасним накриттям фоном; API `usePreferences().setTheme` не змінюється |

## Маршрути

| Маршрут | Файл |
|---|---|
| `/archive` (стек «Обʼєктів», без таб-бару) | `src/app/(tabs)/(objects)/archive.tsx` |

## testID (за `docs/patterns/test-ids.md`)

- `object.nav.archive`, `object.nav.restore` (поруч із наявним `object.nav.delete`)
- `archive.screen`, `archive.card.{index}`, `archive.analytics.{index}`, `archive.empty`
- `outageSettings.startQueue`
- `theme.option.{system|light|dark}` (наявні лишаються)
