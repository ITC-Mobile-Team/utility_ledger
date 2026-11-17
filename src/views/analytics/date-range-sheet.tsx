import {
  Chevron,
  HStack,
  Pressable,
  TextButton,
  ThemedText,
  ThemedView,
} from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import {
  type AnalyticsPeriod,
  type CalendarDate,
  compareDates,
  formatShortDate,
  isSameDate,
  todayDate,
} from '@/services/analytics';
import { formatMonthTitle, toMonthKey } from '@/services/ledger';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '../objects/bottom-sheet';

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'] as const;
// Трохи менше 1/7: з точним 100/7 % сьомий день через округлення переноситься
const DAY_WIDTH = '14.28%';

type DateRangeSheetProps = {
  visible: boolean;
  edge: 'start' | 'end';
  period: AnalyticsPeriod;
  onClose: () => void;
  onSave: (date: CalendarDate) => void;
};

// Шторка вибору дати періоду (артборди 14b, 14c): календар днів з понеділка,
// чернетка застосовується лише на «Готово». Неактивні дні — ті, що зробили б
// період некоректним, і для «До» — дні після сьогодні
export function DateRangeSheet({
  visible,
  edge,
  period,
  onClose,
  onSave,
}: DateRangeSheetProps) {
  const initial = edge === 'start' ? period.start : period.end;
  const [draft, setDraft] = useState(initial);
  const [view, setView] = useState({
    year: initial.year,
    monthIndex: initial.monthIndex,
  });
  const today = todayDate();
  const start = edge === 'start' ? draft : period.start;
  const end = edge === 'end' ? draft : period.end;

  const isDisabled = (date: CalendarDate) =>
    edge === 'start'
      ? compareDates(date, period.end) > 0
      : compareDates(date, period.start) < 0 || compareDates(date, today) > 0;

  const shift = (delta: number) => {
    const date = new Date(view.year, view.monthIndex + delta, 1);
    setView({ year: date.getFullYear(), monthIndex: date.getMonth() });
  };

  const blanks = (new Date(view.year, view.monthIndex, 1).getDay() + 6) % 7;
  const count = new Date(view.year, view.monthIndex + 1, 0).getDate();
  const cells: (CalendarDate | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: count }, (_, i) => ({ ...view, day: i + 1 })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const title = edge === 'start' ? 'Початкова дата' : 'Кінцева дата';

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <HStack align='center' style={styles.header}>
        <TextButton
          title='Скасувати'
          color='muted'
          testID='analytics.sheet.date.cancel'
          onPress={onClose}
        />
        <ThemedText font='heading' accessibilityRole='header'>
          {title}
        </ThemedText>
        <TextButton
          title='Готово'
          color='greenInk'
          testID='analytics.sheet.date.done'
          onPress={() => onSave(draft)}
        />
      </HStack>

      <HStack align='center' style={styles.header}>
        <ThemedText font='titleSmall' accessibilityLiveRegion='polite'>
          {formatMonthTitle(
            toMonthKey(new Date(view.year, view.monthIndex, 1)),
          )}
        </ThemedText>
        <HStack spacing={4}>
          <MonthButton direction='previous' onPress={() => shift(-1)} />
          <MonthButton direction='next' onPress={() => shift(1)} />
        </HStack>
      </HStack>

      <View>
        <View style={styles.grid}>
          {WEEKDAYS.map((day) => (
            <ThemedText
              key={day}
              color='muted'
              font='labelStrong'
              align='center'
              style={styles.weekday}
            >
              {day}
            </ThemedText>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((date, index) =>
            date ? (
              <DayCell
                key={index}
                date={date}
                selected={isSameDate(date, draft)}
                inRange={
                  compareDates(date, start) >= 0 && compareDates(date, end) <= 0
                }
                disabled={isDisabled(date)}
                onPress={() => setDraft(date)}
              />
            ) : (
              <View key={index} style={styles.cell} />
            ),
          )}
        </View>
      </View>

      <ThemedView backgroundColor='surface2' style={styles.summary}>
        <ThemedText color='muted' font='bodySmall'>
          Період
        </ThemedText>
        <ThemedText font='bodySmallStrong'>
          {`${formatShortDate(start)} – ${formatShortDate(end)}`}
        </ThemedText>
      </ThemedView>
    </BottomSheet>
  );
}

type DayCellProps = {
  date: CalendarDate;
  selected: boolean;
  inRange: boolean;
  disabled: boolean;
  onPress: () => void;
};

function DayCell({ date, selected, inRange, disabled, onPress }: DayCellProps) {
  const greenBrand = useThemeColor('greenBrand');
  const greenSoft = useThemeColor('greenSoft');
  const textColor = selected
    ? 'onPrimary'
    : disabled
      ? 'faint'
      : inRange
        ? 'greenInk'
        : 'ink';
  return (
    <Pressable
      guarded={false}
      accessibilityRole='button'
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={formatShortDate(date)}
      disabled={disabled}
      testID={`analytics.sheet.date.day.${date.day}`}
      onPress={onPress}
      style={styles.cell}
    >
      <View
        style={[
          styles.day,
          selected
            ? { backgroundColor: greenBrand }
            : inRange && !disabled
              ? { backgroundColor: greenSoft }
              : undefined,
        ]}
      >
        <ThemedText
          color={textColor}
          font='calendarDay'
          style={selected && styles.selectedText}
        >
          {date.day}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function MonthButton({
  direction,
  onPress,
}: {
  direction: 'previous' | 'next';
  onPress: () => void;
}) {
  return (
    <Pressable
      guarded={false}
      accessibilityRole='button'
      accessibilityLabel={
        direction === 'previous' ? 'Попередній місяць' : 'Наступний місяць'
      }
      testID={
        direction === 'previous'
          ? 'analytics.sheet.date.prev'
          : 'analytics.sheet.date.next'
      }
      onPress={onPress}
      style={(state) => [styles.monthButton, state.pressed && styles.pressed]}
    >
      <View style={direction === 'previous' && styles.flipped}>
        <Chevron direction='right' color='greenInk' />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: DAY_WIDTH,
    paddingBottom: 6,
  },
  cell: {
    width: DAY_WIDTH,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontWeight: '700',
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
