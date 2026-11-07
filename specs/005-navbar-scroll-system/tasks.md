# Tasks: Єдиний навбар — поведінка, скрол, заокруглення й відступи

**Input**: Design documents from `/specs/005-navbar-scroll-system/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: окремих тестових задач немає: unit-тестів у проєкті немає, і специфікація їх не вимагає. Перевіряємо сценаріями `ui-check` в iOS Simulator і вручну на Android за quickstart.

**Формат**: `- [ ] T### [P?] [US?] Опис зі шляхом`. `[P]` означає, що задачу можна робити паралельно (інші файли, без залежностей від незавершених задач).

**Скорочення** (з data-model.md):
- `H` — висота розгорнутої накладки разом зі смужкою шторки.
- `L` — висота великого блоку.
- `D` — відстань згортання.
- `p = clamp(max(scrollY, keyboard × D) / D, 0, 1)`; якщо `D = 0`, то `p = 0`.
- `top` — верхній відступ контенту: `H + SHEET_CONTENT_TOP` для кольорового навбару (низ накладки — це верх шторки), `H` для прозорого.

У воркетах лише `get()`/`set()` (`docs/patterns/reanimated.md`).

**Правило lint/tsc** (Constitution VI): після кожної задачі `npx tsc --noEmit` проходить. Тому пропси, які прибираємо з екранів (`contentInsets.top`, `cornerRadius`), спершу лишаються в типах як `@deprecated` і ігноруються. З типів їх прибирає T030 — уже після того, як екрани їх більше не передають.

## Phase 1: Setup

- [X] T001 У `src/components/navigation-bar/constants.ts` додати дві константи з коментарями: `export const SHEET_RADIUS = 28;` (канвас `--r-xl`) і `export const SHEET_CONTENT_TOP = 24;` (канвас `.sheet{padding:24px 20px 0}`). Старі константи прибере T012
- [X] T002 [P] У `src/components/content-insets.ts` позначити поле `top` у `ContentInsets` як `/** @deprecated ігнорується: відступ до першого блоку задає NavigationView (SHEET_CONTENT_TOP); прибирається в T030 */`. `toPadding` повертає `{ paddingHorizontal: insets?.horizontal ?? HORIZONTAL_PADDING, paddingBottom: insets?.bottom }` без `paddingTop`; `HORIZONTAL_PADDING` імпортувати з `./navigation-bar/constants`. Робити разом із T010, бо T010 додає новий верхній відступ

## Phase 2: Foundational (блокує всі історії)

**⚠️ CRITICAL**: поки T003–T012 не готові, навбар не розбирається по історіях: прогрес, накладка, один ряд кнопок і шторка — спільна основа. Після цієї фази коротких кнопок-«пігулок» уже немає, бо ряд тільки один. US1 лише прибирає мертвий код, оновлює канвас і перевіряє.

- [X] T003 Створити `src/components/navigation-bar/use-navigation-bar-progress.ts` замість `use-title-collapse.ts`.
  - **Вхід**: `scrollY: SharedValue<number>` (вже з урахуванням клавіатури), `hasBackButton: boolean`, `hasLargeBlock: boolean` (= `type === 'full' || hasButtons`), `collapseDistance: SharedValue<number>` (вихід для `NavigationView`).
  - **Розміри**:
    - `L` міряється максимумом: `onLargeHeightChange: (h) => largeHeight.set(c => Math.max(c, h))`. `resetLargeHeight()` описано в T025.
    - `D = hasLargeBlock ? L + (hasBackButton ? 0 : SHORT_TITLE_ROW_HEIGHT) : 0`, записується в `collapseDistance`.
    - `progress = useDerivedValue` за формулою `p` з `Extrapolation.CLAMP`.
  - **Стилі** — лише трансформації й прозорість, **без `height`**:
    - `overlayStyle`: `translateY: −p × D`;
    - `pinnedRowStyle`: `translateY: +p × D`;
    - `largeContentStyle`: `opacity` 1→0 на `p ∈ [0, 0.7]`;
    - `shortTitleStyle`: `opacity` 0→1 і `translateY` 8→0 на `p ∈ [0.6, 1]`;
    - `sheetCornerStyle`: верхні радіуси `D > 0 ? p × SHEET_RADIUS : SHEET_RADIUS`.

  Видалити `src/components/navigation-bar/use-title-collapse.ts`
