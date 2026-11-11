---

description: "Задачі 008-icon-splash-pulse"
---

# Tasks: Іконка застосунку, splash з анімацією та пульсація порожніх станів

**Input**: `specs/008-icon-splash-pulse/` — [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-components.md](contracts/ui-components.md), [quickstart.md](quickstart.md)

**Tests**: автотестів спека не вимагає; перевірка — за [quickstart.md](quickstart.md): агент — симулятор iOS (`ui-check`, скріншоти), користувач — Android-маски, тематичні іконки, покадровий запис запуску; lint і tsc.

**Organization**: задачі згруповано за історіями спеки в порядку пріоритету: US1 іконка (P1), US2 splash (P2), US3 пульсація (P3). Історії незалежні; US1 і US2 ділять лише вихідні SVG і скрипт растеризації (Phase 1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна паралельно (інші файли, без залежностей від незавершених задач)
- **[Story]**: історія зі spec.md (US1…US3)

---

## Phase 1: Setup (вихідні SVG і растеризація)

**Purpose**: джерела правди для всіх PNG іконки й splash (research R3)

- [ ] T001 Створити вихідні SVG у `assets/images/app/source/` з геометрією артборда `AppIcon.dc.html` (полотно 1024, будинок `M512 258 L792 474 L792 792 L232 792 L232 474 Z` з `stroke-width 44`, `stroke-linejoin round`; блискавка `M549 439 L423 626 L501 626 L472 745 L601 551 L523 551 Z` з обводкою 14): `icon-full.svg` — повна іконка (лінійний градієнт `#2B3A52` → `#0B1424` по діагоналі, radial-відблиск білий `.10` з центром `0.28/0.22`, r `.75`, довга тінь — полігон `792,474 1592,1274 1024,1842 232,792` з градієнтом чорний `.38` → `0`, білий будинок, блискавка кольором тла); `android-background.svg` — градієнт + відблиск + тінь без будинку, з тим самим масштабом, що й передній план; `android-foreground.svg` — прозоре тло, білий будинок, блискавка — виріз (`fill-rule="evenodd"`, обводка блискавки теж вирізана), знак масштабовано так, щоб ширина будинку з обводкою була ≈ 52 % полотна по центру (безпечна зона 66/108 dp); `android-monochrome.svg` — та сама геометрія, що `android-foreground.svg`, білий; `splash-mark.svg` — прозоре тло, білий будинок з вирізом блискавки, ширина знака ≈ 46 % полотна по центру (132 з 288, research R4). Тінь в `android-background.svg` масштабувати й зсунути разом зі знаком переднього плану, щоб вона виходила з-під будинку
- [ ] T002 Створити `scripts/render-icons.swift`: для кожної пари `(svg, png, size)` читає SVG через `NSImage(contentsOf:)`, малює в `NSBitmapImageRep` рівно `size×size` пікселів (sRGB, з альфою там, де тло прозоре; для `icon.png` — без альфи) і пише PNG. Пари: `icon-full.svg → assets/images/app/icon.png` (1024, без альфи), `android-background.svg → assets/images/app/android-icon-background.png` (1024), `android-foreground.svg → assets/images/app/android-icon-foreground.png` (1024), `android-monochrome.svg → assets/images/app/android-icon-monochrome.png` (1024), `splash-mark.svg → assets/images/app/splash-icon.png` (1024). Запуск: `swift scripts/render-icons.swift` з кореня
- [ ] T003 Запустити `swift scripts/render-icons.swift` і переглянути кожен PNG (Read зображення) поруч з артбордом. Якщо CoreSVG відмальовує градієнти або виріз неправильно — згенерувати ті самі PNG через `npx --yes @resvg/resvg-js-cli` у scratchpad (не додавати в `package.json`) і зазначити це в README (T004)
- [ ] T004 [P] Створити `assets/images/app/source/README.md`: що це за файли, яка геометрія звідки (артборд «Іконка застосунку · 1024×1024»), які PNG з яких SVG генеруються і якою командою, правила розмірів (безпечна зона 52 % для адаптивної іконки, 46 % для знака splash), що бандл iOS `assets/app.icon` використовує ті самі контури

---

## Phase 2: Foundational

Блокуючих спільних задач немає: кожна історія змінює свої файли. Після Phase 1 історії можна робити в будь-якому порядку або паралельно.

---

## Phase 3: User Story 1 — Впізнавана іконка застосунку (Priority: P1) 🎯 MVP

**Goal**: фірмова іконка на iOS (світлий, темний, тонований режими) і Android (адаптивна з монохромом)

**Independent Test**: quickstart 1–4 — головний екран iOS у Default/Dark/Tinted; лаунчер Android з різними масками й тематичними іконками

- [ ] T005 [US1] Створити бандл Icon Composer `assets/app.icon/` (research R1): `Assets/house.svg` — білий будинок з вирізом блискавки (контури з `android-foreground.svg`, але масштаб і положення як в артборді 1024: будинок на всю композицію, як у `icon-full.svg`), `Assets/shadow.svg` — довга тінь (полігон і градієнт з T001); `icon.json` за схемою наявного `assets/expo.icon/icon.json`: `fill` — лінійний градієнт `#2B3A52` → `#0B1424` (замість `automatic-gradient`), одна група з шарами `shadow` (нижче) і `house`, `"supported-platforms": { "squares": "shared" }`. Якщо точний формат градієнтної заливки в `icon.json` невідомий — відкрити бандл в Icon Composer (`open -a "Icon Composer" assets/app.icon`), задати градієнт там і зберегти; перевірити прев'ю Default/Dark/Tinted в Icon Composer
- [ ] T006 [US1] Оновити `app.json`: `expo.ios.icon` → `"./assets/app.icon"`; `expo.android.adaptiveIcon.backgroundColor` → `"#14213A"` (решта шляхів `foregroundImage`/`backgroundImage`/`monochromeImage` лишаються, файли замінено в T003); верхньорівневий `expo.icon` лишається `./assets/images/app/icon.png`
- [ ] T007 [US1] Видалити `assets/expo.icon/` (`git rm -r`), переконатися пошуком, що на нього ніде немає посилань
- [ ] T008 [US1] `npx expo prebuild --clean` (регенерує закомічені `ios/` і `android/`, руками не редагувати — Constitution III), зібрати й запустити iOS у симуляторі у фоні (`npx expo run:ios`), відкрити панель симулятора, зробити скріншот головного екрана з іконкою; перемкнути Home Screen у Dark і Tinted (Settings → Display або довге натискання → Edit → Customize) і зробити скріншоти — звірити з артбордом (quickstart 1–2). Android: `cd android && ./gradlew assembleRelease` у фоні — збірка проходить; маски й тематичні іконки (quickstart 3–4) — на перевірку користувачу

**Checkpoint**: іконка готова й незалежно перевірена; можна закомітити як MVP

---

## Phase 4: User Story 2 — Фірмовий splash із живою анімацією (Priority: P2)

**Goal**: системний splash зі знаком → анімована накладка з сонцем, тінню й нативним індикатором → плавне згасання за правилами FR-009/FR-009a, лише на холодному запуску

**Independent Test**: quickstart 5–14 — покадровий запуск без стрибка, анімація, нативний індикатор, ≥ 1 с, ≤ ~3,5 с при повільних даних, не показується після фону чи входу, «Зменшити рух», VoiceOver

- [ ] T009 [US2] Оновити плагін `expo-splash-screen` в `app.json`: `"backgroundColor": "#14213A"`, `"image": "./assets/images/app/splash-icon.png"`, `"imageWidth": 288`, `"resizeMode": "contain"`, `"dark": { "backgroundColor": "#14213A", "image": "./assets/images/app/splash-icon.png" }` (data-model «Системний splash»)
- [ ] T010 [P] [US2] Створити `src/views/splash/use-splash-gate.ts`: `useSplashGate(shownAt: number): boolean` за [contracts/ui-components.md](contracts/ui-components.md) — `isSignedIn` з `useAuth()`, `status` з `useAccountDataStatus()`; `minElapsed` стає `true` через `max(0, 1000 − (Date.now() − shownAt))` мс (`setTimeout` у `useEffect`), `timedOut` — через 3000 мс; повертає `minElapsed && (!isSignedIn || status !== 'loading' || timedOut)`; таймери очищаються при розмонтуванні. Коментар — посилання на FR-009, FR-009a
- [ ] T011 [US2] Створити `src/views/splash/app-splash.tsx` — `AppSplash` за research R5 і контрактом:
  - модульний `let splashFinished = false`; якщо `true` — одразу `return null` (лише холодний запуск, перемонтування під `AccountDataProvider` при вході/виході — research R6);
  - `shownAt` — `useState(() => Date.now())`; корінь — `Animated.View` `StyleSheet.absoluteFill`, `zIndex` над навігатором, фон `#14213A`, `testID="splash"`, `accessible`, `accessibilityRole="progressbar"`, `accessibilityLabel="Utility Ledger, завантаження"`; `onLayout` (перший раз) → `SplashScreen.hide()` з `expo-splash-screen`;
  - знак — той самий `assets/images/app/splash-icon.png` через `expo-image`, 288×288 точно по центру екрана (знак у ньому 132×132), щоб збігся з системним splash піксель у піксель; під ним з відступом 28 від низу знака — «Utility Ledger» (Onest 800, 40, `letterSpacing` −1.6, білий);
  - шар появи (`opacity 0 → 1` за 300 мс після першого кадру): `LinearGradient` з `expo-linear-gradient`, кольори `['#2B3A52', '#14213A', '#0B1424']`, `locations [0, .48, 1]`, 160° (`start {x: .33, y: 0}`, `end {x: .67, y: 1}` або точніший розрахунок для 160°); «сонце» — `View` 960×960, `borderRadius 480`, центр у (центр екрана по x, 120 по y), `backgroundImage: 'radial-gradient(circle, rgba(255,236,200,0.20) 0%, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0) 60%)'`; тінь — `View` 220×1000 з верхом під центром знака, `transformOrigin: 'top'`, `backgroundImage: 'radial-gradient(ellipse at top, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0) 85%)'`; обидва `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`, `pointerEvents="none"`; шари в порядку артборда (сонце, тінь, знак з написом);
  - низ: на 58 від низу, по центру, `ActivityIndicator` з `react-native` (`size="large"`, `color="#FFFFFF"`, `testID="splash.progress"`), під ним з відступом 14 — «Комуналка під контролем» (Onest 500, 14, `rgba(255,255,255,0.62)`);
  - анімація: `p = useSharedValue(0)`; якщо `!useReducedMotion()` — `p.set(withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }), -1, true))`, інакше `p.set(0.5)`; сонце `translateX = -170 + 340·p`, `translateY = 40 − 100·sin(π·p)`; тінь `rotate = -38 + 76·p` deg; лише `get()/set()` (`docs/patterns/reanimated.md`);
  - згасання: коли `useSplashGate(shownAt)` → `true`, `opacity → 0` за 300 мс (`withTiming`, колбек → `scheduleOnRN` → `splashFinished = true` і стан `done`), під час згасання `pointerEvents="none"`; `done` → `null`;
  - поки видимий — `<StatusBar style="light" />` з `expo-status-bar`
- [ ] T012 [P] [US2] Створити `src/views/splash/index.ts` (експорт `AppSplash`, `useSplashGate`) і додати `export * from './splash'` у `src/views/index.tsx`
- [ ] T013 [US2] Підключити в `src/app/_layout.tsx`: усередині `AppProviders` після `<RootNavigator />` додати `<AppSplash />` (контракт «Розміщення»)
- [ ] T014 [US2] У `src/providers/preferences-provider.tsx` прибрати `useEffect` з `SplashScreen.hideAsync()` (і змінну `isLoaded`, якщо стане непотрібною); глобальний `SplashScreen.preventAutoHideAsync().catch(() => {})` лишити; оновити коментар: системний splash тримається до першого кадру `AppSplash`, який його й ховає
- [ ] T015 [P] [US2] Створити `docs/patterns/splash.md`: два етапи (системний з `app.json` → накладка `AppSplash`), перший кадр піксель у піксель (фон `#14213A`, `splash-icon.png` 288 по центру, знак 132), хто викликає `preventAutoHideAsync` і `hide`, умови згасання (≥ 1 с; не увійшов / дані `ready|offline` / 3 с), лише холодний запуск (`splashFinished`), «Зменшити рух», нативний `ActivityIndicator`, відхилення від артборда (знак по центру, тінь через `radial-gradient`), як змінити іконку чи знак (SVG у `assets/images/app/source/` → `swift scripts/render-icons.swift` → `expo prebuild --clean`), перевіряти на release-збірці
- [ ] T016 [P] [US2] Оновити `docs/patterns/preferences.md`: налаштування читаються до першого кадру, поки видно системний splash; ховає його тепер `AppSplash` на першому кадрі (посилання на `splash.md`), а не `PreferencesProvider`
- [ ] T017 [P] [US2] Оновити `docs/patterns/test-ids.md`: префікс `splash`, ідентифікатори `splash` (накладка, `role=progressbar`) і `splash.progress` (нативний індикатор)
- [ ] T018 [US2] `npx expo prebuild --clean`, release-збірка iOS у симуляторі у фоні (`npx expo run:ios --configuration Release`); перевірити quickstart 7, 8, 11, 13 (холодний запуск з входом і без, повернення з фону, «Зменшити рух» — Accessibility → Motion → Reduce Motion у симуляторі) скріншотами й `ui-check` (накладка `splash` зникає, з'являється `objects.screen` / екран входу); покадровий запис і Android (5, 6, 9, 10, 12, 14) — на перевірку користувачу

**Checkpoint**: splash працює незалежно від пульсації

---

## Phase 5: User Story 3 — Пульсація ілюстрацій порожніх станів (Priority: P3)

**Goal**: два кільця й «дихаюча» плитка на 05a, 08e, 12e, 09e, 20, 20c, 05o (×3), вимикаються поза фокусом і при «Зменшити рух»

**Independent Test**: quickstart 15–21 — кожен порожній стан у світлій і темній темі, «Зменшити рух», зникнення разом з порожнім станом

- [ ] T019 [US3] Створити `src/components/pulse.tsx` за [contracts/ui-components.md](contracts/ui-components.md) і research R7:
  - `usePulseActive()` — `useIsFocused()` з `expo-router` && `!useReducedMotion()` з `react-native-reanimated`;
  - `PulseRings({ color: 'blueSoft2' | 'powerOnSoft' | 'line', size })` — неактивний → `null`; інакше два `Animated.View` `position: 'absolute'`, `width/height = size`, `borderRadius = size / 2`, колір з теми (як `ThemedView backgroundColor`), `pointerEvents="none"`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`; кожне: прогрес `0 → 1` за 2800 мс `Easing.out(Easing.ease)`, `withRepeat(-1)`; `scale = 0.55 + 0.8·t`, `opacity = 0.9·(1 − t)`; друге — `withDelay(1400, …)`; при неактивності/розмонтуванні `cancelAnimation`;
  - `PulseCore({ style, children })` — `Animated.View`, активний: `scale` `withRepeat(withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true)`, неактивний — `cancelAnimation` і `scale 1`;
  - лише `get()/set()`; анімуються тільки `transform`/`opacity` (FR-016)
- [ ] T020 [US3] Експортувати `PulseRings`, `PulseCore`, `usePulseActive` з `src/components/index.ts`
- [ ] T021 [P] [US3] `src/views/objects/empty-state-view.tsx`: у зовнішній контейнер ілюстрації (188) першим дочірнім додати `<PulseRings color='blueSoft2' size={188} />`, плитку 88 (`ThemedView backgroundColor='surface'`) загорнути в `PulseCore`; бейдж «плюс» лишити поза `PulseCore`; переконатися, що контейнери не обрізають кільця (без `overflow: 'hidden'`) і кільця лежать під колами `blueSoft`/`blueSoft2` (порядок як у `PropertiesEmpty.dc.html`). Покриває 05a, 08e, 12e, 09e
- [ ] T022 [P] [US3] `src/views/outages/outage-message.tsx`: проп `pulse?: boolean` (за замовчуванням `false`); при `true` у контейнер ілюстрації першим — `<PulseRings color={isPower ? 'powerOnSoft' : 'line'} size={<розмір styles.outer>} />`, плитка `surface` у `PulseCore`; бейдж черги поза `PulseCore`
- [ ] T023 [US3] `src/app/(tabs)/(outages)/index.tsx`: передати `pulse` у `OutageMessage` для «Постачальник для вашого міста поки що не доданий» (20c) і «Оберіть свою чергу» (20); стани помилки завантаження графіка (рядки ~204 і ~249) — без `pulse`
- [ ] T024 [P] [US3] `src/views/account-data/account-data-offline.tsx`: обгорнути коло 120 у контейнер 120×120 з `<PulseRings color='line' size={120} />` першим, коло `surface2` з іконкою — у `PulseCore`; і для повноекранного, і для `compact` (05o на «Обʼєктах», «Світлі», у «Профілі»)
- [ ] T025 [P] [US3] Створити `docs/patterns/empty-state-pulse.md`: `PulseRings` + `PulseCore` з `@/components`, параметри (2,8 с, `.55 → 1.35`, `.9 → 0`, зсув 1,4 с, плитка 1.06), кольори за станом (`blueSoft2` / `powerOnSoft` / `line`, таблиця з data-model), де стоять кільця (першими, під колами, без `overflow: hidden`), що не анімується (бейдж, тексти, кнопка), фокус і «Зменшити рух» (`usePulseActive`), як додати пульсацію новому порожньому стану
- [ ] T026 [US3] Перевірити в симуляторі iOS (`ui-check`, dev-збірка достатня — лише JS): акаунт без адрес → «Обʼєкти»; обʼєкт без послуг → місяці й «Послуги»; місяць без послуг; «Світло» без черг і з містом Київ; стан «Немає інтернету» (режим польоту на новому вході) — скріншоти в двох фазах пульсації, звірка з артбордами 05a, 08e, 12e, 09e, 20, 20c, 05o у світлій і темній темі; «Зменшити рух» — кілець немає (quickstart 15–20); за потреби додати `.claude/skills/ui-check/flows/empty-states.flow`

**Checkpoint**: усі три історії готові

---

## Phase 6: Polish & Cross-Cutting

- [ ] T027 Оновити індекс `docs/patterns/README.md`: рядки для `splash.md` («Splash — системний етап зі знаком, накладка `AppSplash` з анімацією й нативним індикатором, ≥ 1 с, дані акаунта ≤ 3 с, лише холодний запуск; як перегенерувати іконку») і `empty-state-pulse.md` («Пульсація порожніх станів — `PulseRings` + `PulseCore`, кольори за станом, вимикається поза фокусом і при «Зменшити рух»»)
- [ ] T028 Пройти решту [quickstart.md](quickstart.md) разом з користувачем: Android-маски й тематичні іконки (3–4), покадровий холодний запуск на обох платформах (5), повільна мережа й офлайн (9–10), згортання під час splash (12), VoiceOver/TalkBack (14), прокрутка й переходи з порожнім станом (21); зафіксувати, що не перевірено
- [ ] T029 Прибрати тимчасові файли, створені під час роботи (scratchpad, тимчасові PNG/рендери resvg, якщо були); не чіпати файли застосунку Claude
- [ ] T030 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI)

---

## Dependencies & Execution Order

- **Phase 1** (T001–T004) — перед US1 і US2 (обидві беруть PNG/контури звідти). US3 від Phase 1 не залежить і може починатися одразу.
- **US1** (T005–T008): T005 → T006 → T007 → T008.
- **US2** (T009–T018): T009 потребує `splash-icon.png` з T003; T010, T012 паралельно; T011 після T010; T013 після T011–T012; T014 разом з T013 (без нього системний splash сховається раніше за накладку); T015–T017 паралельно будь-коли; T018 останнім.
- **US3** (T019–T026): T019 → T020 → T021/T022/T024 паралельно → T023 після T022 → T026; T025 паралельно.
- **Polish** (T027–T030) — після всіх історій; T030 останнім.
- US1 і US2 обидві роблять `expo prebuild --clean` (T008, T018) — якщо робляться разом, достатньо одного prebuild і однієї збірки наприкінці.

## Parallel Example

```text
# Після Phase 1, різні файли:
T005 [US1] assets/app.icon/
T010 [US2] src/views/splash/use-splash-gate.ts
T019 [US3] src/components/pulse.tsx

# Усередині US3 після T020:
T021 src/views/objects/empty-state-view.tsx
T022 src/views/outages/outage-message.tsx
T024 src/views/account-data/account-data-offline.tsx
T025 docs/patterns/empty-state-pulse.md
```

## Implementation Strategy

1. **MVP**: Phase 1 + US1 — фірмова іконка на обох платформах (потрібна для магазинів), коміт.
2. **US2**: системний і анімований splash, нова нативна збірка, коміт разом з `docs/patterns/splash.md` і оновленими `preferences.md`, `test-ids.md`.
3. **US3**: пульсація — лише JS, доставляється OTA; коміт разом з `docs/patterns/empty-state-pulse.md`.
4. Polish: індекс патернів, ручна перевірка з користувачем, lint і tsc.
