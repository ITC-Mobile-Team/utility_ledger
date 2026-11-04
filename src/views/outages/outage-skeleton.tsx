import { HStack, ThemedText, ThemedView, VStack } from '@/components';
import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const Bone = ({ style }: { style: ViewStyle }) => (
  <ThemedView backgroundColor='track' style={[styles.bone, style]} />
);

type OutageSkeletonProps = {
  providerName: string;
};

// Заглушка на час першого завантаження графіка: повторює форму картки
// статусу, смуги доби й списку вимкнень, блоки плавно пульсують
export function OutageSkeleton({ providerName }: OutageSkeletonProps) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(
      withRepeat(
        withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <VStack
      spacing={14}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Завантажуємо графік'
    >
      <Animated.View style={[styles.stack, pulseStyle]}>
        <ThemedView backgroundColor='surface' style={styles.card}>
          <HStack align='center' spacing={14}>
            <Bone style={styles.circle} />
            <VStack spacing={8} style={styles.flex}>
              <Bone style={{ height: 20, width: '60%' }} />
              <Bone style={{ height: 14, width: '85%' }} />
            </VStack>
          </HStack>
        </ThemedView>

        <ThemedView backgroundColor='surface' style={styles.timeline}>
          <HStack style={styles.between}>
            <Bone style={{ height: 16, width: 90 }} />
            <Bone style={{ height: 14, width: 120 }} />
          </HStack>
          <Bone style={styles.bar} />
          <HStack style={styles.between}>
            {[0, 1, 2, 3, 4].map((tick) => (
              <Bone key={tick} style={{ height: 10, width: 18 }} />
            ))}
          </HStack>
        </ThemedView>

        <Bone style={{ height: 12, width: 90, marginLeft: 4 }} />
        <ThemedView backgroundColor='surface' style={styles.list}>
          {[0, 1, 2].map((row) => (
            <VStack key={row}>
              {row > 0 && (
                <ThemedView backgroundColor='line' style={styles.divider} />
              )}
              <HStack align='center' spacing={12} style={styles.row}>
                <Bone style={styles.dot} />
                <VStack spacing={6} style={styles.flex}>
                  <Bone style={{ height: 16, width: '55%' }} />
                  <Bone style={{ height: 12, width: '40%' }} />
                </VStack>
                <Bone style={{ height: 14, width: 70 }} />
              </HStack>
            </VStack>
          ))}
        </ThemedView>
      </Animated.View>
      <ThemedText font='footnote' color='muted' align='center'>
        Завантажуємо графік {providerName}…
      </ThemedText>
    </VStack>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  bone: {
    borderRadius: 6,
  },
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  flex: {
    flex: 1,
  },
  timeline: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
  },
  between: {
    justifyContent: 'space-between',
  },
  bar: {
    height: 30,
    borderRadius: 8,
    marginTop: 8,
  },
  list: {
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