- [X] T004 Переробити `src/components/navigation-bar/navigation-bar-header.tsx` під T003.
  - **Великий блок** міряється одним `onLayout`. Для `type='full'` це заголовок, підзаголовок, `content` і `trailing`, а під ними слот для ряду кнопок (T008). Для `type='short'` великий блок — **лише** ряд кнопок, якщо вони є, а якщо немає — блоку немає.
  - **Згортання**: великий блок прозорішає за `largeContentStyle` і зсувається разом із накладкою, а рядок «назад» закріплений `pinnedRowStyle`.
  - **Що прибрати**: пропси `titleShrink`, `collapseScroll`, `maxScrollY`, а також `largeAreaStyle` і `rowStyle` з анімованою висотою.
  - **Без кнопки «назад»** рядок короткого заголовка завжди резервує `SHORT_TITLE_ROW_HEIGHT`, а заголовок у ньому прозорий, доки `p < 0.6`.
  - **Не чіпати**: `marginStart` кнопки «назад» (`HORIZONTAL_PADDING − (44 − 22) / 2`) і вирівнювання великого заголовка на `HORIZONTAL_PADDING`.
- [X] T005 Оновити `src/components/navigation-bar/types.ts`:
  - прибрати `maxScrollY`, `titleShrink` і `collapseScroll`;
  - `titleCollapseDistance` перейменувати на `collapseDistance` (скрол до повного згортання; 0 без великого блоку);
  - додати `onHeightChange?: (height: number) => void` — він повідомляє `H`;
  - `cornerRadius?` поки лишити з `/** @deprecated ігнорується: шторка за правилом SHEET_RADIUS; прибирається в T030 */`.
- [X] T006 Переробити `src/components/navigation-bar/themed-navigation-bar.tsx` на накладку.
  - **Корінь**: `Animated.View` з `position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1` і `overlayStyle`; `onLayout` → `onHeightChange(e.nativeEvent.layout.height)`.
  - **Порядок усередині**: фон-градієнт, заголовок, смужка шторки.
  - **Шторка**: смужка висотою `SHEET_RADIUS` кольору `bg` внизу накладки, лише для `barType !== 'transparent'`, з `sheetCornerStyle`.
  - **Нижній відступ без кнопок**: прибрати `paddingBottom = EMPTY_BOTTOM + cornerRadius` і звірити відступ з артбордом 16 «Профіль».
  - Проп `cornerRadius` ігнорувати.
- [X] T007 Спростити `src/components/navigation-bar/navigation-bar-buttons-row.tsx`:
  - прибрати `variant`, `top`, `onHeightChange` і `position: 'absolute'`;
  - рендерити лише `NavigationBarButton`; ряд стоїть у потоці розкладки;
  - `isInteractive` керує `pointerEvents`, `accessibilityElementsHidden` і `importantForAccessibility='no-hide-descendants'`;
  - не чіпати горизонтальний `ScrollView` з `paddingHorizontal: HORIZONTAL_PADDING` і `HStack spacing={12}` (ширина кнопки 50% екрана, `docs/patterns/navigation-bar-buttons.md`).
- [X] T008 Переписати `src/components/navigation-bar/navigation-bar-buttons.tsx`: один `NavigationBarButtonsRow`, без перехресного затухання.
  - Ряд рендериться в слоті великого блоку `navigation-bar-header.tsx` з T004. Він входить у `L`, згортається й прозорішає разом із блоком.
  - Відступ ряду від заголовка і накладання кнопок на смужку шторки взяти з артборду 05 «Обʼєкти» (зараз `FULL_ROW_OFFSET = GRADIENT_TAIL − 36`).
  - `isInteractive` = `p < 0.5`: `useAnimatedReaction` на `progress.get() < 0.5` → `scheduleOnRN(setInteractive, …)` лише тоді, коли значення змінилося.
  - Проп `collapse` прибрати.
