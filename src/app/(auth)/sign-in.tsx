import {
  ActionButton,
  AppImage,
  HStack,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
  Spacer,
} from '@/components';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, LegalNotice } from '@/views';
import { useAuth } from '@/providers/auth-provider';
import type { SignInMethod } from '@/services/auth';
import { useState } from 'react';

export default function SignIn() {
  const { signIn } = useAuth();
  const [pendingMethod, setPendingMethod] = useState<SignInMethod | null>(null);

  // Після успішного входу Stack.Protected сам переведе на наступний екран
  const signInWith = async (method: SignInMethod) => {
    setPendingMethod(method);
    try {
      await signIn(method);
    } catch {
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
      contentInsets={{ horizontal: 20, bottom: 32 }}
      cornerRadius={28}
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
            loading={pendingMethod === 'apple'}
            disabled={pendingMethod === 'google'}
            onPress={() => signInWith('apple')}
          />
          <ActionButton
            type='google'
            title='Продовжити з Google'
            loading={pendingMethod === 'google'}
            disabled={pendingMethod === 'apple'}
            onPress={() => signInWith('google')}
          />
        </VStack>

        <ThemedView backgroundColor='blueSoft' style={styles.banner}>
          <HStack align='top' spacing={12} style={styles.bannerContent}>
            <AppImage icon='lock' tintColor='blueInk' size={{ width: 18 }} />

            <VStack spacing={2} style={styles.bannerText}>
              <ThemedText font='hintTitle'>Без паролів</ThemedText>
              <ThemedText color='blueInk' font='radioCardSubtitle'>
                Ми отримуємо лише імʼя та email від провайдера входу.
              </ThemedText>
            </VStack>
          </HStack>
        </ThemedView>

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
    borderRadius: 16,
  },
  bannerContent: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bannerText: {
    flexShrink: 1,
  },
  legalNotice: {
    paddingHorizontal: 20,
  },
});
