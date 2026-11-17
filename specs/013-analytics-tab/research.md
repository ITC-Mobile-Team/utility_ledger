# Research: Вкладка «Аналітика»

Нових залежностей і нативних модулів фіча не потребує: усе малюється наявними компонентами (`NavigationView`, `BottomSheet`, `Segment`, `ListCard`/`ListRow`, `AppImage`/`EmojiGlyph`, `SkeletonBone`) і звичайними `View`. Нових API Expo немає; стек усередині вкладки `NativeTabs` уже використовує «Профіль» (`(tabs)/profile/_layout.tsx`), тож підхід уже працює на SDK 58; перед кодом його звіряють з документацією v58 (expo-router: Stack, native tabs, typed routes, `useLocalSearchParams`) у T001, висновок дописується в R1.

## R1. Маршрути: вкладка стає стеком

- **Decision**: `src/app/(tabs)/analytics.tsx` → тека `src/app/(tabs)/analytics/` з `_layout.tsx` (`Stack`, `headerShown: false`), `index.tsx` (головний екран) і `details.tsx` («Витрати — деталі»). У `(tabs)/_layout.tsx`: `segments[1] === 'analytics'` додається до умови `isTabBarHidden` (деталі без таб-бару, патерн `tab-bar.md`) і тригеру `analytics` ставиться `disableAutomaticContentInsets={ownsInsets}`, як іншим вкладкам з `NavigationView`.
- **Rationale**: так само влаштовано «Профіль»; назва тригера `analytics` не змінюється.
- **Alternatives**: деталі як модальний екран кореневого стеку — інша поведінка «Назад» і таб-бару, ніж у решти вкладених екранів.

## R2. Стан вибору (період і адреса)

- **Decision**: `AnalyticsSelectionProvider` у `src/providers/analytics-selection-provider.tsx`, монтується в `analytics/_layout.tsx`. Тримає `period` і `selection` у `useState`; при першому рендері — 1 січня поточного року → сьогодні і перша адреса. Не пише в сховище.
- **Rationale**: FR-011 — вибір живе, поки застосунок запущено, і спільний для головного екрана й деталей. `NativeTabs` не розмонтовує вкладки при перемиканні, тож стан у layout переживає перемикання вкладок, а холодний запуск його скидає. Вихід з акаунта розмонтовує `(tabs)` — вибір теж скидається, що правильно.
- **Alternatives**: параметри маршруту (деталі отримують період у URL) — дублювання й ризик розбіжності; `KeyValueStorage` — суперечить уточненню «не памʼятати».

## R3. Які місяці входять у розрахунок

- **Decision**: місяць адреси враховується, якщо (а) його додано до обʼєкта (`state.months`, як `getObjectMonths`) і (б) він перетинається з періодом: `toMonthKey(start) ≤ month ≤ toMonthKey(end)`. Суми — `calculateMonth(state, objectId, month)`; пораховані лише позиції з `amount !== null`.
- **Rationale**: FR-002 — те саме, що підсумок екрана місяця. Без умови (а) послуги «фіксована сума» давали б нарахування за кожен місяць періоду, навіть якого користувач не додавав.
- **Alternatives**: рахувати всі календарні місяці — завищені суми для фіксованих послуг.

## R4. Обчислення — чисті функції в `src/services/analytics/`

- **Decision**: модуль `src/services/analytics/` (`types.ts`, `period.ts`, `summary.ts`, `format.ts`, `index.ts`) із чистими функціями від `LedgerState`, `AnalyticsSelection`, `AnalyticsPeriod` (контракт — [contracts/interfaces.md](contracts/interfaces.md)). Екрани викликають один `summarizeAnalytics` і лише малюють результат.
- **Rationale**: принцип II (не-маршрутний код поза `src/app/`); логіку легко перевірити окремо; той самий результат для головного екрана, деталей і шторки адрес.
- **Обсяг**: 3 адреси × 36 місяців × ~5 послуг ≈ 540 `calculateService` — миттєво (SC-003). React Compiler мемоізує обчислення в компонентах; `useMemo` вручну не потрібен.

## R5. Обʼєднання послуг для «Усіх адрес»

- **Decision**: ключ групи — `name.trim().toLocaleLowerCase('uk') + '|' + icon`. У групі: сума, кількість записів (місяців з нарахуванням по всіх адресах), кількість адрес, спожито — лише для послуг `meter`, підсумовується, якщо одиниця однакова в усій групі (інакше не показується). Для однієї адреси ключ — `service.id`.
- **Спожито**: `consumption + (night?.consumption ?? 0)` з `ServiceBill`, у форматі `formatReading` з `getMeterFormat`.
- **Підпис рядка**: одна адреса — «8 записів»; «Усі адреси» — «2 адреси · 16 записів»; на деталях — «1 520 кВт·год · 8 записів».

## R6. Відсотки — метод найбільших залишків

- **Decision**: `toPercents(values)` — цілі частки з floor і роздачею залишку за найбільшою дробовою частиною, сума рівно 100 (як у прототипі канвасу); для нульової суми — усі 0.
- **Rationale**: FR-008.

## R7. Кнопки періоду в навбарі

- **Decision**: дві кнопки «Від» / «До» — `headerContent` у `NavigationView` (згортаються разом із великим заголовком). Новий компонент `AnalyticsPeriodButton` (`src/views/analytics/`): сітка 2 колонки з проміжком 10, висота 52, радіус 16, напівпрозорий білий фон `rgba(255,255,255,.16)`, активна (відкрита шторка цієї дати) — `.32` з білою обвідкою 1,5; підпис «Від»/«До» 12 pt `heroSubGreen`, дата 15 pt semibold білим, 📅 праворуч через `AppImage`.
- **Rationale**: артборд 14; великі кнопки `navigationBarButtons` — інший вигляд (біла картка), патерн `navigation-bar-buttons.md` їх не охоплює.
- **Alternatives**: `navigationBarButtons` — не має підпису з двох рядків і білої картки в дизайні немає.

