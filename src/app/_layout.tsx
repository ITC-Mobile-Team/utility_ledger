import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LedgerProvider } from '@/providers/ledger-provider';
import {
  OnboardingProvider,
  useOnboarding,
} from '@/providers/onboarding-provider';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OnboardingProvider>
          <LedgerProvider>
            <RootNavigator />
          </LedgerProvider>
        </OnboardingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
