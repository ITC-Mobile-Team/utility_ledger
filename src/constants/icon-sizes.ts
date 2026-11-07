import type { AppIcon } from './app-icons';
import type { AppColor } from './colors';

// Розміри гліфів іконок без контейнера (у рядку тексту, окремо на екрані)
export const iconSizes = {
  badge: 12,
  inline: 16,
  hero: 40,
  heroLarge: 64,
} as const;

export type IconRole = keyof typeof iconSizes;

// Сторони кіл і плиток, у яких стоїть іконка. Еталон — пункт меню (`menu`,
// 42 pt): найбільше коло в рядках списків і меню
export const iconTiles = {
  compact: 28,
  menu: 42,
  touch: 44,
  large: 52,
  empty: 80,
  xlarge: 88,
} as const;

// Єдине правило: emoji займає половину сторони контейнера. Пункт меню — коло
// 42 pt з гліфом 21 pt
export const GLYPH_RATIO = 0.5;
export const glyphSizeFor = (container: number) =>
  Math.round(container * GLYPH_RATIO);

// Підкладка іконки на світлих поверхнях — коло з м'яким тоном. На кольоровому
// навбарі підкладка скляна (IconView без background)
export const iconTones: Partial<Record<AppIcon, AppColor>> = {
  person: 'purpleSoft',
  contrast: 'purpleSoft',
  bell: 'powerOnSoft',
  pin: 'powerOnSoft',
  danger: 'amberSoft',
  signOut: 'surface2',
  clock: 'surface2',
  gauge: 'surface2',
  trash: 'coralSoft',
};
export const defaultIconTone: AppColor = 'blueSoft';
export const getIconTone = (icon: AppIcon): AppColor =>
  iconTones[icon] ?? defaultIconTone;
