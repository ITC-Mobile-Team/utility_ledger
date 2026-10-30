import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { HStack } from './stack';
import { AppColor } from '@/constants/colors';
import { Image } from 'expo-image';
import {
  NavigationBarIcon,
  navigationBarIcons,
} from '@/constants/navigationBarIcons';
import { useThemeColor } from '@/hooks/use-theme-colors';

export type NavigationBarButtonItem = {
  id: string;
  title: string;
  icon: NavigationBarIcon;
  iconBackground: AppColor;
};

export type NavigationBarButtonProps = NavigationBarButtonItem & {
  onPress?: () => void;
};

const NavigationBarButton = ({
  title,
  icon,
  iconBackground,
  onPress,
}: NavigationBarButtonProps) => {
  const navigationBarIcon = navigationBarIcons[icon];
  const onPrimary = useThemeColor('onPrimary');
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = 20;
  const gap = 12;
  const columns = 2;
  const buttonWidth =
    (screenWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;
  return (
    <Pressable onPress={onPress} style={{ width: buttonWidth }}>
      <ThemedView backgroundColor='surface' style={styles.button}>
        <HStack align='center' spacing={12}>
          <ThemedView backgroundColor={iconBackground} style={styles.circle}>
            <Image
              source={navigationBarIcon}
              tintColor={onPrimary}
              style={styles.icon}
            />
          </ThemedView>

          <ThemedText color='ink' font='rowTitle' style={styles.title}>
            {title}
          </ThemedText>
        </HStack>
      </ThemedView>
    </Pressable>
  );
};

export default NavigationBarButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
  },
  title: {
    flexShrink: 1,
  },
});
