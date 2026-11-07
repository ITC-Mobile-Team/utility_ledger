# Tasks: Єдині emoji-іконки та «Вийти» без стирання даних

**Input**: Design documents from `/specs/004-emoji-icons-signout/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/icons.md](contracts/icons.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: окремих тестових задач немає (у проєкті немає unit-тестів, у специфікації їх не просили); перевірка — сценарії `ui-check` і ручна перевірка за quickstart.

**Формат**: `- [ ] T### [P?] [US?] Опис зі шляхом`. `[P]` — можна паралельно (різні файли, без залежностей від незавершених задач).

## Phase 1: Setup

- [X] T001 Створити `src/constants/icon-sizes.ts`: `export const iconSizes = { badge: 12, inline: 16, button: 20, feature: 28, hero: 40, heroLarge: 64 } as const;` і `export type IconRole = keyof typeof iconSizes;` (контракт — contracts/icons.md)
- [X] T002 Створити `src/components/emoji-glyph.tsx`: квадрат `size × size` з `alignItems/justifyContent: 'center'`, усередині звичайний `Text` (не `ThemedText`, без шрифту Onest) з `allowFontScaling={false}`, `includeFontPadding: false`, `textAlign: 'center'`, `fontSize = size × k`, `lineHeight = size`, платформні `k` і `translateY` через `Platform.select`, `accessible={false}`; перед написанням звірити `allowFontScaling`/`includeFontPadding` з документацією RN 0.88 (Constitution I); пропси `emoji`, `size`, `testID?`; додати експорт у `src/components/index.ts`
- [X] T003 [P] Створити `src/components/chevron.tsx`: векторний шеврон (`direction: 'right' | 'upDown'`, `color?: AppColor` за замовчуванням `chev`) на `expo-image` + `tintColor`, джерела `assets/images/icons/chevron-right.svg` і `chevron-up-down.svg`, розмір за роллю `inline` (`iconSizes.inline`) і те саме центрування, що в `EmojiGlyph`; додати експорт у `src/components/index.ts` (контракт — contracts/icons.md)
- [X] T004 Затвердити карту emoji: показати користувачу повну карту з research.md R4 (32 ключі без шевронів) і ролі зі шкали, внести правки в research.md і в `src/constants/app-icons.tsx` (T005) до масової заміни; за потреби одразу оновити відповідні артборди канвасу. Без цієї відповіді T005 не починати

## Phase 2: Foundational (блокує US1 і US2)

**⚠️ CRITICAL**: поки не готові T005–T010, жоден екран не можна переводити на emoji, а модуль стирання — видаляти.

- [X] T005 Замінити в `src/constants/app-icons.tsx` усі `require('@/assets/images/icons/…svg')` на emoji-рядки за затвердженою в T004 картою з research.md R4 (32 ключі: без `chevronRight` і `chevronUpDown`, які лишаються векторними через `Chevron`; решта ключів `AppIcon` ті самі); експортувати `appIcons` як `Record<AppIcon, string>`
- [X] T006 [P] Переписати `src/components/app-image.tsx`: пропси `icon: AppIcon`, `role: IconRole`; рендерить `EmojiGlyph` з `appIcons[icon]` і `iconSizes[role]`; прибрати `tintColor`, `Size` і `expo-image`
- [X] T007 [P] Переписати `src/components/icon-view.tsx`: пропси `icon`, `background?`, `size: Size`; гліф — `button`, якщо коло ≤ 44, інакше `feature`; прибрати `iconColor` і `iconSize`; зберегти круглу підкладку (`rgba(255,255,255,0.22)` без `background`)
- [X] T008 [P] Переписати `src/views/profile/row-icon.tsx`: пропси `icon`, `background?` (за замовчуванням `blueSoft`); прибрати `color`; коло 42 pt
- [X] T009 [P] Переписати `src/views/objects/emoji-tile.tsx` на `EmojiGlyph` із `size = tileSize × 0.5` (прибрати власний `Text`); зберегти скруглення (`rounded ? size / 2 : size × 0.3`, `borderCurve: 'continuous'`)
- [X] T010 Перенести `ONBOARDING_KEY` (`'hasSeenOnboarding'`) у `src/services/preferences/onboarding.ts` із експортом в `src/services/preferences/index.ts` і перепідключити імпорт в `src/providers/onboarding-provider.tsx` (щоб модуль `src/services/account` можна було видалити в US2)

