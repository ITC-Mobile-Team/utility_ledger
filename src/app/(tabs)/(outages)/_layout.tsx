import { Stack } from 'expo-router';

// Головний екран завжди під налаштуваннями: коли їх відкривають з іншого табу
// (кнопка «Налаштувати» в профілі), «Назад» веде на нього
export const unstable_settings = { anchor: 'index' };

export default function OutagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='outage-settings' />
    </Stack>
  );
}
