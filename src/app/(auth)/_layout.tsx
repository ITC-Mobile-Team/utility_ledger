import { Stack } from 'expo-router';

export default function SignInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='sign-in' />
      <Stack.Screen name='auth-error' />
    </Stack>
  );
}
