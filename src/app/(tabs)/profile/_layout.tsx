import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='edit-name' />
      <Stack.Screen name='privacy' />
      <Stack.Screen name='terms' />
    </Stack>
  );
}
