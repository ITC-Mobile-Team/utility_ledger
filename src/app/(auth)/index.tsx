import {
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { type AppIcon, appIcons } from '@/constants/app-icons';
import { iconTiles } from '@/constants/icon-sizes';
import {
  ActionButton,
  AppImage,
  EmojiGlyph,
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
          testID='welcome.signIn'
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
  const orbitRadius = firstCircleWidth / 2;
  return (
    <View style={{ width: firstCircleWidth, height: firstCircleWidth }}>
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
            <EmojiGlyph emoji={appIcons.house} size={iconWidth * 0.7} />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {services.map((service, index) => {
        // Бейджі рівномірно розкладені по зовнішньому колу, перший — справа зверху, як у макеті
        const angle =
          ((firstServiceAngle + (360 / services.length) * index) * Math.PI) /
          180;
        return (
          <ServiceBadge
            key={service.icon}
            service={service}
            style={{
              left: orbitRadius + orbitRadius * Math.cos(angle) - badgeSize / 2,
              top: orbitRadius + orbitRadius * Math.sin(angle) - badgeSize / 2,
            }}
          />
        );
      })}
    </View>
  );
};

type Service = {
  icon: AppIcon;
};

const services: Service[] = [
  { icon: 'electricity' },
  { icon: 'gas' },
  { icon: 'water' },
  { icon: 'heating' },
  { icon: 'network' },
];

const badgeSize = iconTiles.touch;
const firstServiceAngle = -40;

const ServiceBadge = ({
  service,
  style,
}: {
  service: Service;
  style: StyleProp<ViewStyle>;
}) => {
  return (
    <ThemedView
      backgroundColor='chipBg'
      borderColor='chipRim'
      size={{ width: badgeSize }}
      style={[styles.circleContainer, styles.circle, styles.badge, style]}
    >
      <AppImage icon={service.icon} container={badgeSize} />
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
  badge: {
    position: 'absolute',
    boxShadow: '0 6px 16px rgba(15, 27, 45, 0.12)',
  },
});
