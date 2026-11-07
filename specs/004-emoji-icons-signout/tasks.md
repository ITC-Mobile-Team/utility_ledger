# Tasks: Єдині emoji-іконки та «Вийти» без стирання даних

**Input**: Design documents from `/specs/004-emoji-icons-signout/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/icons.md](contracts/icons.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: окремих тестових задач немає (у проєкті немає unit-тестів, у специфікації їх не просили); перевірка — сценарії `ui-check` і ручна перевірка за quickstart.

**Формат**: `- [ ] T### [P?] [US?] Опис зі шляхом`. `[P]` — можна паралельно (різні файли, без залежностей від незавершених задач).

## Phase 1: Setup

- [ ] T001 Створити `src/constants/icon-sizes.ts`: `export const iconSizes = { badge: 12, inline: 16, button: 20, feature: 28, hero: 40, heroLarge: 64 } as const;` і `export type IconRole = keyof typeof iconSizes;` (контракт — contracts/icons.md)
- [ ] T002 Створити `src/components/emoji-glyph.tsx`: квадрат `size × size` з `alignItems/justifyContent: 'center'`, усередині звичайний `Text` (не `ThemedText`, без шрифту Onest) з `allowFontScaling={false}`, `includeFontPadding: false`, `textAlign: 'center'`, `fontSize = size × k`, `lineHeight = size`, платформні `k` і `translateY` через `Platform.select`, `accessible={false}`; перед написанням звірити `allowFontScaling`/`includeFontPadding` з документацією RN 0.88 (Constitution I); пропси `emoji`, `size`, `testID?`; додати експорт у `src/components/index.ts`
- [ ] T003 [P] Створити `src/components/chevron.tsx`: векторний шеврон (`direction: 'right' | 'upDown'`, `color?: AppColor` за замовчуванням `chev`) на `expo-image` + `tintColor`, джерела `assets/images/icons/chevron-right.svg` і `chevron-up-down.svg`, розмір за роллю `inline` (`iconSizes.inline`) і те саме центрування, що в `EmojiGlyph`; додати експорт у `src/components/index.ts` (контракт — contracts/icons.md)
- [ ] T004 Затвердити карту emoji: показати користувачу повну карту з research.md R4 (31 ключ без шевронів) і ролі зі шкали, внести правки в research.md і в `src/constants/app-icons.tsx` (T005) до масової заміни; за потреби одразу оновити відповідні артборди канвасу. Без цієї відповіді T005 не починати

## Phase 2: Foundational (блокує US1 і US2)

**⚠️ CRITICAL**: поки не готові T005–T010, жоден екран не можна переводити на emoji, а модуль стирання — видаляти.

- [ ] T005 Замінити в `src/constants/app-icons.tsx` усі `require('@/assets/images/icons/…svg')` на emoji-рядки за затвердженою в T004 картою з research.md R4 (33 ключі: без `chevronRight` і `chevronUpDown`, які лишаються векторними через `Chevron`; решта ключів `AppIcon` ті самі); експортувати `appIcons` як `Record<AppIcon, string>`
- [ ] T006 [P] Переписати `src/components/app-image.tsx`: пропси `icon: AppIcon`, `role: IconRole`; рендерить `EmojiGlyph` з `appIcons[icon]` і `iconSizes[role]`; прибрати `tintColor`, `Size` і `expo-image`
- [ ] T007 [P] Переписати `src/components/icon-view.tsx`: пропси `icon`, `background?`, `size: Size`; гліф — `button`, якщо коло ≤ 44, інакше `feature`; прибрати `iconColor` і `iconSize`; зберегти круглу підкладку (`rgba(255,255,255,0.22)` без `background`)
- [ ] T008 [P] Переписати `src/views/profile/row-icon.tsx`: пропси `icon`, `background?` (за замовчуванням `blueSoft`); прибрати `color`; коло 42 pt
- [ ] T009 [P] Переписати `src/views/objects/emoji-tile.tsx` на `EmojiGlyph` із `size = tileSize × 0.5` (прибрати власний `Text`); зберегти скруглення (`rounded ? size / 2 : size × 0.3`, `borderCurve: 'continuous'`)
- [ ] T010 Перенести `ONBOARDING_KEY` (`'hasSeenOnboarding'`) у `src/services/preferences/onboarding.ts` із експортом в `src/services/preferences/index.ts` і перепідключити імпорт в `src/providers/onboarding-provider.tsx` (щоб модуль `src/services/account` можна було видалити в US2)

**Checkpoint**: компоненти іконок і карта готові; проєкт може не збиратися, поки не оновлені місця виклику (US1).

## Phase 3: User Story 1 — Однакові, відцентровані emoji-іконки (Priority: P1) 🎯 MVP

