---
description: "Задачі для фічі «Профіль — стартова вкладка, тема застосунку та дрібні правки»"
---

# Tasks: Профіль — стартова вкладка, тема застосунку та дрібні правки

**Input**: Design documents from `specs/003-profile-theme-tweaks/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: автотестів спека не вимагає і в проєкті їх немає; перевірка — сценарії ui-check і ручні кроки з [quickstart.md](quickstart.md).

**Organization**: задачі згруповані за історіями зі spec.md у порядку пріоритету: US1 (P1), US2 (P2), US4 (P2), US3 (P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (інші файли, немає залежності від незавершених задач)
- **[Story]**: історія зі spec.md
- Шляхи — від кореня репозиторію

---

## Phase 1: Setup (дизайн-еталон)

**Purpose**: оновити канвас до верстки, щоб усі екрани звірялися з макетом (FR-018). Канвас https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj читати й публікувати через Artifact, як у `docs/design.md`; стилі й токени — `project/ui.css`.

- [X] T001 У канвасі `project/More.dc.html` (артборд «16 · Профіль»): прибрати стрілку з картки профілю; у рядку «Імʼя» прибрати `row-sub` «Як до вас звертатися в застосунку»; між розділами «Сповіщення» і «Документи» додати розділ з overline «Застосунок» і карткою з двома рядками — «Стартова вкладка» (іконка-будинок, значення «Обʼєкти», шеврон вгору-вниз) і «Тема» (іконка-контраст, значення «Як у системі», шеврон вправо); відступ перед карткою «Вийти» зробити вдвічі більшим, ніж між розділами; збільшити `screenHeight` і `h` артборда в `project/canvas.json` під новий розділ
- [X] T002 Повторити зміни T001 у `project/MoreGoogle.dc.html` («16a · Профіль — вхід через Google»); перевірити, що `project/MoreDelete.dc.html` і `project/MoreSignOut.dc.html` (16b, 16c) показують під діалогом оновлений профіль (вони імпортують `More`), і за потреби підняти їхні `h` у `project/canvas.json`
- [X] T003 Додати в канвас артборди екрана «Тема»: `project/Theme.dc.html` «16d · Тема» (світла палітра, вибрано «Як у системі») і `project/ThemeDark.dc.html` «16e · Тема — темна» (темна палітра з `ui.css`, вибрано «Темна»): рядок «Назад», заголовок «Тема», підзаголовок «Оформлення застосунку», фіолетовий навбар як у 16, три великі картки «Як у системі» / «Світла» / «Темна», у кожній мініатюра застосунку (градієнтний навбар, дві картки-рядки, таб-бар у палітрі теми; для «Як у системі» — розділена по діагоналі світла/темна), назва і позначка вибраного (галочка в колі + акцентна рамка); таб-бару на екрані немає
- [X] T004 Додати в канвас артборди `project/MoreOutageSetup.dc.html` «16f · Профіль — Світло не налаштоване» (як 16, але в картці «Сповіщення» під рядком «Вимкнення світла» — іконка-попередження, текст «Місто й черги не налаштовані» і кнопка «Налаштувати») і `project/MoreStartTab.dc.html` «16g · Профіль — стартова вкладка» (як 16 з відкритим системним меню iOS від рядка «Стартова вкладка»: «Обʼєкти» з галочкою, «Світло», «Аналітика» з іконками табів)
- [X] T005 Зареєструвати T003–T004 у `project/canvas.json`: записи в `boards` у ряд «Профіль» (`y: 4668`, `x: 3374`, `3856`, `4338`, `4820` у порядку 16d, 16e, 16f, 16g), у `order` після `Terms.dc.html`, збільшити `notes.flowMore.maxW`; опублікувати канвас і переконатися, що всі нові артборди відкриваються

**Checkpoint**: канвас має артборди 16, 16a (оновлені), 16d, 16e, 16f, 16g — еталон для всіх історій.

---

## Phase 2: Foundational (налаштування пристрою)

**Purpose**: сервіс і провайдер теми та стартової вкладки, на яких стоять US1 і US4.

**⚠️ CRITICAL**: US1 і US4 не починати до завершення цієї фази.

- [X] T006 [P] Створити `src/services/preferences/types.ts`, `src/services/preferences/theme.ts`, `src/services/preferences/start-tab.ts`, `src/services/preferences/index.ts` за [contracts/preferences.md](contracts/preferences.md): типи `ThemePreference = 'light' | 'dark' | 'system'` («типово `'system'`; невідоме, пошкоджене чи відсутнє значення в сховищі читається як `'system'`») і `StartTab = 'objects' | 'outages' | 'analytics'` («типово `'objects'`; невідоме, пошкоджене чи відсутнє значення читається як `'objects'`; `profile` недопустиме»); ключі `THEME_KEY = 'themePreference'`, `START_TAB_KEY = 'startTab'`; `THEME_PREFERENCES = ['system', 'light', 'dark']`, `START_TABS = ['objects', 'outages', 'analytics']`; `parseThemePreference`, `parseStartTab`, `toColorScheme` (`system` → `'auto'`), `toTabRouteName` (`objects` → `'(objects)'`, `outages` → `'(outages)'`, `analytics` → `'analytics'`), `getThemeLabel` («Світла» / «Темна» / «Як у системі»), `getStartTabLabel` («Обʼєкти» / «Світло» / «Аналітика»)
- [X] T007 [P] Додати іконку контрасту для рядка «Тема» в `src/assets/images/icons/contrast.svg` і ключ `contrast` у `src/constants/app-icons.tsx` (стиль і розмір як у наявних іконок; для «Стартова вкладка» беремо наявний `house`)
- [X] T008 Створити `src/providers/preferences-provider.tsx` за [contracts/preferences.md](contracts/preferences.md): `PreferencesProvider` з пропом `storage` (типово `storage` з `@/storage`) читає `THEME_KEY`, `START_TAB_KEY` і `PENDING_WIPE_KEY` (з `@/services/account`) одним `Promise.all`, при `pendingWipe === 'true'` бере `system`/`objects`; до прочитання повертає `null`; на кожну зміну `theme` викликає `Appearance.setColorScheme(toColorScheme(theme))`; `setTheme`/`setStartTab` спершу оновлюють стан, потім пишуть у сховище, помилку запису ковтають; `resetPreferences()` ставить типові значення без запису; хук `usePreferences()` кидає помилку поза провайдером (залежить від T006)
- [X] T009 У `src/app/_layout.tsx` обгорнути все в `PreferencesProvider` одразу всередині `GestureHandlerRootView`, а `useNavigationTheme()`, `ThemeProvider` і решту провайдерів перенести в дочірній компонент, щоб `useColorScheme()` там уже повертав перевизначену схему (R2); `app.json` не чіпати — `userInterfaceStyle` лишається `"automatic"` (залежить від T008)
- [X] T010 У `src/services/account/wipe-local-data.ts` додати в `eraseData` `storage.removeItem(THEME_KEY)` і `storage.removeItem(START_TAB_KEY)` у той самий `Promise.allSettled`; у `src/app/(tabs)/profile/index.tsx` у `wipe()` після `resetOnboarding()` викликати `resetPreferences()` з `usePreferences()` (залежить від T006, T008)

**Checkpoint**: застосунок стартує як раніше (тема системна, відкриваються «Обʼєкти»); `Appearance.setColorScheme` уже керує темою.

---

## Phase 3: User Story 1 - Вибрати тему застосунку (Priority: P1) 🎯 MVP

**Goal**: окремий екран «Тема» з трьома картками; вибір одразу перефарбовує весь застосунок і переживає перезапуск.

**Independent Test**: «Профіль» → «Тема» → «Темна» при світлій системі: усі вкладки й діалоги темні; перезапуск — одразу темний; «Як у системі» йде за системою (quickstart US1).

- [ ] T011 [P] [US1] Створити `src/views/profile/theme-preview.tsx`: мініатюра застосунку для `ThemePreference` з кольорів `colors.light` / `colors.dark` (`src/constants/colors.ts`) і градієнтів навбару — навбар-градієнт, дві картки-рядки, смужка таб-бару; для `system` дві половини, розділені по діагоналі (світла зверху-ліворуч, темна знизу-праворуч); розміри й радіуси за артбордом 16d
- [ ] T012 [P] [US1] Створити `src/views/profile/theme-option-card.tsx`: велика картка з `ThemePreview`, назвою (`getThemeLabel`) і позначкою вибраного (галочка в колі + акцентна рамка); `Pressable` з `@/components` з `guarded={false}`, `accessibilityRole='radio'`, `accessibilityState={{ selected }}`, `accessibilityLabel` — назва варіанта, `testID` `theme.option.<value>`; рамка й фон позначки перетікають за 200 мс, натиснута картка стискається до 0.97 — CSS-переходи Reanimated за `docs/patterns/reanimated.md` (як у `src/views/objects/month-picker-sheet.tsx`); експортувати обидва компоненти з `src/views/profile/index.ts` (залежить від T011)
- [ ] T013 [US1] Створити екран `src/app/(tabs)/profile/theme.tsx`: `NavigationView` з «Назад», заголовок «Тема», підзаголовок «Оформлення застосунку», `barType='purple'`, `cornerRadius={28}`, `testID='theme.screen'`; три `ThemeOptionCard` у порядку `THEME_PREFERENCES`, `selected` з `usePreferences().theme`, дотик → `setTheme(value)` без навігації (користувач лишається на екрані, FR-007); зареєструвати `Stack.Screen name='theme'` у `src/app/(tabs)/profile/_layout.tsx`; звірити з артбордами 16d і 16e (залежить від T008, T012)
- [ ] T014 [US1] У `src/app/(tabs)/profile/index.tsx` додати між «Сповіщеннями» і «Документами» розділ `SectionHeader title='Застосунок' variant='overline'` з `ListCard` і рядком «Тема»: `RowIcon icon='contrast'`, значення праворуч `getThemeLabel(theme)` (стиль як у значення рядка «Імʼя»), шеврон, `onPress` → `router.push('/profile/theme')`, `testID='profile.theme'` (залежить від T007, T013)
- [ ] T015 [US1] Додати плавну зміну теми в `src/app/_layout.tsx` (R3): при зміні схеми поверх навігатора `Animated.View` (`StyleSheet.absoluteFill`, `pointerEvents='none'`) з `bg` попередньої схеми, непрозорість 1 → 0 за 250 мс через `withTiming`; повторна зміна перезапускає анімацію від поточного стану; shared values лише через `get()`/`set()` (`docs/patterns/reanimated.md`) (залежить від T009)
- [ ] T016 [US1] Створити `.claude/skills/ui-check/flows/theme.flow` за [contracts/ui.md](contracts/ui.md): відкрити `/profile/theme`, перевірити `theme.screen` і три `theme.option.*`, вибрати `theme.option.dark` → скриншот темний, назад → `profile.theme` показує «Темна», повернути `theme.option.system`
- [ ] T017 [US1] Пройти quickstart US1 у iOS Simulator: обхід усіх вкладок, діалог «Вийти з акаунта?» (скасувати), клавіатура на «Ваше імʼя», перемикач сповіщень і рядок стану в кожному з трьох варіантів; холодний перезапуск у темній темі без білого кадру; швидкі дотики «Світла» → «Темна» → «Як у системі»; VoiceOver на картці; елементи, що не пішли за темою, виправити або записати в Notes цього файлу

**Checkpoint**: US1 працює окремо — тему можна вибрати й вона зберігається.

---

## Phase 4: User Story 2 - Статус «Світла» і перехід до налаштувань (Priority: P2)

**Goal**: у «Сповіщеннях» видно, чому графіка не буде, і одним дотиком відкрити налаштування «Світла».

**Independent Test**: чистий стан → у профілі «Місто й черги не налаштовані» і «Налаштувати» → активна вкладка «Світло» з налаштуваннями, «Назад» на головний екран «Світла» (quickstart US2).

- [ ] T018 [P] [US2] Створити `src/services/outages/setup-status.ts` за [contracts/outage-setup.md](contracts/outage-setup.md): `getOutageSetupStatus(settings)` → `'noCity'` (`settings.city` порожнє), `'noProvider'` (`getProviderForCity(city)` не знайшов постачальника), `'noQueues'` (серед `settings.queues` немає черги з `provider.queues`), інакше `'ready'` — «умови перевіряються згори донизу; перше збіжне значення — результат»; `getOutageSetupMessage` з текстами «Місто й черги не налаштовані» / «Постачальник для вашого міста ще не доданий» / «Черги не вибрані»; експортувати з `src/services/outages/index.ts`
- [ ] T019 [US2] У `src/app/(tabs)/(outages)/index.tsx` замінити інлайн `isConfigured` на `getOutageSetupStatus(settings) === 'ready'`, поведінку вкладки не змінювати (залежить від T018)
- [ ] T020 [P] [US2] Звірити ключ `anchor` для `unstable_settings` з документацією Expo Router на `docs.expo.dev/versions/v58.0.0/` і додати в `src/app/(tabs)/(outages)/_layout.tsx` `export const unstable_settings = { anchor: 'index' };` (або назву, яку дає документація v58)
- [ ] T021 [P] [US2] Створити `src/views/profile/outage-setup-notice.tsx`: блок під рядком у картці «Сповіщення» — `AppImage icon='danger'`, текст статусу (`font='caption'`, переноситься на кілька рядків, `testID='profile.outageStatus'`), кнопка «Налаштувати» (`Pressable` з `@/components` з глобальним замком, `testID='profile.outageSetup'`); вигляд за артбордом 16f; експортувати з `src/views/profile/index.ts`
- [ ] T022 [US2] У `src/app/(tabs)/profile/index.tsx` у картці «Сповіщення» під рядком перемикача показувати `OutageSetupNotice` з `getOutageSetupMessage(status)`, коли `getOutageSetupStatus(useOutageSettings()) !== 'ready'`, незалежно від стану перемикача (FR-012); кнопка → `router.navigate('/outage-settings')`; перемикач лишити без змін (FR-016) (залежить від T018, T020, T021)
- [ ] T023 [US2] Оновити `.claude/skills/ui-check/flows/profile.flow`: на чистому стані видно `profile.outageStatus` і `profile.outageSetup`; дотик → активна вкладка «Світло» з екраном налаштувань; пройти quickstart US2 (три причини, зникнення статусу після вибору черги, «Назад» → головний екран «Світла», повторне «Налаштувати» не дублює екран)

**Checkpoint**: US2 працює окремо від теми й стартової вкладки.

---

## Phase 5: User Story 4 - Вибрати стартову вкладку (Priority: P2)

**Goal**: у «Застосунку» рядок «Стартова вкладка» з нативним меню; вибрана вкладка відкривається при холодному запуску.

**Independent Test**: вибрати «Світло», повністю закрити й запустити — відкрита «Світло»; повернення з фону лишає поточну вкладку (quickstart US4).

- [ ] T024 [US4] Звірити з документацією `docs.expo.dev/versions/v58.0.0/sdk/ui/` проп-и `Host`, `Menu`, `Picker`, `RNHostView` (`@expo/ui/swift-ui`) і `DropdownMenu`, `DropdownMenuItem` (`@expo/ui/jetpack-compose`): як передається вибране значення й колбек вибору, чи пробрасується `testID`; записати висновок одним абзацом у Notes цього файлу
- [ ] T025 [P] [US4] Створити `src/views/profile/start-tab-row.tsx` (спільний тип пропсів `{ value: StartTab; onChange: (next: StartTab) => void }` і вигляд рядка: `RowIcon icon='house'`, «Стартова вкладка», значення `getStartTabLabel(value)`, шеврон вгору-вниз) і `src/views/profile/start-tab-row.ios.tsx`: `Host` → `Menu` з `label` = `RNHostView` з цим рядком, всередині `Picker` з варіантами `START_TABS` (підпис і SF-іконка табу: `building`, `lightbulb`, `chart.xyaxis.line`), вибір → `onChange`; `accessibilityLabel` «Стартова вкладка, <значення>», `testID='profile.startTab'` (залежить від T006, T024)
- [ ] T026 [P] [US4] Створити `src/views/profile/start-tab-row.android.tsx`: той самий рядок як тригер `DropdownMenu` з `expanded`-станом і трьома `DropdownMenuItem` (підпис, галочка біля поточного), вибір → `onChange` і закриття меню; експортувати `StartTabRow` з `src/views/profile/index.ts` (залежить від T006, T024)
- [ ] T027 [US4] У `src/app/(tabs)/profile/index.tsx` у картці розділу «Застосунок» першим рядком поставити `StartTabRow` з `value={startTab}` і `onChange={setStartTab}` з `usePreferences()`, «Тема» — другим (FR-005, FR-021); вибір не перемикає поточну вкладку (FR-022) (залежить від T014, T025, T026)
- [ ] T028 [US4] У `src/app/(tabs)/_layout.tsx` передати `NativeTabs` проп `initialRouteName={toTabRouteName(startTab)}` з `usePreferences()` (R10); перевірити холодним запуском у iOS Simulator (`xcrun simctl terminate` + запуск) зі збереженим «Аналітика»: якщо відкриваються «Обʼєкти», реалізувати запасний шлях — одноразовий `router.replace` на корінь вибраного табу лише при `usePathname() === '/'` під `SplashScreen.preventAutoHideAsync()` / `hideAsync()` з `expo-splash-screen` (звірити API з docs v58); записати, який шлях спрацював, у Notes цього файлу і в `research.md` R10 (залежить від T009)
- [ ] T029 [US4] Створити `.claude/skills/ui-check/flows/start-tab.flow` за [contracts/ui.md](contracts/ui.md) і пройти quickstart US4 на iOS (меню від рядка, закриття без вибору, вибір без перемикання вкладки, холодний запуск без мигання «Обʼєктів», повернення з фону) і на Android-емуляторі (випадаюче меню)

**Checkpoint**: US4 працює; стартова вкладка переживає перезапуск і не впливає на повернення з фону.

---

## Phase 6: User Story 3 - Охайніший профіль (Priority: P3)

**Goal**: прибрати дубль переходу на «Ваше імʼя», зайвий підпис і відсунути «Вийти» від «Документів».

**Independent Test**: дотик до картки нічого не робить і стрілки немає; «Імʼя» без підпису; відступ перед «Вийти» удвічі більший (quickstart US3).

- [ ] T030 [P] [US3] У `src/views/profile/profile-card.tsx` прибрати `Pressable`, проп `onPress`, стиль `pressed` і `AppImage` зі стрілкою; кореневий `ThemedView` з `accessible`, `accessibilityLabel={`${name}, ${email}`}` без ролі кнопки, `testID='profile.card'` (R7, FR-001)
- [ ] T031 [US3] У `src/app/(tabs)/profile/index.tsx` прибрати `onPress` з `ProfileCard`; у рядку «Імʼя» прибрати другий `ThemedText` «Як до вас звертатися в застосунку» (FR-003); картці «Вийти» дати `marginTop` так, щоб відступ від «Документів» був щонайменше вдвічі більшим, ніж між розділами (зараз 14 + 6 = 20 → 40, R8), остаточне число звірити з артбордом 16 (залежить від T030)
- [ ] T032 [US3] Оновити `.claude/skills/ui-check/flows/profile.flow`: тап по `profile.card` не змінює екран, рядок «Імʼя» без підпису, `profile.name` відкриває «Ваше імʼя», є `profile.startTab` («Обʼєкти») і `profile.theme` («Як у системі»); звірити скриншот профілю з артбордами 16 і 16a у світлій і темній темі

**Checkpoint**: усі історії працюють разом.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T033 [P] Створити `docs/patterns/preferences.md`: налаштування пристрою (`themePreference`, `startTab`) у `KeyValueStorage`, `PreferencesProvider` читає їх до першого рендеру, стирання через `wipeLocalData()` і `resetPreferences()`; тему читати лише через `useColorScheme()`/`useThemeColor()` і не кешувати; чому `'auto'`, а не `null`/`'unspecified'`; fade-оверлей; як додати нове налаштування; додати рядок у `docs/patterns/README.md`
- [ ] T034 [P] Оновити `docs/patterns/pickers.md` (розділ «Налаштування з миттєвим застосуванням»: екран «Тема» лишається відкритим після вибору; короткий вибір із 2–5 значень без опису — нативне меню `@expo/ui` від рядка), `docs/patterns/account-actions.md` (стерті ключі `themePreference`, `startTab`, виклик `resetPreferences()`), `docs/patterns/tab-bar.md` (стартова вкладка через `initialRouteName` або запасний шлях з T028; перехід у налаштування «Світла» з іншого табу через `router.navigate` і `anchor`)
- [ ] T035 [P] Оновити `docs/patterns/test-ids.md`: нові `profile.startTab`, `profile.theme`, `theme.screen`, `theme.option.<system|light|dark>`, `profile.outageStatus`, `profile.outageSetup`; `profile.card` — не інтерактивний
- [ ] T036 Пройти розділ «Стирання» з [quickstart.md](quickstart.md): «Темна» + стартова «Світло» → «Вийти» → після нового входу системна тема, «Стартова вкладка» — «Обʼєкти», відкриті «Обʼєкти»
- [ ] T037 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки
- [ ] T038 У `specs/003-profile-theme-tweaks/spec.md` поставити **Status**: Implemented і коротко підсумувати українською, що змінилося; видалити тимчасові файли зі scratchpad

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: без залежностей; еталон для всіх історій
- **Foundational (Phase 2)**: після Setup; блокує US1 і US4
- **US1 (Phase 3)**: після Foundational
- **US2 (Phase 4)**: після Setup; від Foundational не залежить — можна паралельно з Phase 2–3
- **US4 (Phase 5)**: після Foundational і T014 (розділ «Застосунок» у профілі створює US1)
- **US3 (Phase 6)**: після Setup; незалежна, але правки `profile/index.tsx` робити не одночасно з іншими історіями
- **Polish (Phase 7)**: після всіх історій

### User Story Dependencies

- **US1 (P1)**: лише Foundational
- **US2 (P2)**: незалежна
- **US4 (P2)**: Foundational + T014 з US1
- **US3 (P3)**: незалежна

### Within Each User Story

- Сервіси й компоненти `[P]` → екран → вбудовування в `profile/index.tsx` → ui-check і quickstart
- `src/app/(tabs)/profile/index.tsx` змінюють T010, T014, T022, T027, T031 — послідовно, не паралельно
- `src/app/_layout.tsx` змінюють T009 і T015 — послідовно

### Parallel Opportunities

- Phase 2: T006 і T007
- US1: T011 паралельно з T018, T020, T021 (US2) і T030 (US3)
- US2: T018, T020, T021
- US4: T025 і T026 після T024
- Polish: T033, T034, T035

---

## Parallel Example: User Story 2

```text
Task: "T018 [US2] getOutageSetupStatus у src/services/outages/setup-status.ts"
Task: "T020 [US2] anchor у src/app/(tabs)/(outages)/_layout.tsx"
Task: "T021 [US2] OutageSetupNotice у src/views/profile/outage-setup-notice.tsx"
```

## Parallel Example: User Story 1

```text
Task: "T011 [US1] ThemePreview у src/views/profile/theme-preview.tsx"
# після T011:
Task: "T012 [US1] ThemeOptionCard у src/views/profile/theme-option-card.tsx"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1: канвас
2. Phase 2: налаштування пристрою
3. Phase 3: екран «Тема»
4. **STOP and VALIDATE**: quickstart US1, звірка з 16d/16e
5. Коміт

### Incremental Delivery

1. Setup → коміт (канвас)
2. Foundational → коміт
3. US1 → коміт (MVP)
4. US2 → коміт
5. US4 → коміт
6. US3 → коміт
7. Polish → коміт (патерни разом із кодом, що їх змінює, — за конституцією)

---

## Notes

- [P] — інші файли, без залежностей від незавершених задач
- Коміт після кожної фази; коміт, що змінює патерн, містить оновлений файл `docs/patterns/`
- T024 і T028 записують сюди висновки звірки з документацією і вибраний шлях стартової вкладки
