---

description: "Task list for 014-svitlo-proxy-outages"
---

# Tasks: Графіки відключень для інших міст (svitlo-proxy)

**Input**: Design documents from `/specs/014-svitlo-proxy-outages/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/svitlo-proxy.md](contracts/svitlo-proxy.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: автотестів специфікація не вимагає, тестового раннера в проєкті немає. Перевірка — разовий скрипт розбору на збереженій відповіді (у scratchpad, не в репозиторії), `ui-check` (`outages.flow`), ручні сценарії [quickstart.md](quickstart.md), lint і typecheck.

**Organization**: US1 — графік для свого міста (P1, MVP), US2 — Полтава й Кременчук без змін (P1), US3 — день без графіка (P2). Перед правками екранів прочитати `docs/patterns/outage-providers.md`, `docs/patterns/test-ids.md` і артборди «20 · Відсутність світла — черга 1.1», «20b · Завтра — графік ще не опубліковано», «21b · Налаштування — обрано 1.1 і 3.1», «21c · Вибір міста», «21d · Київ — постачальник ще не доданий» (канвас — `docs/design.md`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (різні файли, без залежностей)
- **[Story]**: US1–US3 зі [spec.md](spec.md)

---

## Phase 1: Setup

**Purpose**: зразок відповіді джерела для розбору

- [ ] T001 Зберегти поточну відповідь `curl -s --compressed https://svitlo-proxy.svitlo-proxy.workers.dev/` у scratchpad сесії (не в репозиторій) і звірити з [contracts/svitlo-proxy.md](contracts/svitlo-proxy.md): є `date_today`, `date_tomorrow`, `regions[]` з `cpu`, `schedule`; набір `cpu` містить усі 21 регіон з таблиці research R5; черги кожного регіону збігаються з колонкою «Черги» R5. Розбіжності записати в `specs/014-svitlo-proxy-outages/research.md` R5

---

## Phase 2: Foundational

**Purpose**: розширення інтерфейсу постачальника, спільне для всіх історій

**⚠️ CRITICAL**: жодна історія не починається до завершення фази

- [ ] T002 У `src/services/outages/types.ts` в `OutageProvider` додати необовʼязкове поле `dataSource?: { name: string; url: string }` з коментарем «неофіційний посередник, звідки беруться дані; вмикає підпис на екрані налаштувань» і змінити сигнатуру на `fetchSchedule(signal?: AbortSignal, options?: { force?: boolean }): Promise<OutageSchedule>` з коментарем «force — pull-to-refresh: обійти памʼять постачальника й піти в мережу»; додати тип `FetchScheduleOptions = { force?: boolean }` і використати його в сигнатурі
- [ ] T003 У `src/providers/outage-provider.tsx` в `useOutageSchedule` змінити `fetchSchedule` на `async (options?: FetchScheduleOptions)` і передавати `options` у `provider.fetchSchedule(current.signal, options)`; `refresh()` (pull-to-refresh і кнопка «Спробувати ще раз») викликає `fetchSchedule({ force: true })`, а `refreshIfStale` і перше завантаження — без `force`. `src/services/outages/providers/poltavaoblenergo.ts` не змінюється (другий параметр ігнорується)

**Checkpoint**: typecheck проходить, поведінка Полтави без змін

---

## Phase 3: User Story 1 - Графік для свого міста (Priority: P1) 🎯 MVP

**Goal**: 21 місто з «Незабаром» отримує графік із svitlo-proxy: шторка міст, черги регіону, графік, попередження, підпис джерела, «перевірено о …».

