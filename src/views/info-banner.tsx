import { AppImage, HStack, ThemedText, ThemedView, VStack } from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import { StyleSheet, type ViewProps } from 'react-native';

type InfoBannerProps = Pick<ViewProps, 'style'> & {
  icon: AppIcon;
  title: string;
  text: string;
};

// Блакитний інформаційний банер: іконка, жирний заголовок і пояснення
export function InfoBanner({ icon, title, text, style }: InfoBannerProps) {
  return (
    <ThemedView backgroundColor='blueSoft' style={[styles.banner, style]}>
      <HStack align='top' spacing={12}>
        <AppImage icon={icon} tintColor='blueInk' size={{ width: 18 }} />
        <VStack spacing={2} style={styles.text}>
          <ThemedText font='hintTitle'>{title}</ThemedText>
          <ThemedText color='blueInk' font='radioCardSubtitle'>
            {text}
          </ThemedText>
        </VStack>
      </HStack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  text: {
    flexShrink: 1,
  },
});
