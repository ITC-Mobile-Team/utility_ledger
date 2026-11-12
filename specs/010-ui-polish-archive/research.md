# Research: 010-ui-polish-archive

Рішення Phase 0. Тут описано, як працює теперішній код (перевірено в репозиторії 2026-11-12) і що міняємо.

## R1. Як зберігати архів і «Враховувати в аналітиці»

- **Decision**: у `LedgerObject` додаються три необовʼязкові поля:
  - `archived?: boolean` (немає поля = не в архіві);
  - `archivedAt?: number` — коли обʼєкт заархівували, для сортування на екрані «Архів»;
  - `includeInAnalytics?: boolean` (немає поля = враховувати).

  Зміни йдуть новим методом репозиторію `setObjectArchive(id, patch)`, а не через `updateObject`. Повернення з архіву записує явні `archived: false` і `includeInAnalytics: true` і не видаляє поля.
- **Rationale**: `updateObject(id, ObjectInput)` у `firestore-ledger-repository.ts` розгортає `{ ...existing, ...input }` і пише весь документ через `set`. Форма редагування не знає про архівні поля, тож вони переживуть редагування. Явні `false`/`true` замість видалення полів обходять `undefined`, який Firestore не приймає в `set` без `ignoreUndefinedProperties`. Правила `firestore.rules` дозволяють власнику писати будь-які поля в `users/{uid}/**`, тож правила міняти не треба. Запис без очікування сервера (`applyWrites`) дає офлайн-поведінку, як у решти мутацій (`docs/patterns/user-data.md`).
- **Alternatives considered**: (a) окрема колекція `archive/{objectId}` — відкинуто, бо подвоює підписки і ламає `deleteObject`. (b) Поле `archivedAt: number | null` без булевого — відкинуто: `null` у Firestore зберігається, але ускладнює типи `LedgerObject` і локальний репозиторій. (c) Розширити `ObjectInput` — відкинуто, бо форма почне перезаписувати архівний стан.

## R2. Список «Обʼєкти», екран «Архів» і режим лише для перегляду

- **Decision**:
  - Селектори в `src/services/ledger/` (поруч із `getObjectServices`): `getActiveObjects(state)`, `getArchivedObjects(state)` (за `archivedAt` спадно), `getAnalyticsObjects(state)` (активні разом з архівованими, у яких `includeInAnalytics !== false`).
  - `(tabs)/(objects)/index.tsx` показує лише активні, а лічильник адрес у підзаголовку рахує активні. Кнопка «Архів» лишається в навбарі й тоді, коли активних немає, але є архівовані. Її дія замість `Alert` відкриває новий екран `(tabs)/(objects)/archive.tsx`.
  - `archive.tsx` має `NavigationView` з `type='short'`, `barType='blue'`, `title='Архів'`. Під кожною `ObjectCard` без статусу місяця — рядок із `Switch` «Враховувати в аналітиці», як перемикач у профілі. Порожній стан — `EmptyStateView`.
  - `[objectId]/index.tsx` для активного обʼєкта додає в навбар кнопку `archive` («Архівувати», `icon: 'archive'`) перед «Видалити», з підтвердженням `Alert`. Після підтвердження — `router.back()` і `setObjectArchive`.
  - Для архівованого обʼєкта навбар має одну кнопку `restore` («Повернути з архіву»). Рядки місяців лишаються натискними для перегляду, свайп видалення місяця вимкнено.
  - `[objectId]/[month]/index.tsx` для архівованого обʼєкта ховає кнопки навбару, вимикає переходи на `reading`, `amount` і `services` та свайп «Скинути». Розрахунок (`bill`) лишається доступним для перегляду.
- **Rationale**: «Архів» у навбарі списку вже є (`objects.nav.archive`). Режим лише для перегляду — це FR-004a. Глибокі екрани редагування (`reading`, `amount`, `service-form`, `object-form`) додатково перевіряють `object.archived` і роблять `router.back()`, щоб до редагування не дійти через deep link чи історію.
- **Alternatives considered**: архів як розділ у профілі — відкинуто, бо кнопка вже живе в «Обʼєктах».

## R3. «Враховувати в аналітиці», коли «Аналітики» ще немає

