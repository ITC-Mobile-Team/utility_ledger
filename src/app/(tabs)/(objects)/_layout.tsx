import { Stack } from 'expo-router';

export default function ObjectsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='object-form' />
      <Stack.Screen name='object-added' options={{ gestureEnabled: false }} />
      <Stack.Screen name='[objectId]/index' />
      <Stack.Screen name='[objectId]/services' />
      <Stack.Screen name='[objectId]/service-form' />
      <Stack.Screen name='[objectId]/icon-picker' />
      <Stack.Screen name='[objectId]/add-months' />
      <Stack.Screen name='[objectId]/[month]/index' />
      <Stack.Screen name='[objectId]/[month]/reading' />
      <Stack.Screen name='[objectId]/[month]/bill' />
      <Stack.Screen name='preview' />
    </Stack>
  );
}
