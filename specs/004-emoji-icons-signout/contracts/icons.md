# Contract: іконки

## `EmojiGlyph` (`src/components/emoji-glyph.tsx`)

```ts
type EmojiGlyphProps = {
  emoji: string;          // один emoji
  size: number;           // сторона квадрата гліфа, pt
  testID?: string;
};
```

- Рендерить квадрат `size × size`; emoji відцентрований по обох осях із розбіжністю ≤ 1 pt (iOS і Android, обидві теми).
- Розмір не змінюється від налаштування розміру шрифту системи.
- Не має пропа кольору.
- Доступність: `accessible={false}` (декоративний). Назву несе батьківський рядок/кнопка, як і зараз.

## `iconSizes` (`src/constants/icon-sizes.ts`)

```ts
export const iconSizes = {
  badge: 12, inline: 16, button: 20, feature: 28, hero: 40, heroLarge: 64,
} as const;
export type IconRole = keyof typeof iconSizes;
```

## Компоненти, що змінюють API

| Компонент | Було | Стає |
|---|---|---|
| `AppImage` | `icon`, `tintColor?`, `size: Size` | `icon`, `role: IconRole` |
| `IconView` | `icon`, `background?`, `iconColor?`, `iconSize`, `size` | `icon`, `background?`, `size: Size` (гліф завжди `button`, якщо коло ≤ 44; `feature` для більших) |
| `RowIcon` | `icon`, `background?`, `color?` | `icon`, `background?` |
| `NavigationBarButton` | `icon`, `iconBackground`, `iconColor?` | `icon`, `iconBackground` |
| `NavigationBarChip`, `NavigationBarIconButton` | `icon`, колір | `icon` |
| `InfoBanner`, `EmptyStateView`, `OutageMessage`, `SwipeableRow` action | `icon: AppIcon` + внутрішній `tintColor` | `icon: AppIcon`, колір не застосовується |
| `EmojiTile` | `Text` з `fontSize = size × 0.5` | `EmojiGlyph size={size × 0.5}` |

Інші місця, що зараз малюють emoji напряму (`month-picker-sheet.tsx`, `icon-picker.tsx` через `ThemedText font='emojiLarge'`), переходять на `EmojiTile` або `EmojiGlyph`. Токени `emoji`, `emojiLarge`, `emojiXL`, `emojiXXL` у `typography.ts`, які більше ніде не використовуються, видаляються. `emoji` лишається, якщо його й далі використовує ініціал аватара.

## Не змінюються

`NativeTabs.Trigger.Icon` (SF Symbols), логотипи Google/Apple (`action-button.tsx`, `provider-logo.tsx`), стрілка «Назад» (`navigation-bar-header.tsx`, `icon-picker.tsx`).
