# Data Model: Графіки відключень для інших міст (svitlo-proxy)

Наявні типи — `src/services/outages/types.ts`. Зміни мінімальні: нових збережених даних немає, формат кешу `OutageSchedule` не змінюється.

## OutageProvider (змінюється)

| Поле | Тип | Зміна | Примітка |
|---|---|---|---|
| `id` | `string` | — | для svitlo-proxy: `svitlo-<cpu>`, напр. `svitlo-kyiv`; ключ кешу `outageSchedule:<id>` |
| `name` | `string` | — | назва обленерго (R5), показується в підзаголовку й у налаштуваннях |
| `cities` | `readonly string[]` | — | рівно одне місто на постачальника svitlo-proxy |
| `queues` | `readonly QueueId[]` | — | статичний список регіону (R5) у порядку номерів |
| `timeZone` | `string` | — | `Europe/Kyiv` |
| `lookupUrl` | `string?` | — | офіційний сайт обленерго (R5) |
| `dataSource` | `{ name: string; url: string }?` | **нове** | є лише в постачальників svitlo-proxy: `{ name: 'svitlo.live', url: 'https://svitlo.live/' }`; вмикає підпис на екрані налаштувань |
| `fetchSchedule` | `(signal?, options?: { force?: boolean }) => Promise<OutageSchedule>` | **новий параметр `options`** | `force` — pull-to-refresh, обходить памʼять svitlo-proxy; POE ігнорує |

**Правила**: кожне місто з `src/constants/cities.ts` має не більше одного постачальника; Полтава й Кременчук — лише `poltavaoblenergo`; Херсон — жодного.

## OutageSchedule (без змін у типі)

| Поле | Для svitlo-proxy |
|---|---|
| `providerId` | `svitlo-<cpu>` |
| `days` | лише дні, де хоча б одна черга має ненульові слоти; у `queues` дня — лише черги з конфігурації з ненульовими слотами |
| `updatedLabel` | `undefined` — джерело не дає часу зміни графіка |
| `fetchedAt` | час отримання відповіді з мережі (не час розбору з памʼяті) |

**Відображення часу в підзаголовку**: `updatedLabel` є → «оновлено о HH:MM» (POE, як зараз); немає → «перевірено о HH:MM» з `fetchedAt` у `timeZone` постачальника.

## Слот: код svitlo-proxy → SlotState

| Код | SlotState | Примітка |
|---|---|---|
| `1` | `on` | |
| `2` | `off` | |
| `3` | `maybe` | припущення, звірити з Миколаївщиною |
| `0` у дні, де вся черга `0` | — | черга не потрапляє в день → «Графік … не опубліковано» |
| `0` серед інших кодів | `maybe` | не траплялось; не обіцяємо світло |
| інше / відсутній ключ слоту | `maybe` | |

Слот `HH:MM` → індекс `(HH*60+MM)/30`; день, де після розбору не 48 слотів, відкидається для цієї черги.

## SvitloRegionConfig (нове, лише в коді)

| Поле | Тип | Приклад |
|---|---|---|
| `cpu` | `string` | `lvivska-oblast` |
| `city` | `string` | `Львів` |
| `name` | `string` | `Львівобленерго` |
| `lookupUrl` | `string` | `https://poweron.loe.lviv.ua/` |
| `queues` | `readonly QueueId[]` | `1.1`…`6.2` |

21 запис (R5) → 21 `OutageProvider` через фабрику.

## Памʼять svitlo-proxy (нове, лише в памʼяті процесу)

| Поле | Опис |
|---|---|
| `payload` | остання розібрана JSON-відповідь |
| `receivedAt` | `Date` отримання з мережі |
| `inFlight` | `Promise` поточного запиту або `null` |

Не зберігається між запусками — після перезапуску діє кеш `outageSchedule:<id>` у `KeyValueStorage` з TTL від `fetchedAt`.
