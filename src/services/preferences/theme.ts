import type { ThemePreference } from './types';

export const THEME_KEY = 'themePreference';

// Порядок карток на екрані «Тема»
export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'light',
  'dark',
];

export const DEFAULT_THEME: ThemePreference = 'system';

const labels: Record<ThemePreference, string> = {
  system: 'Як у системі',
  light: 'Світла',
  dark: 'Темна',
};

// Невідоме, пошкоджене чи відсутнє значення читається як «Як у системі»
export function parseThemePreference(value: string | null): ThemePreference {
  return THEME_PREFERENCES.find((theme) => theme === value) ?? DEFAULT_THEME;
}

// `Appearance.setColorScheme('auto')` прибирає перевизначення (`null` і
// застарілий `'unspecified'` для цього не годяться)
export function toColorScheme(
  preference: ThemePreference,
): 'light' | 'dark' | 'auto' {
  return preference === 'system' ? 'auto' : preference;
}

export function getThemeLabel(preference: ThemePreference) {
  return labels[preference];
}
