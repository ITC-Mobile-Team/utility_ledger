import { StyleSheet } from 'react-native';
import { VStack } from './stack';
import {
  ThemedNavigationBar,
  ThemedNavigationBarProps,
  type NavigationBarVariant,
} from './navigation-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { toPadding, type ContentInsets } from './content-insets';
import { ThemedView } from './themed-view';

type NavigationViewProps = Omit<ThemedNavigationBarProps, 'type'> & {
  type?: NavigationBarVariant;
  contentInsets?: ContentInsets;
};

export const NavigationView = ({
  type = 'full',
  barType,
  title,
  subtitle,
  navigationBarButtons,
  onNavigationButtonPress,
  contentInsets,
  cornerRadius = 0,
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
        barType={barType}
        title={title}
        subtitle={subtitle}
        navigationBarButtons={navigationBarButtons}
        onNavigationButtonPress={onNavigationButtonPress}
        scrollY={scrollY}
        cornerRadius={cornerRadius}
      />
      {cornerRadius > 0 && (
        <ThemedView
          style={[
            styles.sheet,
            {
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
              marginTop: -cornerRadius, // заходить на градієнт навбару
            },
          ]}
        />
      )}
      <Animated.ScrollView
        onScroll={onScroll}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior='automatic'
        style={{ backgroundColor: bg }}
        contentContainerStyle={toPadding(contentInsets)}
        {...rest}
      />
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    height: 24,
  },
});
