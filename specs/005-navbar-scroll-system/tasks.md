# Tasks: Єдиний навбар — поведінка, скрол, заокруглення й відступи

**Input**: Design documents from `/specs/005-navbar-scroll-system/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: окремих тестових задач немає (unit-тестів у проєкті немає, у специфікації їх не просили). Перевірка — сценарії `ui-check` в iOS Simulator і ручна перевірка на Android за quickstart.

**Формат**: `- [ ] T### [P?] [US?] Опис зі шляхом`. `[P]` означає, що задачу можна робити паралельно (інші файли, немає залежностей від незавершених задач).

**Скорочення** (з data-model.md): `H` — висота розгорнутої накладки; `L` — висота великого блоку; `D` — відстань згортання; `p = clamp(max(scrollY, keyboard × D) / D, 0, 1)`, а якщо `D = 0`, то `p = 0`. У воркетах лише `get()`/`set()` (`docs/patterns/reanimated.md`).

## Phase 1: Setup

- [ ] T001 У `src/components/navigation-bar/constants.ts` додати `export const SHEET_RADIUS = 28;` (канвас `--r-xl`) і `export const SHEET_CONTENT_TOP = 24;` (канвас `.sheet{padding:24px 20px 0}`) з коментарями. `COLLAPSE_DISTANCE`, `SHORT_ROW_OFFSET` і `SHORT_ROW_BOTTOM` поки не чіпати: їх приберуть T012 і T013
- [ ] T002 [P] У `src/components/content-insets.ts` прибрати поле `top` з `ContentInsets`, а `toPadding` зробити таким: `paddingHorizontal: insets?.horizontal ?? HORIZONTAL_PADDING`, `paddingBottom: insets?.bottom`, імпорт `HORIZONTAL_PADDING` з `./navigation-bar/constants`. Помилки типів в екранах виправляє T026

## Phase 2: Foundational (блокує всі історії)

**⚠️ CRITICAL**: поки T003–T008 не готові, навбар не можна розбирати по історіях — від прогресу й накладки залежить усе інше.

- [ ] T003 Створити `src/components/navigation-bar/use-navigation-bar-progress.ts` замість `use-title-collapse.ts`. Хук приймає `scrollY: SharedValue<number>` (вже з урахуванням клавіатури), `hasBackButton: boolean` і `hasLargeBlock: boolean`. Він міряє `L` максимумом (`onLargeHeightChange: (h) => largeHeight.set(c => Math.max(c, h))`, як зараз), рахує `D = L + (hasBackButton ? 0 : SHORT_TITLE_ROW_HEIGHT)` (0 без великого блоку), пише `D` у передану `collapseDistance: SharedValue<number>` і віддає `progress = useDerivedValue(...)` за формулою `p`. Стилі лише з трансформаціями й прозорістю, **без `height`**:
  - `overlayStyle`: `translateY: −p × D`;
  - `pinnedRowStyle`: `translateY: +p × D` для рядка «назад» і короткого заголовка;
  - `largeContentStyle`: `opacity` 1→0 на `p ∈ [0, 0.7]`;
  - `shortTitleStyle`: `opacity` 0→1 і `translateY` 8→0 на `p ∈ [0.6, 1]`.

  Видалити `src/components/navigation-bar/use-title-collapse.ts`
