import {
  ActionButton,
  AppImage,
  HStack,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
  Spacer,
  LegalNotice,
} from '@/components';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppHeader } from '@/views';

export default function SignIn() {
  const appleButtonPress = () => {
    router.push('/auth-error');
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
            onPress={appleButtonPress}
          />
          <ActionButton type='google' title='Продовжити з Google' />
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
