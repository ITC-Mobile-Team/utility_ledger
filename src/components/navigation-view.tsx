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
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { toPadding, type ContentInsets } from './content-insets';
import { ThemedView } from './themed-view';

type NavigationViewProps = Omit<KeyboardAwareScrollViewProps, 'onScroll'> &
  Omit<
    ThemedNavigationBarProps,
    'type' | 'scrollY' | 'maxScrollY' | 'titleShrink' | 'collapseScroll'
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
  const collapseScroll = useSharedValue(0);
  // Scroll range without the spacer, with the header expanded
  const naturalScroll = useSharedValue(Number.MAX_VALUE);
  // The scroll area grows as the header shrinks; the spacer keeps enough scroll
  // range for the large title to collapse completely. Long content needs none,
  // so it doesn't leave an empty gap at the bottom
  const spacerHeight = useDerivedValue(() =>
    Math.min(
      titleShrink.value,
      Math.max(collapseScroll.value - naturalScroll.value, 0),
    ),
  );
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    maxScrollY.value =
      e.contentSize.height +
      (e.contentInset?.bottom ?? 0) -
      e.layoutMeasurement.height;
    naturalScroll.value =
      maxScrollY.value - spacerHeight.value + titleShrink.value;
  });
  const shrinkSpacerStyle = useAnimatedStyle(() => ({
    height: spacerHeight.value,
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
        collapseScroll={collapseScroll}
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
        // 'automatic' додає відступ під таб-бар лише коли контент уже довший
        // за екран; коротший контент ховався під таб-баром і не скролився
        contentInsetAdjustmentBehavior='always'
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