**Goal**: усі іконки поза таб-баром, шевронами, логотипами Google/Apple і стрілкою «Назад» — emoji за ролями зі шкали, відцентровані ±1 pt, без залежності від розміру шрифту.

**Independent Test**: quickstart §2 і §3 — пройти екрани на iOS і Android у двох темах, виміряти центрування й порівняти розміри однакових ролей.

### Навбар і спільні компоненти

- [ ] T011 [P] [US1] `src/components/navigation-bar/navigation-bar-button.tsx`: замінити `Image` + `tintColor` на `EmojiGlyph` (роль `button`) у колі 44 pt; прибрати `iconColor`
- [ ] T012 [P] [US1] `src/components/navigation-bar/navigation-bar-chip.tsx`: `EmojiGlyph` (роль `inline`) замість `Image`; прибрати колір
- [ ] T013 [P] [US1] `src/components/navigation-bar/navigation-bar-icon-button.tsx`: `EmojiGlyph` (роль `button`) у кнопці 44 pt; прибрати колір
- [ ] T014 [P] [US1] `src/components/navigation-bar/short-navigation-bar-button.tsx`: `EmojiGlyph` (роль `button`) замість `Image` + `tintColor`; прибрати `iconColor`
- [ ] T015 [P] [US1] `src/components/transparent-action-button.tsx`: `IconView` без `iconSize` (коло 40, роль `button`)

### Views

- [ ] T016 [P] [US1] `src/views/info-banner.tsx` (роль `inline`), `src/views/app-header.tsx` (роль `inline`), `src/views/object-card.tsx` (`IconView` без `iconSize`, шеврон → `Chevron direction='right'`, `EmojiTile` лишити)
- [ ] T017 [P] [US1] `src/views/objects/list-card.tsx`, `src/views/objects/empty-state-view.tsx` (іконка стану `hero`, «➕» `inline`), `src/views/objects/swipeable-row.tsx` (дії `button`), `src/views/objects/days-sheet.tsx` (степер «➕/➖» `button`, `AppImage` без `tintColor`), `src/views/objects/city-picker-sheet.tsx` (пошук `inline`)
- [ ] T018 [P] [US1] `src/views/objects/month-picker-sheet.tsx`: заміна власного `Text` з emoji на `EmojiTile`/`EmojiGlyph`, галочка `badge`, шеврон `inline`; `src/views/objects/service-icon.tsx` без змін API
- [ ] T019 [P] [US1] `src/views/outages/outage-message.tsx` (`hero`), `src/views/outages/power-status-card.tsx` (`feature`), `src/views/outages/outage-city-sheet.tsx` (галочка `inline`)
- [ ] T020 [P] [US1] `src/views/onboarding/addresses-illustration.tsx` (`IconView` 40 і 52 → ролі `button` і `feature`), `src/views/onboarding/analytics-illustration.tsx`, `src/views/onboarding/readings-illustration.tsx` (`inline`)
- [ ] T021 [P] [US1] `src/views/profile/start-tab-row-content.tsx` (шеврон → `<Chevron direction='upDown' />`), `src/views/profile/start-tab-row.tsx`, `src/views/profile/theme-option-card.tsx` (галочка `badge`), `src/views/profile/outage-setup-notice.tsx` (`IconView` без `iconSize`/`iconColor`)

### Екрани (`src/app/`)