**Checkpoint**: компоненти іконок і карта готові; проєкт може не збиратися, поки не оновлені місця виклику (US1).

## Phase 3: User Story 1 — Однакові, відцентровані emoji-іконки (Priority: P1) 🎯 MVP

**Goal**: усі іконки поза таб-баром, шевронами, логотипами Google/Apple і стрілкою «Назад» — emoji за ролями зі шкали, відцентровані ±1 pt, без залежності від розміру шрифту.

**Independent Test**: quickstart §2 і §3 — пройти екрани на iOS і Android у двох темах, виміряти центрування й порівняти розміри однакових ролей.

### Навбар і спільні компоненти

- [X] T011 [P] [US1] `src/components/navigation-bar/navigation-bar-button.tsx`: замінити `Image` + `tintColor` на `EmojiGlyph` (роль `button`) у колі 44 pt; прибрати `iconColor`
- [X] T012 [P] [US1] `src/components/navigation-bar/navigation-bar-chip.tsx`: `EmojiGlyph` (роль `inline`) замість `Image`; прибрати колір
- [X] T013 [P] [US1] `src/components/navigation-bar/navigation-bar-icon-button.tsx`: `EmojiGlyph` (роль `button`) у кнопці 44 pt; прибрати колір
- [X] T014 [P] [US1] `src/components/navigation-bar/short-navigation-bar-button.tsx`: `EmojiGlyph` (роль `button`) замість `Image` + `tintColor`; прибрати `iconColor`
- [X] T015 [P] [US1] `src/components/transparent-action-button.tsx`: `IconView` без `iconSize` (коло 40, роль `button`)

### Views

- [X] T016 [P] [US1] `src/views/info-banner.tsx` (роль `inline`), `src/views/app-header.tsx` (роль `inline`), `src/views/object-card.tsx` (`IconView` без `iconSize`, шеврон → `Chevron direction='right'`, `EmojiTile` лишити)
- [X] T017 [P] [US1] `src/views/objects/list-card.tsx`, `src/views/objects/empty-state-view.tsx` (іконка стану `hero`, «➕» `inline`), `src/views/objects/swipeable-row.tsx` (дії `button`), `src/views/objects/days-sheet.tsx` (степер «➕/➖» `button`, `AppImage` без `tintColor`), `src/views/objects/city-picker-sheet.tsx` (пошук `inline`)
- [X] T018 [P] [US1] `src/views/objects/month-picker-sheet.tsx`: заміна власного `Text` з emoji на `EmojiTile`/`EmojiGlyph`, галочка `badge`, шеврон `inline`; `src/views/objects/service-icon.tsx` без змін API
- [X] T019 [P] [US1] `src/views/outages/outage-message.tsx` (`hero`), `src/views/outages/power-status-card.tsx` (`feature`), `src/views/outages/outage-city-sheet.tsx` (галочка `inline`)
- [X] T020 [P] [US1] `src/views/onboarding/addresses-illustration.tsx` (`IconView` 40 і 52 → ролі `button` і `feature`), `src/views/onboarding/analytics-illustration.tsx`, `src/views/onboarding/readings-illustration.tsx` (`inline`)
- [X] T021 [P] [US1] `src/views/profile/start-tab-row-content.tsx` (шеврон → `<Chevron direction='upDown' />`), `src/views/profile/start-tab-row.tsx`, `src/views/profile/theme-option-card.tsx` (галочка `badge`), `src/views/profile/outage-setup-notice.tsx` (`IconView` без `iconSize`/`iconColor`)

