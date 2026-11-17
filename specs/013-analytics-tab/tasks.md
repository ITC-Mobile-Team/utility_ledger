---

description: "Task list for 013-analytics-tab"
---

# Tasks: Вкладка «Аналітика»

**Input**: Design documents from `/specs/013-analytics-tab/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/interfaces.md](contracts/interfaces.md), [quickstart.md](quickstart.md)

**Tests**: автотестів специфікація не вимагає. Перевірка — `ui-check` (`analytics.flow`), ручні сценарії [quickstart.md](quickstart.md), lint і typecheck.

**Organization**: US1 — витрати за період (P1, MVP), US2 — вибір періоду (P1), US3 — вибір адреси (P2), US4 — деталі витрат (P3). Перед версткою кожного екрана прочитати артборд з `docs/design.md` (14, 14a–14d, 15) і патерни з `docs/patterns/` (`navigation-bar-title`, `navigation-bar-icon-buttons`, `tab-bar`, `pickers`, `empty-state-pulse`, `user-data`, `icons`, `buttons`, `test-ids`, `reanimated`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (різні файли, без залежностей)
- **[Story]**: US1–US4 зі [spec.md](spec.md)

---

## Phase 1: Setup

**Purpose**: маршрути вкладки, іконки й форми множини

- [X] T001 Звірити з документацією Expo SDK 58 (`https://docs.expo.dev/versions/v58.0.0/`, розділи expo-router: Stack, native tabs з вкладеним стеком, typed routes, `useLocalSearchParams`) підхід із research R1 і записати висновок (посилання й розбіжності, якщо є) у `specs/013-analytics-tab/research.md` R1 (конституція, принцип I); потім видалити заглушку `src/app/(tabs)/analytics.tsx`, створити `src/app/(tabs)/analytics/_layout.tsx` — `Stack` з `screenOptions={{ headerShown: false }}` і екранами `index`, `details` (за зразком `src/app/(tabs)/profile/_layout.tsx`), тимчасовий `src/app/(tabs)/analytics/index.tsx` з `NavigationView` `title='Аналітика'`, `barType='green'`, `testID='analytics.screen'` і заглушку `src/app/(tabs)/analytics/details.tsx` (`NavigationView` з «Назад»), щоб маршрут `details` існував до T027
- [X] T002 У `src/app/(tabs)/_layout.tsx` додати `segments[1] === 'analytics'` до умови `isTabBarHidden` (оновити коментар) і тригеру `analytics` — `disableAutomaticContentInsets={ownsInsets}`
- [X] T003 [P] У `src/constants/app-icons.tsx` додати `chart: '📊'`; у `src/constants/icon-sizes.ts` в `iconTones` — `chart: 'greenSoft'` і `arrowUpRight: 'blueSoft'` (research R11, R12)
- [X] T004 [P] У `src/services/ledger/format.ts` в `pluralForms` додати `record: ['запис', 'записи', 'записів']` і `serviceKind: ['вид послуг', 'види послуг', 'видів послуг']`
- [X] T005 [P] У `src/constants/service-icons.ts` додати `getServiceAccent(icon): AppColor` — насичений колір розділу (`amberSoft → amber`, `waterSoft → water`, `gasSoft → gas`, `greenSoft → green`, `blueSoft → blue`, інакше `purple`) і `pickServiceAccents(icons: string[]): AppColor[]`, що при повторі бере наступний вільний з `amber, water, gas, green, blue, purple, coral` (research R10)

---

## Phase 2: Foundational

**Purpose**: обчислення й стан вибору, спільні для всіх історій

**⚠️ CRITICAL**: жодна історія не починається до завершення фази

