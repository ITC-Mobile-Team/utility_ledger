import { StyleSheet, useColorScheme, View } from 'react-native';
import { AppFont, ThemedText } from './themed-text';
import { VStack } from './stack';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, gradientLocations, AppColor } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationBarType = 'blue' | 'green' | 'purple' | 'transparent';

type ThemedNavigationBarProps = {
  type?: NavigationBarType;
  title: string;
  subtitle?: string;
};

export function ThemedNavigationBar({
  type = 'transparent',
  title,
  subtitle,
}: ThemedNavigationBarProps) {
  const isTransparent = type === 'transparent';
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const gradientColors = gradients[scheme].heroBlue;
  const { top: safeAreaTop } = useSafeAreaInsets();
  const titleColor: AppColor = isTransparent ? 'ink' : 'onPrimary';
  const titleFont: AppFont = isTransparent ? 'display' : 'title';
  const subtitleColor: AppColor = isTransparent ? 'muted' : 'heroSub';
  const content = (
    <VStack
      spacing={6}
      style={[styles.stack, { paddingTop: safeAreaTop, paddingBottom: 26 }]}
    >
      <ThemedText color={titleColor} font={titleFont}>
        {title}
      </ThemedText>
      <ThemedText color={subtitleColor} font='navigationSubtitle'>
        {subtitle}
      </ThemedText>
    </VStack>
  );

  if (isTransparent) {
    return <View>{content}</View>;
  } else {
    return (
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {content}
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  stack: {
    paddingHorizontal: 20,
  },
});
