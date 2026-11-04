import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
  useKeyboardHandler,
  useKeyboardState,
  useReanimatedFocusedInput,
} from 'react-native-keyboard-controller';
import { VStack } from './stack';
import {
  ThemedNavigationBar,
  type ThemedNavigationBarProps,
  type NavigationBarVariant,
} from './navigation-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useIsFocused } from 'expo-router';
import { toPadding, type ContentInsets } from './content-insets';
import { COLLAPSE_DISTANCE } from './navigation-bar/constants';
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
  const titleCollapseDistance = useSharedValue(0);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  // Safe area екрана включає таб-бар
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [bottomInset, setBottomInset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Де закінчується контент (без розпірки та нижнього відступу)
  const [contentEnd, setContentEnd] = useState(0);
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  // Фокус в інпуті приходить раніше за клавіатуру: скрол має бути ввімкнений
  // ще до її анімації, інакше KeyboardAwareScrollView не підніме поле над нею
  const { input: focusedInput } = useReanimatedFocusedInput();
  const [hasFocusedInput, setHasFocusedInput] = useState(false);
  useAnimatedReaction(
    () => focusedInput.value !== null,
    (isFocused, previous) => {
      if (isFocused !== previous) scheduleOnRN(setHasFocusedInput, isFocused);
    },
  );
  const [isAtTop, setAtTop] = useState(true);
  useAnimatedReaction(
    () => scrollY.value <= 0,
    (atTop, previous) => {
      if (atTop !== previous) scheduleOnRN(setAtTop, atTop);
    },
  );
  // Короткий контент не скролиться: він і так видно повністю над таб-баром.
  // Перевіряємо лише нагорі: згорнутий навбар нижчий, і там контент може
  // вміститись, але скрол потрібен, щоб повернутись. З клавіатурою скрол
  // лишається, щоб догорнути до поля над нею, і вмикається вже при фокусі
  const contentFits =
    isAtTop &&
    viewportHeight > 0 &&
    contentEnd + (contentInsets?.bottom ?? 0) <= viewportHeight - bottomInset;
  const isScrollEnabled = !contentFits || isKeyboardVisible || hasFocusedInput;
  const buttonsCollapseDistance = navigationBarButtons?.length
    ? COLLAPSE_DISTANCE
    : 0;
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
  // Навбар не зупиняється посередині згортання: скрол, що завершився між
  // розгорнутим і згорнутим станами, доїжджає до ближчого
  const isSnappingToCollapsed = useRef(false);
  const snapHeader = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    // Короткий контент згортає навбар за весь доступний скрол
    const end = Math.min(
      Math.max(titleCollapseDistance.get(), buttonsCollapseDistance),
      maxScrollY.get(),
    );
    const scrollTo = (target: number) =>
      scrollRef.current?.scrollTo({ y: target, animated: true });

    // Короткому контенту не вистачає скролу на повне згортання: доводка
    // виходить за межі контенту, тож повертаємо навбар у розгорнутий стан
    if (isSnappingToCollapsed.current) {
      isSnappingToCollapsed.current = false;
      if (y < end - 1 || y > maxScrollY.get() + 1) scrollTo(0);
      return;
    }
    if (end <= 0 || y <= 0 || y >= end) return;
    if (y < end / 2) {
      scrollTo(0);
      return;
    }
    isSnappingToCollapsed.current = true;
    scrollTo(end);
  };
  // Клавіатура сама прокручує контент до поля у фокусі й може зупинити його
  // посеред згортання навбару, а прокрутку зверху KeyboardAwareScrollView
  // перебиває. Тож поки клавіатура відкрита, навбар згорнутий повністю
  // незалежно від скролу (місця й так мало), а після її закриття скрол
  // доводиться до ближчого стану. Події клавіатури отримують усі екрани
  // стеку, тож реагує лише видимий
  const isFocused = useIsFocused();
  const isScreenFocused = useSharedValue(isFocused);
  useEffect(() => {
    isScreenFocused.set(isFocused);
  }, [isFocused, isScreenFocused]);
  const keyboardCollapse = useSharedValue(0);
  const headerScrollY = useDerivedValue(() =>
    Math.max(
      scrollY.value,
      keyboardCollapse.value *
        Math.max(titleCollapseDistance.value, buttonsCollapseDistance),
    ),
  );
  const onKeyboardHidden = useCallback(() => {
    const y = scrollY.get();
    const end = Math.min(
      Math.max(titleCollapseDistance.get(), buttonsCollapseDistance),
      maxScrollY.get(),
    );
    if (end <= 0 || y <= 0 || y >= end) return;
    scrollRef.current?.scrollTo({ y: y >= end / 2 ? end : 0, animated: true });
  }, [buttonsCollapseDistance, maxScrollY, scrollY, titleCollapseDistance]);
  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        if (!isScreenFocused.value) return;
        keyboardCollapse.value = withTiming(e.height > 0 ? 1 : 0, {
          duration: e.duration,
        });
      },
      onEnd: (e) => {
        'worklet';
        if (isScreenFocused.value && e.height === 0) {
          scheduleOnRN(onKeyboardHidden);
        }
      },
    },
    [onKeyboardHidden],
  );
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
        scrollY={headerScrollY}
        maxScrollY={maxScrollY}
        titleShrink={titleShrink}
        collapseScroll={collapseScroll}
        titleCollapseDistance={titleCollapseDistance}
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
        ref={scrollRef}
        onScroll={onScroll}
        onScrollEndDrag={(e) => {
          // Без інерції onMomentumScrollEnd не прийде. Інерції немає і тоді,
          // коли палець відпустили на краю контенту зі швидкістю: скрол уже
          // там, куди мав би доїхати
          const { velocity, targetContentOffset, contentOffset } =
            e.nativeEvent;
          const hasMomentum =
            Math.abs(velocity?.y ?? 0) >= 0.1 &&
            Math.abs((targetContentOffset?.y ?? 0) - contentOffset.y) >= 1;
          if (!hasMomentum) snapHeader(e);
        }}
        onMomentumScrollEnd={snapHeader}
        // Відступ під таб-бар і home indicator задаємо самі, а не через
        // contentInsetAdjustmentBehavior: автоматичний відступ не потрапляє в
        // події скролу, і без нього maxScrollY хибний. Лише та частина safe
        // area, яку скрол перекриває: над футером форми відступ не потрібен
        onLayout={(e) => {
          setViewportHeight(e.nativeEvent.layout.height);
          scrollRef.current?.measureInWindow((_x, y, _width, height) =>
            setBottomInset(
              Math.max(safeAreaBottom - (windowHeight - (y + height)), 0),
            ),
          );
        }}
        scrollEnabled={isScrollEnabled}
        contentInset={{ bottom: bottomInset }}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        contentInsetAdjustmentBehavior='never'
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        style={{ backgroundColor: bg }}
        contentContainerStyle={[{ flexGrow: 1 }, toPadding(contentInsets)]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...rest}
      >
        {children}
        <View onLayout={(e) => setContentEnd(e.nativeEvent.layout.y)} />
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
