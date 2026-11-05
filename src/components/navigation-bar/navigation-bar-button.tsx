import { StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable } from '../pressable';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { HStack } from '../stack';
import { type AppColor } from '@/constants/colors';
import { Image } from 'expo-image';
import { type AppIcon, appIcons } from '@/constants/app-icons';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { FULL_BUTTON_WIDTH_RATIO } from './constants';

export type NavigationBarButtonItem = {
  id: string;
  title: string;
  icon: AppIcon;
  iconBackground: AppColor;
  iconColor?: AppColor;
  testID?: string;
};

export type NavigationBarButtonProps = NavigationBarButtonItem & {
  onPress?: () => void;
};

export const NavigationBarButton = ({
  title,
  icon,
  iconBackground,
  iconColor = 'onPrimary',
  testID,
  onPress,
}: NavigationBarButtonProps) => {
  const navigationBarIcon = appIcons[icon];
  const iconTint = useThemeColor(iconColor);
  const { width: screenWidth } = useWindowDimensions();
  const buttonWidth = screenWidth * FULL_BUTTON_WIDTH_RATIO;
  return (
    <Pressable
      accessibilityRole='button'
      testID={testID}
      onPress={onPress}
      style={{ width: buttonWidth }}
    >
      <ThemedView backgroundColor='surface' style={styles.button}>
        <HStack align='center' spacing={12}>
          <ThemedView backgroundColor={iconBackground} style={styles.circle}>
            <Image
              source={navigationBarIcon}
              tintColor={iconTint}
              style={styles.icon}
            />
          </ThemedView>

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
});