- **Decision**: вкладка `(tabs)/analytics.tsx` зараз заглушка («Analytics screen»), і підсумків там немає. Фіча додає поле, перемикач і селектор `getAnalyticsObjects`. Майбутня «Аналітика» MUST брати обʼєкти лише через цей селектор: це записується в `docs/patterns/user-data.md`.
- **Rationale**: FR-006a виконується на рівні даних. Перевіряти фільтрацію в UI зараз нема на чому.
- **Alternatives considered**: будувати «Аналітику» в цій фічі — це поза обсягом специфікації.

## R4. Барабан лічильника 5/2, 6/3, 8/3 і як зберігати значення

**Теперішній стан.** `reading.tsx` має `METER_LENGTH = 5`, а `toZone` бере `Number(value)` усього рядка цифр. Червона клітинка (`isLast` у `meter-digit.tsx`) лише фарбується, і в розрахунку всі 5 цифр рахуються як цілі одиниці. `billing.ts` рахує `consumption = reading.value - previous`, `formatNumber` округлює до цілих.

- **Decision**:
  - `getMeterFormat(service): { length; fractionDigits }` у `src/services/ledger/meter-format.ts`: `single`/`dayNight` → 5/2, `water` → 6/3, `gas` → 8/3.
  - `MeterReading.value` і `night` надалі зберігаються **в одиницях з дробовою частиною** (наприклад `123.45` кВт·год), округлені до `fractionDigits`. Рядок цифр барабана перетворюється так: `int(digits) / 10^fractionDigits`.
  - Збережене значення в цифри: `round(value · 10^f)`, доповнене нулями зліва до `length`.
  - `MeterReadingInput` отримує `fractionDigits` і фарбує останні `fractionDigits` клітинок замість `isLast`. Остання клітинка зберігає своє підсвічування «що прибере стерти».
  - Підказки беруть `length` з формату.
  - `formatReading(value, fractionDigits)` показує значення з комою і потрібною кількістю знаків. Його використовують плитки «Попередній» і «Спожито» та історія.
  - Суми в `billing.ts` округлюються до копійок (`Math.round`) на рівні кожної позиції. Тарифи в копійках × дробове споживання дають дробові копійки.
  - `service-form.tsx`: «Початковий показник» приймає кому чи крапку з тим самим числом знаків.
- **Rationale**: «червоні = дробова частина» (FR-009) означає, що значення в одиницях — єдиний спосіб рахувати споживання й гроші правильно. Старі записи — цілі числа, які вже рахувалися як цілі одиниці, тож їхні суми не змінюються, і міграція даних не потрібна.
- **Ризик (виніс користувачу)**: у світла лише 3 цілі клітинки (5 − 2), тобто максимум 999,99 кВт·год. Реальні електролічильники мають 5–6 цілих цифр, а наявні показники понад 999 у 5-клітинковий барабан не вмістяться. Редагування такого показника покаже лише останні цифри, і нове значення буде «Менше попереднього». Це треба підтвердити до реалізації: залишити 5/2, як у специфікації, чи, наприклад, 7/2.
- **Alternatives considered**: зберігати «сирі» цифри барабана й ділити лише при показі — відкинуто, бо змінює суми вже збережених місяців (старі 5-цифрові значення раптом стануть у 100 разів меншими).

## R5. Стартова черга «Світла»

- **Decision**: `OutageSettings.startQueue?: QueueId` зберігається в акаунті разом із `city` і `queues` (`firestore-settings-repository.ts`, тип `AccountOutageSettings`, читання й запис).
  - `outage-settings.tsx`: під «Мої черги», коли обрано ≥ 2 черги, з'являється рядок «Стартова черга» з нативним меню. Платформні файли — як `start-tab-row.ios.tsx` / `.android.tsx`: `@expo/ui` SwiftUI `Menu` + `Picker` inline на iOS, відповідник на Android.
  - Значення входить у стан форми й зберігається кнопкою «Зберегти». Якщо стартову чергу прибрали з обраних, під час збереження її скидають на `undefined`.
  - `(outages)/index.tsx` → `ScheduleScreen`: початкове значення `useState` — `startQueue`, якщо він є серед `queues`, інакше `queues[0]`. Ручне перемикання лишається локальним станом.
