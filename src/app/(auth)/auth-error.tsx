import {
  AppImage,
  NavigationView,
  Spacer,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { StyleSheet } from 'react-native';

export default function AuthError() {
  return (
    <NavigationView
      type='short'
      title='Вхід'
      barType='blue'
      contentInsets={{ horizontal: 20, bottom: 32 }}
      cornerRadius={28}
    >
      <Spacer />
      <VStack align='center' spacing={22}>
        <ThemedView
          backgroundColor='coralSoft'
          size={{ width: 96 }}
          style={styles.circle}
        >
          <AppImage icon='danger' tintColor='coral' size={{ width: 40 }} />
        </ThemedView>

        <VStack align='center' spacing={10}>
          <ThemedText font='title'>Не вдалося увійти</ThemedText>
          <ThemedText color='muted' align='center'>
            Вхід через Apple було скасовано або сталася помилка. Спробуйте ще
            раз або виберіть інший спосіб входу.
          </ThemedText>
        </VStack>
      </VStack>
      <Spacer />
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
