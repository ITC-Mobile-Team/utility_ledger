# Contract: тема застосунку

## `src/services/appearance`

```ts
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'themePreference';
export const THEME_PREFERENCES: readonly ThemePreference[]; // ['system', 'light', 'dark'] — порядок карток

export function parseThemePreference(value: string | null): ThemePreference; // невідоме → 'system'
export function toColorScheme(p: ThemePreference): 'light' | 'dark' | 'auto';
export function getThemeLabel(p: ThemePreference): string; // «Світла» | «Темна» | «Як у системі»
```

## `src/providers/appearance-provider.tsx`

```ts
type AppearanceContextValue = {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => Promise<void>; // застосовує одразу, потім пише в сховище
  resetAppearance: () => void;                             // після wipeLocalData(): стан → 'system', без запису
};

export function AppearanceProvider(props: PropsWithChildren<{ storage?: KeyValueStorage }>): JSX.Element | null;
export function useAppearance(): AppearanceContextValue; // кидає помилку поза провайдером
```

Поведінка:

- До прочитання вибору рендерить `null` (видно splash).
- Читає `THEME_KEY` і `PENDING_WIPE_KEY` разом; при `pendingWipe = 'true'` бере `'system'`.
- Кожна зміна `preference` викликає `Appearance.setColorScheme(toColorScheme(preference))` до наступного кадру.
- `setPreference` спершу оновлює стан (тема змінюється одразу), потім пише в сховище; помилку запису ковтає — вибір діє до перезапуску.
- Не кешує системну схему: решта коду далі читає `useColorScheme()` / `useThemeColor()`.

## Кореневий лейаут

- Порядок: `GestureHandlerRootView` → `AppearanceProvider` → компонент із `useNavigationTheme()` (`ThemeProvider`, `SystemUI.setBackgroundColorAsync`) → решта провайдерів.
- Fade-оверлей: при зміні схеми поверх навігатора рендериться `Animated.View` (`StyleSheet.absoluteFill`, `pointerEvents='none'`) з `bg` попередньої схеми, непрозорість 1 → 0 за 250 мс.

## Стирання

- `createLocalDataWiper.eraseData` додає `storage.removeItem(THEME_KEY)` у `Promise.allSettled`.
- Екран профілю після `wipeLocalData()` викликає `resetAppearance()` разом із `resetOnboarding()`.
