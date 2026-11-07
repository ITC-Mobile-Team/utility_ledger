import {
  ActionButton,
  AppImage,
  NavigationView,
  Spacer,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useAuth } from '@/providers/auth-provider';
import type { SignInMethod } from '@/services/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

const providerNames: Record<SignInMethod, string> = {
  apple: 'Apple',
  google: 'Google',
};

export default function AuthError() {
  const { method = 'apple' } = useLocalSearchParams<{
    method?: SignInMethod;
  }>();
  const { signIn } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  // Після успішного входу Stack.Protected сам переведе на наступний екран
  const retry = async () => {
    setIsRetrying(true);
    try {
      await signIn(method);
    } catch {
      // Лишаємося на цьому екрані, щоб користувач спробував ще раз
    } finally {
      setIsRetrying(false);
    }
  };

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
          <AppImage icon='danger' role='hero' />
        </ThemedView>

        <VStack align='center' spacing={10}>
          <ThemedText font='title'>Не вдалося увійти</ThemedText>
          <ThemedText color='muted' align='center'>
            Вхід через {providerNames[method]} було скасовано або сталася
            помилка. Спробуйте ще раз або виберіть інший спосіб входу.
          </ThemedText>
        </VStack>
      </VStack>
      <Spacer />

      <VStack spacing={12}>
        <ActionButton
          title='Спробувати ще раз'
          loading={isRetrying}
          onPress={retry}
        />
        <ActionButton
          type='secondary'
          title='Інший спосіб входу'
          disabled={isRetrying}
          onPress={() => router.back()}
        />
      </VStack>
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
