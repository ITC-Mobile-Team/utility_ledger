import { Stack } from 'expo-router';

export default function ObjectsLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen
        name='preview'
        options={{ headerBackButtonDisplayMode: 'minimal' }}
      />
    </Stack>
  );
}