- [ ] T004 Переробити `src/components/navigation-bar/navigation-bar-header.tsx` під T003. Великий блок (заголовок, підзаголовок, `content`, `trailing`) займає природну висоту й міряється одним `onLayout`. Згортання — лише через `largeContentStyle` і зсув усієї накладки, рядок «назад» закріплений `pinnedRowStyle`. Прибрати пропси `titleShrink`, `collapseScroll` і `maxScrollY`, а також `largeAreaStyle` і `rowStyle` з анімованою висотою. Без кнопки «назад» рядок короткого заголовка резервує `SHORT_TITLE_ROW_HEIGHT` завжди, а заголовок у ньому прозорий до `p ≥ 0.6`. Відступ кнопки «назад» (`marginStart = HORIZONTAL_PADDING − (44 − 22) / 2`) і вирівнювання великого заголовка на `HORIZONTAL_PADDING` зберегти
- [ ] T005 Оновити `src/components/navigation-bar/types.ts`: прибрати `maxScrollY`, `titleShrink`, `collapseScroll` і `cornerRadius` з `ThemedNavigationBarProps`, лишити `scrollY` і `titleCollapseDistance`, перейменувавши його на `collapseDistance` (скрол, за який навбар згортається повністю; 0, якщо великого блоку немає), додати `onHeightChange?: (height: number) => void` (повідомляє `H`). Тип `NavigationBarVariant` лишається для `type`
- [ ] T006 Переробити `src/components/navigation-bar/themed-navigation-bar.tsx` на накладку: кореневий `Animated.View` з `position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1` і `overlayStyle`, `onLayout` → `onHeightChange(max(H))`. Порядок усередині: фон-градієнт (T020 подовжить його вгору), заголовок (T004), ряд великих кнопок (T011 перенесе його у великий блок), смужка шторки (T024). `useNavigationBarCollapse` більше не викликати
- [ ] T007 У `src/components/navigation-view.tsx` поставити `ThemedNavigationBar` накладкою над `KeyboardAwareScrollView`: обгортка `View` з `flex: 1`, навбар абсолютно зверху, скрол на всю висоту. Тримати `const [headerHeight, setHeaderHeight] = useState(0)` з `onHeightChange`. Верхній відступ контенту = `headerHeight + SHEET_CONTENT_TOP` (кольоровий навбар) або `headerHeight` (прозорий):
  - iOS — `contentInset={{ top, bottom: bottomInset }}`, `scrollIndicatorInsets` так само, і в `onScroll` `scrollY = contentOffset.y + top`;
  - Android — `paddingTop: top` у `contentContainerStyle`, і `scrollY = contentOffset.y`.

  Значення `top` для воркету тримати в shared value. Прибрати `titleShrink`, `collapseScroll`, `naturalScroll` і поки що старий `spacerHeight` (новий робить T021). Платформи розрізняти через `Platform.OS`. Перед зміною звірити `contentInset` і `contentOffset` з документацією ScrollView RN 0.88 (Constitution I)
- [ ] T008 У `src/components/navigation-view.tsx` перейти на одну відстань: `collapseDistance` (shared value з навбару) замість `titleCollapseDistance` і `buttonsCollapseDistance`. `headerScrollY = max(scrollY, keyboardCollapse × collapseDistance)` передається в навбар як `scrollY`. Прибрати імпорт `COLLAPSE_DISTANCE`. `isAtTop` і `contentFits` рахувати від нормалізованого `scrollY` і `viewportHeight − bottomInset − верхній відступ`. Перевірка фази: `npx tsc --noEmit` без помилок у `src/components/`, у симуляторі «Профіль» і обʼєкт згортаються, контент іде 1:1 з пальцем

**Checkpoint**: навбар — накладка з одним прогресом; далі історії можна робити в будь-якому порядку.

## Phase 3: User Story 1 — Без коротких кнопок-«пігулок» (Priority: P1) 🎯 MVP

**Goal**: великі кнопки ховаються разом із великим заголовком, «пігулок» немає (FR-001, FR-002).

**Independent Test**: «Обʼєкти» з 5+ адресами, обʼєкт, послуги — прогорнути до кінця й назад. «Пігулок» немає в жодній точці, нагорі кнопки натискаються, у дереві `ui-check` кожен testID кнопки навбару трапляється не більше одного разу (quickstart 1–2).

