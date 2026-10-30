import { StyleSheet } from 'react-native';
import { VStack } from './stack';
import {
  ThemedNavigationBar,
  ThemedNavigationBarProps,
} from './navigation-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

type NavigationContentInsets = {
  top?: number;
  horizontal?: number;
  bottom?: number;
};

type NavigationViewProps = ThemedNavigationBarProps & {
  contentInsets?: NavigationContentInsets;
};

export const NavigationView = ({
  type,
  title,
  subtitle,
  navigationBarButtons,
  onNavigationButtonPress,
  contentInsets,
  ...rest
}: NavigationViewProps) => {
  const bg = useThemeColor('bg');
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return (
    <VStack style={styles.container}>
      <ThemedNavigationBar
        type={type}
        title={title}
        subtitle={subtitle}
        navigationBarButtons={navigationBarButtons}
        onNavigationButtonPress={onNavigationButtonPress}
        scrollY={scrollY}
      />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior='automatic'
        style={{ backgroundColor: bg }}
        contentContainerStyle={{
          paddingTop: contentInsets?.top ?? undefined,
          paddingHorizontal: contentInsets?.horizontal ?? undefined,
          paddingBottom: contentInsets?.bottom ?? undefined,
        }}
        {...rest}
      />
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
