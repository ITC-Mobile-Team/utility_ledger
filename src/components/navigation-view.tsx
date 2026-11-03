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
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { toPadding, type ContentInsets } from './content-insets';
import { ThemedView } from './themed-view';

type NavigationViewProps = Omit<KeyboardAwareScrollViewProps, 'onScroll'> &
  Omit<
    ThemedNavigationBarProps,
    'type' | 'scrollY' | 'maxScrollY' | 'titleShrink'
  > & {
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
  keyboardShouldPersistTaps = 'handled',
  children,
  ...rest
}: NavigationViewProps) => {
  const bg = useThemeColor('bg');
  const scrollY = useSharedValue(0);
  const maxScrollY = useSharedValue(Number.MAX_VALUE);
  const titleShrink = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    maxScrollY.value =
      e.contentSize.height +
      (e.contentInset?.bottom ?? 0) -
      e.layoutMeasurement.height;
  });
  // The scroll area grows as the header shrinks; this keeps the scroll range
  // stable so the large title can collapse completely
  const shrinkSpacerStyle = useAnimatedStyle(() => ({
    height: titleShrink.value,
  }));

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
        maxScrollY={maxScrollY}
        titleShrink={titleShrink}
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
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...rest}
      >
        {children}
        <Animated.View style={shrinkSpacerStyle} />
      </KeyboardAwareScrollView>
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