### Екрани (`src/app/`)

- [X] T022 [P] [US1] `src/app/(auth)/index.tsx` (будинок `hero`; іконки послуг на екрані входу (`electricity`, `gas`, `water`, `heating`): замінити кольорові SVG на `appIcons` emoji за роллю `inline`) і `src/app/(auth)/auth-error.tsx` (`danger` `hero`); логотипи Google/Apple не чіпати
- [X] T023 [P] [US1] `src/app/(tabs)/(objects)/object-added.tsx` (`check` → `heroLarge`), `src/app/(tabs)/(objects)/object-form.tsx` і `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` (шеврони → `Chevron direction='right'`)
- [X] T024 [P] [US1] `src/app/(tabs)/(objects)/[objectId]/index.tsx` (`EmojiTile` лишити; галочка `badge`), `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx` («🔄» `inline`), `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx` (`gauge` `button`, шеврон → `Chevron direction='right'`)
- [X] T025 [US1] `src/app/(tabs)/(objects)/[objectId]/icon-picker.tsx`: плитки вибору через `EmojiTile`/`EmojiGlyph` замість `ThemedText font='emojiLarge'`; стрілка «Назад» (`arrow-back.svg`) лишається
- [X] T026 [P] [US1] `src/app/(tabs)/(outages)/outage-settings.tsx`: пін `inline`, годинник `inline`, «↗️» `inline`, галочка `inline`; прибрати `tintColor` у всіх викликах
- [X] T027 [P] [US1] `src/app/(tabs)/profile/index.tsx`: `RowIcon` без `color`, іконки рядків за контрактом ui.md (👤, 🔔, 🌓, 🛡️, 📄, 🚪, 🗑️)
- [X] T028 [US1] Усі решта місць, де ще передається `tintColor`/`iconColor`/`iconSize` або `Image` з `appIcons`: знайти `grep -rnE "tintColor|iconColor|iconSize|appIcons\[" src` і привести до нового API; результат — `npx tsc --noEmit` без помилок
- [X] T029 [US1] Прибрати невикористані токени `emojiLarge`, `emojiXL`, `emojiXXL` (і `emoji`, якщо його не використовує ініціал аватара в `src/views/profile/avatar.tsx`) з `src/constants/typography.ts`
- [X] T030 [US1] Видалити SVG, які більше ніхто не підключає, з `assets/images/icons/` (лишити `arrow-back.svg`, `chevron-right.svg`, `chevron-up-down.svg` і `socials/*`; перед видаленням перевірити `grep -rn "icons/" src app.json`)
- [X] T031 [US1] Виміряти центрування за quickstart §3 (обрізані скріншоти `ui-check` кола `RowIcon`, плитки послуги, кнопки навбару, степера «➕/➖» на iOS і Android, світла й темна тема; скрипт — у scratchpad) і підкоригувати `k`/`translateY` у `src/components/emoji-glyph.tsx` до розбіжності ≤ 1 pt
- [X] T032 [US1] Пройти екрани за quickstart §2 з максимальним розміром шрифту системи: іконки не змінюють розмір, висота рядків списків не зросла порівняно з до змін (скріншот до/після); порівняти ролі між екранами (FR-003)

**Checkpoint**: US1 працює окремо — усі іконки emoji, відцентровані, однакових розмірів.

## Phase 4: User Story 2 — «Вийти» і «Видалити акаунт» лише завершують сесію (Priority: P1)

**Goal**: обидві дії викликають лише `signOut()`; дані, налаштування, тема, стартова вкладка, онбординг і сповіщення не змінюються; підписи й тексти не обіцяють стирання.

**Independent Test**: quickstart §1 — додати обʼєкт, змінити тему, вийти, увійти; усе на місці; те саме для «Видалити акаунт».

