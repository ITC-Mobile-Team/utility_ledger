import { useAuth } from '@/providers/auth-provider';
import { useOnboarding } from '@/providers/onboarding-provider';
import { PreferencesProvider } from '@/providers/preferences-provider';
import { configureOutageNotifications } from '@/services/outages';
import { AppProviders } from '@/views/app-providers';
import { AppSplash } from '@/views/splash';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <AppProviders>
          <RootNavigator />
          <AppSplash />
        </AppProviders>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