- [X] T009 Видалити `src/components/navigation-bar/use-navigation-bar-collapse.ts` і його імпорти з `themed-navigation-bar.tsx` і `navigation-bar-buttons.tsx`. Градієнт тепер має висоту `H` (з хвостом під кнопками, як в артборді 05) і їде разом із накладкою, а не за `gradientStyle`
- [X] T010 У `src/components/navigation-view.tsx` поставити `ThemedNavigationBar` накладкою над `KeyboardAwareScrollView`.
  - **Розкладка**: обгортка `View` з `flex: 1`, навбар абсолютно зверху, скрол на всю висоту.
  - **Висота шапки**: `const [headerHeight, setHeaderHeight] = useState(0)` з `onHeightChange`; `top` — за формулою зі скорочень (data-model.md), тримати також у shared value для воркету.
  - **iOS**: `contentInset={{ top, bottom: bottomInset }}`, `scrollIndicatorInsets` так само, в `onScroll` `scrollY = contentOffset.y + top`.
  - **Android**: `paddingTop: top` у `contentContainerStyle`, `scrollY = contentOffset.y`.
  - Платформи розрізняти через `Platform.OS`.
  - **Що прибрати**: `titleShrink`, `collapseScroll`, `naturalScroll`, старий `spacerHeight` (новий — T021), а також `AnimatedThemedView`, `sheetCornerStyle`, `styles.sheet` і рендер шторки — вона тепер у T006.
  - `cornerRadius` з пропсів ігнорувати.
  - Перед зміною звірити `contentInset` і `contentOffset` з документацією ScrollView RN 0.88 (Constitution I).
- [X] T011 У `src/components/navigation-view.tsx` перейти на одну відстань.
  - `collapseDistance` (shared value з навбару) замінює `titleCollapseDistance` і `buttonsCollapseDistance`.
  - `headerScrollY = max(scrollY, keyboardCollapse × collapseDistance)` передається в навбар як `scrollY`.
  - Прибрати імпорт `COLLAPSE_DISTANCE`.
  - `isAtTop` і `contentFits` рахувати від нормалізованого `scrollY` і `viewportHeight − bottomInset − top`.
- [X] T012 Прибрати з `src/components/navigation-bar/constants.ts` невживані тепер `COLLAPSE_DISTANCE`, `SHORT_ROW_OFFSET`, `SHORT_ROW_BOTTOM`, `EMPTY_BOTTOM`, а також `FULL_ROW_OFFSET` і `GRADIENT_TAIL`, якщо T008–T009 їх більше не використовують. Перевірити через `grep -rn` по `src/`. **Перевірка фази**: `npx tsc --noEmit` і `npx expo lint` без помилок. У симуляторі «Профіль», обʼєкт і «Обʼєкти» згортаються, контент іде 1:1 з пальцем, «пігулок» немає

**Checkpoint**: навбар — накладка з одним прогресом, одним рядом кнопок і шторкою за єдиним правилом. Далі історії можна робити в будь-якому порядку.

## Phase 3: User Story 1 — Без коротких кнопок-«пігулок» (Priority: P1) 🎯 MVP

**Goal**: великі кнопки ховаються разом із великим заголовком, «пігулок» немає ні в коді, ні в дизайні (FR-001, FR-002).

**Independent Test**: «Обʼєкти» з 5+ адресами, обʼєкт і послуги — прогорнути до кінця й назад. «Пігулок» немає в жодній точці, нагорі кнопки натискаються, у дереві `ui-check` кожен testID кнопки навбару трапляється не більше одного разу (quickstart 1–2).

- [X] T013 [P] [US1] Видалити `src/components/navigation-bar/short-navigation-bar-button.tsx` і його експорт з `src/components/navigation-bar/index.ts`. Через `grep -rn ShortNavigationBarButton src` перевірити, що інших використань немає
- [X] T014 [P] [US1] Оновити канвас: `docs/design.md` → артефакт `Px8EEBtJf8LRD97UwbGUjj`, читати й публікувати через Artifact.
  - У спільних компонентах `Properties`, `Property`, `PropertyMonth`, `PropertyMeters` і `Outage` змінити згорнутий стан (`start-collapsed` / `start-scrolled`): лишити тільки рядок «назад» і короткий заголовок, прибрати «пігулки» й чипи-кнопки.
  - Звірити артборди 05b, 08b, 08c, 09b, 12b і 20s.
  - Перед публікацією перечитати артефакт: там може бути новіша версія.
