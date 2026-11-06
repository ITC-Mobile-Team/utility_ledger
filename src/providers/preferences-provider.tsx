import { PENDING_WIPE_KEY } from '@/services/account';
import {
  DEFAULT_START_TAB,
  DEFAULT_THEME,
  parseStartTab,
  parseThemePreference,
  START_TAB_KEY,
  type StartTab,
  THEME_KEY,
  type ThemePreference,
  toColorScheme,
} from '@/services/preferences';
import { storage as defaultStorage, type KeyValueStorage } from '@/storage';
import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance } from 'react-native';

type Preferences = { theme: ThemePreference; startTab: StartTab };

type PreferencesContextValue = Preferences & {
  // Тема застосовується одразу, потім пишеться в сховище
  setTheme: (next: ThemePreference) => Promise<void>;
  // Лише стан і сховище: поточна вкладка не змінюється, а вибір діє з
  // наступного холодного запуску
  setStartTab: (next: StartTab) => Promise<void>;
  // Після wipeLocalData() сховище вже стерте, тож лише повертаємо типові
  resetPreferences: () => void;
};

const defaults: Preferences = {
  theme: DEFAULT_THEME,
  startTab: DEFAULT_START_TAB,
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Splash тримається, поки налаштування не прочитані: без цього між splash і
// першим кадром застосунку видно порожнє вікно в системній (світлій) темі,
// навіть якщо вибрана темна
SplashScreen.preventAutoHideAsync().catch(() => {});

type Props = PropsWithChildren<{ storage?: KeyValueStorage }>;

// Налаштування пристрою. Читаються до першого рендеру, поки видно splash, щоб
// застосунок не мигнув іншою темою чи вкладкою (docs/patterns/preferences.md)
export function PreferencesProvider({
  storage = defaultStorage,
  children,
}: Props) {
  // null означає, що значення ще читаються зі сховища
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      storage.getItem(THEME_KEY),
      storage.getItem(START_TAB_KEY),
      storage.getItem(PENDING_WIPE_KEY),
    ])
      .then(([theme, startTab, pendingWipe]): Preferences => {
        // Перерване стирання доведе до кінця finishPendingWipe, а до того
        // темна тема чи інша вкладка не мають пережити вихід
        if (pendingWipe === 'true') return defaults;
        return {
          theme: parseThemePreference(theme),
          startTab: parseStartTab(startTab),
        };
      })
      .catch(() => defaults)
      .then((next) => {
        Appearance.setColorScheme(toColorScheme(next.theme));
        if (active) setPreferences(next);
      });
    return () => {
      active = false;
    };
  }, [storage]);

  // Ефекти дітей (зокрема фон вікна в AppProviders) спрацьовують раніше за
  // батьківські, тож до цього моменту перший кадр уже має вибрану тему
  const isLoaded = preferences !== null;
  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [isLoaded]);

  const setTheme = useCallback(
    async (next: ThemePreference) => {
      Appearance.setColorScheme(toColorScheme(next));
      setPreferences((current) => current && { ...current, theme: next });
      // Збій запису не скасовує вибір: він діє до перезапуску
      await storage.setItem(THEME_KEY, next).catch(() => {});
    },
    [storage],
  );

  const setStartTab = useCallback(
    async (next: StartTab) => {
      setPreferences((current) => current && { ...current, startTab: next });
      await storage.setItem(START_TAB_KEY, next).catch(() => {});
    },
    [storage],
  );

  const resetPreferences = useCallback(() => {
    Appearance.setColorScheme(toColorScheme(defaults.theme));
    setPreferences(defaults);
  }, []);

  // Поки значення не прочитані, нічого не рендеримо
  if (!preferences) return null;

  return (
    <PreferencesContext
      value={{ ...preferences, setTheme, setStartTab, resetPreferences }}
    >
      {children}
    </PreferencesContext>
  );
}

export function usePreferences() {
  const value = use(PreferencesContext);
  if (!value)
    throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
