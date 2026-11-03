import { HStack, ThemedText, ThemedView } from '@/components';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

export type YearPickerProps = {
  years: number[];
  selection: number;
  onChange: (year: number) => void;
};

// Поза iOS нативного барабана немає — роки ідуть рядком «пігулок»
export function YearPicker({ years, selection, onChange }: YearPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <HStack spacing={8}>
        {years.map((year) => {
          const isSelected = year === selection;
          return (
            <Pressable
              key={year}
              onPress={() => onChange(year)}
              accessibilityState={{ selected: isSelected }}
            >
              <ThemedView
                backgroundColor={isSelected ? 'blue' : 'surface'}
                style={styles.chip}
              >
                <ThemedText
                  font='rowTitle'
                  color={isSelected ? 'onPrimary' : 'ink'}
                >
                  {String(year)}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
