import { AppImage, HStack, ThemedText, VStack } from '@/components';
import { getStartTabLabel, type StartTab } from '@/services/preferences';
import { StyleSheet } from 'react-native';
import { RowIcon } from './row-icon';

export type StartTabRowProps = {
  value: StartTab;
  onChange: (next: StartTab) => void;
};

// Вигляд рядка «Стартова вкладка»: значення праворуч і шеврон вгору-вниз,
// що натякає на меню. Спільний для iOS і Android, де рядок стає тригером
// нативного меню
export function StartTabRowContent({ value }: { value: StartTab }) {
  return (
    <HStack align='center' spacing={12} style={styles.row}>
      <RowIcon icon='house' />
      <VStack spacing={2} style={styles.copy}>
        <ThemedText font='rowTitle'>Стартова вкладка</ThemedText>
      </VStack>
      <ThemedText style={styles.value} numberOfLines={1}>
        {getStartTabLabel(value)}
      </ThemedText>
      <AppImage icon='chevronUpDown' tintColor='chev' size={{ width: 18 }} />
    </HStack>
  );
}

export const startTabRowStyles = StyleSheet.create({
  host: {
    alignSelf: 'stretch',
  },
});

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  copy: {
    flex: 1,
  },
  value: {
    maxWidth: 140,
    fontSize: 15,
  },
});
