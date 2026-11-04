import { ThemedText, ThemedView } from '@/components';
import {
  formatDuration,
  formatTime,
  type OutageInterval,
} from '@/services/outages';
import { ListCard, ListRow } from '@/views/objects';
import { StyleSheet, View } from 'react-native';

type OutageListProps = {
  intervals: OutageInterval[];
  // Хвилини від початку доби; лише для сьогоднішнього дня
  nowMinutes?: number;
};

const describe = ({ start, end, switchEnd }: OutageInterval) => {
  const duration = `${formatDuration(end - start)} без світла`;
  return switchEnd > end
    ? `${duration} · перемикання до ${formatTime(switchEnd)}`
    : duration;
};

// Список вимкнень дня з позначкою «Зараз» / «Минуло» / «через …»
export function OutageList({ intervals, nowMinutes }: OutageListProps) {
  return (
    <ListCard>
      {intervals.map((interval) => {
        const hasNow = nowMinutes !== undefined;
        const isNow =
          hasNow &&
          nowMinutes >= interval.start &&
          nowMinutes < interval.switchEnd;
        const isPast = hasNow && nowMinutes >= interval.switchEnd;
        return (
          <View key={interval.start} style={isPast && styles.past}>
            <ListRow
              showsChevron={false}
              leading={
                <ThemedView
                  backgroundColor={isNow ? 'coral' : 'powerOff'}
                  style={styles.dot}
                />
              }
              trailing={
                isNow ? (
                  <ThemedView backgroundColor='coral' style={styles.nowTag}>
                    <ThemedText font='status' color='onPrimary'>
                      Зараз
                    </ThemedText>
                  </ThemedView>
                ) : hasNow ? (
                  <ThemedText font='status' color='muted'>
                    {isPast
                      ? 'Минуло'
                      : `через ${formatDuration(interval.start - nowMinutes)}`}
                  </ThemedText>
                ) : undefined
              }
            >
              <ThemedText font='rowTitle'>
                {formatTime(interval.start)} – {formatTime(interval.end)}
              </ThemedText>
              <ThemedText font='caption' color='muted'>
                {describe(interval)}
              </ThemedText>
            </ListRow>
          </View>
        );
      })}
    </ListCard>
  );
}

const styles = StyleSheet.create({
  past: {
    opacity: 0.45,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nowTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