- [X] T006 Створити `src/services/analytics/types.ts` — `CalendarDate`, `AnalyticsPeriod`, `AnalyticsSelection`, `AnalyticsSummary`, `AnalyticsMonth`, `AnalyticsServiceTotal`, `AddressOption` точно за [data-model.md](data-model.md) і [contracts/interfaces.md](contracts/interfaces.md)
- [X] T007 [P] Створити `src/services/analytics/period.ts` — `todayDate`, `getDefaultPeriod` («`{ поточний рік, 0, 1 }` → сьогодні»), `compareDates`, `isSameDate`, `getPeriodMonths` (від `toMonthKey(start)` до `toMonthKey(end)` включно; місяць входить, якщо перетинається з періодом хоч одним днем — FR-005)
- [X] T008 [P] Створити `src/services/analytics/format.ts` — `formatShortDate` («1 бер 2026», скорочення `січ лют бер кві тра чер лип сер вер жов лис гру`), `formatMonthShort` («Січ»), `formatPeriodMonths` («Січень – серпень 2026»; різні роки — «Листопад 2025 – березень 2026»; один місяць — «Серпень 2026») (research R13)
- [X] T009 Створити `src/services/analytics/summary.ts`: `toPercents` (найбільші залишки, сума рівно 100, для нуля — усі 0); `getDefaultSelection` і `normalizeSelection` (перший обʼєкт `getAnalyticsObjects` у порядку списку «Обʼєкти» — активні, потім архівовані з аналітикою; `all` лише коли обʼєктів > 1; зниклий обʼєкт → перший доступний; немає обʼєктів → `null`); `summarizeAnalytics` — лише місяці, додані до обʼєкта (`state.months`) і з `getPeriodMonths` (research R3), суми через `calculateMonth`/`calculateService` з `amount !== null`; групування послуг за `service.id` або для `all` за `name.trim().toLocaleLowerCase('uk') + '|' + icon`; `recordCount`, `addressCount`, `consumption` (`consumption + night?.consumption`, лише `meter`, лише за однакової одиниці в групі), `accent` через `pickServiceAccents`; `average` = `total / місяці з нарахуванням` або `null`; `filledMonthCount` за `getMonthStatus` (для `all` — заповнено в усіх адресах, де місяць додано); `isEmpty`; послуги з `amount > 0` від найбільшої (research R4–R6)
- [X] T010 У `src/services/analytics/summary.ts` додати `getAddressOptions(state, period)` — адреси (`formatShortAddress`, «N послуг · м. Місто», без міста — «N послуг», сума, `ratio` від усіх) і останнім «Усі адреси» («N адрес · M видів послуг») лише коли адрес > 1; створити `src/services/analytics/index.ts` з реекспортом
- [X] T011 Створити `src/providers/analytics-selection-provider.tsx` — `AnalyticsSelectionProvider` (`useState` для `period` = `getDefaultPeriod()` і сирого `selection`; без збереження в сховище — FR-011) і `useAnalyticsSelection()`, що повертає нормалізований через `normalizeSelection(useLedgerState(), …)` вибір; обгорнути `Stack` у `src/app/(tabs)/analytics/_layout.tsx`

**Checkpoint**: обчислення й стан готові

---

## Phase 3: User Story 1 — Витрати за період (Priority: P1) 🎯 MVP

**Goal**: головний екран з карткою «Витрати», графіком, плитками й списками «Послуги / Місяці» для адреси за замовчуванням і періоду з 1 січня

**Independent Test**: адреса з двома послугами й заповненими місяцями → «Аналітика» → сума картки дорівнює сумі підсумків екранів розрахунку; стовпчик на кожен місяць; відсотки послуг разом 100 (quickstart 1–4, 9)

