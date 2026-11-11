import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useIsFocused } from 'expo-router';
import { type PropsWithChildren, useEffect } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Пульсація ілюстрацій порожніх станів (`ui.css` «Pulse — empty / waiting
// states», docs/patterns/empty-state-pulse.md): цикл 2,8 с, друге кільце
// зі зсувом 1,4 с, плитка «дихає» до 106 %
const CYCLE_MS = 2800;

type PulseColor = Extract<AppColor, 'blueSoft2' | 'powerOnSoft' | 'line'>;

// Анімація лише на екрані у фокусі й без системного «Зменшити рух»
export function usePulseActive(): boolean {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  return isFocused && !reduceMotion;
}

type PulseRingsProps = {
  color: PulseColor;
  // Діаметр ілюстрації: кільця на весь контейнер і розходяться до 135 %
  size: number;
};

// Два кільця, що по черзі розходяться від центру й зникають. Ставити першим
// дочірнім елементом контейнера ілюстрації — під її колами
export function PulseRings({ color, size }: PulseRingsProps) {
  const isActive = usePulseActive();
  if (!isActive) return null;
  return (
    <>
      <Ring color={color} size={size} delay={0} />
      <Ring color={color} size={size} delay={CYCLE_MS / 2} />
    </>
  );
}

function Ring({ color, size, delay }: PulseRingsProps & { delay: number }) {
  const backgroundColor = useThemeColor(color);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: CYCLE_MS,
            easing: Easing.out(Easing.ease),
          }),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(progress);
  }, [delay, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.get();
    return {
      opacity: 0.9 * (1 - t),
      transform: [{ scale: 0.55 + 0.8 * t }],
    };
  });

  return (
    <Animated.View
      pointerEvents='none'
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
        style,
      ]}
    />
  );
}

type PulseCoreProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

// Центральна плитка ілюстрації: масштаб 1 → 1.06 → 1 за 2,8 с
export function PulseCore({ style, children }: PulseCoreProps) {
  const isActive = usePulseActive();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      resetScale(scale);
      return;
    }
    scale.set(
      withRepeat(
        withTiming(1.06, {
          duration: CYCLE_MS / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => resetScale(scale);
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

function resetScale(scale: SharedValue<number>) {
  cancelAnimation(scale);
  scale.set(1);
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
