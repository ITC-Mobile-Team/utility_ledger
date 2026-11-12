import { setThemeSnapshotRoot, ThemeTransition } from '@/components';
import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import { AccountDataProvider } from '@/providers/account-data-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { LedgerProvider } from '@/providers/ledger-provider';
import { OnboardingProvider } from '@/providers/onboarding-provider';
import { OutageProvider } from '@/providers/outage-provider';
import { ProfileProvider } from '@/providers/profile-provider';
import { ThemeProvider } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Провайдери застосунку, що залежать від теми, тож живуть усередині
// PreferencesProvider: до першого рендеру він уже виставив вибрану схему, і
// фон вікна та навігація беруть її
export function AppProviders({ children }: PropsWithChildren) {
  const theme = useNavigationTheme();
  return (
    <>
      {/* Корінь для знімка перед зміною теми (ThemeTransition) */}
      <View ref={setThemeSnapshotRoot} collapsable={false} style={styles.root}>
        <ThemeProvider value={theme}>
          <KeyboardProvider>
            <AuthProvider>
              <OnboardingProvider>
                <AccountDataProvider>
                  <LedgerProvider>
                    <OutageProvider>
                      <ProfileProvider>{children}</ProfileProvider>
                    </OutageProvider>
                  </LedgerProvider>
                </AccountDataProvider>
              </OnboardingProvider>
            </AuthProvider>
          </KeyboardProvider>
        </ThemeProvider>
      </View>
      <ThemeTransition />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
