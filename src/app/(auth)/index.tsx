import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  ActionButton,
  AppImage,
  ThemedText,
  ThemedView,
  VStack,
  ScreenView,
} from '@/components';
import { router } from 'expo-router';
import { AppHeader } from '@/views';

export default function Welcome() {
  const signInPress = () => {
    router.push('/sign-in');
  };
  return (
    <ScreenView
      backgroundColor='surface'
      contentInsets={{ horizontal: 24, bottom: 34 }}
    >
      <VStack style={styles.fill}>
        <AppHeader />
        <Content />
        <ActionButton
          title='Увійти або зареєструватися'
          onPress={signInPress}
        />
      </VStack>
    </ScreenView>
  );
}

const Content = () => {
  return (
    <VStack spacing={28} style={styles.contentContainer}>
      <ContentCircle />

      <VStack spacing={12}>
        <ThemedText font='display' align='center'>
          Комунальні платежі без зайвих турбот
        </ThemedText>
        <ThemedText color='muted' align='center'>
          Додайте адресу, фіксуйте показники та зберігайте рахунки в одному
          місці.
        </ThemedText>
      </VStack>
    </VStack>
  );
};

const ContentCircle = () => {
  const { width: screenWidth } = useWindowDimensions();
  const firstCircleWidth = screenWidth - 182;
  const secondCircleWidth = firstCircleWidth - 60;
  const thirdCircleWidth = secondCircleWidth - 56;
  const iconWidth = thirdCircleWidth - 56;
  return (
    <ThemedView backgroundColor='surface'>
      <ThemedView
        backgroundColor='blueSoft'
        size={{ width: firstCircleWidth }}
        style={[styles.circleContainer, styles.circle]}
      >
        <ThemedView
          backgroundColor='blueSoft2'
          size={{ width: secondCircleWidth }}
          style={[styles.circleContainer, styles.circle]}
        >
          <ThemedView
            backgroundColor='blue'
            size={{ width: thirdCircleWidth }}
            style={[styles.circleContainer, styles.circle]}
          >
            <AppImage icon='house' size={{ width: iconWidth }} />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderRadius: 999,
  },
});