**Independent Test**: обрати «Київ», черги 1.1 і 30.1 → вкладка «Світло» показує «ДТЕК Київські електромережі · перевірено о HH:MM» і графік на сьогодні, що збігається з Yasno / сайтом ДТЕК; у налаштуваннях під карткою міста — підпис про svitlo.live; у шторці міст у «Незабаром» лише Херсон.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Створити `src/services/outages/providers/svitlo-regions.ts`: тип `SvitloRegionConfig = { cpu: string; city: string; name: string; lookupUrl: string; queues: readonly QueueId[] }` і масив `svitloRegions: readonly SvitloRegionConfig[]` рівно з 21 записом таблиці research R5 (місто — точна назва з `src/constants/cities.ts`; Херсона немає). Черги: хелпер `subQueues(n)` → `1.1, 1.2, …, n.1, n.2` для 6 груп; Київ — `Array.from({ length: 60 }, (_, i) => \`${i + 1}.1\`)`; Чернівці — `'1'`…`'12'`. Тернопіль — `lookupUrl: 'https://www.toe.com.ua/'` (сайт за Cloudflare, користувач проходить перевірку в браузері)
- [ ] T005 [P] [US1] Створити `src/services/outages/providers/svitlo-proxy.ts` з чистою функцією `parseSvitloRegion(payload: unknown, config: SvitloRegionConfig, receivedAt: Date): OutageSchedule` за [data-model.md](data-model.md) і [contracts/svitlo-proxy.md](contracts/svitlo-proxy.md): `providerId` — `svitlo-${config.cpu}`; кидає `Error` («svitlo-proxy: немає regions» / «svitlo-proxy: регіон <cpu> без графіка»), якщо `regions` не масив або регіону немає чи `schedule: null`; для кожної дати й кожної черги з `config.queues` будує 48 слотів (`"HH:MM"` → індекс `(HH*60+MM)/30`): `1 → 'on'`, `2 → 'off'`, `3 → 'maybe'`, `0` серед інших кодів або відсутній ключ → `'maybe'`; чергу, у якої всі 48 слотів `0` (або немає даних на дату), у день не додає; день без жодної черги не додає; `days` сортує за датою; `updatedLabel` — `undefined`; `fetchedAt` — `receivedAt.toISOString()`; черги з відповіді, яких немає в `config.queues`, ігнорує
- [ ] T006 [US1] У `src/services/outages/providers/svitlo-proxy.ts` додати модульну памʼять і запит (research R4): `const ENDPOINT = 'https://svitlo-proxy.svitlo-proxy.workers.dev/'`; `let memory: { payload: unknown; receivedAt: Date } | undefined`; `let inFlight: Promise<{ payload; receivedAt }> | null`; `loadPayload({ force })` — якщо `inFlight` є, повертає його; якщо `!force` і `memory` молодша за `SCHEDULE_TTL_MS` (2 хв — імпортувати з `src/providers/outage-provider.tsx` не можна, тож винести константу `SCHEDULE_TTL_MS` у `src/services/outages/types.ts` і реекспортувати з `src/providers/outage-provider.tsx` під тим самим імʼям), повертає памʼять; інакше `fetch(ENDPOINT)` без сигналу, перевіряє `response.ok` (помилка «svitlo-proxy responded with <status>»), `response.json()`, кладе в `memory`, у `finally` скидає `inFlight`. Обгортка `waitFor(promise, signal)` відхиляє з `AbortError`, коли спрацьовує `signal`, не скасовуючи спільний запит
- [ ] T007 [US1] У `src/services/outages/providers/svitlo-proxy.ts` експортувати `createSvitloProvider(config: SvitloRegionConfig): OutageProvider` — `id: \`svitlo-${config.cpu}\``, `name: config.name`, `cities: [config.city]`, `queues: config.queues`, `timeZone: 'Europe/Kyiv'`, `lookupUrl: config.lookupUrl`, `dataSource: { name: 'svitlo.live', url: 'https://svitlo.live/' }`, `fetchSchedule(signal, options)` → `waitFor(loadPayload({ force: options?.force }), signal)` → `parseSvitloRegion(...)`; і `export const svitloProviders = svitloRegions.map(createSvitloProvider)`
- [ ] T008 [US1] У `src/services/outages/registry.ts` змінити `outageProviders` на `[poltavaoblenergo, ...svitloProviders]` (POE першим, щоб Полтава й Кременчук ніколи не дісталися svitlo-proxy) і оновити коментар («Полтава й Кременчук — POE, решта міст — svitlo-proxy, таблиця в providers/svitlo-regions.ts»)
- [ ] T009 [US1] Разовим скриптом у scratchpad (не в репозиторії; через `bunx tsx` чи `npx tsx` із шляхом до `src/services/outages/providers/svitlo-proxy.ts`) прогнати `parseSvitloRegion` на відповіді з T001 для `kyiv`, `lvivska-oblast`, `chernivetska-oblast`, `mikolaivska-oblast`, `poltavska-oblast` і перевірити очікування [quickstart.md](quickstart.md) крок 1 (Київ — 60 черг по 48 слотів; Львів без даних → `days: []` без помилки; Чернівці — черги `1`…`12`; Миколаїв — `3` → `maybe`); перевірити, що для кожного з 23 міст `src/constants/cities.ts`, крім Херсона, `getProviderForCity` повертає рівно одного постачальника, а для Полтави й Кременчука — `poltavaoblenergo`
- [ ] T010 [P] [US1] У `src/app/(tabs)/(outages)/index.tsx` у `ScheduleScreen` змінити підзаголовок за [contracts/ui.md](contracts/ui.md): під час запиту — « · оновлюємо…» (без змін); є `updatedTime` з `schedule.updatedLabel` — « · оновлено о HH:MM» (без змін); інакше, якщо є `schedule.fetchedAt`, — « · перевірено о HH:MM», де час — `fetchedAt` у `provider.timeZone`: додати в `src/services/outages/schedule.ts` функцію `formatZonedTime(iso: string, timeZone: string): string | undefined` (через `getZonedNow(timeZone, new Date(iso))` і `formatTime`, `undefined` для невалідної дати) і використати її
- [ ] T011 [P] [US1] У `src/app/(tabs)/(outages)/outage-settings.tsx` після `</ListCard>` блоку міста (усередині того самого `VStack`, де картка міста) показувати, якщо `provider?.dataSource` є, `ThemedText` `font='caption'` `color='muted'` `testID='outageSettings.dataSource'` з текстом «Дані: {provider.dataSource.name}, не офіційне джерело — звіряйте з сайтом обленерго» (для POE підпису немає); відступи — як у наявних підписів під картками на цьому екрані (звірити з артбордом «21b · Налаштування — обрано 1.1 і 3.1»). Перевірити, що сітка `QueueToggle` з 60 чипами Києва переноситься в рядки й екран скролиться (FR-013), без змін верстки
- [ ] T012 [US1] Перевірити `src/views/outages/outage-city-sheet.tsx`: розділ «Доступно» показує 23 міста, «Незабаром» — лише Херсон, під назвою міста — `provider.name`; правок не очікується — якщо щось розходиться з [contracts/ui.md](contracts/ui.md), виправити тут
- [ ] T013 [US1] Пройти [quickstart.md](quickstart.md) кроки 2 і 3.1–3.2, 3.5–3.7 в iOS Simulator (Київ: підпис, 60 черг, підзаголовок, графік; перемикання міст за 2 хв — один запит; pull-to-refresh змінює «перевірено о»; офлайн — збережений графік); увімкнути «Попереджати перед вимкненням» для Києва й переконатися, що попередження плануються (FR-008)

