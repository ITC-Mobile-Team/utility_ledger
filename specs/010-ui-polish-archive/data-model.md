# Data Model: 010-ui-polish-archive

Усі зміни зворотно сумісні: нові поля необовʼязкові, старі документи читаються без міграції.

## LedgerObject (`src/services/ledger/types.ts`, Firestore `users/{uid}/objects/{id}`)

| Поле | Тип | Типово | Опис |
|---|---|---|---|
| `archived` | `boolean?` | відсутнє = `false` | Обʼєкт в архіві: прихований зі списку «Обʼєкти», лише перегляд |
| `archivedAt` | `number?` (ms) | — | Час останнього архівування; сортування на «Архіві» (новіші вище). Після повернення з архіву не видаляється |
| `includeInAnalytics` | `boolean?` | відсутнє = `true` | Має значення лише при `archived === true`; `false` виключає обʼєкт з `getAnalyticsObjects` |

`ObjectInput` (форма) цих полів не містить, тож редагування їх не перезаписує.

**Переходи стану**

```
активний ──архівувати (підтвердження)──▶ архівований {archived: true, archivedAt: now, includeInAnalytics: true}
архівований ──перемикач──▶ архівований {includeInAnalytics: true|false}
архівований ──повернути з архіву──▶ активний {archived: false, includeInAnalytics: true}
будь-який ──видалити──▶ (документ і всі залежні видалено, як зараз)
```

**Правила**

- Архівований обʼєкт: заборонені `addMonths`, `deleteMonth`, `moveMonth`, `setReading`, `setDayCount`, `setAmount`, `resetEntry`, `addService`/`updateService`/`deleteService`, `updateObject` (перевірка на рівні UI, бо репозиторій лишається простим).
- `getActiveObjects` = `!archived`; `getArchivedObjects` = `archived`, за `archivedAt` спадно; `getAnalyticsObjects` = активні + архівовані з `includeInAnalytics !== false`.

## MeterReading (`users/{uid}/readings/…`)

| Поле | Було | Стає |
|---|---|---|
| `value`, `night` | ціле число — усі цифри барабана як цілі одиниці | число в одиницях з дробовою частиною, округлене до `fractionDigits` послуги |

Старі цілі значення лишаються валідними (дробова частина = 0), суми минулих місяців не змінюються.

## MeterFormat (обчислюваний, `src/services/ledger/meter-format.ts`)

| `LedgerService.zones` | `length` | `fractionDigits` | Цілих клітинок |
|---|---|---|---|
| `single`, `dayNight` (світло) | 5 | 2 | 3 |
| `water` | 6 | 3 | 3 |
| `gas` | 8 | 3 | 5 |

- Цифри → значення: `Number(digits) / 10^fractionDigits`.
- Значення → цифри: `String(Math.round(value · 10^fractionDigits)).padStart(length, '0').slice(-length)`.
- `LedgerService.initialReading` / `initialNightReading` трактуються так само (одиниці з дробом).

## OutageSettings (`src/services/outages/types.ts`; акаунт — `AccountOutageSettings`)

| Поле | Тип | Опис |
|---|---|---|
| `startQueue` | `QueueId?` | Черга, вибрана при холодному запуску вкладки «Світло». Валідна лише якщо є в `queues`; інакше ігнорується, а при збереженні налаштувань скидається |

Зберігається в документі налаштувань акаунта разом із `city` і `queues`.
