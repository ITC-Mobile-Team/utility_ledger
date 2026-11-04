import { AppImage, HStack, Pressable, ThemedText } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import type { QueueSettings } from '@/services/outages';
import { ScrollView, StyleSheet } from 'react-native';

type QueueChipsProps = {
  queues: QueueSettings[];
  selected: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

// Перемикач між обраними чергами; «+» відкриває налаштування черг
export function QueueChips({
  queues,
  selected,
  onSelect,
  onAdd,
}: QueueChipsProps) {
  const surface = useThemeColor('surface');
  const line = useThemeColor('line');
  const powerOn = useThemeColor('powerOn');
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
              {
                backgroundColor: isSelected ? powerOn : surface,
                borderColor: isSelected ? powerOn : line,
              },
              state.pressed && styles.pressed,
            ]}
          >
            <HStack align='center' spacing={6}>
              <ThemedText
                font='rowTitleCompact'
                color={isSelected ? 'powerOnText' : 'ink'}
              >
                {queue.id}
              </ThemedText>
              {queue.name && (
                <ThemedText
                  font='labelMedium'
                  color={isSelected ? 'powerOnText' : 'muted'}
                >
                  {queue.name}
                </ThemedText>
              )}
            </HStack>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Змінити черги'
        onPress={onAdd}
        style={(state) => [
          styles.chip,
          styles.add,
          { backgroundColor: surface, borderColor: line },
          state.pressed && styles.pressed,
        ]}
      >
        <AppImage icon='plus' tintColor='ink' size={{ width: 18 }} />
      </Pressable>
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
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  add: {
    width: 40,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
