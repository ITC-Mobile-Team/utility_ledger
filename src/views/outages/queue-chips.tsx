import { HStack, Pressable, ThemedText } from '@/components';
import type { QueueSettings } from '@/services/outages';
import { ScrollView, StyleSheet } from 'react-native';

type QueueChipsProps = {
  queues: QueueSettings[];
  selected: string;
  onSelect: (id: string) => void;
};

// Перемикач між обраними чергами в шапці навбару «Світла»: скляні чипи на
// градієнті, обраний — білий. Набір черг змінюється через шестерню в навбарі
export function QueueChips({ queues, selected, onSelect }: QueueChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole='tablist'
      accessibilityLabel='Черги'
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {queues.map((queue) => {
        const isSelected = queue.id === selected;
        return (
          <Pressable
            key={queue.id}
            guarded={false}
            accessibilityRole='tab'
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(queue.id)}
            style={(state) => [
              styles.chip,
              isSelected && styles.selected,
              state.pressed && styles.pressed,
            ]}
          >
            <HStack align='center' spacing={6}>
              <ThemedText
                font='rowTitleCompact'
                color={isSelected ? 'powerOnText' : 'onPrimary'}
              >
                {queue.id}
              </ThemedText>
              {queue.name && (
                <ThemedText
                  font='labelMedium'
                  color={isSelected ? 'powerOnInkOnLight' : 'heroSubPower'}
                >
                  {queue.name}
                </ThemedText>
              )}
            </HStack>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -20,
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  selected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
  },
  pressed: {
    opacity: 0.7,
  },
});