- [X] T033 [US2] `src/views/profile/confirm-destructive.ts`: зробити `message` необовʼязковим (`message?: string`); якщо його немає — не передавати в `ActionSheetIOS` і `Alert.alert`
- [X] T034 [US2] `src/app/(tabs)/profile/index.tsx`: замінити `wipe`/`isWiping` на виклик `useAuth().signOut()` з тим самим прапорцем повторного запуску; прибрати імпорти `wipeLocalData`, `useOnboarding`, `resetPreferences`; `confirmSignOut`: заголовок «Вийти з акаунта?», без `message`, кнопка «Вийти»; `confirmDelete`: заголовок «Видалити акаунт?», `message` «Поки що це лише вихід з акаунта. Видалення даних зʼявиться згодом.», кнопка «Видалити акаунт»; прибрати `getProviderName(method)` із тексту, якщо він більше не використовується
- [X] T035 [US2] `src/app/(tabs)/profile/index.tsx`: прибрати підписи під заголовками рядків `profile.signOut` («Дані на цьому пристрої буде стерто») і `profile.delete` («Обʼєкти, показники та розрахунки буде стерто»); у `ListRow` лишити лише заголовок
- [X] T036 [P] [US2] `src/providers/auth-provider.tsx`: прибрати `finishPendingWipe` і обгортку в `useEffect`; підписка на `service.onAuthStateChanged(setUser)` одразу, з очищенням у `return`
- [X] T037 [P] [US2] `src/providers/preferences-provider.tsx`: прибрати імпорт і читання `PENDING_WIPE_KEY` та галузь `if (pendingWipe === 'true') return defaults`; прибрати `resetPreferences` з типу контексту, реалізації й значення провайдера
- [X] T038 [P] [US2] `src/providers/onboarding-provider.tsx`: прибрати `resetOnboarding` з типу, реалізації й значення провайдера
- [X] T039 [US2] Видалити каталог `src/services/account/` (`index.ts`, `wipe-local-data.ts`); `grep -rn "services/account" src docs` не повертає нічого, окрім документації, яку оновлює T042
- [X] T040 [US2] Перевірити в `src/app/(tabs)/profile/terms.tsx` і `src/app/(tabs)/profile/privacy.tsx`, що тексти про видалення акаунта не обіцяють стирання, якого більше немає (зараз: «Ви можете видалити акаунт у будь-який момент… Разом з ним будуть видалені всі ваші записи», «…видалити акаунт разом з усіма записами»); переформулювати без обіцянки видалення й зафіксувати зміну в підсумку фічі
- [X] T041 [US2] Додати `.claude/skills/ui-check/flows/sign-out.flow` (вихід → екран входу → вхід → дані й тема на місці; «Видалити акаунт» → те саме; `nosee` підпису про стирання) і оновити `.claude/skills/ui-check/flows/profile.flow` (`see Вийти`, `nosee Дані на цьому пристрої буде стерто`, `nosee Обʼєкти, показники та розрахунки буде стерто`)
- [X] T042 [US2] Прогнати `sign-out.flow` і `profile.flow` у iOS Simulator; пройти quickstart §1 вручну, включно з поверненням у той самий і в інший акаунт (онбординг не повторюється) і примусовим закриттям застосунку одразу після підтвердження виходу (FR-015: дані не втрачені)

**Checkpoint**: US2 працює окремо й незалежно від US1.

## Phase 5: Polish & Cross-Cutting