- [X] T015 [US1] Перевірити US1 в iOS Simulator через skill `ui-check` (quickstart 1–2): «Обʼєкти», обʼєкт і послуги в розгорнутому й згорнутому стані. У згорнутому стані testID кнопок навбару (`docs/patterns/test-ids.md`) відсутні в дереві, у розгорнутому — по одному

**Checkpoint**: MVP готовий; коміт після lint і tsc.

**Як зроблено MVP (відхилення від опису задач):**
- Кути шторки — не смужка `bg` у накладці (вона перекривала б перший блок), а «зворотні» кути кольором низу градієнта під накладкою, масштаб `p` (`navigation-bar-background.tsx`). Низ накладки = верх шторки, тож `top = H + SHEET_CONTENT_TOP`.
- `D = H − (safe area + 44 + EMPTY_BOTTOM)`: у згорнутому стані під рядком «назад» лишається хвіст градієнта 24. З кнопками хвіст накладки — 0, градієнт заходить у кнопки на `BUTTONS_GRADIENT_OVERLAP` і з'їжджає вниз з прогресом.
- Верхній відступ контенту — `paddingTop` на обох платформах. `contentInset.top` на iOS не брали, бо початковий зсув тоді треба виставляти окремо; pull-to-refresh під навбаром вирішує T023.
- Нативні таби на iOS підміняли `contentInsetAdjustmentBehavior` скролу на `automatic` і додавали 62 pt зверху: у `src/app/(tabs)/_layout.tsx` для «Обʼєктів», «Світла» і «Профілю» — `disableAutomaticContentInsets` на iOS.
- `navigation-bar-buttons.tsx` видалено: один ряд — це `NavigationBarButtonsRow` у слоті великого блоку.
- Розпірка R6 (`spacerHeight = max(0, D − природний maxScrollY)`) уже є в T010; T021 лишається на перевірку.
- Канвас: з компонентів `Properties`, `Property`, `PropertyMonth`, `PropertyMeters` прибрано блок «пігулок» у згорнутому стані (версія 120); `Outage` не мінявся — чипи черг там є `headerContent`, а не кнопки.

## Phase 4: User Story 2 — Різкі й довгі свайпи без смикання (Priority: P1)

**Goal**: навбар іде за контентом; доводка після зупинки до ближчого стану, без конфліктів з інерцією, відскоком і новим дотиком (FR-003…FR-008).

**Independent Test**: обʼєкт з 12+ місяцями і «Світло» — 20 різких свайпів униз і вгору, частина з зупинкою пальцем під час інерції. Кожен жест закінчується в розгорнутому чи згорнутому стані без зайвого руху (quickstart 3–7).

- [X] T016 [US2] Переписати `snapHeader` у `src/components/navigation-view.tsx`.
  - Ціль: `y < D/2 ? 0 : D` (нормалізований `y`, `D = collapseDistance`).
  - Нічого не робити, якщо `D <= 0`, `y <= 0` або `y >= D`.
  - Прибрати `isSnappingToCollapsed` і гілку «повернутись у розгорнутий»: діапазон гарантує R6.
  - `scrollTo` отримує сирий офсет: на iOS `target − top`, на Android `target`.
  - Тригери не змінювати: `onMomentumScrollEnd` і `onScrollEndDrag` без інерції (наявна перевірка `hasMomentum`).
- [X] T017 [US2] Одна доводка на зупинку й поступка новому дотику, у `src/components/navigation-view.tsx`.
  - `useRef` `isSnapping` ставиться перед `scrollTo`.
  - `onScrollBeginDrag` скидає його й викликає `setUserScrolling(true)`.
  - Якщо `onMomentumScrollEnd` прийшов від самої доводки (`isSnapping`), він повторно `snapHeader` не викликає, а лише скидає прапорець.
  - Нативне скасування `scrollTo` дотиком не перехоплювати (research R3).