## R8. Календар дат — власний `DateRangeSheet`

- **Decision**: `src/views/analytics/date-range-sheet.tsx` на `BottomSheet`: рядок «Скасувати» / назва / «Готово», місяць-рік з кнопками ‹ ›, тиждень з ПН, сітка 7 колонок кнопками 42×42 (`Pressable`, `guarded={false}` — локальний стан), рядок «Період». Чернетка дати локальна; «Готово» викликає `onSave`, «Скасувати»/тап поза шторкою — `onClose`. Обмеження: для «Від» неактивні дні після кінцевої дати; для «До» — до початкової і після сьогодні. Перший день тижня — понеділок (`(getDay() + 6) % 7`).
- **Rationale**: уточнення — дні, як у макеті 14b/14c. Нативні пікери (`@react-native-community/datetimepicker`) не мають виділення діапазону й вигляду дизайн-системи і потребують нативного модуля.
- **Патерн**: новий розділ «Вибір дати й періоду» у `docs/patterns/pickers.md` і рядок індексу.

## R9. Графік і смуга розподілу — звичайні `View`

- **Decision**: стовпчики — `View` з висотою `round(value / max × 46)` (мінімум 2 pt для ненульових), радіус 6, останній місяць — `greenBrand`, решта — `greenSoft2`; підписи «Січ»… 10 pt `muted`. Понад 12 місяців — останні 12 і підпис «Останні 12 місяців». Смуга розподілу на деталях — ряд `View` з `flex` = частка, проміжок 3, висота 12, радіус 6. Графік — один елемент доступності з `accessibilityLabel` «Витрати по місяцях, січень – серпень: найбільше в січні».
- **Rationale**: `react-native-svg` немає в проєкті; прямокутників вистачає.

## R10. Кольори послуг у смузі

- **Decision**: колір = насичений відповідник розділу іконки: `amberSoft → amber`, `waterSoft → water`, `gasSoft → gas`, `greenSoft → green`, `blueSoft → blue`, невідома іконка — `purple`. Якщо колір уже зайнятий іншою послугою — наступний вільний з ряду `amber, water, gas, green, blue, purple, coral`. Функція `getServiceAccent(icon)` поруч із `getServiceIconBackground` у `src/constants/service-icons.ts`.

## R11. Плитка ↗️ (FR-016)

- **Decision**: підкладка `blueSoft` (той самий тон, що `defaultIconTone`), гліф `arrowUpRight` через `AppImage` у колі `iconTiles.touch` (48 у макеті → 44 зі шкали, гліф 22) — центрування дає `EmojiGlyph` за патерном `icons.md`. Тон звіряється на пристрої у світлій і темній темі (у темній `blueSoft` — `rgba(77,140,235,.18)`); запасний варіант — `blueSoft2`. На артборді «14 · Аналітика» `var(--coral-soft)` → `var(--blue-soft)` і гліф по центру (flex-центрування й корекція як у `.ic`).
- **Rationale**: синьо-сірий гліф ↗️ на рожевому — дисонанс (зауваження користувача); синя мʼяка гама вже використовується для нейтральних іконок.

## R12. Порожній стан, завантаження, офлайн

- **Decision**: вміст головного екрана — у `AccountDataGate` з новим `AnalyticsSkeleton` (`src/views/account-data/analytics-skeleton.tsx`: рядок адреси, картка, сегмент, 3 рядки на `SkeletonBone`). Немає адрес в аналітиці — `EmptyStateView` (пульсація за `empty-state-pulse.md`) з новою іконкою `chart` (📊, додати в `src/constants/app-icons.tsx` і тон `greenSoft` в `iconTones`) / текстами «Тут будуть витрати» / «Додайте адресу й внесіть показники — і тут зʼявиться, скільки ви платите щомісяця», кнопки періоду неактивні. Порожній період — «0,00 ₴» і в списках «За цей період ще немає записів».
- **Канвас**: артборди «14e · Аналітика — порожній» і «14s · Аналітика — завантаження» додаються (у дизайні їх немає).
- **Патерн**: у `user-data.md` прибрати «Аналітика поки заглушка без даних — без скелетона».

## R13. Формати

- Дата на кнопці: «1 бер 2026» — нові `monthShort` (`'січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'`) у `src/services/analytics/format.ts`; підпис стовпчика — «Січ».
- Період місяцями на деталях: «Січень – серпень 2026»; роки різні — «Листопад 2025 – березень 2026»; один місяць — «Серпень 2026».
- Гроші — наявний `formatMoney` (копійки → «12 803,00 ₴»). Множини — `pluralize` (`address` уже є; додати `record`: запис/записи/записів і `serviceKind`: вид послуг/види послуг/видів послуг).

## R14. testID

Схема `екран.компонент.елемент` (`test-ids.md`): `analytics.screen`, `analytics.period.start|end`, `analytics.address`, `analytics.total`, `analytics.tabs.services|months`, `analytics.service.<i>`, `analytics.month.<i>`, `analytics.sheet.date.day.<d>`, `analytics.sheet.date.done|cancel|prev|next`, `analytics.sheet.address.<i>`, `analytics.details.screen`, `analytics.details.tabs.*`. Новий флоу `.claude/skills/ui-check/flows/analytics.flow`.
