---

description: "Task list for 012-unified-navbar-glass"
---

# Tasks: Єдиний навбар і кнопки з рідкого скла

**Input**: Design documents from `/specs/012-unified-navbar-glass/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/interfaces.md](contracts/interfaces.md), [quickstart.md](quickstart.md)

**Tests**: специфікація автотестів не вимагає. Перевіряємо через `ui-check` (`navbar.flow`, `theme.flow`), скріншоти iOS 26 і Android та [quickstart.md](quickstart.md).

**Organization**: задачі згруповані за user story.
- US1 — скляні кнопки.
- US2 — єдиний навбар без згортання.
- US3 — канвас.

US1 і US2 обидві змінюють `navigation-bar-header.tsx`, тому їхні задачі в цьому файлі йдуть послідовно (T003 → T009).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (різні файли, без залежностей)
- **[Story]**: US1, US2, US3 зі [spec.md](spec.md)

---

## Phase 1: Setup

Підготовки не потрібно:
- `expo-glass-effect` ~58.0.4 уже в `package.json`, модуль `ExpoGlassEffect` — у нативному проєкті й в Expo Go;
- нових залежностей і development build немає (plan: Constitution Check III, research R8).

---

## Phase 2: Foundational

Блокувальних спільних задач немає. Кожна історія починається з власних файлів.

---

## Phase 3: User Story 1 - Кнопки навбару зі скла (Priority: P1) 🎯 MVP

**Goal**: «Назад», «Налаштування» і вибір місяця — однакові круглі кнопки 44×44.
- На iOS 26+ вони з системного рідкого скла.
- Деінде — однакова напівпрозора підкладка.

**Independent Test**: quickstart, кроки 1–4 і 8–10. На iOS 26 «Назад» на екрані адреси і ⚙️ на «Світлі» — круглі скляні кнопки однакового розміру. На Android і з «Зменшити прозорість» — напівпрозорі кола того самого розміру.

- [X] T001 [P] [US1] Створити `src/hooks/use-liquid-glass.ts`: `useLiquidGlass(): boolean` за contracts/interfaces.md.
  - Повертає `true` лише якщо `Platform.OS === 'ios'`, `isGlassEffectAPIAvailable()`, `isLiquidGlassAvailable()` (обидві з `expo-glass-effect`) і `AccessibilityInfo.isReduceTransparencyEnabled()` дав `false`.
  - Підписатися на `AccessibilityInfo.addEventListener('reduceTransparencyChanged', …)` і відписатися при розмонтуванні.
  - Початкове значення `false`, доки асинхронна перевірка не завершилась.
  - У коментарі пояснити, чому окремо перевіряється «Зменшити прозорість»: `isLiquidGlassAvailable()` може повернути `true` і за увімкненого налаштування (research R1).
  - FR-002, FR-003.
- [X] T002 [US1] Переписати `src/components/navigation-bar/navigation-bar-icon-button.tsx` за contracts/interfaces.md.
  - **Пропи**: `content: { icon: AppIcon } | { kind: 'back' }`, `tone: 'colored' | 'plain'`, `accessibilityLabel`, `testID?`, `onPress`.
  - **Розмір**: коло 44×44 (`iconTiles.touch`, `borderRadius: 22`).
  - **Вміст**:
    - emoji — `AppImage` з `container={iconTiles.touch}`;
    - стрілка — `expo-image` `require('@/assets/images/icons/arrow-back.svg')` 22×22, `tintColor`: `onPrimary` для `colored`, `coral` для `plain`.
  - **Скло** (`useLiquidGlass()` повертає `true`): `GlassView` з `glassEffectStyle={tone === 'colored' ? 'clear' : 'regular'}`, `isInteractive`, `colorScheme` — тема застосунку (`useColorScheme`/провайдер теми з `docs/patterns/preferences.md`), а не системна.
  - **Запасний вигляд**:
    - `colored`: `backgroundColor: 'rgba(255, 255, 255, 0.18)'`, `borderWidth: StyleSheet.hairlineWidth`, `borderColor: 'rgba(255, 255, 255, 0.35)'`;
    - `plain`: `useThemeColor('surface2')` з обвідкою `useThemeColor('line')`.
  - **Натискання**: `Pressable` з `@/components` (замок 500 мс, `docs/patterns/buttons.md`). На склі без зміни opacity; у запасному вигляді `pressed` дає `opacity: 0.7`.
  - Ні кнопка, ні її предки не отримують `opacity < 1`: за малої прозорості скло не малюється (research R2).
  - FR-001, FR-002, FR-003, FR-007.
- [X] T003 [US1] У `src/components/navigation-bar/navigation-bar-header.tsx` замінити `Pressable` + `Image` кнопки «Назад» на `NavigationBarIconButton`.
  - Пропи: `content={{ kind: 'back' }}`, `tone={isTransparent ? 'plain' : 'colored'}`, `accessibilityLabel='Назад'`, `testID='navigationBar.back'`, `onPress={() => router.back()}`.
  - Вирівнювання (FR-004, research R4):
    - лівий край кола «Назад» на `HORIZONTAL_PADDING` (`marginStart: HORIZONTAL_PADDING` замість зсуву на половину різниці);
    - короткий заголовок на 8 pt після кнопки (`afterBack: { marginStart: 8 }`), `flex: 1`, `numberOfLines={1}`, `maxFontSizeMultiplier` 1,5;
    - правий край `accessory` на `HORIZONTAL_PADDING`, проміжок до заголовка 8 pt, заголовок не налазить на праву кнопку.
  - Прибрати константи `BACK_TAP_SIZE`/`BACK_ICON_SIZE` і стиль `pressed`, якщо вони більше не потрібні.
- [X] T004 [US1] У `src/app/(tabs)/(outages)/index.tsx` оновити `settingsButton` під нові пропи: `content={{ icon: 'gear' }}`, `tone='colored'` (навбар `power`). `accessibilityLabel='Налаштування графіка'` і `testID='outages.settings'` без змін. FR-001.
- [X] T005 [US1] У `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx` замінити `NavigationBarChip` «Місяць» у `headerAccessory` на `NavigationBarIconButton`.
  - Пропи: `content={{ icon: 'calendar' }}`, `tone='colored'`, `accessibilityLabel='Змінити місяць'`, `testID='month.change'`; той самий `onPress` (шторка місяців).
  - Умова `!isReadOnly` лишається: для архівного обʼєкта кнопки немає (spec Edge Cases).
  - Прибрати імпорт `NavigationBarChip`.
  - FR-005b.
- [X] T006 [US1] Видалити `src/components/navigation-bar/navigation-bar-chip.tsx` і його експорт з `src/components/navigation-bar/index.ts`, перевірити `src/components/index.ts`. Інших використань немає (research R4).
- [ ] T007 [US1] Перевірити скло в iOS Simulator з iOS 26 (quickstart, кроки 1–4, 8–10; світла й темна тема):
  - вигляд «Назад» на кольоровому і прозорому навбарі (екран суми з рахунку), ⚙️, 📅;
  - відгук `isInteractive` під `Pressable` (ризик research R2). Якщо відгуку немає — зробити `GlassView` коренем кнопки, а `Pressable` покласти всередину на всю площу (`StyleSheet.absoluteFill`) і зафіксувати рішення в `research.md` R2;
  - запасний вигляд з увімкненим «Зменшити прозорість» і перемикання на ходу;
  - запасний вигляд на Android-емуляторі;
  - скріншоти через `ui-check` `shot`.
  - SC-001, SC-004.

**Checkpoint**: кнопки рядка навбару скляні на iOS 26+ і однакові деінде. Згортання ще працює по-старому.

---

## Phase 4: User Story 2 - Однаковий навбар на всіх екранах (Priority: P1)

**Goal**:
- навбар не згортається, висота під час скролу дорівнює висоті при відкритті;
- корені вкладок — `full` (великий заголовок 28, підзаголовок);
- усі інші екрани — `short` (рядок 44: «Назад», заголовок 22, права кнопка), без підзаголовка.

**Independent Test**: quickstart, кроки 5–7 і `ui-check` `navbar.flow`. Свайп на «Обʼєктах», «Профілі», «Світлі» й «Місяці» не змінює висоту навбару. Вкладені екрани мають однаковий рядок 44 без підзаголовка.

- [ ] T008 [US2] Видалити `src/components/navigation-bar/use-navigation-bar-progress.ts`. У `src/components/navigation-bar/themed-navigation-bar.tsx`:
  - прибрати `scrollY`, `collapseDistance`, `fallbackScrollY`, `fallbackCollapseDistance`, стан `isCollapsed` і `useAnimatedReaction`;
  - `Animated.View` накладки замінити на `View` без `overlayStyle`;
  - `onLayout` викликає `onHeightChange(height)` напряму, якщо висота змінилась;
  - зберегти й заміряти висоту ряду великих кнопок (`onButtonsHeightChange` → `useState`) для градієнта.
  - FR-006, research R3.
- [ ] T009 [US2] У `src/components/navigation-bar/navigation-bar-header.tsx` (після T003):
  - прибрати пропи `progress` і `isCollapsed`, `Animated.View` великого блоку з `largeContentStyle`, `pointerEvents`/`accessibilityElementsHidden`/`importantForAccessibility` за `isCollapsed`, `pinnedRowStyle` і `shortTitleStyle`;
  - **`full`**: великий блок (заголовок 28 + `trailing`, підзаголовок 14, `content`, ряд кнопок) завжди видимий і натискається. Рядка короткого заголовка поверх нього немає. Рядок з «Назад» над великим заголовком є, лише якщо `canGoBack`. Корені вкладок за правилом не мають «Назад».
  - **`short`**: рядок 44 у потоці розкладки (не `position: 'absolute'`): «Назад», заголовок, `accessory`; під ним ряд кнопок, якщо він є.
  - Коментар над компонентом: навбар не згортається, висота — та, з якою відкрився екран.
  - FR-005, FR-005a, FR-006, FR-007.
- [ ] T010 [US2] У `src/components/navigation-bar/navigation-bar-background.tsx` замінити анімовані `style`/`sheetCornerStyle` (`AnimatedViewStyle`) на статичні:
  - градієнт з кнопками закінчується на `buttonsHeight − BUTTONS_GRADIENT_OVERLAP` від низу накладки (`bottom`), без кнопок — внизу;
  - кути шторки завжди повні `SHEET_RADIUS` (28), без `scale`.
  - Відповідно оновити виклик у `themed-navigation-bar.tsx`. Research R3.
- [ ] T011 [US2] У `src/components/navigation-bar/types.ts` прибрати `scrollY` і `collapseDistance` з `ThemedNavigationBarProps`. Оновити коментарі:
  - `headerContent`/`headerTrailing` — «лише для `type='full'`», без «згортається»;
  - `navigationBarButtons` — «завжди видимі».
  - `headerAccessory` — права скляна кнопка рядка `short` (`NavigationBarIconButton`).
  - `type` — `full` лише на коренях вкладок.
  - Прибрати з `src/components/navigation-bar/constants.ts` невживані після T008–T010 константи (`EMPTY_BOTTOM` і `SHORT_TITLE_ROW_HEIGHT` лишаються).
- [ ] T012 [US2] Спростити `src/components/navigation-view.tsx` (research R3).
  - **Прибрати**:
    - `snapTarget`, `snapHeader`, `isSnapping`;
    - `collapseDistance`, `naturalMaxScroll`, `spacerHeight` і `spacerStyle` з розпіркою;
    - `keyboardCollapse`, `headerScrollY`, `onKeyboardHidden`, `keyboardShiftStyle` (обгортка `Animated.View` стає звичайною `View` або зникає);
    - `useKeyboardHandler`;
    - ефект доводки при поверненні фокуса (`isFocused`/`isScreenFocused`, якщо більше ніде не потрібні);
    - `onMomentumScrollEnd` для доводки.
  - **Лишити**:
    - `headerHeight` з `onHeightChange` і `contentTop` (+`SHEET_CONTENT_TOP` на кольоровому навбарі);
    - `SafeAreaListener` і `contentInset` під таб-бар, `progressViewOffset`, `contentInsetAdjustmentBehavior='never'`;
    - `contentFits`/`scrollEnabled` з `isUserScrolling` (скидати на `onScrollEndDrag` без інерції й на `onMomentumScrollEnd`), але без умови `isAtTop`;
    - маркер кінця контенту.
  - Не передавати в `ThemedNavigationBar` `scrollY`/`collapseDistance`.
  - Перевірити, що `useFormFooterKeyboardInsets` у `src/views/objects/form-footer.tsx` не покладається на прибрані значення.
  - FR-006.
- [ ] T013 [P] [US2] `src/app/(tabs)/(objects)/object-form.tsx`: `NavigationView` → `type='short'`, прибрати `subtitle`. FR-005a.
- [ ] T014 [P] [US2] `src/app/(tabs)/(objects)/preview.tsx`: `type='short'`, прибрати `subtitle`. FR-005a.
- [ ] T015 [P] [US2] `src/app/(tabs)/(objects)/[objectId]/service-form.tsx`: `type='short'`, прибрати `subtitle` («Для обʼєкта: …»). FR-005a.
- [ ] T016 [US2] `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx` (після T005): `type='short'`, прибрати `subtitle` (адреса). FR-005a.
- [ ] T017 [P] [US2] `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx`: `type='short'`, прибрати `subtitle` («<місяць> · <послуга>»). FR-005a.
- [ ] T018 [P] [US2] `src/app/(tabs)/profile/theme.tsx`: `type='short'`, прибрати `subtitle` («Оформлення застосунку»). FR-005a.
- [ ] T019 [P] [US2] `src/app/(tabs)/profile/edit-name.tsx`: `type='short'`, прибрати `subtitle` («Як до вас звертатися в застосунку»). FR-005a.
- [ ] T020 [US2] Пройти решту екранів зі списку spec «Екрани, яких стосується» і переконатися, що вони вже `short` (вкладені) або `full` (корені). Прибрати пропи, що лишились від згортання (`headerTrailing`/`headerContent` на `short`):
  - `archive.tsx`, `[objectId]/index.tsx`, `services.tsx`, `bill.tsx`, `amount.tsx`;
  - `outage-settings.tsx`;
  - `legal-document.tsx`;
  - `sign-in.tsx`, `auth-error.tsx`;
  - корені `(objects)/index.tsx`, `(outages)/index.tsx`, `profile/index.tsx`.
  - Перевірити `src/app/(tabs)/_layout.tsx`: коментар до `disableAutomaticContentInsets` не має посилатися на згортання.
- [ ] T021 [US2] Переписати `.claude/skills/ui-check/flows/navbar.flow`:
  - шапковий коментар: specs/012, навбар без згортання;
  - замість `gone "label=Імʼя, документи та акаунт"` після свайпу — `see Імʼя, документи та акаунт` (підзаголовок кореня лишається);
  - `check id=objects.nav.add count=1` після свайпу на «Обʼєктах»;
  - на «Темі» замість `see Оформлення застосунку` — `see Тема` і `shot`;
  - на місяці адреси — `check id=month.change count=1`, `shot`;
  - `tap id=navigationBar.back` по одному разу.
- [ ] T022 [P] [US2] У `.claude/skills/ui-check/flows/theme.flow` (рядок 22) замінити `see Оформлення застосунку` на перевірку, що відкрито «Тему» (`see Тема` або `wait id=` екрана теми, якщо testID є).
- [ ] T023 [US2] Запустити `navbar.flow`, `theme.flow`, `profile.flow`, `meter.flow`, `archive.flow`, `smoke.flow`. Пройти quickstart, кроки 5–7:
  - без згортання;
  - клавіатура на «Додати показник» і «Ваше імʼя» — поле не ховається під навбаром;
  - найбільший системний шрифт (Accessibility Inspector / «Більший текст»): скляні кнопки лишаються 44×44, короткий заголовок обрізається трикрапкою й не налазить на «Назад» чи 📅 (spec Edge Cases);
  - прогорнути довгий контент до кінця на «Обʼєктах», «Місяці» й «Профілі»: останній блок видно повністю над таб-баром / home indicator (spec Edge Cases);
  - висоти рядка 44 на вкладених однакові ±1 pt за скріншотами (SC-002);
  - «потягни, щоб оновити» на «Світлі» — індикатор під навбаром.
  - Виправити знайдене.

**Checkpoint**: навбар однаковий на всіх екранах і не змінюється під час скролу.

---

## Phase 5: User Story 3 - Канвас збігається із застосунком (Priority: P2)

**Goal**: артборди канваса показують той самий навбар і ті самі скляні кнопки, що й застосунок (`docs/design.md`).

**Independent Test**: quickstart, крок 11. Кожен артборд з навбаром збігається з екраном застосунку за висотою навбару й виглядом кнопок (SC-003).

- [ ] T024 [US3] Прочитати канвас (`Artifact` `action: "read"`, `https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj`): `project/canvas.json`, `project/ui.css`, артборди з research R6. Додати в `project/ui.css` клас `.glass-btn`:
  - коло 44×44, `border-radius: 22px`;
  - `backdrop-filter: blur(...) saturate(...)`;
  - фон `rgba(255,255,255,.18)` і обвідка `.5px rgba(255,255,255,.35)` на `.hero`;
  - на білому екрані — `var(--glass-bg)` і `var(--glass-rim)`;
  - відблиск `inset 0 1px 0 var(--glass-hi)`.
  - `.back` перевести на цей вигляд і прибрати `margin-left: -10px`: коло стоїть на полі 20 pt (FR-004).
  - FR-008.
- [ ] T025 [US3] Вкладені артборди переробити на рядок `.hero-row`: скляна `.back` + `h1` 22 (`.hero h1`), без великого заголовка (`h1.big`/`.title`) і підзаголовка. Артборди:
  - 02 «Вхід» і 04 «Помилка входу» — без «Назад», якщо його немає в застосунку;
  - 06, 06a, 07;
  - 08, 08a, 08e;
  - 09, 09d, 09e, 09f, 09g, 09h, 09i;
  - 10, 10a, 10b, 10c, 10d, 10i;
  - 10e, 10f, 10g;
  - 11, 11b, 11c, 11e;
  - 12, 12c, 12e;
  - 13, 13a, 13b, 13c, 13d;
  - 16d, 16e, 17, 18, 19;
  - 21a, 21b, 21c, 21d;
  - 05c, 05d.
  - FR-005a, FR-008.
- [ ] T026 [US3] На артбордах місяця (09*) чип «Місяць» замінити скляною кнопкою 📅 праворуч у `.hero-row` (`.glass-btn`, `aria-label="Змінити місяць"`). На 08a (архівований обʼєкт) кнопки немає. На артбордах «Світла» (20, 20a–20e, 20l, 20d) шестерню перевести з `.chip` на `.glass-btn`. FR-005b, FR-008.
- [ ] T027 [US3] Артборди «після скролу» (05b, 08b, 09b, 12b, 20s): навбар тієї самої висоти й складу, що й до скролу, контент частково під ним, кути шторки 28 (`.hero.collapsible`/`.hero-band` прибрати або привести до статичного вигляду). Назву 20s «Після скролу — заокруглення» змінити в `canvas.json` на «Після скролу». FR-006, FR-008.
- [ ] T028 [US3] Опублікувати змінені файли канваса (`Artifact` publish з `url` канваса, лише змінені `files`). Перечитати 3–4 артборди (05b, 09, 10, 20) і звірити з екранами застосунку: висота навбару, скляні кнопки. SC-003.

**Checkpoint**: канвас і застосунок збігаються.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T029 Переписати `docs/patterns/navigation-bar-title.md` (назва файлу лишається): **навбар без згортання**.
  - **Що прибрати**: правила прогресу `p`, `D`, кути, що ростуть з `p`, розпірку, доводку `snapTarget`, згортання з клавіатурою, «висота зменшується лише при `p = 0`», фокус посеред доводки, короткий заголовок, що зʼявляється при згортанні.
  - **Що лишити**: накладку над скролом, `SHEET_CONTENT_TOP`/`SHEET_RADIUS` (кути завжди 28), `contentInsets` без `top`, `disableAutomaticContentInsets`, `progressViewOffset`, нижній відступ через `SafeAreaListener`, `scrollEnabled` для короткого контенту, шрифти (28/22/14), відсутність індикаторів прокрутки, `headerContent`/`headerTrailing`.
  - **Що додати**:
    - корені вкладок — `full`, решта — `short` без підзаголовка;
    - висота після відкриття не змінюється під час скролу;
    - з клавіатурою навбар не змінюється.
  - Робиться в тому самому коміті, що й T008–T012 (конституція IV).
- [ ] T030 [P] Оновити `docs/patterns/navigation-bar-buttons.md`: кнопки під заголовком завжди видимі й натискаються, не ховаються під час скролу. Прибрати пункт про `p ≥ 0.5` і «ховаються разом із заголовком». Градієнт заходить у ряд на `BUTTONS_GRADIENT_OVERLAP` (статично).
- [ ] T031 [P] Створити `docs/patterns/navigation-bar-icon-buttons.md` — скляні кнопки рядка навбару:
  - `NavigationBarIconButton` (`content`, `tone`), `useLiquidGlass`;
  - `GlassView` `clear`/`regular` + `isInteractive` + тема застосунку;
  - запасна підкладка на Android, iOS < 26 і з «Зменшити прозорість»;
  - заборона opacity < 1 на склі та предках;
  - вирівнювання кола на 20 pt;
  - де стоять: «Назад», ⚙️ (`headerTrailing`), 📅 (`headerAccessory`).
- [ ] T032 Оновити `docs/patterns/README.md`:
  - рядок «Заголовок навбару при скролі» → «Навбар» з новим описом (без згортання, корені full / вкладені short);
  - рядок «Кнопки навбару» — без «ховаються разом із заголовком»;
  - новий рядок для `navigation-bar-icon-buttons.md`.
- [ ] T033 [P] Прибрати згадки про `NavigationBarChip` і згортання з інших патернів:
  - `docs/patterns/test-ids.md` (рядок 22 — лише `NavigationBarIconButton`);
  - `docs/patterns/pickers.md` (рядок 21: «скляна кнопка 📅 праворуч у рядку „Назад“ (`NavigationBarIconButton` через `headerAccessory`)»);
  - `docs/patterns/outage-providers.md` (рядок 57: чипи черг не згортаються, шестерня — скляна кнопка);
  - `docs/patterns/icons.md`, якщо там є виняток для стрілки «Назад»: стрілка тепер усередині скляної кнопки.
- [ ] T034 У `specs/012-unified-navbar-glass/spec.md` поставити **Status**: Implemented і коротко підсумувати українською, що змінилося (конституція, «Процес»).
- [ ] T035 Запустити `npx expo lint` і `npx tsc --noEmit` з кореня проєкту, виправити всі помилки (конституція VI).

---

## Dependencies & Execution Order

- **US1** (T001–T007): T001 → T002 → T003. T004, T005 — після T002 (без [P]: до T002 нові пропи не існують і typecheck падає). T006 — після T005. T007 — останнім.
- **US2** (T008–T023):
  - T008 → T009 (після T003) → T010 → T011 → T012;
  - T013–T019 від компонентів не залежать: `type='short'` і без `subtitle` вони працюють і зі старим навбаром. T016 — після T005;
  - T020 — після T011;
  - T021–T023 — після T012.
- **US3** (T024–T028): від коду не залежить, можна паралельно з US1/US2. Звірка T028 — після T007 і T023.
- **Polish**: T029–T033 — в одному коміті з відповідною зміною коду (T029/T030 з US2, T031 з US1). T034, T035 — останні.

## Parallel Example

```text
# US1 старт:
T001 use-liquid-glass.ts   ‖  T013–T015, T017–T019 (екрани → short)  ‖  T024 канвас ui.css

# Після T002 (різні файли, можна разом, але лише після T002):
T004 (outages)/index.tsx   ‖  T005 [month]/index.tsx

# Документація:
T030 navigation-bar-buttons.md  ‖  T031 navigation-bar-icon-buttons.md  ‖  T033 інші патерни
```

## Implementation Strategy

1. **MVP — US1**: скляні кнопки (T001–T007) і патерн T031. Користувач одразу бачить головну зміну на кожному екрані. Коміт.
2. **US2**: прибрати згортання й уніфікувати структуру (T008–T023) разом з T029, T030, T032, T033. Коміт.
3. **US3**: канвас (T024–T028). Коміт.
4. **Завершення**: T034, T035, фінальний коміт.
