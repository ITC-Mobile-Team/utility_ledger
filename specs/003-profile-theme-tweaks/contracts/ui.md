# Contract: UI

## Профіль — `src/app/(tabs)/profile/index.tsx` (артборди 16, 16a, 16f)

Порядок блоків згори донизу:

1. `ProfileCard` — без `onPress` і стрілки; `accessible`, мітка «<імʼя>, <email>», без ролі кнопки. testID `profile.card`.
2. «Акаунт»: рядок «Імʼя» — лише заголовок «Імʼя» і значення праворуч, `onPress` → `/profile/edit-name` (testID `profile.name`); «Спосіб входу» без змін.
3. «Сповіщення»: перемикач «Вимкнення світла» (testID `profile.notify`, поведінка без змін). Якщо `getOutageSetupStatus(...) !== 'ready'` — під рядком у тій самій картці `OutageSetupNotice`: іконка-попередження, текст статусу (testID `profile.outageStatus`), кнопка «Налаштувати» (testID `profile.outageSetup`) → `router.navigate('/outage-settings')`.
4. «Оформлення» (новий, overline-заголовок з роллю header): рядок «Тема», значення праворуч — `getThemeLabel(preference)`, шеврон, `onPress` → `/profile/theme`. testID `profile.theme`.
5. «Документи» без змін.
6. Картка «Вийти» з відступом зверху вдвічі більшим, ніж між розділами (R8); «Видалити акаунт» і версія без змін.

## Екран «Тема» — `src/app/(tabs)/profile/theme.tsx` (артборди 16d, 16e)

- Зареєстрований у `profile/_layout.tsx`; `NavigationView` з «Назад», заголовок «Тема», підзаголовок «Оформлення застосунку», `barType='purple'`; таб-бару немає. testID `theme.screen`.
- Три `ThemeOptionCard` у порядку `THEME_PREFERENCES` («Як у системі», «Світла», «Темна»). Кожна — велика картка: `ThemePreview` (мініатюра екрана: навбар-градієнт, дві картки-рядки, таб-бар у палітрі цієї теми; для `system` — розділена по діагоналі світла/темна), назва, позначка вибраного (галочка в колі + акцентна рамка).
- Дотик: `setPreference(value)`; користувач лишається на екрані. `Pressable` з `guarded={false}`, `accessibilityRole='radio'`, `accessibilityState={{ selected }}`, мітка — назва варіанта. testID `theme.option.system|light|dark`.
- Анімації: рамка й фон позначки перетікають за 200 мс, натиснута картка стискається до 0.97 (CSS-переходи Reanimated, як у `MonthPickerSheet`).

## ui-check

- `profile.flow`: тап по `profile.card` не змінює екран; рядок «Імʼя» без підпису; є `profile.theme` з «Як у системі»; на чистому стані видно `profile.outageStatus` і `profile.outageSetup`.
- `theme.flow`: відкрити `/profile/theme`, вибрати `theme.option.dark` → скриншот темний, назад → `profile.theme` показує «Темна»; повернути `theme.option.system`.
