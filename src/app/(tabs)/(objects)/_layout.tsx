import { Stack } from 'expo-router';

export default function ObjectsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='preview' />
    </Stack>
  );
}
