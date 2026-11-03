import { HStack } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

type PageIndicatorProps = {
  count: number;
  progress: SharedValue<number>;
};

export function PageIndicator({ count, progress }: PageIndicatorProps) {
  return (
    <HStack align='center' spacing={6} style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} index={index} progress={progress} />
      ))}
    </HStack>
  );
}

type DotProps = {
  index: number;
  progress: SharedValue<number>;
};

function Dot({ index, progress }: DotProps) {
  const activeColor = useThemeColor('coral');
  const inactiveColor = useThemeColor('track');

  // 0 — крапка активна, 1 — сусідня або далі
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.min(1, Math.abs(progress.value - index));
    return {
      width: interpolate(distance, [0, 1], [28, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        distance,
        [0, 1],
        [activeColor, inactiveColor],
      ),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    height: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
