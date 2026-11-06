import { ThemeTransition } from '@/components';
import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import { AuthProvider } from '@/providers/auth-provider';
import { LedgerProvider } from '@/providers/ledger-provider';
import { OnboardingProvider } from '@/providers/onboarding-provider';
import { OutageProvider } from '@/providers/outage-provider';
import { ProfileProvider } from '@/providers/profile-provider';
import { ThemeProvider } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Провайдери застосунку, що залежать від теми, тож живуть усередині
// PreferencesProvider: до першого рендеру він уже виставив вибрану схему, і
// фон вікна та навігація беруть її
export function AppProviders({ children }: PropsWithChildren) {
  const theme = useNavigationTheme();
  return (
    <>
      <ThemeProvider value={theme}>
        <KeyboardProvider>
          <AuthProvider>
            <OnboardingProvider>
              <LedgerProvider>
                <OutageProvider>
                  <ProfileProvider>{children}</ProfileProvider>
                </OutageProvider>
              </LedgerProvider>
            </OnboardingProvider>
          </AuthProvider>
        </KeyboardProvider>
      </ThemeProvider>
      <ThemeTransition />
    </>
  );
}
