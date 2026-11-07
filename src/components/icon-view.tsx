import { StyleSheet, type ViewProps } from 'react-native';
import type { AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import type { Size } from './size';
import { ThemedView } from './themed-view';
import { AppImage } from './app-image';

type IconViewProps = ViewProps & {
  icon: AppIcon;
  background?: AppColor;
  size: Size;
};

// Коло з іконкою всередині: гліф рівня button, а в колах більших за 44 pt —
// feature
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
      <AppImage icon={icon} role={size.width > 44 ? 'feature' : 'button'} />
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
