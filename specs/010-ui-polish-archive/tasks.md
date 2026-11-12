---

description: "Задачі для архівування обʼєктів, барабанів лічильника за типом послуги, стартової черги «Світла», нового вибору теми й візуальних правок"
---

# Tasks: Архівування обʼєктів, лічильники за типом послуги, стартова черга «Світла» і візуальні правки

**Input**: Design documents from `/specs/010-ui-polish-archive/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interfaces.md, quickstart.md

**Tests**: автотестів спека не вимагає. Перевірка — сценарії з [quickstart.md](quickstart.md), `ui-check` в iOS Simulator (`.claude/skills/ui-check/flows/`) і ручний прохід на Android-емуляторі.

**Organization**: задачі згруповано за user stories зі spec.md (US1–US6). Канвас дизайну — `docs/design.md`, читати й оновлювати через інструмент Artifact.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можна виконувати паралельно (інші файли, без залежностей від незавершених задач)
- **[Story]**: до якої user story належить задача

---

## Phase 1: Setup

- [ ] T001 Додати залежності через `npx expo install expo-application react-native-view-shot` (research R6, R14). Перевірити, що `package.json` має обидва пакети з версіями, які підібрав Expo: `expo-application` ~58.1.2, `react-native-view-shot` — рекомендований для SDK 58. `ios/` і `android/` руками не чіпати

---

## Phase 2: Foundational

Не потрібна: кожна історія зачіпає свої файли. Спільна лише T001, яку потребують US4 і US6.

---

## Phase 3: User Story 1 — Архівувати обʼєкт і повернути його з архіву (Priority: P1) 🎯 MVP

**Goal**: обʼєкт можна заархівувати з навбару деталей. Він зникає зі списку, видимий на екрані «Архів» лише для перегляду, має перемикач «Враховувати в аналітиці» і повертається з архіву з усією історією.

**Independent Test**: quickstart.md, розділ «Архів (US1)», кроки 1–7.

- [ ] T002 [US1] Оновити канвас (`docs/design.md`):
  - артборд «Обʼєкт»: кнопка навбару «Архівувати» з іконкою 🗄️ перед «Видалити»;
  - новий артборд «Архів» у світлій і темній темах: картки обʼєктів без статусу місяця, під кожною рядок із перемикачем «Враховувати в аналітиці»;
  - стан порожнього архіву: заголовок «Архів порожній», пояснення «Архівуйте адресу в її деталях, щоб прибрати зі списку, не втрачаючи історії»;
  - стан архівованого обʼєкта з єдиною кнопкою «Повернути з архіву».
- [ ] T003 [US1] У `src/services/ledger/types.ts`:
  - до `LedgerObject` додати `archived?: boolean` (немає поля = `false`), `archivedAt?: number` (ms, час останнього архівування; після повернення не видаляється), `includeInAnalytics?: boolean` (немає поля = `true`; має значення лише при `archived === true`), з коментарями українською (data-model.md);
  - до `LedgerRepository` додати `setObjectArchive(id: string, patch: { archived: boolean; includeInAnalytics?: boolean }): Promise<void>` (contracts/interfaces.md);
  - `ObjectInput` змінити на `Omit<LedgerObject, 'id' | 'createdAt' | 'archived' | 'archivedAt' | 'includeInAnalytics'>`, щоб форма не перезаписувала архівні поля.
- [ ] T004 [US1] Реалізувати `setObjectArchive` у `src/services/ledger/firestore-ledger-repository.ts` за зразком `updateObject`: знайти обʼєкт, зібрати новий і викликати `commit` з `set('objects', id, object)`.
  - `archived: true` → `archivedAt: Date.now()`, `includeInAnalytics: patch.includeInAnalytics ?? true`.
  - `archived: false` → `archived: false`, `includeInAnalytics: true`.
  - Лише зміна перемикача → `{ archived: true, includeInAnalytics }` без зміни `archivedAt`.
  - Явні булеві значення, ніякого `undefined` у документі (research R1).
- [ ] T005 [P] [US1] Реалізувати той самий `setObjectArchive` у `src/services/ledger/local-ledger-repository.ts` з тією ж логікою полів, що в T004.
- [ ] T006 [US1] Додати селектори поруч із `getObjectServices` (у тому самому файлі `src/services/ledger/`, де він оголошений) і експортувати їх з `src/services/ledger/index.ts`:
  - `getActiveObjects(state)` — `!object.archived`;
  - `getArchivedObjects(state)` — `object.archived`, сортування за `archivedAt` спадно;
  - `getAnalyticsObjects(state)` — активні разом з архівованими, у яких `includeInAnalytics !== false`; коментар: «єдине джерело обʼєктів для Аналітики»;
  - `isObjectReadOnly(object)` — `object.archived === true`.
- [ ] T007 [US1] У `src/app/(tabs)/(objects)/index.tsx`:
  - список і лічильник адрес у підзаголовку — з `getActiveObjects(state)`;
  - `isEmpty` рахувати за активними;
  - кнопки навбару: коли активних немає, але є архівовані, показувати лише кнопку `archive`; коли немає жодних, як зараз — `[]`;
  - дія `archive` замість `Alert.alert('Архів', …)` виконує `router.push('/archive')`;
  - прибрати невикористаний імпорт `Alert`.
- [ ] T008 [US1] Створити `src/app/(tabs)/(objects)/archive.tsx`:
  - `NavigationView` з `type='short'`, `title='Архів'`, `barType='blue'`, `testID='archive.screen'`, `contentInsets={{ bottom: 32 }}`;
  - список `getArchivedObjects(state)`: кожен `ObjectCard` (`testID` `archive.card.{index}`, без `month`/`status`, `services` з `getObjectServices`, `onPress` → `/[objectId]`) у `VStack`;
  - під карткою, у тій самій поверхні, рядок «Враховувати в аналітиці» з `Switch` з `react-native`, як перемикач у `src/app/(tabs)/profile/index.tsx`: `value={object.includeInAnalytics !== false}`, `onValueChange={(v) => ledger.setObjectArchive(object.id, { archived: true, includeInAnalytics: v })}`, `testID` `archive.analytics.{index}`;
  - порожній стан — `EmptyStateView` з іконкою `archive`, текстами з T002, `testID` `archive.empty`, без кнопки дії.

  Стек «Обʼєктів» уже ховає таб-бар на вкладених екранах (`docs/patterns/tab-bar.md`); перевірити, що `(objects)/_layout.tsx` не потребує реєстрації маршруту, а якщо Stack перелічує екрани явно — додати `archive`.
- [ ] T009 [US1] У `src/app/(tabs)/(objects)/[objectId]/index.tsx`:
  - (a) для активного обʼєкта в `objectButtons` перед `delete` додати `{ id: 'archive', title: 'Архівувати', icon: 'archive', iconBackground: 'surface2', testID: 'object.nav.archive' }`;
  - (b) `confirmArchive`: `Alert.alert('Архівувати адресу?', 'Адреса зникне зі списку, а вся історія збережеться в архіві.', [Скасувати (cancel), Архівувати])`; після підтвердження — `router.back()`, потім `ledger.setObjectArchive(object.id, { archived: true })`;
  - (c) для `isObjectReadOnly(object)` кнопки навбару — `{ id: 'restore', title: 'Повернути з архіву', icon: 'archive', iconBackground: 'greenSoft', testID: 'object.nav.restore' }` і наявна `delete` (з тим самим `confirmDelete`; видалення архівованого обʼєкта лишається, spec «Поза обсягом»). Дія `restore` → `ledger.setObjectArchive(object.id, { archived: false })` без підтвердження, користувач лишається на екрані;
  - (d) для архівованого вимкнути `SwipeableRow` видалення місяця (рендерити `ListRow` без свайпа або передати `enabled={false}`, якщо компонент це підтримує) і не відкривати `MonthPickerSheet`.
- [ ] T010 [US1] У `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx` для `isObjectReadOnly(object)`:
  - сховати кнопки навбару (`navigationBarButtons=[]`);
  - рядки послуг не відкривають `reading`, `amount` і `services`;
  - свайп «Скинути» (`SwipeableRow`, рядки 174–186) вимкнено;
  - перехід до розрахунку `bill` лишити доступним.
- [ ] T011 [P] [US1] Захист глибоких екранів редагування: у `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/amount.tsx`, `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` і `src/app/(tabs)/(objects)/object-form.tsx` (лише режим редагування з `objectId`) при `isObjectReadOnly(object)` одразу виконати `router.back()` в ефекті й рендерити `null`. `src/app/(tabs)/(objects)/[objectId]/services.tsx` для архівованого показує список послуг для перегляду: без кнопок навбару, рядки не відкривають `service-form`, свайп видалення вимкнено.
- [ ] T012 [US1] Додати сценарій `.claude/skills/ui-check/flows/archive.flow` у форматі наявних flow (див. `.claude/skills/ui-check/SKILL.md`): відкрити `objects.card.0`, натиснути `object.nav.archive`, підтвердити «Архівувати», перевірити, що в списку немає цієї адреси; `objects.nav.archive` → `archive.screen` і `archive.card.0`; відкрити картку → є `object.nav.restore` і `object.nav.delete`, немає `object.nav.addMonth` і `object.nav.archive`; `object.nav.restore` → назад до списку → адреса повернулась. Пройти сценарій в iOS Simulator.

- [ ] T013 [US1] Оновити патерни в тому ж коміті, що й код US1 (Constitution IV, «Процес»): `docs/patterns/user-data.md` — поля `archived`/`archivedAt`/`includeInAnalytics`, `setObjectArchive`, архівований обʼєкт лише для перегляду (крім «Повернути з архіву» й «Видалити»), обʼєкти для «Аналітики» — лише через `getAnalyticsObjects`; `docs/patterns/tab-bar.md` — екран «Архів» у стеку «Обʼєктів» без таб-бару; опис цих файлів в індексі `docs/patterns/README.md`, якщо змінився зміст

**Checkpoint**: архів працює незалежно від решти історій — MVP.

---

## Phase 4: User Story 2 — Барабан лічильника під тип послуги (Priority: P1)

**Goal**: світло 5 клітинок / 2 червоні, вода 6/3, газ 8/3; показники зберігаються в одиницях з дробом, старі значення й суми не змінюються.

**Independent Test**: quickstart.md, розділ «Лічильники (US2)».

- [ ] T014 [US2] Оновити канвас: артборди «Введення показника» (10–10d) для світла (5 клітинок, 2 червоні), води (6, 3 червоні) і газу (8, 3 червоні; перевірити, що 8 клітинок вміщаються в ширину 375 pt — за потреби зменшити клітинку й проміжок); підказки «Введіть N цифр…», «Цифра N з M», «Усі M цифр введено».
- [ ] T015 [P] [US2] Створити `src/services/ledger/meter-format.ts` і експортувати його з `src/services/ledger/index.ts`:
  - `getMeterFormat(service)`: `zones` `'single' | 'dayNight'` → `{ length: 5, fractionDigits: 2 }`, `'water'` → `{ length: 6, fractionDigits: 3 }`, `'gas'` → `{ length: 8, fractionDigits: 3 }` (data-model.md, таблиця MeterFormat);
  - `digitsToReading(digits, format)` = `Number(digits) / 10 ** fractionDigits`, округлене до `fractionDigits` знаків;
  - `readingToDigits(value, format)` = `''`, якщо `value === undefined`, інакше `String(Math.round(value * 10 ** fractionDigits)).padStart(length, '0').slice(-length)`;
  - `formatReading(value, fractionDigits)` — групування тисяч як у `formatNumber`, кома як десятковий роздільник, рівно `fractionDigits` знаків (`123,45`);
  - коментарі українською: червоні клітинки — дробова частина; старі цілі значення валідні; показник світла понад 999,99 показується останніми 5 цифрами (рішення користувача, spec Edge Cases).
- [ ] T016 [US2] У `src/views/meter/meter-digit.tsx` розділити `isLast` на два пропси:
  - `isFraction` — червоне фарбування: фон `coral`, рамка порожньої `blankRimLast`, стиль `activeLast`;
  - `isLast` — лише підсвічування «що прибере стерти», коли введено всі цифри.

  Усі місця, де зараз `isLast` вибирає колір (рядки ~49–102), перевести на `isFraction`.
- [ ] T017 [US2] У `src/views/meter/meter-reading-input.tsx`:
  - додати проп `fractionDigits: number`;
  - передавати в `MeterDigit` `isFraction={index >= length - fractionDigits}` і `isLast={index === length - 1}`;
  - режим `readOnly` (онбординг) лишається з `fractionDigits={1}` за замовчуванням;
  - `showsHorizontalScrollIndicator={false}` / `showsVerticalScrollIndicator={false}` на внутрішньому скролі (FR-019).
- [ ] T018 [US2] У `src/app/(tabs)/(objects)/[objectId]/[month]/reading.tsx`:
  - прибрати `METER_LENGTH = 5`, брати `const format = getMeterFormat(service)`;
  - `toDigits` → `readingToDigits(saved, format)`;
  - у `toZone`: `value.length < format.length`, `current = digitsToReading(value, format)`, `consumption` округлювати до `fractionDigits`;
  - `hintFor`: «Введіть ${length} цифр зліва направо, як на лічильнику», «Цифра ${n} з ${length}», «Усі ${length} цифр введено»;
  - `MeterReadingInput` отримує `length={format.length}` і `fractionDigits={format.fractionDigits}`;
  - плитки «Попередній» і «Спожито» показують `formatReading(…, format.fractionDigits)`;
  - збереження — значення в одиницях; для день/ніч обидві секції з тим самим форматом.
- [ ] T019 [US2] У `src/services/ledger/billing.ts`:
  - кожну грошову позицію (`supply`, `sewage`, `dayAmount`, нічна сума, газ, однозонна) округлювати до цілих копійок `Math.round(...)` перед підсумком `total`;
  - поля `current`, `previous` і `consumption` лишаються в одиницях з дробом;
  - перевірити, що для старих цілих показників суми не змінюються.
- [ ] T020 [P] [US2] Замінити показ показників і споживання на `formatReading(value, getMeterFormat(service).fractionDigits)` там, де зараз `formatNumber` показує показник чи спожите: `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx`, `src/app/(tabs)/(objects)/[objectId]/[month]/bill.tsx` і будь-які інші місця, які знайде `grep -rn "formatNumber" src`. Гроші лишаються на `formatMoney`.
- [ ] T021 [P] [US2] У `src/app/(tabs)/(objects)/[objectId]/service-form.tsx` поле «Початковий показник» (і нічний): приймати кому або крапку, обмежити дробову частину `getMeterFormat` для вибраних `zones`, зберігати `Number(value.replace(',', '.'))`, округлене до `fractionDigits`; при редагуванні показувати з комою.
- [ ] T022 [US2] Додати `.claude/skills/ui-check/flows/meter.flow`: внести показник світла (5 клітинок, підказка «Цифра 1 з 5»), води (6) і газу (8); перевірити тексти підказок і що «Зберегти» активна лише після всіх цифр. Пройти в iOS Simulator.

- [ ] T023 [US2] Оновити `docs/patterns/meter-reading.md` у тому ж коміті, що й код US2: формати 5/2 (світло), 6/3 (вода), 8/3 (газ) через `getMeterFormat`, червоні клітинки — дробова частина, значення в одиницях з дробом, старі цілі значення валідні, показник світла понад 999,99 показується останніми 5 цифрами, підказки «Введіть N цифр…» / «Цифра N з M» / «Усі M цифр введено»; рядок індексу `docs/patterns/README.md`

**Checkpoint**: показники вносяться цифра в цифру для всіх трьох типів.

---

## Phase 5: User Story 3 — Стартова черга «Світла» (Priority: P2)

**Goal**: у налаштуваннях «Світла» можна вибрати чергу, що вибрана при холодному запуску.

**Independent Test**: quickstart.md, розділ «Стартова черга (US3)».

- [ ] T024 [US3] Оновити канвас: артборд налаштувань «Світла» — рядок «Стартова черга» зі значенням під секцією «Мої черги» (лише коли обрано ≥ 2 черги).
- [ ] T025 [US3] У `src/services/outages/types.ts` до `OutageSettings` додати `startQueue?: QueueId` з коментарем: «Черга, вибрана при холодному запуску вкладки «Світло». Валідна лише якщо є в `queues`; інакше ігнорується, а при збереженні налаштувань скидається» (data-model.md).
- [ ] T026 [US3] У `src/services/outages/firestore-settings-repository.ts`:
  - тип `AccountOutageSettings` (рядок 18) доповнити `startQueue?: string`;
  - читання (рядок ~55) — `startQueue: data.startQueue`, лише якщо це рядок;
  - запис (рядок ~76) — додавати `startQueue`, лише коли він визначений (без `undefined` у документі).

  Перевірити `src/services/outages/settings-repository.ts` і `index.web.ts` на потребу тієї самої зміни.
- [ ] T027 [P] [US3] Створити `src/views/outages/start-queue-row-content.tsx`, `start-queue-row.tsx`, `start-queue-row.ios.tsx`, `start-queue-row.android.tsx` за зразком `src/views/profile/start-tab-row*.tsx`:
  - пропси `queues: QueueSettings[]`, `value: QueueId`, `onChange(id: QueueId)`;
  - рядок «Стартова черга» зі значенням (назва черги, якщо задана, інакше «Черга {id}»);
  - iOS — `Menu` + `Picker` inline з `@expo/ui/swift-ui`, Android — той самий підхід, що в `start-tab-row.android.tsx`;
  - `accessibilityIdentifier` / `testID` `outageSettings.startQueue`;
  - підпис для читача екрана — «Стартова черга, {назва}».
- [ ] T028 [US3] У `src/app/(tabs)/(outages)/outage-settings.tsx`:
  - стан форми `startQueue` (початково `settings.startQueue`);
  - під сіткою «Мої черги» рендерити `StartQueueRow`, коли `pickedQueues.length >= 2`; значення — `startQueue`, якщо він серед обраних, інакше перша обрана;
  - при збереженні (місце, де збирається `queues: pickedQueues.map(...)`, рядок ~143) записати `startQueue`, лише якщо він серед `pickedQueues`, інакше не записувати;
  - `showsVerticalScrollIndicator={false}` на скролі екрана (FR-019).
- [ ] T029 [US3] У `src/app/(tabs)/(outages)/index.tsx` у `ScheduleScreen` отримувати `startQueue` з `useOutageSettings()` (або передати пропом з батьківського компонента) і ініціалізувати `useState` значенням `queues.some((q) => q.id === startQueue) ? startQueue : firstQueue`. Наявний запасний варіант `queue = … ? selectedQueue : firstQueue` лишити. Ручне перемикання не змінює налаштувань.

- [ ] T030 [US3] Оновити патерни в тому ж коміті, що й код US3: `docs/patterns/pickers.md` — «Стартова черга» як нативне меню від рядка (як «Стартова вкладка»); `docs/patterns/outage-providers.md` — `OutageSettings.startQueue` в акаунті, скидання при прибиранні черги, застосування лише при холодному запуску

**Checkpoint**: холодний запуск відкриває стартову чергу.

---

## Phase 6: User Story 4 — Новий вибір теми з плавним перемиканням (Priority: P2)

**Goal**: картки теми зі сценою логотипу без галочки; зміна теми — справжній плавний перехід на всьому екрані.

**Independent Test**: quickstart.md, розділ «Тема (US4)».

- [ ] T031 [US4] Оновити канвас: артборд «Тема» (16d–16g) — три картки зі сценою знака застосунку («Світла» — денне небо, сонце високо, коротка тінь; «Темна» — нічне небо, місяць, зірки; «Як у системі» — навпіл), вибрана з рамкою `blue` 2 pt, невибрані приглушені (opacity 0.6), без позначки-радіо.
- [ ] T032 [US4] Створити `src/views/brand/logo-scene.tsx` (і `src/views/brand/index.ts`), винісши з `src/views/splash/app-splash.tsx` малювання сцени:
  - знак `splash-icon.png`, «сонце» дугою за `x = −170 + 340·p`, `y = 40 − 100·sin(π·p)` у масштабі `size`;
  - тінь будинку з поворотом `−38° + 76°·p`.

  Пропси `variant: 'day' | 'night' | 'split'`, `animated: boolean`, `size: number`. Поведінка:
  - `animated` — цикл `p` 1 → 0 → 1 по 7 с з `inOut(ease)`, як на splash;
  - `animated={false}` або `useReducedMotion()` — `p = 0.5`;
  - `night` — темний градієнт, місяць замість сонця, 5–7 зірок;
  - `split` — дві половини (`overflow: 'hidden'`, ліва день, права ніч);
  - shared values лише через `get()`/`set()` (`docs/patterns/reanimated.md`).

  Сцени декоративні: `accessibilityElementsHidden` / `importantForAccessibility='no-hide-descendants'`.
- [ ] T033 [US4] Перевести `src/views/splash/app-splash.tsx` на `LogoScene` (`variant='day'`, `animated`, розмір знака як зараз). Перевірити, що перший кадр splash піксель у піксель збігається з системним (`docs/patterns/splash.md`). Пройти `.claude/skills/ui-check/flows/splash.flow`.
- [ ] T034 [US4] Переробити `src/views/profile/theme-option-card.tsx`:
  - замість `ThemePreview` рендерити `LogoScene` (`system` → `split`, `light` → `day`, `dark` → `night`; `animated={selected}`);
  - прибрати круглу позначку з `check` і стилі радіо;
  - рамка `blue` при виборі (як зараз, `borderWidth: 2`), невибрана — колір рамки = фон, `opacity: 0.6` на сцені;
  - CSS transition `borderColor` і `opacity` 250 мс;
  - `accessibilityRole='radio'` і `accessibilityState={{ checked: selected }}` лишити.

  Видалити `src/views/profile/theme-preview.tsx` і його експорт з `src/views/profile/index.ts`.
- [ ] T035 [US4] Перехід теми знімком (research R6):
  - (a) у `src/app/_layout.tsx` обгорнути навігатор у `View` з `ref`, `collapsable={false}`, `style={{ flex: 1 }}` і передати ref у новий контекст `ThemeSnapshotContext` (у `src/components/theme-transition.tsx`);
  - (b) у `ThemeTransition` додати функцію `captureBeforeThemeChange(): Promise<void>`:
    - `captureRef(rootRef, { format: 'jpg', quality: 0.9, result: 'tmpfile' })` з `react-native-view-shot`, імпорт ліниво з перевіркою наявності нативного модуля (стара development build без нього → запасний шлях);
    - знімок показати як `expo-image` `Image` на `StyleSheet.absoluteFill` з `pointerEvents='none'`;
    - після зміни схеми — CSS-анімація `opacity` 1 → 0 за 350 мс `ease-out`, `animationFillMode: 'forwards'`, `key` для перезапуску;
    - після завершення файл видалити (`expo-file-system`, якщо вже є в залежностях, інакше лишити тимчасовим);
  - (c) зміна схеми без знімка (система в режимі «Як у системі», помилка знімка) — теперішнє накриття фоном, але 350 мс;
  - (d) `useReducedMotion()` — без накриття й без знімка.
- [ ] T036 [US4] У `src/providers/preferences-provider.tsx` у `setTheme` перед `Appearance.setColorScheme(...)` дочекатися `captureBeforeThemeChange()` (з таймаутом 150 мс, щоб тема не затримувалась, якщо знімок повільний). Якщо спрацював таймаут чи знімок упав — у `__DEV__` писати `console.warn('[theme] snapshot fallback', причина, мс)`, щоб тихий перехід на накриття було видно). Повторний виклик під час анімації бере новий знімок поточного кадру. API `usePreferences().setTheme` не змінюється.
- [ ] T037 [US4] Оновити `.claude/skills/ui-check/flows/theme.flow` під картки без позначки: перевірка вибору через `accessibilityState`/`selected` замість іконки галочки. Пройти в iOS Simulator.
- [ ] T038 [US4] Зібрати нову development build з `react-native-view-shot` (`npx expo run:ios` і `npx expo run:android` або `bunx`/`npx eas-cli@latest build --profile development`). Перевірити перемикання теми на обох платформах: увесь екран, навбар і таб-бар перетікають ≤ 0,5 с, без кадру з різкою зміною (SC-004). Окремо: (1) виміряти час `captureRef` на iOS Simulator і Android-емуляторі (10 перемикань, у лозі немає `[theme] snapshot fallback`, медіана < 150 мс); (2) таб-бар є на знімку на обох платформах (тимчасово не розчиняти знімок і порівняти скріншот). Якщо на Android таб-бар на знімок не потрапляє — повідомити користувача й записати обмеження в `docs/patterns/preferences.md`.

- [ ] T039 [US4] Оновити патерни в тому ж коміті, що й код US4: `docs/patterns/preferences.md` — перехід теми знімком кореня (`captureRef`, 350 мс), пом'якшене накриття для системної зміни й без нативного модуля, «Зменшити рух» без анімації; `docs/patterns/pickers.md` — екран «Тема» зі сценами логотипу без позначки, вибраний — рамка й анімація; `docs/patterns/splash.md` — сцена винесена в `LogoScene` (`src/views/brand/`); рядки індексу `docs/patterns/README.md`

**Checkpoint**: тема перемикається плавно, екран вибору — з логотипом.

---

## Phase 7: User Story 5 — Охайніші списки, картки й навбари (Priority: P3)

**Goal**: галочки без фону, нове коло плюса, усі послуги в картках, однакові шрифти навбару, без індикаторів прокрутки, таб-бар Android у кольорах застосунку.

**Independent Test**: quickstart.md, розділ «Візуальні правки (US5) і профіль (US6)», у світлій і темній темах на iOS і Android.

- [ ] T040 [US5] Оновити канвас: рядок заповненого місяця (лише галочка), клітинки доданих місяців у «Оберіть місяць» (лише галочка), коло під плюсом «Додати адресу» в новому кольорі, картка обʼєкта з > 5 послугами (перенос на другий рядок), таб-бар Android у кольорах дизайн-системи.
- [ ] T041 [US5] У `src/app/(tabs)/(objects)/[objectId]/index.tsx` у `trailing` рядка місяця замість `ThemedView backgroundColor='greenSoft'` з `AppImage` рендерити лише `AppImage icon='check'` з роллю `role='inline'` (16 pt) зі шкали `docs/patterns/icons.md` замість `badge` (12 pt, для галочок у кружечках). Прибрати стиль `check`.
- [ ] T042 [P] [US5] У `src/views/objects/month-picker-sheet.tsx` у `MonthCell` замінити `ThemedView backgroundColor='greenSoft' style={styles.addedMark}` на `View` з тим самим позиціонуванням (`position: 'absolute', top: 6, right: 6`) без фону й радіуса, з `AppImage icon='check' role='badge'` усередині.
- [ ] T043 [P] [US5] У `src/constants/colors.ts` змінити `plusSoft`: світла тема `#D3E3F8`, темна — непрозорий світло-синій `#C9DBF7` (research R9; точне значення — з канвасу T040). Перевірити, що ➕ контрастний у `objects/index.tsx`, `[objectId]/index.tsx`, `services.tsx`, `empty-state-view.tsx`, `addresses-illustration.tsx`.
- [ ] T044 [P] [US5] У `src/views/object-card.tsx` прибрати `.slice(0, 5)`, а `HStack` з іконками послуг зробити з `flexWrap: 'wrap'` і `rowGap: 6`. Якщо `HStack` не пропускає стиль, використати `View` з `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: 6`.
- [ ] T045 [P] [US5] У `src/components/navigation-bar/navigation-bar-header.tsx` `getTitleFont` для `full` завжди повертає `'title'` (28/36), для `short` — `'headline'`. Прибрати параметр `isTransparent` з функції, якщо він більше не потрібен. Пройти екрани з прозорим навбаром (типовий `barType`: `edit-name`, `privacy`, `terms`, `sign-in`, `auth-error`, екрани без `barType`) і з кольоровим. Заголовок і підзаголовок мають збігатися зі «Світлом». Окремі `font`/`fontSize` для заголовків навбару в екранах прибрати, якщо знайдуться.
- [ ] T046 [P] [US5] Прибрати індикатори прокрутки (FR-019): `showsVerticalScrollIndicator={false}` і/або `showsHorizontalScrollIndicator={false}` у `src/components/navigation-view.tsx`, `src/components/screen-view.tsx`, `src/components/save-area-scoll-view.tsx`, `src/components/navigation-bar/navigation-bar-buttons-row.tsx`, `src/views/objects/city-picker-sheet.tsx`, `src/views/outages/outage-city-sheet.tsx`, `src/views/outages/queue-chips.tsx`, `src/app/(tabs)/(objects)/[objectId]/icon-picker.tsx`. Файли з T017 і T028 покриваються там. Фінальна перевірка: `grep -rln "ScrollView\|FlatList\|KeyboardAwareScrollView" src` — кожен файл має пропси вимкнення.
- [ ] T047 [US5] У `src/app/(tabs)/_layout.tsx` на `NativeTabs` додати Android-кольори з `useThemeColor` (research R13):
  - `backgroundColor` — `surface`;
  - `rippleColor` — `line`;
  - `indicatorColor` — мʼякий тон активної вкладки через перевизначення на `NativeTabs.Trigger`: `blueSoft` для «Обʼєктів», `powerOnSoft` для «Світла», `greenSoft` для «Аналітики», `purpleSoft` для «Профілю». Якщо Trigger-рівня немає в типах `node_modules/expo-router/build/native-tabs/types.d.ts`, то один `indicatorColor` = `surface2`;
  - `labelVisibilityMode='labeled'`.

  Перевірити на Android-емуляторі в обох темах і після перемикання теми на льоту. Якщо кольори не оновлюються без перезапуску, задокументувати це в `docs/patterns/tab-bar.md` і повідомити користувача.