- **Rationale**: екран вкладки живе, поки застосунок відкритий, тож `useState` з початковим значенням дає поведінку «лише при холодному запуску» без окремого прапорця. Меню від рядка — уже узгоджений патерн (`docs/patterns/pickers.md`, «короткий вибір»).
- **Alternatives considered**: зберігати на пристрої, як стартову вкладку — відкинуто, бо черги вже синхронізуються з акаунтом і стартова черга без них не має сенсу.

## R6. Плавна зміна теми

**Теперішній стан.** `ThemeTransition` (`src/components/theme-transition.tsx`) на 250 мс накриває екран суцільним фоном попередньої схеми. Під накриттям уміст (картки, навбар, таб-бар) уже в новій темі й проступає крізь однотонний шар, без справжнього перетікання кольорів. Тому користувач бачить «різку» зміну. Тема змінюється через `Appearance.setColorScheme` у `preferences-provider.tsx`.

- **Decision**: перехід через знімок екрана.
  1. Кореневий `View` (`collapsable={false}`) у `src/app/_layout.tsx` обгортає навігатор.
  2. `setTheme` спершу робить `captureRef(rootRef, { format: 'jpg', quality: 0.9, result: 'tmpfile' })` з `react-native-view-shot`.
  3. Знімок показується поверх усього (`expo-image`, `StyleSheet.absoluteFill`, `pointerEvents='none'`).
  4. Далі викликається `Appearance.setColorScheme`, і знімок розчиняється за 350 мс (`ease-out`, CSS-анімація Reanimated, як зараз).
  5. Повторний вибір під час анімації перезапускає цикл від поточного кадру через `key`.
  6. Зміна системної теми в режимі «Як у системі» й помилка знімка використовують теперішнє накриття фоном як запасний варіант.
  7. «Зменшити рух» (`useReducedMotion`) — без анімації.
  8. Знімок видаляється після анімації.
- **Rationale**: знімок дає справжній crossfade усього, включно з нативним таб-баром, який є частиною дерева кореневого View. Анімувати кольори кожного компонента означало б переписати всі `Themed*`. За документацією v58, `captureRef` дає пакет `react-native-view-shot` (`npx expo install react-native-view-shot`), «Included in Expo Go». У поточній development build пакета немає (його немає в `node_modules` і `Podfile.lock`), тож **потрібна нова development build**.
- **Alternatives considered**: (a) довше накриття — відкинуто, бо проблема в однотонності, а не в тривалості; (b) анімація кожного кольору через shared values — відкинуто як надто велика зміна; (c) `captureScreen()` — відкинуто, бо її немає на сторінці Expo, а `captureRef` кореня достатньо.

## R7. Новий екран «Тема» з логотипом

- **Decision**: сцену зі splash (сонце дугою, тінь будинку в протифазі, знак `splash-icon.png`) винести з `src/views/splash/app-splash.tsx` у спільний компонент `src/views/brand/logo-scene.tsx` з пропсами `variant: 'day' | 'night' | 'split'`, `animated: boolean` і розміром. `ThemeOptionCard` замість `ThemePreview` показує `LogoScene`. Вибрана картка — `animated` і рамка `blue` 2 pt. Невибрана — статична (`p = 0.5`) з `opacity` 0.6. Позначки «радіо» з `check` немає. «Ніч» — темний градієнт, місяць замість сонця й кілька зірок. «Навпіл» — половина кожної сцени (`overflow: hidden`). Перехід вибору — CSS transition рамки й `opacity`. «Зменшити рух» — без руху. `accessibilityRole='radio'` і `accessibilityState.checked` лишаються.
- **Rationale**: перевикористовує анімацію splash (`docs/patterns/splash.md`). Shared value через `get()`/`set()` — за `docs/patterns/reanimated.md`. `theme-preview.tsx` після заміни видаляється.
- **Alternatives considered**: Lottie чи нові растрові ассети — відкинуто, бо нова залежність і дублювання знака.

## R8. Позначки «заповнено» без фону

- **Decision**: у `[objectId]/index.tsx` (`trailing` рядка місяця) і `month-picker-sheet.tsx` (`addedMark`) прибрати `ThemedView backgroundColor='greenSoft'` і лишити `AppImage icon='check'`. У рядку місяця роль `badge` → більша роль зі шкали `docs/patterns/icons.md`, щоб галочка без кола не здавалась дрібною.

## R9. Колір кола під плюсом

