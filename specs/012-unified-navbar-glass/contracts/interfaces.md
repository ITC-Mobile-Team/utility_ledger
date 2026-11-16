# Interfaces: Єдиний навбар і кнопки з рідкого скла

Внутрішні контракти компонентів (публічних API немає).

## `useLiquidGlass(): boolean` — `src/hooks/use-liquid-glass.ts`

Повертає `true`, лише якщо одночасно:

- `Platform.OS === 'ios'`;
- `isGlassEffectAPIAvailable()`;
- `isLiquidGlassAvailable()`;
- `AccessibilityInfo.isReduceTransparencyEnabled()` повернув `false`.

Хук слухає подію `reduceTransparencyChanged` і оновлює значення без перезапуску. Поки асинхронна перевірка не завершилась, повертає `false`: спершу показується запасний вигляд, без мерехтіння скла.

## `NavigationBarIconButton` — `src/components/navigation-bar/navigation-bar-icon-button.tsx`

```ts
type NavigationBarIconButtonProps = {
  // Вміст: emoji-іконка або стрілка «Назад»
  content: { icon: AppIcon } | { kind: 'back' };
  // Тон за фоном навбару: 'colored' — градієнт (біла стрілка, clear-скло),
  // 'plain' — прозорий навбар (coral-стрілка, regular-скло)
  tone: 'colored' | 'plain';
  accessibilityLabel: string;
  testID?: string;
  onPress: () => void;
};
```

- Розмір 44×44, коло (`borderRadius: 22`). Іконка всередині: emoji — `iconTiles.touch`, стрілка — 22.
- Якщо `useLiquidGlass()` повертає `true` — `GlassView`:
  - `glassEffectStyle`: `tone === 'colored' ? 'clear' : 'regular'`;
  - `isInteractive`;
  - `colorScheme`: тема застосунку.
- Інакше — `View` з підкладкою:
  - `colored`: `rgba(255,255,255,0.18)` і обвідка `rgba(255,255,255,0.35)`;
  - `plain`: `surface2` і обвідка `line`.
- Натискання — через `Pressable` з `@/components` (замок 500 мс). На склі opacity не змінюється, у запасному вигляді `pressed` дає `opacity: 0.7`.
- Ні сама кнопка, ні її предки в навбарі не мають `opacity < 1`.

## `ThemedNavigationBar` / `NavigationView` — зміни пропів

Прибираються:
- `ThemedNavigationBarProps.scrollY`;
- `ThemedNavigationBarProps.collapseDistance`.

Лишаються:
- `onHeightChange(height)` — висота накладки з `onLayout`, з неї рахується верхній відступ контенту.
- `type: 'full' | 'short'`. Правило: `full` лише на коренях вкладок.
- `subtitle`, `headerContent`, `headerTrailing` — лише для `full`.
- `headerAccessory` — права кнопка рядка `short`. Очікується `NavigationBarIconButton`.
- `navigationBarButtons` — ряд великих кнопок під заголовком, на `full` і `short`, завжди видимий.

Висота накладки:
- `full`: `safeAreaTop + заголовок/підзаголовок/headerContent + (ряд кнопок або EMPTY_BOTTOM)`;
- `short`: `safeAreaTop + SHORT_TITLE_ROW_HEIGHT (44) + (ряд кнопок або EMPTY_BOTTOM)`.

Під час скролу висота не змінюється.

## testID

Без змін:
- `navigationBar.back` — скляна «Назад»;
- `outages.settings`;
- `month.change` — тепер кругла скляна кнопка 📅 замість чипа;
- `navigationBar.buttons`.
