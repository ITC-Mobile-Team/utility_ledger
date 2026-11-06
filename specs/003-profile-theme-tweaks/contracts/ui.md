# Contract: UI

## Профіль — `src/app/(tabs)/profile/index.tsx` (артборди 16, 16a, 16f)

Порядок блоків згори донизу:

1. `ProfileCard` — без `onPress` і стрілки; `accessible`, мітка «<імʼя>, <email>», без ролі кнопки. testID `profile.card`.
2. «Акаунт»: рядок «Імʼя» — лише заголовок «Імʼя» і значення праворуч, `onPress` → `/profile/edit-name` (testID `profile.name`); «Спосіб входу» без змін.
3. «Сповіщення»: перемикач «Вимкнення світла» (testID `profile.notify`, поведінка без змін). Якщо `getOutageSetupStatus(...) !== 'ready'` — під рядком у тій самій картці `OutageSetupNotice`: іконка-попередження, текст статусу (testID `profile.outageStatus`), кнопка «Налаштувати» (testID `profile.outageSetup`) → `router.navigate('/outage-settings')`.
4. «Застосунок» (новий, overline-заголовок з роллю header), одна картка з двома рядками:
   - `StartTabRow` — «Стартова вкладка», значення праворуч `getStartTabLabel(startTab)`, іконка-шеврон вгору-вниз; дотик відкриває нативне меню (R9) з варіантами `START_TABS` (іконка й підпис табу, галочка біля поточного); вибір → `setStartTab`. testID `profile.startTab`; пункти меню — `profile.startTab.<objects|outages|analytics>`, якщо `@expo/ui` пробрасує testID, інакше ui-check шукає за текстом.
   - «Тема» — значення праворуч `getThemeLabel(theme)`, шеврон, `onPress` → `/profile/theme`. testID `profile.theme`.
5. «Документи» без змін.
6. Картка «Вийти» з відступом зверху вдвічі більшим, ніж між розділами (R8); «Видалити акаунт» і версія без змін.

## Екран «Тема» — `src/app/(tabs)/profile/theme.tsx` (артборди 16d, 16e)

- Зареєстрований у `profile/_layout.tsx`; `NavigationView` з «Назад», заголовок «Тема», підзаголовок «Оформлення застосунку», `barType='purple'`; таб-бару немає. testID `theme.screen`.
- Три `ThemeOptionCard` у порядку `THEME_PREFERENCES` («Як у системі», «Світла», «Темна»). Кожна — велика картка: `ThemePreview` (мініатюра екрана: навбар-градієнт, дві картки-рядки, таб-бар у палітрі цієї теми; для `system` — розділена по діагоналі світла/темна), назва, позначка вибраного (галочка в колі + акцентна рамка).
- Дотик: `setTheme(value)`; користувач лишається на екрані. `Pressable` з `guarded={false}`, `accessibilityRole='radio'`, `accessibilityState={{ selected }}`, мітка — назва варіанта. testID `theme.option.system|light|dark`.
- Анімації: рамка й фон позначки перетікають за 200 мс, натиснута картка стискається до 0.97 (CSS-переходи Reanimated, як у `MonthPickerSheet`).

## Таб-бар — `src/app/(tabs)/_layout.tsx`

- `NativeTabs` отримує `initialRouteName` зі збереженої стартової вкладки (див. [preferences.md](preferences.md)).

## ui-check

- `profile.flow`: тап по `profile.card` не змінює екран; рядок «Імʼя» без підпису; є `profile.startTab` з «Обʼєкти» і `profile.theme` з «Як у системі»; на чистому стані видно `profile.outageStatus` і `profile.outageSetup`.
- `theme.flow`: відкрити `/profile/theme`, вибрати `theme.option.dark` → скриншот темний, назад → `profile.theme` показує «Темна»; повернути `theme.option.system`.
- `start-tab.flow`: відкрити `profile.startTab`, вибрати «Світло» → рядок показує «Світло», активний таб лишився «Профіль»; холодний перезапуск → відкрита вкладка «Світло»; повернути «Обʼєкти».