- [ ] T048 [US5] Оновити патерни в тому ж коміті, що й код US5: `docs/patterns/icons.md` — позначка «заповнено» лише галочкою без фону; `docs/patterns/pickers.md` — у «Оберіть місяць» додані місяці з самою галочкою; `docs/patterns/navigation-bar-title.md` — заголовок `title` 28 для всіх повних навбарів, `headline` 22 для коротких, жоден скрол без вимкнених індикаторів; `docs/patterns/tab-bar.md` — Android-кольори `NativeTabs`; рядки індексу `docs/patterns/README.md`

**Checkpoint**: візуальні правки звірено з канвасом на обох платформах.

---

## Phase 8: User Story 6 — Охайніший профіль (Priority: P3)

**Goal**: імʼя один раз у картці, рядок «Змінити імʼя», номер білда поруч із версією.

**Independent Test**: quickstart.md, розділ «Візуальні правки (US5) і профіль (US6)», пункт «Профіль».

- [ ] T049 [US6] Оновити канвас: артборди 16 і 16a «Профіль» — рядок «Змінити імʼя» без значення праворуч, підпис «Utility Ledger · версія 1.0.0 (42)».
- [ ] T050 [US6] У `src/app/(tabs)/profile/index.tsx`:
  - рядок `profile.name`: заголовок «Змінити імʼя», прибрати `trailing` з іменем і стиль `value`, якщо він більше ніде не використовується;
  - версія: `import * as Application from 'expo-application'`, `version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version`, `build = Application.nativeBuildVersion`;
  - текст `Utility Ledger · версія ${version}${build ? ` (${build})` : ''}`;
  - `testID='profile.version'` лишити;
  - прибрати імпорт `Constants`, якщо він більше не потрібен.
