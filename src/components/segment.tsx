import { StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ThemedView, ThemedText } from './index';

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
  return (
    <ThemedView
      backgroundColor='track'
      accessibilityRole='tablist'
      style={[styles.container, style]}
    >
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
              state.pressed && !selected && styles.pressed,
              styles.item,
            ]}
          >
            <ThemedView
              backgroundColor={selected ? 'surface' : 'track'}
              style={styles.button}
            >
              <ThemedText
                font='segment'
                color={selected ? 'ink' : 'muted'}
                numberOfLines={1}
                style={styles.label}
              >
                {item.label}
              </ThemedText>
            </ThemedView>
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
    paddingHorizontal: 3,
    gap: 3,
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