**Checkpoint**: 21 нове місто показує графік; можна випускати OTA

---

## Phase 4: User Story 2 - Полтава й Кременчук без змін (Priority: P1)

**Goal**: POE лишається джерелом для Полтави й Кременчука з перемиканням і «оновлено о …».

**Independent Test**: обрати Полтаву, чергу 1.1 → «Полтаваобленерго · оновлено о …», проміжки перемикання як на poe.pl.ua, підпису про svitlo.live немає.

### Implementation for User Story 2

- [ ] T014 [US2] Пройти [quickstart.md](quickstart.md) крок 5 для Полтави й Кременчука: постачальник `poltavaoblenergo`, підзаголовок «оновлено о HH:MM» з `updatedLabel`, перемикання після вимкнень показано, підпису `outageSettings.dataSource` немає; акаунт із збереженим містом Полтава й назвами черг після оновлення не втрачає налаштувань і кешу `outageSchedule:poltavaoblenergo` (FR-009). Якщо щось змінилось — виправити в `src/app/(tabs)/(outages)/index.tsx` або `src/services/outages/registry.ts`

**Checkpoint**: Полтава ідентична поведінці до фічі (SC-003)

---

## Phase 5: User Story 3 - День без графіка (Priority: P2)

**Goal**: день, для якого джерело не має даних, показується як «Графік … не опубліковано», не як «світло весь день» і не як помилка.

**Independent Test**: обрати Львів (зараз дані `0` на обидва дні) → «Графік на сьогодні не опубліковано» і «Графік на завтра ще не опубліковано», без «Спробувати ще раз», підзаголовок «Львівобленерго · перевірено о …».

### Implementation for User Story 3

