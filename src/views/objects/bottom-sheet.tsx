import { ThemedView } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { type PropsWithChildren, useEffect, useState } from 'react';
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
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  style?: ViewStyle;
}>;

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const SCRIM_DURATION = 200;
const SHEET_DELAY = 150;

// Шторка знизу поверх затемнення; спершу темніє фон, потім виїжджає шторка.
// Закривається тапом по фону
export function BottomSheet({
  visible,
  onClose,
  style,
  children,
}: BottomSheetProps) {
  const scrim = useThemeColor('scrim');
  const { bottom } = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [isMounted, setMounted] = useState(visible);
  const scrimOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

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
      <View style={styles.container}>
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
        <AnimatedThemedView
          backgroundColor='surface'
          style={[
            styles.sheet,
            { paddingBottom: bottom + 16 },
            style,
            sheetStyle,
          ]}
        >
          <ThemedView backgroundColor='line' style={styles.grabber} />
          {children}
        </AnimatedThemedView>
      </View>
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
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
});
