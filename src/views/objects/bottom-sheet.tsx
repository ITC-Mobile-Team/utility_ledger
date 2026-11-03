import { ThemedView } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  GestureDetector,
  GestureHandlerRootView,
  type PanGestureActiveEvent,
  usePanGesture,
} from 'react-native-gesture-handler';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  // Тягнути можна лише за грабер — щоб свайп не конфліктував зі скролом списку
  dragByGrabberOnly?: boolean;
  style?: ViewStyle;
}>;

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const SCRIM_DURATION = 200;
const SHEET_DELAY = 150;
// Частка висоти шторки або швидкість свайпу, після яких вона закривається
const CLOSE_DISTANCE_RATIO = 0.3;
const CLOSE_VELOCITY = 800;

// Шторка знизу поверх затемнення; спершу темніє фон, потім виїжджає шторка.
// Закривається тапом по фону, свайпом униз або кнопкою «Назад» — завжди з анімацією
export function BottomSheet({
  visible,
  onClose,
  dragByGrabberOnly = false,
  style,
  children,
}: BottomSheetProps) {
  const scrim = useThemeColor('scrim');
  const { bottom } = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [isMounted, setMounted] = useState(visible);
  const scrimOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);
  const sheetHeight = useSharedValue(screenHeight);

  // Монтуємо Modal одразу, а прибираємо лише після анімації закриття
  if (visible && !isMounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      scrimOpacity.value = withTiming(1, { duration: SCRIM_DURATION });
      translateY.value = withDelay(
        SHEET_DELAY,
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      translateY.value = withTiming(screenHeight, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      scrimOpacity.value = withDelay(
        SHEET_DELAY,
        withTiming(0, { duration: SCRIM_DURATION }, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, screenHeight, scrimOpacity, translateY]);

  const onPanUpdate = (event: PanGestureActiveEvent) => {
    'worklet';
    const offset = Math.max(event.translationY, 0);
    translateY.set(offset);
    scrimOpacity.set(1 - offset / sheetHeight.get());
  };
  const onPanEnd = (event: PanGestureActiveEvent) => {
    'worklet';
    const shouldClose =
      event.translationY > sheetHeight.get() * CLOSE_DISTANCE_RATIO ||
      event.velocityY > CLOSE_VELOCITY;
    if (shouldClose) {
      scheduleOnRN(onClose);
      return;
    }
    translateY.set(withSpring(0, { damping: 24, stiffness: 260 }));
    scrimOpacity.set(withTiming(1, { duration: SCRIM_DURATION }));
  };
  // Worklets-плагін приймає лише літерал обʼєкта, тож конфіг без spread
  const sheetPan = usePanGesture({
    enabled: !dragByGrabberOnly,
    activeOffsetY: 8,
    failOffsetX: [-20, 20],
    onUpdate: onPanUpdate,
    onDeactivate: onPanEnd,
  });
  const grabberPan = usePanGesture({
    enabled: dragByGrabberOnly,
    activeOffsetY: 8,
    failOffsetX: [-20, 20],
    onUpdate: onPanUpdate,
    onDeactivate: onPanEnd,
  });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      {/* Modal рендериться поза кореневим GestureHandlerRootView */}
      <GestureHandlerRootView style={styles.container}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: scrim },
            scrimStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel='Закрити'
          />
        </Animated.View>
        <GestureDetector gesture={sheetPan}>
          <AnimatedThemedView
            backgroundColor='surface'
            onLayout={(event) => {
              sheetHeight.set(event.nativeEvent.layout.height);
            }}
            style={[
              styles.sheet,
              { paddingBottom: bottom + 16 },
              style,
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={grabberPan}>
              <View style={styles.grabberArea}>
                <ThemedView backgroundColor='line' style={styles.grabber} />
              </View>
            </GestureDetector>
            {children}
          </AnimatedThemedView>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  grabberArea: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    marginVertical: -8,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
});
