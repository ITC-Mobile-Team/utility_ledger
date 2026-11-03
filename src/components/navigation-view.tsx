import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { VStack } from './stack';
import {
  ThemedNavigationBar,
  type ThemedNavigationBarProps,
  type NavigationBarVariant,
} from './navigation-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { toPadding, type ContentInsets } from './content-insets';
import { ThemedView } from './themed-view';

type NavigationViewProps = Omit<KeyboardAwareScrollViewProps, 'onScroll'> &
  Omit<ThemedNavigationBarProps, 'type' | 'scrollY'> & {
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
      {/* Скролить до поля у фокусі, коли відкривається клавіатура */}
      <KeyboardAwareScrollView
        onScroll={onScroll}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior='automatic'
        style={{ backgroundColor: bg }}
        contentContainerStyle={[{ flexGrow: 1 }, toPadding(contentInsets)]}
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
