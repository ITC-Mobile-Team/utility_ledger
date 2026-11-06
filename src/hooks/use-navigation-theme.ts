import { colors } from '@/constants/colors';
import { DarkTheme, DefaultTheme } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// Фон навігаторів і кореневого вікна береться з токена `bg`, інакше під час
// переходів між екранами з-під заокруглених кутів проступає білий фон
// стандартної теми
export function useNavigationTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = colors[scheme];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.bg);
  }, [palette.bg]);

  return useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.bg,
        card: palette.surface,
        text: palette.ink,
        border: palette.line,
      },
    };
  }, [scheme, palette]);
}
