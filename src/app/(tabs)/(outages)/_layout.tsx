import { Stack } from 'expo-router';

export default function OutagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='outage-settings' />
    </Stack>
  );
}
