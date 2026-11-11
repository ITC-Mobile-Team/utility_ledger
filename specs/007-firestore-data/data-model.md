# Data Model: 007-firestore-data

Усе під `users/{uid}`; `uid` — ідентифікатор акаунта Firebase Auth. Типи TypeScript не змінюються (`src/services/ledger/types.ts`, `src/services/profile/types.ts`, `src/services/outages/types.ts`); у документах зберігаються ті самі поля, ключові поля (`id`, `serviceId`, `month`, `objectId`) дублюються в документі, щоб читати документ без розбору ідентифікатора.

| Шлях | Тип | Поля документа | Ідентифікатор |
|---|---|---|---|
| `users/{uid}` | `UserProfile` без `userId` | `name: string \| null`, `nameSource: 'provider' \| 'user'`, `email: string \| null`, `method: 'apple' \| 'google' \| null` | `uid` |
| `users/{uid}/objects/{id}` | `LedgerObject` | `id`, `name`, `city?: {name, region}`, `street?`, `house?`, `apartment?`, `building?`, `createdAt: number` | локальний id (старі — з `createId()`, нові — `doc(collection).id`) |
| `users/{uid}/services/{id}` | `LedgerService` | усі поля типу, у т.ч. `objectId`, `tariff` і нічний тариф у копійках (цілі), `zones`, `createdAt` | як обʼєкти |
| `users/{uid}/months/{objectId}_{month}` | `ObjectMonth` | `objectId`, `month: 'YYYY-MM'` | природний ключ |
| `users/{uid}/readings/{serviceId}_{month}` | `MeterReading` | `serviceId`, `month`, `value: number`, `night?: number` | природний ключ |
| `users/{uid}/dayCounts/{serviceId}_{month}` | `DayCount` | `serviceId`, `month`, `days: number` | природний ключ |
| `users/{uid}/amounts/{serviceId}_{month}` | `MonthAmount` | `serviceId`, `month`, `amount: number` (копійки) | природний ключ |
| `users/{uid}/settings/outages` | частина `OutageSettings` | `city?: string`, `queues: {id, name?}[]` | фіксований |

Необовʼязкові поля без значення не записуються (Firestore не приймає `undefined`): репозиторій прибирає `undefined` перед записом.

## Що лишається на пристрої (`KeyValueStorage`)

| Ключ | Що | Чому |
|---|---|---|
| `outageSettings` | лише `notifications` (увімкнено, за скільки хвилин, черги) | залежить від дозволу пристрою (FR-013) |
| `outageSchedule:{providerId}` | кеш графіка | публічні дані постачальника |
| тема, стартова вкладка, `hasSeenOnboarding` | налаштування пристрою | без змін |
| `accountDataSynced:{uid}` | `'1'`, коли пристрій хоч раз отримав дані акаунта з сервера | вибір між скелетонами й миттєвим показом (R5) |
| `ledgerState`, `userProfile`, місто/черги в `outageSettings` | дані попередньої версії | видаляються після перенесення (R7) |

## Стан даних акаунта

```
signed out ──вхід──▶ (є accountDataSynced:{uid}) ──▶ ready
                     (немає)  ──▶ loading ──серверне читання ok──▶ migrate? ──▶ ready
                                     │
                                     └─unavailable──▶ offline ──«Спробувати ще»──▶ loading
ready ──вихід──▶ signed out   (кеш і черга записів акаунта лишаються на диску)
ready ──видалення акаунта──▶ дані в хмарі й кеші видалено, прапорець видалено ──▶ signed out
```

## Похідний знімок `LedgerState`

Знімок збирається з шести слухачів колекцій і віддається незмінним обʼєктом. Перед віддачею відкидаються сироти: послуги без обʼєкта, місяці без обʼєкта, показники/дні/суми без послуги (R9). Порядок масивів — за `createdAt` (обʼєкти, послуги), щоб екрани бачили той самий порядок, що й зараз.

## Каскади (як зараз у `local-ledger-repository.ts`)

- `deleteObject(id)` → обʼєкт, його послуги, місяці, показники/дні/суми цих послуг.
- `deleteService(id)` → послуга, її показники/дні/суми.
- `deleteMonth(objectId, month)` → місяць і показники/дні/суми послуг обʼєкта за цей місяць.
- `moveMonth(objectId, from, to)` → видалення документів `…_{from}` і створення `…_{to}` з тими самими полями (ідентифікатор природний, тож перенесення — це delete + set).
- `resetEntry(serviceId, month)` → видалення трьох документів `…/{serviceId}_{month}`.
