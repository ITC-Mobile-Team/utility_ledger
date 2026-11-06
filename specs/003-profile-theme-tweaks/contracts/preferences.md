# Contract: налаштування пристрою (тема й стартова вкладка)

## `src/services/preferences`

```ts
export type ThemePreference = 'light' | 'dark' | 'system';
export type StartTab = 'objects' | 'outages' | 'analytics';

export const THEME_KEY = 'themePreference';
export const START_TAB_KEY = 'startTab';
export const THEME_PREFERENCES: readonly ThemePreference[]; // ['system', 'light', 'dark'] — порядок карток
export const START_TABS: readonly StartTab[];               // ['objects', 'outages', 'analytics'] — порядок у меню

export function parseThemePreference(value: string | null): ThemePreference; // невідоме → 'system'
export function parseStartTab(value: string | null): StartTab;               // невідоме → 'objects'
export function toColorScheme(p: ThemePreference): 'light' | 'dark' | 'auto';
export function toTabRouteName(t: StartTab): '(objects)' | '(outages)' | 'analytics';
export function getThemeLabel(p: ThemePreference): string;  // «Світла» | «Темна» | «Як у системі»
export function getStartTabLabel(t: StartTab): string;      // «Обʼєкти» | «Світло» | «Аналітика»
```

## `src/providers/preferences-provider.tsx`

```ts
type PreferencesContextValue = {
  theme: ThemePreference;
  startTab: StartTab;
  setTheme: (next: ThemePreference) => Promise<void>;   // застосовує одразу, потім пише в сховище
  setStartTab: (next: StartTab) => Promise<void>;       // лише стан і сховище, без навігації
  resetPreferences: () => void;                         // після wipeLocalData(): типові значення, без запису
};

export function PreferencesProvider(props: PropsWithChildren<{ storage?: KeyValueStorage }>): JSX.Element | null;
export function usePreferences(): PreferencesContextValue; // кидає помилку поза провайдером
```

Поведінка:

- До прочитання рендерить `null` (видно splash). Читає `THEME_KEY`, `START_TAB_KEY` і `PENDING_WIPE_KEY` одним `Promise.all`; при `pendingWipe = 'true'` бере типові значення.
- Кожна зміна `theme` викликає `Appearance.setColorScheme(toColorScheme(theme))` до наступного кадру.
- `setTheme` / `setStartTab` спершу оновлюють стан, потім пишуть у сховище; помилку запису ковтають — вибір діє до перезапуску.
- Не кешує системну схему: решта коду далі читає `useColorScheme()` / `useThemeColor()`.

## Кореневий лейаут

- Порядок: `GestureHandlerRootView` → `PreferencesProvider` → компонент із `useNavigationTheme()` (`ThemeProvider`, `SystemUI.setBackgroundColorAsync`) → решта провайдерів.
- Fade-оверлей: при зміні схеми поверх навігатора рендериться `Animated.View` (`StyleSheet.absoluteFill`, `pointerEvents='none'`) з `bg` попередньої схеми, непрозорість 1 → 0 за 250 мс.

## Стартова вкладка в таб-барі

- `(tabs)/_layout.tsx`: `<NativeTabs initialRouteName={toTabRouteName(startTab)} …>`; значення читається один раз при монтуванні (роутер ігнорує зміни пропа).
- Запасний шлях (R10): якщо холодний запуск усе одно відкриває «Обʼєкти», — одноразовий `router.replace` на корінь вибраного табу лише при `usePathname() === '/'`, під `SplashScreen.preventAutoHideAsync()` / `hideAsync()`.

## Стирання

- `createLocalDataWiper.eraseData` додає `storage.removeItem(THEME_KEY)` і `storage.removeItem(START_TAB_KEY)` у `Promise.allSettled`.
- Екран профілю після `wipeLocalData()` викликає `resetPreferences()` разом із `resetOnboarding()`.
