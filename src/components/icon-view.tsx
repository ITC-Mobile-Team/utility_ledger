import { StyleSheet, type ViewProps } from 'react-native';
import type { AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import type { Size } from './size';
import { ThemedView } from './themed-view';
import { AppImage } from './app-image';

type IconViewProps = ViewProps & {
  icon: AppIcon;
  // Без підкладки — скляна, для кольорового навбару
  background?: AppColor;
  size: Size;
};

// Коло з іконкою всередині: гліф — половина сторони кола
export function IconView({ icon, background, size }: IconViewProps) {
  return (
    <ThemedView
      backgroundColor={background}
      size={size}
      style={[
        !background && styles.iconOpacityBackground,
        styles.iconContainer,
      ]}
    >
      <AppImage icon={icon} container={size.width} />
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
