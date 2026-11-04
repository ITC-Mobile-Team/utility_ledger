import { ThemedText, ThemedView } from '@/components';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// display — статичний барабан (ілюстрації); решта — введення цифра за цифрою
export type MeterDigitState = 'display' | 'filled' | 'active' | 'blank';

type MeterDigitProps = {
  digit: string;
  state: MeterDigitState;
  // Остання (дробова) цифра лічильника — червона
  isLast: boolean;
  isError?: boolean;
};

const ENTRY = {
  filled: '#2A3D5C',
  active: '#1E2D44',
  blankRim: 'rgba(255,255,255,0.16)',
  blankRimLast: 'rgba(210,57,47,0.55)',
  focus: '#5B9BFF',
  focusGlow: 'rgba(91,155,255,0.28)',
  focusLast: '#FF8E86',
  focusGlowLast: 'rgba(255,142,134,0.28)',
  error: '#FF8E86',
} as const;

export function MeterDigit({
  digit,
  state,
  isLast,
  isError = false,
}: MeterDigitProps) {
  if (state === 'display') {
    return (
      <ThemedView
        backgroundColor={isLast ? 'coral' : 'meterDigit'}
        style={[styles.displayCell, !digit && styles.empty]}
      >
        <ThemedText color='onPrimary' font='meterDigit'>
          {digit}
        </ThemedText>
      </ThemedView>
    );
  }

  if (state === 'filled') {
    return (
      <ThemedView
        backgroundColor={isLast ? 'coral' : undefined}
        style={[
          styles.entryCell,
          !isLast && { backgroundColor: ENTRY.filled },
          isError && styles.errorCell,
        ]}
      >
        <ThemedText color='onPrimary' font='meterDigit'>
          {digit}
        </ThemedText>
      </ThemedView>
    );
  }

  if (state === 'active') {
    return (
      <View
        style={[
          styles.entryCell,
          styles.activeCell,
          isLast ? styles.activeLast : styles.activeDefault,
        ]}
      >
        <Caret />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.entryCell,
        styles.blankCell,
        { borderColor: isLast ? ENTRY.blankRimLast : ENTRY.blankRim },
      ]}
    />
  );
}

// Миготливий курсор в активній клітинці
function Caret() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(0, { duration: 0 })),
        withDelay(500, withTiming(1, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.caret, animatedStyle]} />;
}

const styles = StyleSheet.create({
  displayCell: {
    width: 36,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  empty: {
    opacity: 0.35,
  },
  entryCell: {
    width: 46,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  errorCell: {
    borderWidth: 2,
    borderColor: ENTRY.error,
  },
  activeCell: {
    backgroundColor: ENTRY.active,
    borderWidth: 2,
  },
  activeDefault: {
    borderColor: ENTRY.focus,
    boxShadow: `0 0 0 4px ${ENTRY.focusGlow}`,
  },
  activeLast: {
    borderColor: ENTRY.focusLast,
    boxShadow: `0 0 0 4px ${ENTRY.focusGlowLast}`,
  },
  blankCell: {
    borderWidth: 1.5,
  },
  caret: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
});
