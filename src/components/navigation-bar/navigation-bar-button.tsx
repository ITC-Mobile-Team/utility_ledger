import { StyleSheet, useWindowDimensions } from 'react-native';
import { Pressable } from '../pressable';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { HStack } from '../stack';
import { type AppColor } from '@/constants/colors';
import { type AppIcon } from '@/constants/app-icons';
import { AppImage } from '../app-image';
import { FULL_BUTTON_WIDTH_RATIO } from './constants';

export type NavigationBarButtonItem = {
  id: string;
  title: string;
  icon: AppIcon;
  iconBackground: AppColor;
  testID?: string;
};

export type NavigationBarButtonProps = NavigationBarButtonItem & {
  onPress?: () => void;
};

export const NavigationBarButton = ({
  title,
  icon,
  iconBackground,
  testID,
  onPress,
}: NavigationBarButtonProps) => {
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
            <AppImage icon={icon} role='button' />
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
  title: {
    flexShrink: 1,
  },
});
