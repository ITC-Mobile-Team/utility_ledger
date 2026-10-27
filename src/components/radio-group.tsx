import { Pressable } from 'react-native';
import { RadioCard } from './radio-card';
import { VStack } from './stack';

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
    <VStack spacing={8}>
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
    </VStack>
  );
}
