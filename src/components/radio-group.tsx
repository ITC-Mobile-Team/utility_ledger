import { Pressable } from './pressable';
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
  // Префікс: варіанти отримують `${testID}.${value}`
  testID?: string;
};

export function RadioGroup<T extends string>({
  items,
  value,
  onChange,
  testID,
}: RadioGroupProps<T>) {
  return (
    <VStack spacing={8}>
      {items.map((item) => {
        return (
          <Pressable
            guarded={false}
            key={item.value}
            accessibilityRole='radio'
            accessibilityState={{ selected: item.value === value }}
            testID={testID && `${testID}.${item.value}`}
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