- [X] T043 [P] Додати `docs/patterns/icons.md` (EmojiGlyph, `Chevron`, шкала ролей, карта `AppIcon`, винятки: таб-бар, шеврони, логотипи, стрілка «Назад»; правило «нова іконка — тільки через `AppIcon` і роль») і рядок у `docs/patterns/README.md`
- [X] T044 [P] Оновити `docs/patterns/account-actions.md`: розділи «Вихід і видалення акаунта» і «Налаштування пристрою при виході» переписати — обидві дії лише `signOut()`, `services/account` видалений, `pendingWipe` не існує; прибрати вимогу додавати репозиторії в `createLocalDataWiper`, лишити вимогу `clear()` для майбутнього Firebase-видалення; оновити рядок у `README.md`
- [X] T045 [P] Оновити `docs/patterns/preferences.md` (прибрати п. 3 про `createLocalDataWiper` і `resetPreferences()`), `docs/patterns/buttons.md`, `docs/patterns/navigation-bar-buttons.md`, `docs/patterns/swipe-actions.md` там, де згадуються SVG-іконки, `tintColor` або `iconColor`
- [X] T046 Оновити канвас дизайну (`docs/design.md`, інструмент Artifact): артборди з іконками та 16, 16a, 16b, 16c (рядки «Вийти» і «Видалити акаунт» без підписів, нові тексти діалогів), а також «Дизайн-система» (іконки як emoji, шкала ролей); у `docs/design.md` нічого не змінюється, якщо посилання те саме
- [X] T047 Оновити шапку `specs/004-emoji-icons-signout/spec.md`: `Status: Implemented` і короткий підсумок реалізованого (в стилі 003)
- [X] T048 Прибрати тимчасові файли (скрипт вимірювання центрування, скріншоти, збірки, кеші), створені під час роботи, тільки ті, що створені цією фічею
- [X] T049 Остання задача: запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI)

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → US1/US2 → Polish.** T001 передує T002–T003, T001–T003 передують усьому; T005–T010 блокують обидві історії.
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

## Phase 6: Convergence

**Еталон «пункт меню»**: серед усіх іконок у рядках меню й списків найбільша — коло/плитка 42 pt із гліфом 21 pt (`EmojiTile` 42 × 0,5; у `RowIcon` гліф лише 20 pt, бо береться з ролі `button`). Усі решта кіл і плиток мають 28, 32, 36, 40, 44, 48, 52, 56, 64 pt з гліфами 14–32 pt, які не пов'язані з коло одним правилом, а підкладки різняться формою (коло, скруглений квадрат) і типом (суцільні `blue`/`inkTile`, м'які `*Soft`, скло 22%). Правило нижче замикає це одним еталоном.