- [X] T012 [P] [US1] Створити `src/views/analytics/month-bars.tsx` — `MonthBars({ months })`: ≤ 12 останніх місяців, висота `round(ratio × 46)` (мін. 2 pt для ненульових), радіус 6, останній `greenBrand`, решта `greenSoft2`, підписи `formatMonthShort` 10 pt `muted`; > 12 — підпис «Останні 12 місяців»; один елемент доступності з описом «Витрати по місяцях, <період>: найбільше в <місяць>» (research R9, FR-015)
- [X] T013 [P] [US1] Створити `src/views/analytics/expenses-card.tsx` — `ExpensesCard({ summary, onPress })` за артбордом 14: плитка ↗️ (`AppImage icon='arrowUpRight'`, коло `iconTiles.touch`, підкладка `blueSoft`, гліф по центру — FR-016) і бейдж «UAH»; «Витрати» + `formatMoney(total)`; `MonthBars`; «У середньому X на місяць» (лише коли `average !== null`); плитки «Послуги» (`serviceCount`) і «Місяців заповнено»; `Pressable` з `testID='analytics.total'`
- [X] T014 [P] [US1] Створити `src/views/analytics/service-row.tsx` — `AnalyticsServiceRow({ item, variant, index, onPress })`: `ServiceIcon`, назва, підпис (`list`: «8 записів» або «2 адреси · 16 записів»; `details`: «1 520 кВт·год · 8 записів» через `formatReading`), сума й «73%»; `testID` `analytics.service.<i>` / `analytics.details.service.<i>`
- [X] T015 [P] [US1] Створити `src/views/analytics/month-row.tsx` — `AnalyticsMonthRow({ item, variant, index, onPress })`: emoji місяця з `monthAppearance` на його підкладці (`EmojiTile`), назва; `list` — смужка `ratio` (`track` / `green`), сума праворуч мін. 96 pt; `details` — підпис «X% від періоду»; `testID` `analytics.month.<i>` / `analytics.details.month.<i>`
- [X] T016 [P] [US1] Створити `src/views/account-data/analytics-skeleton.tsx` — `AnalyticsSkeleton` на `SkeletonBone` + `useSkeletonShine` (рядок адреси, картка, сегмент, 3 рядки); експорт у `src/views/account-data/index.ts`
- [X] T017 [US1] Створити `src/views/analytics/index.ts` з експортами й зібрати `src/app/(tabs)/analytics/index.tsx`: `NavigationView` (`title='Аналітика'`, `barType='green'`), вміст у `AccountDataGate skeleton={<AnalyticsSkeleton />}`; рядок адреси як статичний `ListRow` (🏢/🏠, назва, підпис); `ExpensesCard`; `Segment` «Послуги / Місяці» (`testID='analytics.tabs'`); списки в `ListCard`; порожній період — «За цей період ще немає записів»; немає адрес — `EmptyStateView` (`icon='chart'`, «Тут будуть витрати», «Додайте адресу й внесіть показники — і тут зʼявиться, скільки ви платите щомісяця», `testID='analytics.empty'`) за `empty-state-pulse.md`
- [X] T018 (iOS і Android, світла й темна) [US1] Звірити екран з артбордами 14 і 14a у світлій і темній темі (iOS і Android): відступи, шрифти, кольори з токенів; довга адреса — один рядок із трикрапкою; плитка ↗️ — відступи по краях однакові ±0,5 pt (quickstart 13)

**Checkpoint**: MVP — вкладка показує витрати з 1 січня для першої адреси

---

## Phase 4: User Story 2 — Вибір періоду (Priority: P1)

**Goal**: кнопки «Від» / «До» в навбарі і шторка з календарем днів

**Independent Test**: «Від» → 1 березня → «Готово» → «1 бер 2026», сума з березня; «Скасувати» не змінює період; дні після сьогодні в «До» неактивні (quickstart 5, 10)

- [X] T019 [P] [US2] Створити `src/views/analytics/period-button.tsx` — `AnalyticsPeriodButton({ label, date, active, disabled, onPress, testID })`: висота 52, радіус 16, фон `rgba(255,255,255,.16)` (активна — `.32` з білою обвідкою 1,5), підпис 12 pt `heroSubGreen`, дата `formatShortDate` 15 pt semibold білим, 📅 праворуч через `AppImage`; a11y «Початкова дата, 1 січ 2026» / «Кінцева дата, …» (research R7)
- [X] T020 [P] [US2] Створити `src/views/analytics/date-range-sheet.tsx` — `DateRangeSheet({ visible, edge, period, onClose, onSave })` на `BottomSheet` за артбордами 14b/14c: «Скасувати» / «Початкова дата»|«Кінцева дата» / «Готово» (`greenInk`); «Листопад 2026» з кнопками «Попередній місяць» / «Наступний місяць» 44×44; ПН…НД; сітка 7 колонок, кнопки 42×42 через `Pressable guarded={false}`: обрана — `greenBrand` білим жирним, у періоді — `greenSoft`/`greenInk`, неактивні — `faint` (для `start` — після `end`; для `end` — до `start` і після сьогодні); рядок «Період: <від> – <до>» з чернеткою; чернетка локальна, `onSave` лише на «Готово»; testID `analytics.sheet.date.{cancel,done,prev,next,day.<d>}` (research R8)
- [X] T021 [US2] У `src/app/(tabs)/analytics/index.tsx` передати `headerContent` у `NavigationView` — сітка 2 колонки з проміжком 10 з двома `AnalyticsPeriodButton` (`analytics.period.start|end`, неактивні в порожньому стані; `active`, поки відкрита шторка саме цієї дати — `active={sheetEdge === 'start'}` / `'end'`, US2-1) і `DateRangeSheet` з `key` на кожне відкриття; «Готово» → `setPeriod` з провайдера
- [X] T022 [US2] Оновити `docs/patterns/pickers.md` — розділ «Вибір дати й періоду» (кнопки «Від»/«До» у `headerContent`, `DateRangeSheet`, правила неактивних днів, чернетка до «Готово», місяць рахується, якщо перетинається з періодом) і рядок у `docs/patterns/README.md`