- [X] T018 [US2] Винести в `src/components/navigation-view.tsx` спільну функцію `snapTarget(y, D)` і перерахунок у сирий офсет. Її використовують `snapHeader` і `onKeyboardHidden`, без дублювання
- [X] T019 [US2] Відскок: у `src/components/navigation-bar/use-navigation-bar-progress.ts` переконатися, що `progress` обрізаний до `[0, 1]`, а `overlayStyle` і `pinnedRowStyle` при `scrollY < 0` нічого не масштабують і не розтягують (FR-007). Пройти quickstart 7 на iOS
- [X] T020 [P] [US2] У `src/components/navigation-bar/navigation-bar-background.tsx` подовжити градієнт угору за верх накладки (`top: −висота_вікна`, колір верхньої точки градієнта) і вниз на `D`. Тоді при відтягуванні зверху й під час згортання не видно смуги фону (research R4)
- [X] T021 [US2] Розпірка R6 у `src/components/navigation-view.tsx`.
  - `naturalMaxScroll` = `maxScrollY` без розпірки (з обробника скролу: `contentSize − spacer + bottomInset − layoutMeasurement`).
  - `spacerHeight = isScrollEnabled ? max(0, D − naturalMaxScroll) : 0`, анімований `Animated.View` під маркером кінця контенту.
  - Контент, що вміщується, розпірки не отримує.
  - Перевірити quickstart 10.
- [X] T022 [US2] Клавіатура R7 у `src/components/navigation-view.tsx`.
  - Поки `keyboardCollapse > 0`, контент зсувається від'ємним `translateY` обгортки дітей на `keyboardCollapse × max(0, D − scrollY)` на обох платформах; розкладка не змінюється.
  - Під згорнутим навбаром не має лишатися порожньої смуги.
  - Перевірити quickstart 13 на «Форма обʼєкта» і «Змінити імʼя».
  - Якщо `KeyboardAwareScrollView` не докручує поле над клавіатурою, перейти на запасний варіант із plan.md (прокрутка до `D` на `onStart` клавіатури) і записати рішення в research.md R7.
- [X] T023 [US2] Pull-to-refresh R8 у `src/components/navigation-view.tsx`: на Android клонувати переданий `refreshControl` з `progressViewOffset = top` (`React.cloneElement`). На iOS індикатор сам стає під `contentInset.top`. Перевірити на `src/app/(tabs)/(outages)/index.tsx` (quickstart 12) на iOS і Android: індикатор під навбаром, навбар розгорнутий
- [X] T024 [US2] Зміна фокуса посеред руху (spec Edge Cases). У `src/components/navigation-view.tsx`, коли `useIsFocused()` стає `false`, а `isUserScrolling` чи `isSnapping` ще активні, скинути `isUserScrolling`. Коли екран знову у фокусі, викликати доводку `snapTarget(scrollY, D)`, якщо `0 < scrollY < D`. Перевірити quickstart 16: різкий свайп на обʼєкті й одразу «назад» або інша вкладка, потім повернення — навбар у кінцевому стані
- [X] T025 [US2] Зміна висоти під час скролу (spec Edge Cases, ризик plan.md).
  - `ThemedNavigationBar` перемірює `H` і `L` заново (`resetLargeHeight()` з T003, `setHeaderHeight` без максимуму), лише коли `p = 0` і користувач не скролить: шапка могла зменшитись (підзаголовок «оновлюємо…» зник, чипи черг сховались).
  - Під час згортання лишається максимум.
  - Перевірити quickstart 17 на «Світлі»: скелетон → графік і оновлення не дають ривка навбару й зайвого відступу під шапкою.

**Checkpoint**: різкі свайпи, відскок, клавіатура, оновлення, зміна фокуса й висоти поводяться за FR-003…FR-008 і FR-012.