- [ ] T022 [P] [US1] `src/app/(auth)/index.tsx` (будинок `hero`; іконки послуг на екрані входу (`electricity`, `gas`, `water`, `heating`): замінити кольорові SVG на `appIcons` emoji за роллю `inline`) і `src/app/(auth)/auth-error.tsx` (`danger` `hero`); логотипи Google/Apple не чіпати
- [ ] T023 [P] [US1] `src/app/(tabs)/(objects)/object-added.tsx` (`check` → `heroLarge`), `src/app/(tabs)/(objects)/object-form.tsx` і `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` (шеврони → `Chevron direction='right'`)
- [ ] T024 [P] [US1] `src/app/(tabs)/(objects)/[objectId]/index.tsx` (`EmojiTile` лишити; галочка `badge`), `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx` («🔄» `inline`), `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx` (`gauge` `button`, шеврон → `Chevron direction='right'`)
- [ ] T025 [US1] `src/app/(tabs)/(objects)/[objectId]/icon-picker.tsx`: плитки вибору через `EmojiTile`/`EmojiGlyph` замість `ThemedText font='emojiLarge'`; стрілка «Назад» (`arrow-back.svg`) лишається
- [ ] T026 [P] [US1] `src/app/(tabs)/(outages)/outage-settings.tsx`: пін `inline`, годинник `inline`, «↗️» `inline`, галочка `inline`; прибрати `tintColor` у всіх викликах
- [ ] T027 [P] [US1] `src/app/(tabs)/profile/index.tsx`: `RowIcon` без `color`, іконки рядків за контрактом ui.md (👤, 🔔, 🌓, 🛡️, 📄, 🚪, 🗑️)
- [ ] T028 [US1] Усі решта місць, де ще передається `tintColor`/`iconColor`/`iconSize` або `Image` з `appIcons`: знайти `grep -rnE "tintColor|iconColor|iconSize|appIcons\[" src` і привести до нового API; результат — `npx tsc --noEmit` без помилок
- [ ] T029 [US1] Прибрати невикористані токени `emojiLarge`, `emojiXL`, `emojiXXL` (і `emoji`, якщо його не використовує ініціал аватара в `src/views/profile/avatar.tsx`) з `src/constants/typography.ts`
- [ ] T030 [US1] Видалити SVG, які більше ніхто не підключає, з `assets/images/icons/` (лишити `arrow-back.svg`, `chevron-right.svg`, `chevron-up-down.svg` і `socials/*`; перед видаленням перевірити `grep -rn "icons/" src app.json`)
- [ ] T031 [US1] Виміряти центрування за quickstart §3 (обрізані скріншоти `ui-check` кола `RowIcon`, плитки послуги, кнопки навбару, степера «➕/➖» на iOS і Android, світла й темна тема; скрипт — у scratchpad) і підкоригувати `k`/`translateY` у `src/components/emoji-glyph.tsx` до розбіжності ≤ 1 pt
- [ ] T032 [US1] Пройти екрани за quickstart §2 з максимальним розміром шрифту системи: іконки не змінюють розмір, висота рядків списків не зросла порівняно з до змін (скріншот до/після); порівняти ролі між екранами (FR-003)

**Checkpoint**: US1 працює окремо — усі іконки emoji, відцентровані, однакових розмірів.

## Phase 4: User Story 2 — «Вийти» і «Видалити акаунт» лише завершують сесію (Priority: P1)

**Goal**: обидві дії викликають лише `signOut()`; дані, налаштування, тема, стартова вкладка, онбординг і сповіщення не змінюються; підписи й тексти не обіцяють стирання.

**Independent Test**: quickstart §1 — додати обʼєкт, змінити тему, вийти, увійти; усе на місці; те саме для «Видалити акаунт».

- [ ] T033 [US2] `src/views/profile/confirm-destructive.ts`: зробити `message` необовʼязковим (`message?: string`); якщо його немає — не передавати в `ActionSheetIOS` і `Alert.alert`
- [ ] T034 [US2] `src/app/(tabs)/profile/index.tsx`: замінити `wipe`/`isWiping` на виклик `useAuth().signOut()` з тим самим прапорцем повторного запуску; прибрати імпорти `wipeLocalData`, `useOnboarding`, `resetPreferences`; `confirmSignOut`: заголовок «Вийти з акаунта?», без `message`, кнопка «Вийти»; `confirmDelete`: заголовок «Видалити акаунт?», `message` «Поки що це лише вихід з акаунта. Видалення даних зʼявиться згодом.», кнопка «Видалити акаунт»; прибрати `getProviderName(method)` із тексту, якщо він більше не використовується
- [ ] T035 [US2] `src/app/(tabs)/profile/index.tsx`: прибрати підписи під заголовками рядків `profile.signOut` («Дані на цьому пристрої буде стерто») і `profile.delete` («Обʼєкти, показники та розрахунки буде стерто»); у `ListRow` лишити лише заголовок
- [ ] T036 [P] [US2] `src/providers/auth-provider.tsx`: прибрати `finishPendingWipe` і обгортку в `useEffect`; підписка на `service.onAuthStateChanged(setUser)` одразу, з очищенням у `return`
- [ ] T037 [P] [US2] `src/providers/preferences-provider.tsx`: прибрати імпорт і читання `PENDING_WIPE_KEY` та галузь `if (pendingWipe === 'true') return defaults`; прибрати `resetPreferences` з типу контексту, реалізації й значення провайдера
- [ ] T038 [P] [US2] `src/providers/onboarding-provider.tsx`: прибрати `resetOnboarding` з типу, реалізації й значення провайдера
- [ ] T039 [US2] Видалити каталог `src/services/account/` (`index.ts`, `wipe-local-data.ts`); `grep -rn "services/account" src docs` не повертає нічого, окрім документації, яку оновлює T042
- [ ] T040 [US2] Перевірити в `src/app/(tabs)/profile/terms.tsx` і `src/app/(tabs)/profile/privacy.tsx`, що тексти про видалення акаунта не обіцяють стирання, якого більше немає (зараз: «Ви можете видалити акаунт у будь-який момент… Разом з ним будуть видалені всі ваші записи», «…видалити акаунт разом з усіма записами»); переформулювати без обіцянки видалення й зафіксувати зміну в підсумку фічі
- [ ] T041 [US2] Додати `.claude/skills/ui-check/flows/sign-out.flow` (вихід → екран входу → вхід → дані й тема на місці; «Видалити акаунт» → те саме; `nosee` підпису про стирання) і оновити `.claude/skills/ui-check/flows/profile.flow` (`see Вийти`, `nosee Дані на цьому пристрої буде стерто`, `nosee Обʼєкти, показники та розрахунки буде стерто`)
- [ ] T042 [US2] Прогнати `sign-out.flow` і `profile.flow` у iOS Simulator; пройти quickstart §1 вручну, включно з поверненням у той самий і в інший акаунт (онбординг не повторюється) і примусовим закриттям застосунку одразу після підтвердження виходу (FR-015: дані не втрачені)