**Теперішній стан.** `plusSoft`: світла тема `#FDECEA` (кораловий), темна `#F2A49C` (непрозорий рожевий). Його використовують `objects/index.tsx`, `[objectId]/index.tsx`, `services.tsx`, `empty-state-view.tsx`, `addresses-illustration.tsx`.

- **Decision**: перевести `plusSoft` у синю гаму навбару. Орієнтовно: світла тема `#D3E3F8` (= `blueSoft2`), темна — непрозорий світло-синій `#C9DBF7`. Емодзі ➕ темно-сірий, і на напівпрозорому темному фоні він губиться, тому фон у темній темі непрозорий і світлий. Точне значення фіксується в канвасі разом з артбордом списку. Зміна в токені `src/constants/colors.ts` оновлює всі місця одразу.

## R10. Усі послуги в картці обʼєкта

- **Decision**: `src/views/object-card.tsx`: прибрати `services.slice(0, 5)`, у `HStack` додати `flexWrap: 'wrap'` і `rowGap` 6.

## R11. Однакові шрифти навбару

**Теперішній стан.** `getTitleFont` у `navigation-bar-header.tsx`: `full` + прозорий навбар → `display` (32/42), `full` + кольоровий → `title` (28/36), `short` → `headline` (22). «Світло» (`barType='power'`) має `title` 28 і підзаголовок `navigationSubtitle` 14. Прозорий навбар — типовий `barType` у `ThemedNavigationBar`, тож екрани без `barType` мають заголовок 32.

- **Decision**: `full` завжди `title` (28), `short` — `headline` (22), підзаголовок — `navigationSubtitle`. Окремі `font` чи `fontSize` у заголовках екранів прибрати, якщо такі знайдуться під час проходу екранів.

## R12. Без індикаторів прокрутки

- **Decision**: явно `showsVerticalScrollIndicator={false}` / `showsHorizontalScrollIndicator={false}` у всіх прокручуваних контейнерах:
  - `navigation-view.tsx`, `screen-view.tsx`, `save-area-scoll-view.tsx`, `navigation-bar-buttons-row.tsx`;
  - `meter-reading-input.tsx`, `city-picker-sheet.tsx`, `outage-city-sheet.tsx`, `queue-chips.tsx`;
  - `icon-picker.tsx`, `outage-settings.tsx`.

  Правило «нових скролів з індикатором не додаємо» — у `docs/patterns/README.md` (або окремим пунктом у `navigation-bar-title.md`).

## R13. Таб-бар Android у кольорах дизайн-системи

- **Decision**: у `(tabs)/_layout.tsx` на `NativeTabs` задати (документовані Android-пропси expo-router native tabs):
  - `backgroundColor={surface}`;
  - `indicatorColor` — мʼякий тон активної вкладки (`blueSoft` / `powerOnSoft` / `greenSoft` / `purpleSoft` через `Trigger`-перевизначення);
  - `rippleColor` — `line`;
  - `labelVisibilityMode='labeled'`.

  Кольори беруться з `useThemeColor`, тож при зміні теми пропси оновлюються. Що Android підхоплює зміну пропсів на льоту, документація не гарантує, тож це перевіряється на пристрої. Зміна JS-only.

## R14. Профіль: «Змінити імʼя» і номер білда

- **Decision**:
  - Рядок `profile.name`: заголовок «Змінити імʼя», `trailing` з іменем прибрати (лишається шеврон від `ListRow`).
  - Версія: `Application.nativeApplicationVersion` і `Application.nativeBuildVersion` з `expo-application` (сторінка v58: build number на iOS, version code на Android, обидва `string | null`). Формат — «Utility Ledger · версія 1.0.0 (42)», без дужок, якщо білд `null`.
  - Пакет уже лінкований як транзитивна залежність `expo-notifications` (`ExpoApplication` є в `Podfile.lock`), тож `npx expo install expo-application` робить його прямою залежністю без нової development build.
- **Alternatives considered**: `Constants.expoConfig.ios.buildNumber` — відкинуто: в `app.json` його немає, і він не відповідав би номеру, який призначає EAS.

## R15. Development build

Нова development build потрібна лише через `react-native-view-shot` (R6). Усі інші пункти — JS-only і доставляються OTA. Решту фічі можна реалізувати й перевірити до збірки. Плавна тема з запасним накриттям працюватиме й у старій збірці, якщо імпорт `react-native-view-shot` загорнути в перевірку наявності нативного модуля.
