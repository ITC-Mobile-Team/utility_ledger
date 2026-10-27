import { Pressable, StyleSheet, View } from 'react-native';
import { RadioCard } from './radio-card';

export type RadioItem<T extends string> = {
  value: T;
  title: string;
  subtitle: string;
};

type RadioGroupProps<T extends string> = {
  items: readonly RadioItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function RadioGroup<T extends string>({
  items,
  value,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        return (
          <Pressable
            key={item.value}
            onPress={() => {
              onChange(item.value);
            }}
          >
            <RadioCard
              title={item.title}
              subtitle={item.subtitle}
              isSelected={item.value === value}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});