**Checkpoint**: US2 працює окремо й незалежно від US1.

## Phase 5: Polish & Cross-Cutting

- [ ] T043 [P] Додати `docs/patterns/icons.md` (EmojiGlyph, `Chevron`, шкала ролей, карта `AppIcon`, винятки: таб-бар, шеврони, логотипи, стрілка «Назад»; правило «нова іконка — тільки через `AppIcon` і роль») і рядок у `docs/patterns/README.md`
- [ ] T044 [P] Оновити `docs/patterns/account-actions.md`: розділи «Вихід і видалення акаунта» і «Налаштування пристрою при виході» переписати — обидві дії лише `signOut()`, `services/account` видалений, `pendingWipe` не існує; прибрати вимогу додавати репозиторії в `createLocalDataWiper`, лишити вимогу `clear()` для майбутнього Firebase-видалення; оновити рядок у `README.md`
- [ ] T045 [P] Оновити `docs/patterns/preferences.md` (прибрати п. 3 про `createLocalDataWiper` і `resetPreferences()`), `docs/patterns/buttons.md`, `docs/patterns/navigation-bar-buttons.md`, `docs/patterns/swipe-actions.md` там, де згадуються SVG-іконки, `tintColor` або `iconColor`
- [ ] T046 Оновити канвас дизайну (`docs/design.md`, інструмент Artifact): артборди з іконками та 16, 16a, 16b, 16c (рядки «Вийти» і «Видалити акаунт» без підписів, нові тексти діалогів), а також «Дизайн-система» (іконки як emoji, шкала ролей); у `docs/design.md` нічого не змінюється, якщо посилання те саме
- [ ] T047 Оновити шапку `specs/004-emoji-icons-signout/spec.md`: `Status: Implemented` і короткий підсумок реалізованого (в стилі 003)
- [ ] T048 Прибрати тимчасові файли (скрипт вимірювання центрування, скріншоти, збірки, кеші), створені під час роботи, тільки ті, що створені цією фічею
- [ ] T049 Остання задача: запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI)

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1/US2 → Polish.** T001–T002 передують усьому; T005–T010 блокують обидві історії.
- **US1 і US2 незалежні** після Phase 2, але обидві правлять `src/app/(tabs)/profile/index.tsx` (T027, T034, T035): виконувати їх послідовно T027 → T034 → T035, а решту — паралельно.
- T004 (затвердження карти emoji) блокує T005; T003 (`Chevron`) блокує T011–T027 там, де є шеврони (T016, T017, T018, T021, T023, T024).
- Усередині US1: T011–T027 паралельні (різні файли), T028 збирає залишки після них, T029–T030 після T028, T031–T032 останні.
- Усередині US2: T033 → T034 → T035; T036–T038 паралельні; T039 лише після T010, T036, T037, T038 і T034 (інакше зламаються імпорти).
- T040 незалежна від коду. T041–T042 після T039.
- Polish: T043–T046 паралельні й можуть іти після відповідних історій; T047 → T048 → T049 — наприкінці.

## Parallel Example: User Story 1

```text
T011 navigation-bar-button.tsx    T012 navigation-bar-chip.tsx    T013 navigation-bar-icon-button.tsx
T016 info-banner/app-header/object-card    T017 objects/list-card… days-sheet
T019 outages/*    T020 onboarding/*    T022 (auth)/*    T026 outage-settings.tsx
```

## Implementation Strategy

- **MVP**: Phase 1–2 + US2 (T033–T042) дає найвідчутнішу зміну поведінки й малий обсяг; US1 — більший обсяг, але механічний.
- **Інкрементальна доставка**: після Phase 2 можна комітити по групах задач (навбар → views → екрани); `tsc` зелений лише після T028, тож комітити US1 варто одним потоком або групами, що компілюються.
- **OTA-доставка**: нативних змін немає (Constitution III).
