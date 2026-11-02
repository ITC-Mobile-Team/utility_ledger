import { StyleSheet, type ViewProps } from 'react-native';
import type { AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import type { Size } from './size';
import { ThemedView } from './themed-view';
import { AppImage } from './app-image';

type IconViewProps = ViewProps & {
  icon: AppIcon;
  background?: AppColor;
  iconColor?: AppColor;
  iconSize: Size;
  size: Size;
};

export function IconView({
  icon,
  background,
  iconColor = 'onPrimary',
  iconSize,
  size,
}: IconViewProps) {
  return (
    <ThemedView
      backgroundColor={background}
      size={size}
      style={[
        !background && styles.iconOpacityBackground,
        styles.iconContainer,
      ]}
    >
      <AppImage icon={icon} tintColor={iconColor} size={iconSize} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  iconOpacityBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});