**Checkpoint**: US1 + US2 — витрати за будь-який період

---

## Phase 5: User Story 3 — Вибір адреси (Priority: P2)

**Goal**: шторка «Адреса» з адресами й «Усі адреси»

**Independent Test**: дві адреси → тап на рядок адреси → три варіанти з сумами → «Усі адреси» → сума = А + Б, однакові послуги одним рядком (quickstart 6, 7)

- [X] T023 [P] [US3] Створити `src/views/analytics/address-row.tsx` — `AddressRow({ option, onPress })`: картка-рядок радіус 20, іконка 🏢 (`apartment`) або 🏠 (`house`, «Усі адреси») на підкладці, назва з `numberOfLines={1}`, підпис, коло 32 `surface2` з `Chevron` донизу; a11y «Обрати адресу, зараз: <назва>», `testID='analytics.address'`
- [X] T024 [P] [US3] Створити `src/views/analytics/address-sheet.tsx` — `AddressSheet({ visible, options, period, selection, onClose, onSelect })` на `BottomSheet` за артбордом 14d: «Адреса», «Витрати за <від> – <до>», радіогрупа варіантів (іконка, назва, підпис, сума, смужка 72×4 `greenBrand` за `ratio`), обраний — стиль вибраної опції; вибір закриває шторку; testID `analytics.sheet.address.<i>`
- [X] T025 [US3] У `src/app/(tabs)/analytics/index.tsx` замінити статичний рядок на `AddressRow` з `getAddressOptions`, підключити `AddressSheet` → `setSelection`

**Checkpoint**: US1–US3 — будь-яка адреса або всі

---

## Phase 6: User Story 4 — Деталі витрат (Priority: P3)

**Goal**: екран «Витрати — деталі» зі смугою розподілу

**Independent Test**: тап на картку → «Витрати <сума>», «Січень – серпень 2026», смуга послуг; з рядка місяця — одразу «Місяці»; таб-бару немає (quickstart 8)

- [X] T026 [P] [US4] Створити `src/views/analytics/service-share-bar.tsx` — `ServiceShareBar({ services })`: картка з рядом `View` (`flex` = `percent`, проміжок 3, висота 12, радіус 6, колір `accent`) і легендою (кружок 10 + назва 13 pt `muted`); a11y «Електроенергія 73%, холодна вода 27%» (research R9)
- [X] T027 [US4] Замінити заглушку `src/app/(tabs)/analytics/details.tsx` повним екраном — `NavigationView` з «Назад», `title={`Витрати ${formatMoney(total)}`}`, `subtitle={formatPeriodMonths(period)}`, `barType='green'`, `testID='analytics.details.screen'`; параметр `tab` (`useLocalSearchParams`, за замовчуванням `services`); `Segment` (`analytics.details.tabs`); «Послуги» — `ServiceShareBar` + `AnalyticsServiceRow variant='details'`; «Місяці» — `AnalyticsMonthRow variant='details'` від найновішого
- [X] T028 [US4] У `src/app/(tabs)/analytics/index.tsx` відкривати деталі: картка й рядок послуги — `router.push('/analytics/details')`, рядок місяця — з `params: { tab: 'months' }`; звірити з артбордом 15 у світлій і темній темі

**Checkpoint**: усі історії працюють

---

## Phase 7: Polish & Cross-Cutting