- [ ] T009 [P] [US1] Видалити `src/components/navigation-bar/short-navigation-bar-button.tsx` і його експорт з `src/components/navigation-bar/index.ts`. Через `grep -rn ShortNavigationBarButton src` перевірити, що інших використань немає
- [ ] T010 [US1] Спростити `src/components/navigation-bar/navigation-bar-buttons-row.tsx`: прибрати `variant`, `top` і `onHeightChange`, рендерити лише `NavigationBarButton`, ряд у потоці розкладки (без `position: 'absolute'`). Пропс `isInteractive` керує `pointerEvents`, `accessibilityElementsHidden` і `importantForAccessibility='no-hide-descendants'`. Горизонтальний `ScrollView` з `paddingHorizontal: HORIZONTAL_PADDING` і `HStack spacing={12}` зберегти (ширина кнопки — 50% екрана, `docs/patterns/navigation-bar-buttons.md`)
- [ ] T011 [US1] Переписати `src/components/navigation-bar/navigation-bar-buttons.tsx`: один `NavigationBarButtonsRow`, без перехресного затухання двох рядів. Перенести ряд кнопок у великий блок `navigation-bar-header.tsx` (під `content`) — він міряється в `L`, разом згортається й прозорішає за `largeContentStyle`. Відступ ряду від заголовка й накладання кнопок на смужку шторки взяти з артборду 05 «Обʼєкти» (зараз `FULL_ROW_OFFSET = GRADIENT_TAIL − 36`). `isInteractive` = `p < 0.5`: `useAnimatedReaction` на `progress.get() < 0.5` → `scheduleOnRN(setInteractive, …)` лише за зміни
- [ ] T012 [US1] Видалити `src/components/navigation-bar/use-navigation-bar-collapse.ts`. Градієнт, що зараз їде за `gradientStyle`, тепер іде разом із накладкою (`overlayStyle`) і має фіксовану висоту `H` (з хвостом під кнопками, як у артборді 05). Прибрати імпорти з `themed-navigation-bar.tsx`
- [ ] T013 [US1] Прибрати з `src/components/navigation-bar/constants.ts` `COLLAPSE_DISTANCE`, `SHORT_ROW_OFFSET` і `SHORT_ROW_BOTTOM`, а також `FULL_ROW_OFFSET` і `GRADIENT_TAIL`, якщо T011–T012 їх більше не використовують. Перевірити через `grep -rn` по `src/`
- [ ] T014 [US1] У канвасі (`docs/design.md` → артефакт `Px8EEBtJf8LRD97UwbGUjj`, читати й публікувати через Artifact) оновити згорнутий стан у спільних компонентах `Properties`, `Property`, `PropertyMonth`, `PropertyMeters` і `Outage` (`start-collapsed` / `start-scrolled`): лишити тільки рядок «назад» і короткий заголовок, прибрати «пігулки» й чипи-кнопки. Звірити артборди 05b, 08b, 08c, 09b, 12b і 20s. Перед публікацією перечитати артефакт (може бути новіша версія)
- [ ] T015 [US1] Перевірити US1 в iOS Simulator через skill `ui-check` (quickstart 1–2): «Обʼєкти», обʼєкт, послуги розгорнуті й згорнуті; у згорнутому стані testID кнопок навбару (`docs/patterns/test-ids.md`) відсутні в дереві, у розгорнутому — по одному

**Checkpoint**: «пігулок» немає, кнопки ховаються з заголовком.

## Phase 4: User Story 2 — Різкі й довгі свайпи без смикання (Priority: P1)

**Goal**: навбар іде за контентом, доводка після зупинки до ближчого стану, без конфліктів з інерцією, відскоком і новим дотиком (FR-003…FR-008).

**Independent Test**: обʼєкт з 12+ місяцями і «Світло» — 20 різких свайпів униз/угору, частина з зупинкою пальцем під час інерції; кожен жест закінчується в розгорнутому чи згорнутому стані без зайвого руху (quickstart 3–7).

- [ ] T016 [US2] Переписати `snapHeader` у `src/components/navigation-view.tsx`:
  - ціль — `y < D/2 ? 0 : D` (нормалізований `y`, `D = collapseDistance`); нічого не робити, якщо `D <= 0`, `y <= 0` або `y >= D`;
  - прибрати `isSnappingToCollapsed` і гілку «повернутись у розгорнутий»: R6 гарантує діапазон;
  - `scrollTo` отримує сирий офсет: на iOS `target − top` (контент з `contentInset.top`), на Android `target`;
  - тригери не змінювати: `onMomentumScrollEnd` і `onScrollEndDrag` без інерції (наявна перевірка `hasMomentum`).