**Як зроблено US2 і що перевірено:**
- Доводка (`snapTarget`, `isSnapping`, скидання в `onScrollBeginDrag`) і доводка після повернення фокуса — у `navigation-view.tsx`. В iOS Simulator доводку з середини автоматично не перевірити: свайп AXe до 0,4 екрана не скролить, а 0,5 одразу проїжджає за `D`. Сценарії quickstart 3–6 і 16 — вручну (T039, T040).
- T020: градієнт подовжувати не треба. Накладка при відскоку не рухається (прогрес обрізаний), а під час згортання низ градієнта сам іде за низом накладки (`gradientStyle`). Перевірено відтягуванням на «Світлі».
- T022: зсув — `translateY` обгортки скролу, а не контенту: обгортка дітей з `flexGrow` ламала б `contentFits`. Перевірено на «Додати нову адресу»: з клавіатурою навбар згорнутий, поле одразу під ним, після закриття — розгорнутий.
- T023: `contentInset.top` на iOS не застосовується під `KeyboardAwareScrollView`, тож на iOS — власний індикатор під навбаром (research R8). Розкладку «Світла» перевірено. Сам індикатор на скріншот не потрапив, бо оновлення закінчується за частку секунди; перевірити вручну.
- T025: нова висота шапки росте одразу, а зменшується лише при `p = 0` (`use-navigation-bar-progress.ts`).
- T021: розпірка є з MVP; на контенті, ледь довшому за екран, не перевіряли (немає таких даних) — US4 T034.

## Phase 5: User Story 3 — Одне правило заокруглень і відступів (Priority: P2)

**Goal**: радіус шторки й відступи задає `NavigationView`; екрани їх не перевизначають, а застарілі пропси прибрані з типів (FR-009, FR-010).

**Independent Test**: скріншоти всіх екранів з обсягу в розгорнутому й згорнутому стані. Кути 0→28 (зі згортанням) або 28 (без згортання), поле 20, відступ від шторки до першого блоку 24, розбіжність ≤ 1 pt (quickstart 8–9).

- [X] T026 [US3] У `src/components/navigation-view.tsx` переконатися, що відступ від верху шторки до першого блоку дорівнює рівно `SHEET_CONTENT_TOP`: `top = H + SHEET_CONTENT_TOP` (T010) на кольоровому навбарі. Бічне поле за замовчуванням 20 (T002). Звірити з артбордом 05 «Обʼєкти»
- [X] T027 [P] [US3] Прибрати `cornerRadius` і `contentInsets.top`, а також `horizontal: 20` (тепер це значення за замовчуванням) з екранів «Обʼєктів». Лишити лише `contentInsets={{ bottom: N }}`:
  - `src/app/(tabs)/(objects)/index.tsx:54-55` (`cornerRadius={isEmpty ? 28 : 0}` прибрати повністю)
  - `src/app/(tabs)/(objects)/object-form.tsx:79`
  - `src/app/(tabs)/(objects)/preview.tsx:58`
  - `src/app/(tabs)/(objects)/[objectId]/index.tsx:176`
  - `src/app/(tabs)/(objects)/[objectId]/services.tsx:63`
  - `src/app/(tabs)/(objects)/[objectId]/service-form.tsx:185`
  - `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx:236`
  - `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx:100`
  - `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx:223-224`
- [X] T028 [P] [US3] Те саме для «Світла» і «Профілю»:
  - `src/app/(tabs)/(outages)/index.tsx:76-77, 99-100, 154-155`
  - `src/app/(tabs)/(outages)/outage-settings.tsx:175`
  - `src/app/(tabs)/profile/index.tsx:94-96`
  - `src/app/(tabs)/profile/theme.tsx:17-19`
  - `src/app/(tabs)/profile/edit-name.tsx:53`
- [X] T029 [P] [US3] Те саме для входу й онбордингу:
  - `src/app/(auth)/sign-in.tsx:35-36`
  - `src/app/(auth)/auth-error.tsx:46-47`
  - `src/app/(auth)/index.tsx:29`: `horizontal: 24` звірити з артбордом 01 «Перший запуск». Якщо 24 задумано дизайном, лишити як виняток у вмісті екрана, а не через `NavigationView` (research R10)
  - `src/app/(onboarding)/index.tsx:106`: звірити з артбордами 20–22
- [X] T030 [US3] Після T027–T029 прибрати застарілі поля з типів: `top` з `ContentInsets` у `src/components/content-insets.ts` і `cornerRadius` з `ThemedNavigationBarProps` у `src/components/navigation-bar/types.ts`. Перевірити через `grep -rn "cornerRadius\|contentInsets={{ top" src/app`, що використань не лишилось. `npx tsc --noEmit` без помилок
- [X] T031 [US3] Звірити екрани з власною версткою з артбордами: `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx` (10e–10g), `bill.tsx` (11) і `(onboarding)/index.tsx` (20–22). Якщо після T027–T029 перший блок зсунувся відносно дизайну, виправити відступ усередині контенту екрана
- [X] T032 [US3] Пройти quickstart 8–9: зробити через `ui-check` скріншоти всіх екранів з обсягу в розгорнутому й згорнутому стані й порівняти кути, поля й відступ до першого блоку з канвасом (≤ 1 pt). Окремо перевірити «Обʼєкти»: порожньо → перша адреса

