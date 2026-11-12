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
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance } from 'react-native';
import {
  captureBeforeThemeChange,
  finishThemeChange,
} from '@/components/theme-transition';

type Preferences = { theme: ThemePreference; startTab: StartTab };

type PreferencesContextValue = Preferences & {
  // Тема застосовується одразу, потім пишеться в сховище
  setTheme: (next: ThemePreference) => Promise<void>;
  // Лише стан і сховище: поточна вкладка не змінюється, а вибір діє з
  // наступного холодного запуску
  setStartTab: (next: StartTab) => Promise<void>;
};

const defaults: Preferences = {
  theme: DEFAULT_THEME,
  startTab: DEFAULT_START_TAB,
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Системний splash тримається, поки налаштування не прочитані й поки не
// зʼявиться перший кадр анімованого splash (AppSplash його й ховає,
// docs/patterns/splash.md): без цього між splash і першим кадром застосунку
// видно порожнє вікно в системній (світлій) темі, навіть якщо вибрана темна
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
    Promise.all([storage.getItem(THEME_KEY), storage.getItem(START_TAB_KEY)])
      .then(([theme, startTab]): Preferences => ({
        theme: parseThemePreference(theme),
        startTab: parseStartTab(startTab),
      }))
      .catch(() => defaults)
      .then((next) => {
        Appearance.setColorScheme(toColorScheme(next.theme));
        if (active) setPreferences(next);
      });
    return () => {
      active = false;
    };
  }, [storage]);

  // Номер останнього вибору теми: швидкі дотики по картках запускають кілька
  // знімків паралельно, і застосовується лише найновіший вибір
  const themeRequest = useRef(0);

  const setTheme = useCallback(
    async (next: ThemePreference) => {
      const request = ++themeRequest.current;
      // Знімок поточного вигляду до зміни схеми — він розчиниться в новій
      // темі (ThemeTransition). Сама функція не довше ~250 мс і не кидає
      await captureBeforeThemeChange();
      if (request !== themeRequest.current) return;
      const scheme = toColorScheme(next);
      Appearance.setColorScheme(scheme);
      // «Як у системі» — схема, яку зараз має система
      const resolved = scheme === 'auto' ? Appearance.getColorScheme() : scheme;
      finishThemeChange(resolved === 'dark' ? 'dark' : 'light');
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

  // Поки значення не прочитані, нічого не рендеримо
  if (!preferences) return null;

  return (
    <PreferencesContext value={{ ...preferences, setTheme, setStartTab }}>
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