- [ ] T051 [US6] Оновити `.claude/skills/ui-check/flows/profile.flow`: текст «Змінити імʼя» замість «Імʼя», версія з дужками. Пройти в iOS Simulator.

**Checkpoint**: профіль звірено з артбордом.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T052 Звірити `docs/patterns/README.md` з усіма файлами патернів, зміненими в історіях (задачі оновлення патернів у кожній фазі): кожен файл є в індексі, опис відповідає новому змісту; нічого не лишилось неоновленим
- [ ] T053 Пройти весь [quickstart.md](quickstart.md) в iOS Simulator і на Android-емуляторі, включно з офлайн-архівуванням (режим польоту) і `ui-check` `smoke.flow`, `navbar.flow`, `start-tab.flow`.
- [ ] T054 У `specs/010-ui-polish-archive/spec.md` поставити **Status**: Implemented і коротко українською підсумувати, що змінилося і що не перевірено.
- [ ] T055 Запустити `npx expo lint` і `npx tsc --noEmit`, виправити всі помилки (Constitution VI).

---

## Dependencies & Execution Order

- **Setup (T001)** потрібна для US4 (T035–T038) і US6 (T050). Решта історій від неї не залежить.
- **US1 (Phase 3)**: T003 → T004/T005 → T006 → T007–T011 → T012. T002 (канвас) — перед версткою T008–T009.
- **US2 (Phase 4)**: T015 → T016 → T017 → T018; T019, T020, T021 після T015; T022, далі T023.
- **US3 (Phase 5)**: T025 → T026 → T028 → T029; T027 паралельно з T026.
- **US4 (Phase 6)**: T032 → T033, T034; T035 → T036 → T037 → T038.
- **US5 (Phase 7)**: усі задачі в різних файлах, крім T041 (той самий файл, що T009 з US1 — виконувати після T009).
- **US6 (Phase 8)**: T050 після T001.
- **Патерни**: задачі T013, T023, T030, T039, T048 — останні у своїх фазах і йдуть у коміт разом із кодом історії.
- **Polish (Phase 9)** — після всіх історій; lint і typecheck — остання задача.