**Checkpoint**: одне правило шторки й відступів на всіх екранах; застарілих пропсів немає.

**Як зроблено US3 і що перевірено:**
- `cornerRadius`, `contentInsets.top` і `horizontal: 20` прибрано з 16 екранів і з `src/views/profile/legal-document.tsx` (його в списку задач не було). `cornerRadius` прибрано з `ThemedNavigationBarProps`, а `NavigationView` приймає `contentInsets` без `top` (`Omit<ContentInsets, 'top'>`).
- Регресія з MVP: `ScreenView` (онбординг, `(auth)/index.tsx`) теж використовує `toPadding`, і значення за замовчуванням `HORIZONTAL_PADDING` дало онбордингу бічні поля 20. `toPadding` повернуто до загального вигляду (з `top`, без значень за замовчуванням), а поле 20 за замовчуванням і ігнорування `top` тепер тільки в `NavigationView`. `horizontal: 24` на `(auth)/index.tsx` — це `ScreenView`, тож лишається.
- T031: сума рахунку й онбординг не використовують `NavigationView`, тож не змінились. Рахунок (`bill.tsx`) — `short` без згортання: перший блок, як і раніше, через 24 від шторки, кути 28.
- Форми з прозорим навбаром («Додати послугу», «Показник») втратили власні 16 pt зверху: тепер перший блок іде через хвіст навбару 24, як на «Додати адресу».
- T032: скріншоти «Обʼєктів», «Послуг», «Додати послугу», «Теми», «Ваше ім'я», «Налаштувань» (кути 28 без згортання) — відповідають правилу. Місяць, рахунок і «Показник» не знімали: у симуляторі немає місяців і послуг.

## Phase 6: User Story 4 — Однакова поведінка на будь-якій довжині контенту (Priority: P3)

**Goal**: правила короткого, ледь довшого й довгого контенту з `docs/patterns/navigation-bar-title.md` працюють на новій накладці (FR-012).

**Independent Test**: quickstart 10–11 і 14.

- [ ] T033 [US4] Перевірити й за потреби виправити в `src/components/navigation-view.tsx` вимкнений скрол для контенту, що вміщується.
  - «Тема» (`src/app/(tabs)/profile/theme.tsx`) і вхід (`src/app/(auth)/sign-in.tsx`) не гортаються, навбар не згортається.
  - `scrollEnabled` не перемикається посеред жесту (`isUserScrolling`).
  - З `refreshControl` скрол завжди увімкнений і має `alwaysBounceVertical`.
- [ ] T034 [US4] Перевірити ледь довший контент (обʼєкт з 1–2 місяцями) і довгий: навбар згортається повністю, розпірка не більша за `D − природний maxScrollY`, унизу довгої форми немає порожнього місця перед кнопкою (`src/app/(tabs)/(objects)/object-form.tsx`)
- [ ] T035 [US4] Перевірити найбільший системний шрифт (quickstart 14) на обʼєкті й «Світлі»: `L` і `H` більші, а згортання, доводка й кути поводяться так само; `L` не скаче під час згортання

## Phase 7: Polish & Cross-Cutting

- [ ] T036 [P] Переписати `docs/patterns/navigation-bar-title.md` під нову поведінку:
  - накладка з трансформаціями;
  - один прогрес `p` і одна відстань `D`;
  - кнопки у великому блоці; для `short` блок складається лише з кнопок;
  - доводка до ближчого стану: межа `D/2`, після зупинки, один раз, скасовується дотиком; чому не `snapToOffsets`;
  - відскок;
  - розпірка R6;
  - клавіатура R7;
  - refresh R8;
  - зміна фокуса й висоти;
  - шторка `SHEET_RADIUS`;
  - відступи `top = H + SHEET_CONTENT_TOP` і `HORIZONTAL_PADDING`; `disableAutomaticContentInsets` для вкладок на iOS;
  - `contentInsets` без `top`.

  Прибрати застарілі пункти: `titleShrink`, `cornerRadius`, повернення в розгорнутий стан для короткого контенту
