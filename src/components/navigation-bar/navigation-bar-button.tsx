import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { HStack, VStack } from '../stack';
import { type AppColor } from '@/constants/colors';
import { Image } from 'expo-image';
import { type AppIcon, appIcons } from '@/constants/app-icons';
import { useThemeColor } from '@/hooks/use-theme-colors';

export type NavigationBarButtonItem = {
  id: string;
  title: string;
  icon: AppIcon;
  iconBackground: AppColor;
  iconColor?: AppColor;
};

export type NavigationBarButtonProps = NavigationBarButtonItem & {
  // Кількість кнопок у ряду; більше двох — компактні плитки (іконка над підписом)
  columns?: number;
  onPress?: () => void;
};

export const NavigationBarButton = ({
  title,
  icon,
  iconBackground,
  iconColor = 'onPrimary',
  columns = 2,
  onPress,
}: NavigationBarButtonProps) => {
  const navigationBarIcon = appIcons[icon];
  const iconTint = useThemeColor(iconColor);
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = 20;
  const gap = 12;
  const compact = columns > 2;
  const buttonWidth =
    (screenWidth - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  const iconCircle = (
    <ThemedView backgroundColor={iconBackground} style={styles.circle}>
      <Image
        source={navigationBarIcon}
        tintColor={iconTint}
        style={styles.icon}
      />
    </ThemedView>
  );

  if (compact) {
    return (
      <Pressable onPress={onPress} style={{ width: buttonWidth }}>
        <ThemedView backgroundColor='surface' style={styles.compactButton}>
          <VStack align='center' spacing={8}>
            {iconCircle}
            <ThemedText
              font='caption'
              numberOfLines={2}
              style={styles.compactTitle}
            >
              {title}
            </ThemedText>
          </VStack>
        </ThemedView>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={{ width: buttonWidth }}>
      <ThemedView backgroundColor='surface' style={styles.button}>
        <HStack align='center' spacing={12}>
          {iconCircle}
          <ThemedText font='rowTitle' style={styles.title}>
            {title}
          </ThemedText>
        </HStack>
      </ThemedView>
    </Pressable>
  );
};

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
  compactButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 22,
  },
  compactTitle: {
    textAlign: 'center',
  },
});
