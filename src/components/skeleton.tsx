import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  StyleSheet,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ThemedView } from './themed-view';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// Відблиск, що пробігає блоком зліва направо, як `.skel::after` у дизайні
const shine = {
  light: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.55)',
    'rgba(255,255,255,0)',
  ],
  dark: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.08)',
    'rgba(255,255,255,0)',
  ],
} as const;

// Спільний прогрес відблиску для всіх блоків одного скелетона (1,3 с)
export function useSkeletonShine(): SharedValue<number> {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        -1,
      ),
    );
  }, [progress]);
  return progress;
}

type SkeletonBoneProps = {
  style?: StyleProp<ViewStyle>;
  progress: SharedValue<number>;
};

// Блок скелетона: колір `track`, радіус 10, відблиск
export function SkeletonBone({ style, progress }: SkeletonBoneProps) {
  const scheme = useColorScheme() ?? 'light';
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${-100 + 200 * progress.get()}%` }],
  }));
  return (
    <ThemedView backgroundColor='track' style={[styles.bone, style]}>
      <AnimatedGradient
        colors={shine[scheme]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, shineStyle]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bone: {
    borderRadius: 10,
    overflow: 'hidden',
  },
});
