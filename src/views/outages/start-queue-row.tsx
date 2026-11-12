import { ThemedText } from '@/components';
import { ListRow } from '@/views/objects/list-card';
import { Alert, StyleSheet } from 'react-native';
import {
  getQueueLabel,
  getStartQueueLabel,
  type StartQueueRowProps,
} from './start-queue-row-content';

// Запасний варіант для платформ без нативного меню (веб)
export function StartQueueRow({ queues, value, onChange }: StartQueueRowProps) {
  return (
    <ListRow
      trailing={
        <ThemedText style={styles.value}>
          {getStartQueueLabel(queues, value)}
        </ThemedText>
      }
      showsChevron={false}
      testID='outageSettings.startQueue'
      onPress={() =>
        Alert.alert(
          'Стартова черга',
          undefined,
          queues.map((queue) => ({
            text: getQueueLabel(queue),
            onPress: () => onChange(queue.id),
          })),
        )
      }
    >
      <ThemedText font='rowTitle'>Стартова черга</ThemedText>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  value: {
    maxWidth: 150,
    fontSize: 15,
  },
});