- [X] T050 Зафіксувати еталон іконки пункту меню і єдине правило розмірів: у `specs/004-emoji-icons-signout/research.md` (R2) додати таблицю всіх кіл/плиток із розмірами (28, 32, 36, 40, 42, 44, 48, 52, 56, 64 pt) і ухвалене правило «гліф = 0,5 × сторона контейнера; еталон пункту меню — коло 42 pt, гліф 21 pt, форма — коло»; у `src/constants/icon-sizes.ts` додати шкалу контейнерів (`iconTiles`: `compact` 28, `menu` 42, `large` 52, `empty` 88 тощо) і функцію `glyphSizeFor(container)` = `container × 0.5`, щоб жодне місце не писало розмір гліфа числом per FR-003 (partial)
- [X] T051 Перевести `IconView` (`src/components/icon-view.tsx`) і `EmojiTile` (`src/views/objects/emoji-tile.tsx`) на єдине правило `glyphSizeFor(size)`, прибрати вибір гліфа за роллю `button`/`feature` у `IconView` (зараз 20 pt у колі 42 і 28 pt у колі 52) і зробити кола єдиною формою для іконок лівого краю рядків per FR-003 (partial)
- [X] T052 Привести всі ліві іконки пунктів меню й рядків до еталона коло 42 pt / гліф 21 pt: `RowIcon` (`src/views/profile/row-icon.tsx`, зараз гліф 20), `ObjectCard` (`src/views/object-card.tsx`, коло 42 уже, гліф 20), піни міста в `src/app/(tabs)/(outages)/outage-settings.tsx` (`styles.icon` 36 pt), `OutageSetupNotice` (`src/views/profile/outage-setup-notice.tsx`, 32 pt), `ServiceIcon` у `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx` (36 pt), `rowIconSize` у `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx` і `service-form.tsx` (48 pt) per FR-003 (partial)
- [X] T053 Єдина підкладка іконок: на світлих поверхнях — коло з м'яким тоном `*Soft` (`blueSoft`, `purpleSoft`, `powerOnSoft`, `coralSoft`, `amberSoft`, `surface2`), на кольоровому навбарі — скло `rgba(255,255,255,0.22)`; замінити суцільні `blue`/`inkTile` у `src/views/object-card.tsx`, прибрати скруглений квадрат у `EmojiTile` (`rounded={false}` за замовчуванням, використовується в `src/app/(tabs)/(objects)/[objectId]/index.tsx` і `src/views/objects/month-picker-sheet.tsx`), зібрати відповідність «роль → тон» в одному місці (`src/constants/icon-sizes.ts` або `src/constants/colors.ts`) per FR-008 (partial)
- [X] T054 Привести великі контейнери до шкали й правила 0,5: `power-status-card.tsx` (52 pt, гліф 28), `outage-settings.tsx` `noticeIcon` (52 pt), `days-sheet.tsx` `stepperCircle` (52 pt), кружок «➕» в `src/views/onboarding/addresses-illustration.tsx` (52 pt), `bill.tsx` `emptyIcon` (56 pt), `outage-message.tsx` `tile` (88 pt, гліф 40), `empty-state-view.tsx` (80/120/168 pt), `auth-error.tsx` (96 pt), `ServiceIcon` 64 pt в `icon-picker.tsx`, комірка місяця в `month-picker-sheet.tsx` (гліф 28), футер `ObjectCard` (`EmojiTile` 28 pt, гліф 14: звірити читабельність і за потреби підняти до наступного кроку шкали) per FR-003 (partial)
- [X] T055 Привести кола й гліфи в навбарі до правила 0,5 і шкали: `src/components/navigation-bar/navigation-bar-button.tsx` і `navigation-bar-icon-button.tsx` (коло 44 pt, гліф 20 → 22), `short-navigation-bar-button.tsx` (коло 28 pt, гліф 16 → 14), `navigation-bar-chip.tsx`, `transparent-action-button.tsx` (коло 40 → 42), `ServiceBadge` в `src/app/(auth)/index.tsx` (коло 44), `app-header.tsx` (36 pt) per FR-003 (partial)
- [X] T056 Оновити канвас дизайну під еталон: у кожному артборді з іконками (05–05b «Обʼєкти», 06–07, 08–08c, 09–09i, 10–11e, 12–12c, 13–13d, 13a, 16–16g, 20–22, 20–21d) і на сторінці «Дизайн-система» (`docs/design.md`, інструмент Artifact) замінити векторні іконки на emoji з розмірами й підкладками за T050–T055, додати до «Дизайн-системи» таблицю шкали контейнерів і ролей; якщо до артефакту немає прав на запис — опублікувати окрему копію й оновити посилання в `docs/design.md` per Constitution IV (missing; уточнює T046, який лишається відкритим)
- [X] T057 Оновити `docs/patterns/icons.md`: додати шкалу контейнерів, правило «гліф = 0,5 × контейнер», еталон «пункт меню» 42/21, правило підкладок і таблицю «роль → тон» per FR-016 (partial)
- [X] T058 Звірити результат: `ui-check` обрізані знімки ліворуч-іконок профілю (`profile.*`), `ObjectCard`, рядка міста, статусу світла, стартової вкладки, карток послуг у світлій і темній темі та на Android-емуляторі; усі пункти меню мають коло 42 pt, гліф 21 pt, однакову форму й тон підкладки, розбіжність центру ≤ 1 pt (це продовжує T031 і T032) per SC-002 (partial)

