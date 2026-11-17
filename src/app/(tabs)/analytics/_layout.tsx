import { AnalyticsSelectionProvider } from '@/providers/analytics-selection-provider';
import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <AnalyticsSelectionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='index' />
        <Stack.Screen name='details' />
      </Stack>
    </AnalyticsSelectionProvider>
  );
}
