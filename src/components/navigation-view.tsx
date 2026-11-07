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
import { SHEET_CONTENT_TOP } from './navigation-bar/constants';

type NavigationViewProps = Omit<KeyboardAwareScrollViewProps, 'onScroll'> &
  Omit<
    ThemedNavigationBarProps,
    'type' | 'scrollY' | 'collapseDistance' | 'onHeightChange'
  > & {
    type?: NavigationBarVariant;
    contentInsets?: ContentInsets;
  };

export const NavigationView = ({
  type = 'full',
  barType,
  title,
  subtitle,
  headerAccessory,
  headerContent,
  headerTrailing,
  navigationBarButtons,
  onNavigationButtonPress,
  contentInsets,
  // Застарілий проп: шторка тепер за єдиним правилом навбару
  cornerRadius: _cornerRadius,
  keyboardShouldPersistTaps = 'handled',
  children,
  ...rest
}: NavigationViewProps) => {
  const bg = useThemeColor('bg');
  const scrollY = useSharedValue(0);
  const maxScrollY = useSharedValue(Number.MAX_VALUE);
  // Скрол, за який навбар згортається повністю (міряє сам навбар)
  const collapseDistance = useSharedValue(0);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  // Safe area екрана включає таб-бар
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [bottomInset, setBottomInset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Навбар лежить поверх скролу, тож контент починається під ним: на кольоровому
  // навбарі — через SHEET_CONTENT_TOP від верху шторки (низу накладки)
  const [headerHeight, setHeaderHeight] = useState(0);
  const isColored = barType !== undefined && barType !== 'transparent';
  const contentTop = headerHeight + (isColored ? SHEET_CONTENT_TOP : 0);
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
  // Перевіряємо лише нагорі: там навбар розгорнутий, а згорнутий забирає менше
  // місця, і контент може вміститись, але скрол потрібен, щоб повернутись.
  // З клавіатурою скрол лишається, щоб догорнути до поля над нею, і вмикається
  // вже при фокусі.
  // Поки палець на екрані чи скрол доїжджає за інерцією, scrollEnabled не
  // чіпаємо: вимкнений посеред жесту він обриває скрол там, де той є, і екран
  // «замерзає». А під час жесту вміщення змінюється саме собою (скелетон →
  // графік)
  const [isUserScrolling, setUserScrolling] = useState(false);
  // З pull-to-refresh скрол потрібен завжди, навіть короткому контенту,
  // інакше графік не оновити, поки він завантажується чи не опублікований
  const hasRefreshControl = Boolean(rest.refreshControl);
  const contentFits =
    !hasRefreshControl &&
    !isUserScrolling &&
    isAtTop &&
    viewportHeight > 0 &&
    contentEnd + (contentInsets?.bottom ?? 0) <= viewportHeight - bottomInset;
  const isScrollEnabled = !contentFits || isKeyboardVisible || hasFocusedInput;
  const isScrollEnabledValue = useSharedValue(isScrollEnabled);
  useEffect(() => {
    isScrollEnabledValue.set(isScrollEnabled);
  }, [isScrollEnabled, isScrollEnabledValue]);
  // Діапазон скролу без розпірки
  const naturalMaxScroll = useSharedValue(Number.MAX_VALUE);
  // Контенту, ледь довшому за екран, бракує скролу, щоб згорнути навбар
  // повністю: розпірка під ним додає рівно стільки, скільки бракує. Довгий
  // контент обходиться без неї, тож унизу форми немає порожнього місця
  const spacerHeight = useDerivedValue(() =>
    isScrollEnabledValue.value
      ? Math.max(collapseDistance.value - naturalMaxScroll.value, 0)
      : 0,
  );
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    maxScrollY.value =
      e.contentSize.height +
      (e.contentInset?.bottom ?? 0) -
      e.layoutMeasurement.height;
    naturalMaxScroll.value = maxScrollY.value - spacerHeight.value;
  });
  // Навбар не зупиняється посередині згортання: скрол, що завершився між
  // розгорнутим і згорнутим станами, доїжджає до ближчого
  const isSnappingToCollapsed = useRef(false);
  const snapHeader = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    // Короткий контент згортає навбар за весь доступний скрол
    const end = Math.min(collapseDistance.get(), maxScrollY.get());
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
    Math.max(scrollY.value, keyboardCollapse.value * collapseDistance.value),
  );
  const onKeyboardHidden = useCallback(() => {
    const y = scrollY.get();
    const end = Math.min(collapseDistance.get(), maxScrollY.get());
    if (end <= 0 || y <= 0 || y >= end) return;
    scrollRef.current?.scrollTo({ y: y >= end / 2 ? end : 0, animated: true });
  }, [collapseDistance, maxScrollY, scrollY]);
  // У воркетах лише get()/set(): React Compiler робить `.value` залежністю
  // мемоізації й читає його під час рендеру
  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        if (!isScreenFocused.get()) return;
        keyboardCollapse.set(
          withTiming(e.height > 0 ? 1 : 0, { duration: e.duration }),
        );
      },
      onEnd: (e) => {
        'worklet';
        if (isScreenFocused.get() && e.height === 0) {
          scheduleOnRN(onKeyboardHidden);
        }
      },
    },
    [onKeyboardHidden],
  );
  const spacerStyle = useAnimatedStyle(() => ({
    height: spacerHeight.value,
  }));

  return (
    <View style={styles.container}>
      {/* Скролить до поля у фокусі, коли відкривається клавіатура */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onScrollBeginDrag={() => setUserScrolling(true)}
        onScrollEndDrag={(e) => {
          // Без інерції onMomentumScrollEnd не прийде. Інерції немає і тоді,
          // коли палець відпустили на краю контенту зі швидкістю: скрол уже
          // там, куди мав би доїхати
          const { velocity, targetContentOffset, contentOffset } =
            e.nativeEvent;
          const hasMomentum =
            Math.abs(velocity?.y ?? 0) >= 0.1 &&
            Math.abs((targetContentOffset?.y ?? 0) - contentOffset.y) >= 1;
          if (!hasMomentum) {
            setUserScrolling(false);
            snapHeader(e);
          }
        }}
        onMomentumScrollEnd={(e) => {
          setUserScrolling(false);
          snapHeader(e);
        }}
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
        scrollIndicatorInsets={{ top: contentTop, bottom: bottomInset }}
        contentInsetAdjustmentBehavior='never'
        // Скрол тепер доходить до верху екрана, під навбар: iOS не має сам
        // додавати відступ під safe area, його вже містить висота навбару
        automaticallyAdjustContentInsets={false}
        alwaysBounceVertical={hasRefreshControl}
        scrollEventThrottle={16}
        style={{ backgroundColor: bg }}
        contentContainerStyle={[
          { flexGrow: 1, paddingTop: contentTop },
          toPadding(contentInsets),
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...rest}
      >
        {children}
        <View onLayout={(e) => setContentEnd(e.nativeEvent.layout.y)} />
        <Animated.View style={spacerStyle} />
      </KeyboardAwareScrollView>
      <ThemedNavigationBar
        type={type}
        barType={barType}
        title={title}
        subtitle={subtitle}
        headerAccessory={headerAccessory}
        headerContent={headerContent}
        headerTrailing={headerTrailing}
        navigationBarButtons={navigationBarButtons}
        onNavigationButtonPress={onNavigationButtonPress}
        scrollY={headerScrollY}
        collapseDistance={collapseDistance}
        onHeightChange={setHeaderHeight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
