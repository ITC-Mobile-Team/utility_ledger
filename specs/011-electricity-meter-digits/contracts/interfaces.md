# Interface Contracts: 011-electricity-meter-digits

## `getMeterFormat` — `src/services/ledger/meter-format.ts`

```ts
getMeterFormat(service: Pick<LedgerService, 'zones'>): MeterFormat
```

| `zones` | Результат |
|---|---|
| `'water'` | `{ length: 8, fractionDigits: 3 }` |
| `'gas'` | `{ length: 8, fractionDigits: 3 }` |
| інше (`'single'`, `'dayNight'`) | `{ length: 7, fractionDigits: 2 }` |

Сигнатури `digitsToReading`, `readingToDigits`, `subtractReadings`, `formatReading`, `sanitizeReadingInput`, `parseReadingInput` не змінюються.

## UI — екран «Додати показник» (`reading.tsx`)

| testID | Контракт |
|---|---|
| `reading.value` / `reading.day` / `reading.night` | барабан з `length` клітинками, останні `fractionDigits` червоні |
| `reading.save` | активна лише коли введено всі `length` цифр і значення ≥ попереднього |

Підказки: «Введіть 7 цифр зліва направо, як на лічильнику» / «Цифра K з 7» / «Усі 7 цифр введено» для світла; для води — 8.