- [ ] T037 [P] Оновити `docs/patterns/navigation-bar-buttons.md`: прибрати пункт про «пігулки» (`ShortNavigationBarButton`) і додати: «кнопки ховаються разом із великим заголовком, у згорнутому навбарі їх немає»
- [ ] T038 Оновити в `docs/patterns/README.md` описи двох файлів навбару
- [ ] T039 [P] Створити `.claude/skills/ui-check/flows/navbar.flow` за форматом сусідніх `.flow` (див. `.claude/skills/ui-check/SKILL.md`). Включити сценарії quickstart 1, 2, 5, 8 (скріншоти ключових екранів), 9, 10, 11, 16 і 17. Сценарії 3, 4 і 6 (різкі свайпи, SC-002, SC-003) пройти на iOS вручну із записом екрана, бо `ui-check` не відтворює інерцію. Прогнати flow і записати результат (`N/N`)
- [ ] T040 Ручна перевірка на Android (quickstart 15): сценарії 1, 3–6 і 12 із записом екрана й увімкненим Perf Monitor. Під час різких свайпів частота кадрів не нижча 55 (SC-006), а відстань, яку пролітає контент, відрізняється від екрана без навбару не більше ніж на 10% (SC-004). Якщо доводка помітно запізнюється — запасний варіант з research R3 (Reanimated `scrollTo` через власний `ScrollViewComponent`)
- [ ] T041 Прогнати наявні сценарії `ui-check` (`smoke.flow`, `profile.flow`, `theme.flow`, `start-tab.flow`, `sign-out.flow`) і виправити кроки, що посилалися на короткі кнопки чи старі відступи
- [ ] T042 У `specs/005-navbar-scroll-system/spec.md` поставити **Status**: Implemented і коротко підсумувати українською, що змінилося (розділ конституції «Процес»)
- [ ] T043 Запустити `npx expo lint` і `npx tsc --noEmit` і виправити всі помилки (Constitution VI)

## Dependencies & Execution Order

- **Phase 1** (T001–T002) → **Phase 2** (T003–T012). Phase 2 іде послідовно: T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012. T002 робиться разом із T010.
- **US1** (T013–T015), **US2** (T016–T025) і **US3** (T026–T032) залежать лише від Phase 2. Задачі в спільних файлах (`navigation-view.tsx`, `use-navigation-bar-progress.ts`, `themed-navigation-bar.tsx`) виконувати послідовно в порядку ID. T030 — лише після T027–T029.
- **US4** (T033–T035) — після US2 (розпірка, доводка) і US3 (відступи).
- **Polish**: T036–T038 — після US1–US3; T039–T041 — після всіх історій; T042 → T043 останні.

### Parallel Opportunities

- T002 паралельно з T001 (застосовується разом із T010).
- US1: T013 і T014 паралельно.
- US2: T020 паралельно з T016–T019 (`navigation-bar-background.tsx`).
- US3: T027, T028 і T029 — три групи екранів, паралельно.
- Polish: T036, T037 і T039 паралельно.

### Parallel Example: User Story 3

```text
T027 екрани «Обʼєктів»     ─┐
T028 «Світло» і «Профіль»  ─┼─► T030 прибрати застарілі поля ─► T031 звірка ─► T032 скріншоти
T029 вхід і онбординг      ─┘
```

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + US1 (T001–T015). Навбар-накладка з одним прогресом прибирає подвійну швидкість контенту й перерахунок розкладки, «пігулок» немає ні в коді, ні в канвасі. Застарілі пропси екранів поки ігноруються (`@deprecated`), тож lint і tsc проходять. Після T015 — коміт.
- **Далі**: US2 → коміт; US3 → коміт; US4 → коміт; Polish. Зміну патернів комітити разом зі зміною поведінки, яку вони описують.
- Кожен коміт — після `npx expo lint` і `npx tsc --noEmit` без помилок.
