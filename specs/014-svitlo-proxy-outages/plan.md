# Implementation Plan: Графіки відключень для інших міст (svitlo-proxy)

**Branch**: `feature/outage-providers` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-svitlo-proxy-outages/spec.md`

## Summary

21 місто зі списку отримує графік відключень із svitlo-proxy — одного JSON на всю Україну з 30-хвилинними слотами (агрегатор сайту svitlo.live). Полтава й Кременчук лишаються на POE. Технічно це один новий модуль постачальника з фабрикою `createSvitloProvider(config)` і таблицею 21 регіону, спільною памʼяттю відповіді на 2 хв (один запит на всі міста), розбором кодів `1/2/3/0` у наявні `on/off/maybe` і «день без графіка». В інтерфейсі лише дві зміни: підпис «Дані: svitlo.live…» на екрані налаштувань і «перевірено о …» в підзаголовку. Херсон лишається в «Незабаром».

## Technical Context

**Language/Version**: TypeScript (strict), React 19 / React Native, Expo SDK 58 (`expo@^58.0.14`)

**Primary Dependencies**: Expo Router, `fetch` (вбудований), `expo-web-browser` (посилання на сайт обленерго — уже є), `expo-notifications` (попередження — уже є). Нових залежностей немає.

**Storage**: `KeyValueStorage` (AsyncStorage) — наявний кеш `outageSchedule:<providerId>`; налаштування міста й черг у Firestore — без змін формату.

**Testing**: тестового раннера в проєкті немає; разовий скрипт для `parseSvitloRegion` на збереженій відповіді, `ui-check` (`outages.flow`) в iOS Simulator, ручна звірка з сайтами обленерго ([quickstart.md](quickstart.md)).

**Target Platform**: iOS і Android (web — лише локальні налаштування, той самий код постачальника).

**Project Type**: mobile-app

**Performance Goals**: перше відкриття вкладки з порожнім кешем — графік ≤ 2 с на мобільному інтернеті (відповідь ~5 КБ gzip, ~0,1–0,3 с); перемикання між містами svitlo-proxy протягом 2 хв — без запитів у мережу.

**Constraints**: офлайн — показ кешу як для POE; джерело неофіційне, без SLA; розбір ~320 КБ JSON на кожне отримання — один раз на 2 хв.

**Scale/Scope**: 21 новий постачальник (+1 наявний), до 60 черг у регіоні, 2 дні.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Перевірка | Статус |
|---|---|---|
| I. Expo за документацією версії | Expo API не додаються й не змінюються: лише `fetch` і вже використані `expo-web-browser`, `expo-notifications`. Нових пакетів немає. | ✅ |
| II. Expo Router і `src/` | Новий код — `src/services/outages/providers/`, правки в `src/views/outages/` та двох наявних екранах `src/app/(tabs)/(outages)/`. Нових маршрутів немає. | ✅ |
| III. CNG | `ios/`, `android/` і `app.json` не змінюються. **OTA-оновлення**, нова development build не потрібна. | ✅ |
| IV. Дизайн і патерни | Артборди: «20 · Відсутність світла — черга 1.1» (підзаголовок), «20b · Завтра — графік ще не опубліковано» (день без даних), «21b · Налаштування — обрано 1.1 і 3.1» (сітка черг), «21c · Вибір міста» (розділи), «21d · Київ — постачальник ще не доданий» і «20c · Місто без постачальника (Київ)» — стають прикладом Херсона. Новий артборд «21e · Налаштування — Київ, дані svitlo.live» з підписом про джерело і 60 чипами. Патерн `docs/patterns/outage-providers.md` оновлюється (окрема задача). | ✅ |
| V. Українська мова | Тексти UI українською («перевірено о», підпис про джерело); артефакти українською. | ✅ |
| VI. Lint і typecheck | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit`. | ✅ |

Порушень немає — Complexity Tracking не заповнюється.

**Після Phase 1**: дизайн (data-model, contracts) не вводить нових залежностей, маршрутів чи нативних змін; зміна інтерфейсу `OutageProvider` (необовʼязкові `dataSource` і `options.force`) сумісна з POE. ✅

## Project Structure

### Documentation (this feature)

```text
specs/014-svitlo-proxy-outages/
├── spec.md
├── plan.md              # цей файл
├── research.md          # R1–R8: формат джерела, звірка, памʼять, таблиця регіонів
├── data-model.md        # OutageProvider (+dataSource, +options.force), коди слотів, SvitloRegionConfig
├── quickstart.md        # перевірка: розбір, шторка, Київ/Львів, Полтава, звірка
├── contracts/
│   ├── svitlo-proxy.md  # формат відповіді й що вважати помилкою
│   └── ui.md            # тексти й умови показу на екранах
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/services/outages/
├── types.ts                         # OutageProvider: + dataSource?, fetchSchedule(signal?, options?)
├── registry.ts                      # outageProviders = [poltavaoblenergo, ...svitloProviders]
├── schedule.ts                      # + formatCheckedTime(fetchedAt, timeZone) (або в index.tsx)
└── providers/
    ├── poltavaoblenergo.ts          # без змін поведінки (ігнорує options)
    ├── svitlo-proxy.ts              # НОВЕ: fetch + памʼять (TTL, in-flight), parseSvitloRegion, createSvitloProvider
    └── svitlo-regions.ts            # НОВЕ: 21 SvitloRegionConfig (research.md R5)

src/providers/outage-provider.tsx    # useOutageSchedule: refresh() → fetchSchedule(signal, { force: true })

src/app/(tabs)/(outages)/
├── index.tsx                        # підзаголовок: «оновлено о» / «перевірено о»
└── outage-settings.tsx              # підпис про dataSource під карткою міста

src/views/outages/outage-city-sheet.tsx  # без змін (розділи рахуються від реєстру) — лише перевірка

docs/patterns/outage-providers.md    # розділ «svitlo-proxy», привʼязка міст, «перевірено о», день без даних
.claude/skills/ui-check/flows/outages.flow  # НОВЕ: шторка міст, Київ, Львів, підпис джерела
```

**Structure Decision**: усе в наявному модулі `src/services/outages/` за правилом «нове місто = файл у `providers/` + рядок у `registry.ts`». Таблицю регіонів винесено в окремий файл, щоб модуль джерела лишався про формат і памʼять, а дані про обленерго редагувались окремо.

## Ризики

- **svitlo-proxy недоступний / змінив формат** → вкладка показує кеш і примітку; розбір кидає зрозумілу помилку на відсутній `regions`/регіон. Окремого запасного джерела в обсязі немає.
- **Код `3`** трактується як `maybe` — звірити з Миколаївщиною (quickstart, крок 4).
- **60 чипів Києва** — довгий екран налаштувань; рішення користувача (уточнення 1).

## Complexity Tracking

Не потрібно — порушень конституції немає.
