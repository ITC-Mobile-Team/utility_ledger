import {
  ActionButton,
  NavigationView,
  ThemedText,
  VStack,
  Spacer,
} from '@/components';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, InfoBanner, LegalNotice } from '@/views';
import { useAuth } from '@/providers/auth-provider';
import { AuthError, type SignInMethod } from '@/services/auth';
import { useState } from 'react';

export default function SignIn() {
  const { signIn } = useAuth();
  const [pendingMethod, setPendingMethod] = useState<SignInMethod | null>(null);

  // Після успішного входу Stack.Protected сам переведе на наступний екран
  const signInWith = async (method: SignInMethod) => {
    setPendingMethod(method);
    try {
      await signIn(method);
    } catch (error) {
      // Закрите вікно провайдера — не помилка: лишаємось на екрані
      if (error instanceof AuthError && error.kind === 'cancelled') return;
      router.push({ pathname: '/auth-error', params: { method } });
    } finally {
      setPendingMethod(null);
    }
  };
  return (
    <NavigationView
      type='short'
      title='Вхід і реєстрація'
      barType='blue'
      contentInsets={{ bottom: 32 }}
    >
      <VStack style={{ flex: 1 }}>
        <AppHeader />

        <VStack spacing={10} style={styles.textStack}>
          <ThemedText font='display'>Ваші дані завжди поруч</ThemedText>
          <ThemedText color='muted'>
            Увійдіть через Apple або Google. Під час першого входу акаунт
            створиться автоматично.
          </ThemedText>
        </VStack>

        <VStack spacing={12} style={styles.buttonStack}>
          <ActionButton
            type='apple'
            title='Продовжити з Apple'
            testID='signIn.apple'
            loading={pendingMethod === 'apple'}
            disabled={pendingMethod === 'google'}
            onPress={() => signInWith('apple')}
          />
          <ActionButton
            type='google'
            title='Продовжити з Google'
            testID='signIn.google'
            loading={pendingMethod === 'google'}
            disabled={pendingMethod === 'apple'}
            onPress={() => signInWith('google')}
          />
        </VStack>

        <InfoBanner
          icon='lock'
          title='Без паролів'
          text='Ми отримуємо лише імʼя та email від провайдера входу.'
          style={styles.banner}
        />

        <Spacer />

        <LegalNotice style={styles.legalNotice} />
      </VStack>
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  textStack: {
    marginTop: 24,
  },
  buttonStack: {
    marginTop: 32,
  },
  banner: {
    marginTop: 24,
  },
  legalNotice: {
    paddingHorizontal: 20,
  },
});