Історії між собою незалежні, крім спільного файлу `src/app/(tabs)/(objects)/[objectId]/index.tsx` (T009, T041) і `src/app/(tabs)/(objects)/[objectId]/[month]/index.tsx` (T010, T020): у цих парах виконувати по черзі.

## Parallel Examples

- **US1**: T005 (локальний репозиторій) паралельно з T004; T011 (захист п'яти екранів) паралельно з T009/T010 після T006.
- **US2**: T015, потім T020 і T021 паралельно з T016–T018.
- **US3**: T027 (рядок-меню) паралельно з T025–T026.
- **US5**: T042–T046 одночасно (різні файли); T041 — після T009 (той самий файл).
- **Між історіями**: US5 і US6 можна робити паралельно з US1–US4, з урахуванням спільних файлів вище.

## Implementation Strategy

1. **MVP** — Phase 1 + US1 (архів): єдина нова функція з даними, кнопка «Архів» перестає бути заглушкою.
2. Далі US2 (лічильники) — впливає на правильність даних.
3. US5 + US6 — швидкі JS-правки, видимі одразу, можна вставити будь-коли.
4. US3 (стартова черга).
5. US4 (тема) — наостанок, бо потребує нової development build. До збірки перехід працює з запасним накриттям.
6. Кожну історію комітити окремо одразу після реалізації разом із задачею оновлення патернів своєї фази (Constitution, «Процес»). Остання задача — lint і typecheck.
