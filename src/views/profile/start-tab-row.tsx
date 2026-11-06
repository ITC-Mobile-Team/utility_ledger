import { ThemedText } from '@/components';
import { getStartTabLabel, START_TABS } from '@/services/preferences';
import { ListRow } from '@/views/objects/list-card';
import { Alert, StyleSheet } from 'react-native';
import { RowIcon } from './row-icon';
import type { StartTabRowProps } from './start-tab-row-content';

// Запасний варіант для платформ без нативного меню (веб)
export function StartTabRow({ value, onChange }: StartTabRowProps) {
  return (
    <ListRow
      leading={<RowIcon icon='house' />}
      trailing={
        <ThemedText style={styles.value}>{getStartTabLabel(value)}</ThemedText>
      }
      showsChevron={false}
      testID='profile.startTab'
      onPress={() =>
        Alert.alert(
          'Стартова вкладка',
          undefined,
          START_TABS.map((tab) => ({
            text: getStartTabLabel(tab),
            onPress: () => onChange(tab),
          })),
        )
      }
    >
      <ThemedText font='rowTitle'>Стартова вкладка</ThemedText>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  value: {
    maxWidth: 140,
    fontSize: 15,
  },
});
