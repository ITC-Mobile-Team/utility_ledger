import { useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

const PADDING = 3;
const GAP = 3;

export type SegmentItem<T extends string> = {
  value: T;
  label: string;
};

type SegmentProps<T extends string> = {
  items: readonly SegmentItem<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function Segment<T extends string>({
  items,
  value,
  onChange,
  style,
}: SegmentProps<T>) {
  const surface = useThemeColor('surface');
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  const itemWidth = useSharedValue(0);
  const translateX = useSharedValue(0);

  // Перший вимір: ставимо індикатор на місце без анімації
  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    const w = (width - PADDING * 2 - GAP * (items.length - 1)) / items.length;
    itemWidth.set(w);
    translateX.set(selectedIndex * (w + GAP));
  };

  // Зміна вибраного айтема: плавно їдемо до нової позиції
  useEffect(() => {
    translateX.set(
      withTiming(selectedIndex * (itemWidth.get() + GAP), {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [selectedIndex, itemWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth.get(),
    opacity: itemWidth.get() > 0 ? 1 : 0, // ховаємо до першого виміру
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <ThemedView
      backgroundColor='track'
      accessibilityRole='tablist'
      onLayout={onLayout}
      style={[styles.container, style]}
    >
      <Animated.View
        pointerEvents='none'
        style={[styles.indicator, { backgroundColor: surface }, indicatorStyle]}
      />

      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole='tab'
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                onChange(item.value);
              }
            }}
            style={(state) => [
              styles.item,
              state.pressed && !selected && styles.pressed,
            ]}
          >
            <View style={styles.button}>
              <ThemedText
                font='segment'
                color={selected ? 'ink' : 'muted'}
                numberOfLines={1}
                style={styles.label}
              >
                {item.label}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  item: {
    flex: 1,
  },
  button: {
    marginVertical: 3,
    borderRadius: 10,
  },
  label: {
    padding: 10,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
