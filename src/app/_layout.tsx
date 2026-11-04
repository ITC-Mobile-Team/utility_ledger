import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LedgerProvider } from '@/providers/ledger-provider';
import { OutageProvider } from '@/providers/outage-provider';
import { configureOutageNotifications } from '@/services/outages';
import {
  OnboardingProvider,
  useOnboarding,
} from '@/providers/onboarding-provider';
import { colors } from '@/constants/colors';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

configureOutageNotifications();

function RootNavigator() {
  const { isSignedIn } = useAuth();
  const { hasSeenOnboarding } = useOnboarding();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name='(auth)' />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn && !hasSeenOnboarding}>
        <Stack.Screen name='(onboarding)' />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn && hasSeenOnboarding}>
        <Stack.Screen name='(tabs)' />
      </Stack.Protected>
    </Stack>
  );
}

// Фон навігаторів і кореневого вікна береться з токена `bg`, інакше під час
// переходів між екранами з-під заокруглених кутів проступає білий фон
// стандартної теми
function useNavigationTheme() {
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

export default function RootLayout() {
  const theme = useNavigationTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <KeyboardProvider>
          <AuthProvider>
            <OnboardingProvider>
              <LedgerProvider>
                <OutageProvider>
                  <RootNavigator />
                </OutageProvider>
              </LedgerProvider>
            </OnboardingProvider>
          </AuthProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
