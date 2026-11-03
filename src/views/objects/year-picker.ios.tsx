import { ThemedView } from '@/components';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, useColorScheme } from 'react-native';
import type { YearPickerProps } from './year-picker';

// Нативний iOS-барабан (SwiftUI Picker зі стилем wheel)
export function YearPicker({ years, selection, onChange }: YearPickerProps) {
  const scheme = useColorScheme() ?? 'light';
  return (
    <ThemedView backgroundColor='surface' style={styles.card}>
      <Host matchContents={{ vertical: true }} colorScheme={scheme}>
        <Picker
          selection={selection}
          onSelectionChange={onChange}
          modifiers={[pickerStyle('wheel')]}
        >
          {years.map((year) => (
            <Text key={year} modifiers={[tag(year)]}>
              {String(year)}
            </Text>
          ))}
        </Picker>
      </Host>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
});