- [ ] T015 [US3] Перевірити, що `DayContent` у `src/app/(tabs)/(outages)/index.tsx` для черги, якої немає в дні (`findDay(...)?.queues[queue]` → `undefined`), показує наявний стан «Графік на сьогодні не опубліковано» / «Графік на завтра ще не опубліковано» з текстом «Щойно {provider.name} його оприлюднить…», а `schedule` з `days: []` не веде в гілку «Не вдалося завантажити графік»; переконатися, що `getPowerStatus` у `src/services/outages/schedule.ts` для сьогоднішнього дня без даних не показує «Світло є» в картці статусу (якщо показує — для дня без слотів картку статусу не рендерити)
- [ ] T016 [US3] Перевірити `src/services/outages/notifications.ts`: `syncOutageNotifications` для черги без слотів на день не планує попереджень (ітерує лише наявні `days[].queues`); пройти [quickstart.md](quickstart.md) крок 3.3–3.4 у симуляторі (Київ «Завтра» до оголошення графіка; Львів)

**Checkpoint**: усі три історії працюють незалежно

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Оновити `docs/patterns/outage-providers.md`: у «Як влаштовано» додати рядки `providers/svitlo-proxy.ts` (запит, памʼять 2 хв на всі міста, `parseSvitloRegion`) і `providers/svitlo-regions.ts` (таблиця регіонів); у «Як додати місто» — варіант «регіон svitlo-proxy = запис у `svitlo-regions.ts`»; новий розділ «svitlo-proxy» (формат, коди `1/2/3/0`, день без даних, `force` для pull-to-refresh, `dataSource` і підпис на екрані налаштувань, «перевірено о …» замість «оновлено о …», Тернопіль за Cloudflare); у «Вигляд» — правило підзаголовка; індекс `docs/patterns/README.md` — оновити опис рядка, якщо він згадує лише Полтаву
- [ ] T018 [P] Оновити канвас (`docs/design.md`, інструмент Artifact): новий артборд «21e · Налаштування — Київ, дані svitlo.live» (картка міста «Київ / ДТЕК Київські електромережі», підпис «Дані: svitlo.live, не офіційне джерело — звіряйте з сайтом обленерго», сітка 60 чипів 1.1…60.1); артборди «20c · Місто без постачальника (Київ)» і «21d · Київ — постачальник ще не доданий» переробити на Херсон («Херсонобленерго» / «Постачальник ще не доданий»); на «20 · Відсутність світла — черга 1.1» підзаголовок лишити «оновлено о» (це Полтава)
- [ ] T019 [P] Створити `.claude/skills/ui-check/flows/outages.flow` за зразком `.claude/skills/ui-check/flows/profile.flow` і `docs/patterns/test-ids.md`: відкрити налаштування графіка (`outageSettings.screen`), шторка міст — `see` «Херсон» у «Незабаром»; обрати «Київ» → `wait id=outageSettings.dataSource`, `see id=outageSettings.queue.60.1`; обрати «Львів» → зберегти чергу 1.1 → вкладка «Світло»: `see` «Графік на сьогодні не опубліковано», `nosee` «Спробувати ще раз»; обрати «Полтава» → `gone id=outageSettings.dataSource`. Прогнати `.claude/skills/ui-check/scripts/ui run .claude/skills/ui-check/flows/outages.flow` і записати результат у T019
- [ ] T020 Користувач звіряє графіки з офіційними сайтами для обраних міст ([quickstart.md](quickstart.md) крок 4), зокрема Миколаїв (код `3`); розбіжності — нові задачі в цьому файлі
- [ ] T021 У `specs/014-svitlo-proxy-outages/spec.md` поставити **Status**: Implemented і додати **Підсумок** українською (що змінилось, що перевірено, що ні)
- [ ] T022 Запустити `npx expo lint` і `npx tsc --noEmit` (у Bun-проєкті — `bunx`), виправити всі помилки

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002 → T003)** → історії.
- **US1**: T004 і T005 разом → T006 → T007 → T008 → T009; T010, T011 після T002 (паралельно з T004–T009) → T012 → T013.
- **US2 (T014)** — після T008 (реєстр із POE першим); від решти US1 не залежить.
- **US3 (T015, T016)** — після T005 (розбір нульових днів) і T008.
- **Polish**: T017, T018, T019 разом після US1–US3 → T020 → T021 → T022.

## Parallel Example: User Story 1

```text
T004 svitlo-regions.ts        ┐
T005 parseSvitloRegion        ├─ різні файли, одночасно
T010 підзаголовок index.tsx   │
T011 підпис outage-settings   ┘
```

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 → 21 нове місто з графіком; можна випускати OTA.
2. **+US2**: підтвердити, що Полтава не змінилась.
3. **+US3**: дні без даних.
4. Polish: патерн, канвас, флоу, звірка користувачем, статус, lint і typecheck.

Комітити після кожної фази (коміт зі зміною патерну містить і файл `docs/patterns/`).
