import {
  OnboardingProvider,
  useOnboarding,
} from '@/providers/onboarding-provider';
import { Stack } from 'expo-router';

function RootNavigator() {
  const { hasSeenOnboarding } = useOnboarding();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!hasSeenOnboarding}>
        <Stack.Screen name='(auth)' />
      </Stack.Protected>
      <Stack.Protected guard={hasSeenOnboarding}>
        <Stack.Screen name='(tabs)' />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}