- [X] T029 [P] Оновити `docs/patterns/user-data.md` — замість «Аналітика поки заглушка без даних — без скелетона» описати `AnalyticsSkeleton` і обчислення лише з доданих місяців `getAnalyticsObjects`; рядок у `docs/patterns/README.md`, якщо змінився зміст
- [X] T030 [P] Канвас (`docs/design.md`, Artifact read → publish): у `project/Analytics.dc.html` плитка ↗️ — `var(--blue-soft)` замість `var(--coral-soft)` і гліф по центру; нові артборди `project/AnalyticsEmpty.dc.html` («14e · Аналітика — порожній») і `project/AnalyticsLoading.dc.html` («14s · Аналітика — завантаження») та записи в `project/canvas.json` (`boards`, `order`) у групі «Аналітика»
- [X] T031 [P] Створити `.claude/skills/ui-check/flows/analytics.flow` — сценарії quickstart 1, 5, 6, 8 за testID з [contracts/interfaces.md](contracts/interfaces.md); пройти флоу на iOS Simulator
- [ ] T032 (частково: iOS 27.2 і Android-емулятор Pixel 9 Pro — пройдено 1, 3, 4, 5, 8, 10, 13, світла й темна тема, системна «Назад»; швидкодія 16, VoiceOver/TalkBack, кілька адрес і порожні стани — не перевірено) Пройти ручні сценарії [quickstart.md](quickstart.md) 2, 3, 4, 9–16 на iOS і Android (16 — замір SC-003) (VoiceOver/TalkBack — підписи кнопок, графік одним описом)
- [X] T033 У `specs/013-analytics-tab/spec.md` поставити **Status**: Implemented і коротко підсумувати зміни українською
- [X] T034 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки

---

## Dependencies & Execution Order

- **Setup (T001–T005)** → **Foundational (T006–T011)** → історії.
- **US1 (T012–T018)** — MVP, залежить лише від Foundational.
- **US2 (T019–T022)** — після T017 (той самий `index.tsx`); T019, T020 можна робити паралельно з US1.
- **US3 (T023–T025)** — після T017; T023, T024 паралельно з US1/US2.
- **US4 (T026–T028)** — після T014, T015 (рядки з `variant='details'`) і T017.
- **Polish** — T029–T031 паралельно після історій; T032 → T033 → T034 останні.

Усередині Foundational: T006 → (T007 ∥ T008) → T009 → T010 → T011.

## Parallel Examples

- **Setup**: T003, T004, T005 разом.
- **US1**: T012, T013, T014, T015, T016 разом → T017 → T018.
- **US2**: T019 і T020 разом → T021 → T022.
- **US3**: T023 і T024 разом → T025.
- **Polish**: T029, T030, T031 разом.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 → вкладка показує витрати за поточний рік для першої адреси; можна випускати OTA.
2. **+US2**: довільний період.
3. **+US3**: кілька адрес і «Усі адреси».
4. **+US4**: деталі.
5. Polish: патерни, канвас, флоу, ручна перевірка, статус, lint і typecheck.

Комітити після кожної фази (коміт зі зміною патерну містить і файл `docs/patterns/`).

---

## Phase 8: Convergence

- [ ] T035 Вирівняти підписи днів тижня (ПН … НД) з колонками чисел у `src/views/analytics/date-range-sheet.tsx`, як на артбордах 14b/14c: зараз підпис — `ThemedText` з `width: DAY_WIDTH`, і колонки заголовка вужчі за колонки днів (НД стоїть лівіше за 1, 8, 15). Кожен підпис має стояти у `View` тієї самої ширини, що клітинка дня (`styles.cell` / `DAY_WIDTH`), з `alignItems: 'center'`, а текст — по центру всередині; перевірити скріншотом на iOS і Android, що центр кожного підпису збігається з центром кола дня per US2/AC1, SC-005 (partial)
- [ ] T036 Оновити артборд «15 · Витрати — деталі» (`project/AnalyticsDetail.dc.html` у канвасі): застосунок показує великий заголовок «Витрати <сума>» з підзаголовком-періодом під скляною «Назад» (навбар `full` за `docs/patterns/navigation-bar-title.md`), а артборд — центрований заголовок у рядку з «Назад»; перемалювати шапку артборда під застосунок і прибрати зі списку «Місяці» рядки без нарахувань per SC-005, plan: Constitution IV (partial)
- [ ] T037 Переглянути додавання року до назви місяця в `src/views/analytics/month-row.tsx` (`Листопад 2025` для місяців не поточного року): у spec і канвасі його немає — або описати в spec (US1/AC6, US4/AC3) як потрібне для періодів через рік, або прибрати per US1/AC6 (unrequested)
