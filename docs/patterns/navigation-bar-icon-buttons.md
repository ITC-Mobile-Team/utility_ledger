# Скляні кнопки рядка навбару

Круглі кнопки в навбарі — «Назад», ⚙️ «Налаштування графіка» на «Світлі», 📅 «Змінити місяць» на екрані місяця — це один компонент `NavigationBarIconButton` з `@/components`.

- Пропи: `content` — `{ icon: AppIcon }` (emoji через `AppImage`) або `{ kind: 'back' }` (стрілка `arrow-back.svg`); `tone` — `'colored'` на градієнтному навбарі, `'plain'` на прозорому. «Назад» `NavigationBarHeader` малює сам, тон бере з `barType`.
- Коло 44×44. Коло «Назад» починається на `HORIZONTAL_PADDING` (20 pt) — на одній лінії із заголовком і контентом; короткий заголовок — на 8 pt після кнопки.
- На iOS 26+ — системне рідке скло: `GlassView` з `expo-glass-effect`, `glassEffectStyle` `clear` на кольоровому навбарі (просвічує градієнт, біла стрілка контрастна) і `regular` на прозорому, `isInteractive`, `colorScheme` — тема застосунку (`useColorScheme`), а не системна.
- Скло вмикає хук `useLiquidGlass()` (`src/hooks/use-liquid-glass.ts`): iOS, `isGlassEffectAPIAvailable()`, `isLiquidGlassAvailable()` і вимкнене «Зменшити прозорість» (`AccessibilityInfo`, слухає `reduceTransparencyChanged`). `isLiquidGlassAvailable()` за увімкненого налаштування може повернути `true`, тому воно перевіряється окремо. До завершення перевірки — запасний вигляд.
- Запасний вигляд (Android, iOS < 26, «Зменшити прозорість»): `colored` — `rgba(255,255,255,0.18)` з обвідкою `rgba(255,255,255,0.35)`, `plain` — `surface2` з обвідкою `line`; натискання — `opacity: 0.7`.
- На склі й будь-якому його предку не ставимо `opacity < 1`: за малої прозорості скло не малюється. Тому відгук на склі дає `isInteractive`, а не pressed-opacity. Виняток — згортання великого блоку: ⚙️ у `headerTrailing` зникає разом із заголовком, і скло зникає з ним.
- Натискання — через `Pressable` з `@/components` (замок 500 мс, `buttons.md`); `testID` передається пропом (`navigationBar.back`, `outages.settings`, `month.change`).
- Де стоять: «Назад» — у рядку навбару вкладених екранів; кнопка праворуч від великого заголовка — `headerTrailing`; кнопка праворуч у рядку з «Назад» — `headerAccessory`. Чипів-пігулок у рядку навбару немає.
- Нової development build не потрібно: модуль `expo-glass-effect` уже в нативному проєкті й в Expo Go.
