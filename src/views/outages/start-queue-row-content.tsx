import { Chevron, HStack, ThemedText, VStack } from '@/components';
import type { QueueId, QueueSettings } from '@/services/outages';
import { StyleSheet } from 'react-native';

export type StartQueueRowProps = {
  queues: QueueSettings[];
  value: QueueId;
  onChange: (next: QueueId) => void;
};

// Назва черги в меню й рядку: власна назва, якщо задана, інакше «Черга 1.1»
export const getQueueLabel = (queue: QueueSettings) =>
  queue.name?.trim()
    ? `${queue.id} · ${queue.name.trim()}`
    : `Черга ${queue.id}`;

export const getStartQueueLabel = (queues: QueueSettings[], value: QueueId) => {
  const queue = queues.find((item) => item.id === value);
  return queue ? getQueueLabel(queue) : `Черга ${value}`;
};

// Вигляд рядка «Стартова черга»: значення праворуч і шеврон вгору-вниз, що
// натякає на меню. Спільний для iOS і Android, де рядок — тригер меню
export function StartQueueRowContent({
  queues,
  value,
}: Pick<StartQueueRowProps, 'queues' | 'value'>) {
  return (
    <HStack align='center' spacing={12} style={styles.row}>
      <VStack spacing={2} style={styles.copy}>
        <ThemedText font='rowTitle'>Стартова черга</ThemedText>
        <ThemedText color='muted' font='caption'>
          Відкривається першою після запуску
        </ThemedText>
      </VStack>
      <ThemedText style={styles.value} numberOfLines={1}>
        {getStartQueueLabel(queues, value)}
      </ThemedText>
      <Chevron direction='upDown' />
    </HStack>
  );
}

export const startQueueRowStyles = StyleSheet.create({
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
    maxWidth: 150,
    fontSize: 15,
  },
});