## Phase 7: Convergence

- [X] T059 Привести будинок у центральному колі екрана входу до правила «гліф = 0,5 × контейнер»: у `src/app/(auth)/index.tsx` замість `size={iconWidth * 0.7}` (на 402 pt це ~34 pt у колі 104 pt) рахувати гліф від кола `glyphSizeFor(thirdCircleWidth)` і прибрати невикористану `iconWidth`, якщо вона більше ніде не потрібна per FR-003 (partial)
- [X] T060 Узгодити з користувачем тексти документів: `src/app/(tabs)/profile/terms.tsx` («Разом з ним будуть видалені всі ваші записи») і `src/app/(tabs)/profile/privacy.tsx` («видалити акаунт разом з усіма записами») обіцяють стирання, якого «Видалити акаунт» більше не робить; переформулювати (наприклад, «з появою синхронізації…») або залишити як чернетку під Firebase за явним рішенням користувача, зафіксувати рішення в підсумку `spec.md` per FR-014 / Обсяг (partial; T040 закрита без зміни тексту)
- [X] T061 Прибрати emoji з озвучуваних назв рядків: зараз `Pressable`-рядки отримують label на кшталт «🚪 Вийти», «🌓 Тема», «🛡️ Політика конфіденційності» (видно в `ui screen`), хоча іконка декоративна; у `src/components/emoji-glyph.tsx` (і за потреби в `ListRow` з `src/views/objects/list-card.tsx`) зробити так, щоб текст гліфа не входив до `accessibilityLabel` батька (iOS — `accessibilityElementsHidden`, Android — `importantForAccessibility='no-hide-descendants'` на `Text`, або явний label рядка), оновити селектори в `.claude/skills/ui-check/flows/*.flow`, якщо вони покладалися на emoji в label per contracts/icons.md «декоративний» (partial)
- [X] T062 Перевірити emoji в темній темі на iOS і Android (US1/AC6, quickstart §3): обрізані знімки `RowIcon`, кнопок навбару, степера «➕/➖», галочок ✅ на `coralSoft`/`surface2`/`blueSoft` підкладках; переконатися, що гліфи читаються, і поміряти центрування в темній темі тим самим методом per SC-002 (partial; T058 виміряла лише світлу тему)
- [X] T063 Перевірити FR-005 на екрані з іконками при найбільшому розмірі шрифту системи: прокрутити профіль і «Обʼєкти» до рядків з іконками (`xcrun simctl ui <sim> content_size accessibility-extra-extra-extra-large`), поміряти коло 42 pt / гліф ~20 pt тим самим скриптом, повернути розмір шрифту `large` per FR-005 (partial; T032 не дійшла до рядків з іконками)

## Phase 8: Convergence

- [X] T064 Перенести в канвас (`docs/design.md`, інструмент Artifact) підкладки темних emoji з T062: у `project/ui.css` додати токени `--plus-soft` (світла тема `#FDECEA`, темна `#F2A49C`) і `--glyph-light` (`#FFFFFF` / `#D5D9E0`), у артбордах замінити `var(--coral-soft)` під ➕ (плитки «Додати адресу», «Додати послугу», бейдж «➕» порожніх станів, кружок онбордингу) на `var(--plus-soft)` і фон кнопок степера днів у `PropertyMonth.dc.html` на `var(--glyph-light)`, щоб темна версія артбордів збігалася із застосунком per Constitution IV (partial)
- [X] T065 Перевірити на Android, що emoji не потрапляє в озвучувану назву рядків після T061: на емуляторі Pixel_9_Pro відкрити «Профіль», зняти `adb shell uiautomator dump` і переконатися, що `content-desc` рядків «Вийти», «Видалити акаунт», «Тема» не містить emoji; якщо містить — доповнити `src/components/emoji-glyph.tsx` для Android per contracts/icons.md «декоративний» (partial; T061 перевірена лише на iOS)