- [ ] T017 [US2] Гарантувати одну доводку на зупинку й поступку новому дотику в `src/components/navigation-view.tsx`: `useRef` `isSnapping` ставиться перед `scrollTo`. `onScrollBeginDrag` скидає його й `setUserScrolling(true)`. `onMomentumScrollEnd`, який прийшов від самої доводки (`isSnapping`), повторно `snapHeader` не викликає, а лише скидає прапорець. Нативне скасування `scrollTo` дотиком не перехоплювати (research R3)
- [ ] T018 [US2] Перевірити, що `onKeyboardHidden` у `src/components/navigation-view.tsx` використовує той самий розрахунок цілі й сирого офсету, що й T016. Винести спільну функцію `snapTarget(y, D)` у той самий файл, без дублювання
- [ ] T019 [US2] Відскок: у `src/components/navigation-bar/use-navigation-bar-progress.ts` `progress` обрізається до `[0, 1]` (`Extrapolation.CLAMP`), а `overlayStyle` і `pinnedRowStyle` за `scrollY < 0` нічого не масштабують і не розтягують (FR-007). Пройти quickstart 7 на iOS
- [ ] T020 [P] [US2] У `src/components/navigation-bar/navigation-bar-background.tsx` подовжити градієнт угору за верх накладки (`top: −висота_вікна`, колір верхньої точки градієнта) і так само вниз на висоту, на яку зсувається накладка (`D`). Тоді при відтягуванні зверху й під час згортання не видно смуги фону (research R4)
- [ ] T021 [US2] Розпірка R6 у `src/components/navigation-view.tsx`: `naturalMaxScroll` = `maxScrollY` без розпірки (з обробника скролу: `contentSize − spacer + bottomInset − layoutMeasurement`), `spacerHeight = isScrollEnabled ? max(0, D − naturalMaxScroll) : 0`, анімований `Animated.View` під маркером кінця контенту. Короткий контент, що вміщується, розпірки не отримує (scroll вимкнений). Перевірити quickstart 10
- [ ] T022 [US2] Клавіатура R7 у `src/components/navigation-view.tsx`: поки `keyboardCollapse > 0`, верхній відступ контенту зменшується на `keyboardCollapse × max(0, D − scrollY)`. На iOS для цього анімується `transform: translateY` обгортки контенту (від'ємний) — це не layout. На Android так само через `translateY` контейнера дітей. Під згорнутим навбаром не повинно лишатися порожньої смуги. Перевірити quickstart 13 на «Форма обʼєкта» й «Змінити імʼя». Якщо `KeyboardAwareScrollView` не докручує поле над клавіатурою, перейти на запасний варіант із plan.md (прокрутка до `D` на `onStart` клавіатури) і записати рішення в research.md R7
- [ ] T023 [US2] Pull-to-refresh R8: у `src/components/navigation-view.tsx`, якщо передано `refreshControl`, клонувати його з `progressViewOffset = top` на Android (`React.cloneElement`). На iOS індикатор сам стає під `contentInset.top`. Перевірити на `src/app/(tabs)/(outages)/index.tsx` (quickstart 12) на iOS і Android: індикатор під навбаром, навбар розгорнутий

**Checkpoint**: різкі свайпи, відскок, клавіатура й оновлення поводяться за FR-003…FR-008 і FR-012.

## Phase 5: User Story 3 — Одне правило заокруглень і відступів (Priority: P2)

**Goal**: радіус шторки й відступи задає `NavigationView`, екрани їх не перевизначають (FR-009, FR-010).

**Independent Test**: скріншоти всіх екранів з обсягу в розгорнутому й згорнутому стані — кути 0→28 (зі згортанням) або 28 (без), поле 20, відступ до першого блоку 24, розбіжність ≤ 1 pt (quickstart 8–9).

- [ ] T024 [US3] Перенести шторку в накладку `src/components/navigation-bar/themed-navigation-bar.tsx`: смужка висотою `SHEET_RADIUS` кольору `bg` внизу накладки, лише для `barType !== 'transparent'`. Радіус верхніх кутів `D > 0 ? p × SHEET_RADIUS : SHEET_RADIUS` (useAnimatedStyle). Прибрати з `src/components/navigation-view.tsx` `AnimatedThemedView`, `sheetCornerStyle`, `styles.sheet` і проп `cornerRadius` (і з деструктуризації), а з `navigation-bar-header.tsx` — `paddingBottom = EMPTY_BOTTOM + cornerRadius`: нижній відступ заголовка без кнопок узгодити з артбордом 16 «Профіль»
- [ ] T025 [US3] У `src/components/navigation-view.tsx` переконатися, що відступ від шторки до першого блоку — рівно `SHEET_CONTENT_TOP` (T007) на кольоровому навбарі, а бічне поле — 20 за замовчуванням (T002)
- [ ] T026 [P] [US3] Прибрати `cornerRadius` і `contentInsets.top` (і `horizontal: 20`, бо це тепер значення за замовчуванням) з екранів «Обʼєктів»:
  - `src/app/(tabs)/(objects)/index.tsx:54-55` (`cornerRadius={isEmpty ? 28 : 0}` → немає);
  - `src/app/(tabs)/(objects)/object-form.tsx:79`;
  - `src/app/(tabs)/(objects)/preview.tsx:58`;
  - `src/app/(tabs)/(objects)/[objectId]/index.tsx:176`;
  - `src/app/(tabs)/(objects)/[objectId]/services.tsx:63`;
  - `src/app/(tabs)/(objects)/[objectId]/service-form.tsx:185`;
  - `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx:236`;
  - `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx:100`;
  - `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx:223-224`.

  Лишити лише `contentInsets={{ bottom: N }}`
- [ ] T027 [P] [US3] Те саме для «Світла» й «Профілю»:
  - `src/app/(tabs)/(outages)/index.tsx:76-77, 99-100, 154-155`;
  - `src/app/(tabs)/(outages)/outage-settings.tsx:175`;
  - `src/app/(tabs)/profile/index.tsx:94-96`;
  - `src/app/(tabs)/profile/theme.tsx:17-19`;
  - `src/app/(tabs)/profile/edit-name.tsx:53`.
- [ ] T028 [P] [US3] Те саме для входу й онбордингу:
  - `src/app/(auth)/sign-in.tsx:35-36`;
  - `src/app/(auth)/auth-error.tsx:46-47`;
  - `src/app/(auth)/index.tsx:29` (`horizontal: 24` — звірити з артбордом 01 «Перший запуск»: якщо 24 задумано дизайном, лишити як виняток у вмісті екрана, а не через `NavigationView`, research R10);
  - `src/app/(onboarding)/index.tsx:106` (звірити з артбордами 20–22).
- [ ] T029 [US3] Звірити екрани з власною версткою з артбордами: `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx` (10e–10g), `bill.tsx` (11), `(onboarding)/index.tsx` (20–22). Якщо після T026–T028 перший блок зсунувся відносно дизайну, виправити відступ усередині контенту екрана
- [ ] T030 [US3] Пройти quickstart 8–9: скріншоти всіх екранів з обсягу через `ui-check` у розгорнутому й згорнутому стані, порівняти кути, поля й відступ до першого блоку з канвасом (≤ 1 pt). Окремо «Обʼєкти» порожньо → перша адреса

**Checkpoint**: одне правило шторки й відступів на всіх екранах.

## Phase 6: User Story 4 — Однакова поведінка на будь-якій довжині контенту (Priority: P3)

**Goal**: правила короткого, ледь довшого й довгого контенту з `docs/patterns/navigation-bar-title.md` працюють на новій накладці (FR-012).

**Independent Test**: quickstart 10–11 і 14.

- [ ] T031 [US4] Перевірити й за потреби виправити в `src/components/navigation-view.tsx` вимкнений скрол для контенту, що вміщується: «Тема» (`src/app/(tabs)/profile/theme.tsx`) і вхід (`src/app/(auth)/sign-in.tsx`) не гортаються, навбар не згортається. `scrollEnabled` не перемикається посеред жесту (`isUserScrolling`), з `refreshControl` скрол завжди увімкнений і `alwaysBounceVertical`
- [ ] T032 [US4] Перевірити контент, ледь довший за екран (обʼєкт з 1–2 місяцями), і довгий контент: повне згортання, розпірка не більша за `D − природний maxScrollY`, унизу довгої форми немає порожнього місця перед кнопкою (`src/app/(tabs)/(objects)/object-form.tsx`)
- [ ] T033 [US4] Перевірити найбільший системний шрифт (quickstart 14) на обʼєкті й «Світлі»: `L` і `H` більші, згортання, доводка й кути поводяться так само; `L` міряється максимумом і не скаче під час згортання

## Phase 7: Polish & Cross-Cutting

- [ ] T034 [P] Переписати `docs/patterns/navigation-bar-title.md` під нову поведінку: накладка з трансформаціями; один прогрес `p` і одна відстань `D`; кнопки в великому блоці; доводка до ближчого стану (межа `D/2`, після зупинки, раз, скасування дотиком, без `snapToOffsets` — чому); відскок; розпірка R6; клавіатура R7; refresh R8; шторка `SHEET_RADIUS`; відступи `SHEET_CONTENT_TOP` і `HORIZONTAL_PADDING`; `contentInsets` без `top`. Прибрати застарілі пункти (`titleShrink`, `cornerRadius`, повернення в розгорнутий для короткого контенту)
- [ ] T035 [P] Оновити `docs/patterns/navigation-bar-buttons.md`: прибрати пункт про «пігулки» (`ShortNavigationBarButton`), додати «кнопки ховаються разом із великим заголовком, у згорнутому навбарі їх немає»
- [ ] T036 Оновити описи двох файлів навбару в `docs/patterns/README.md`
- [ ] T037 [P] Створити `.claude/skills/ui-check/flows/navbar.flow` за форматом сусідніх `.flow` (див. `.claude/skills/ui-check/SKILL.md`): сценарії quickstart 1, 2, 5, 8 (скріншоти ключових екранів), 9, 10, 11. Прогнати його й записати результат (`N/N`)
- [ ] T038 Ручна перевірка на Android (quickstart 15): сценарії 1, 3–6, 12 із записом екрана; навбар не відстає від контенту. Якщо доводка помітно запізнюється — research R3, запасний варіант (Reanimated `scrollTo` через власний `ScrollViewComponent`)
- [ ] T039 Прогнати наявні сценарії `ui-check` (`smoke.flow`, `profile.flow`, `theme.flow`, `start-tab.flow`, `sign-out.flow`) і виправити кроки, що посилалися на короткі кнопки чи старі відступи
- [ ] T040 У `specs/005-navbar-scroll-system/spec.md` поставити **Status**: Implemented і коротко підсумувати українською, що змінилося (конституція, «Процес»)
- [ ] T041 Запустити `npx expo lint` і `npx tsc --noEmit` і виправити всі помилки (Constitution VI)

## Dependencies & Execution Order

- **Phase 1** (T001–T002) → **Phase 2** (T003–T008, послідовно: T003 → T004 → T005 → T006 → T007 → T008).
- **US1** (T009–T015), **US2** (T016–T023) і **US3** (T024–T030) залежать лише від Phase 2. Але вони ділять файли `navigation-view.tsx`, `themed-navigation-bar.tsx` і `navigation-bar-header.tsx`, тож задачі в цих файлах робити послідовно в порядку ID.
- **US4** (T031–T033) — після US2 (розпірка, доводка) і US3 (відступи).
- **Polish**: T034–T036 — після US1–US3; T037–T039 — після всіх історій; T040 → T041 останні.

### Parallel Opportunities

- T002 паралельно з T001.
- US1: T009 паралельно з початком T010 (різні файли).
- US2: T020 паралельно з T016–T019 (`navigation-bar-background.tsx`).
- US3: T026, T027 і T028 — три окремі групи екранів, паралельно між собою після T024–T025.
- Polish: T034, T035 і T037 паралельно.

### Parallel Example: User Story 3

```text
T026 екрани «Обʼєктів»   ─┐
T027 «Світло» і «Профіль» ─┼─► T029 звірка з артбордами ─► T030 скріншоти
T028 вхід і онбординг    ─┘
```

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + US1 (T001–T015). Навбар-накладка з одним прогресом уже прибирає подвійну швидкість контенту й перерахунок розкладки, а «пігулок» немає. Після T015 — коміт.
- **Далі**: US2 (доводка, відскок, клавіатура, refresh) → коміт; US3 (шторка й відступи, екрани) → коміт; US4 (регресія) → коміт; Polish (патерни в тому самому коміті, що й зміна поведінки, якщо можливо).
- Кожен коміт — після `npx expo lint` і `npx tsc --noEmit` без помилок.
