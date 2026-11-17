import { HStack, ThemedText, ThemedView, VStack } from '@/components';
import { type AnalyticsMonth, formatMonthShort } from '@/services/analytics';
import { getMonthLocative, getMonthName } from '@/services/ledger';
import { StyleSheet } from 'react-native';

const MAX_BARS = 12;
const BAR_HEIGHT = 46;

type MonthBarsProps = {
  months: readonly AnalyticsMonth[];
};

// Стовпчики витрат по місяцях (артборд 14): не більше 12 останніх місяців,
// висота — частка від найбільшого, останній місяць темно-зелений
export function MonthBars({ months }: MonthBarsProps) {
  const visible = months.slice(-MAX_BARS);
  const max = Math.max(0, ...visible.map((m) => m.total));
  const peak = visible.find((m) => m.total === max && max > 0);
  const first = visible[0];
  const last = visible[visible.length - 1];
  const range =
    first && last
      ? first.month === last.month
        ? getMonthName(first.month).toLocaleLowerCase('uk')
        : `${getMonthName(first.month).toLocaleLowerCase('uk')} – ${getMonthName(last.month).toLocaleLowerCase('uk')}`
      : '';
  const label = peak
    ? `Витрати по місяцях, ${range}: найбільше в ${getMonthLocative(peak.month)}`
    : `Витрати по місяцях, ${range}: записів немає`;

  return (
    <VStack spacing={6}>
      <HStack
        spacing={visible.length > 8 ? 4 : 8}
        style={styles.bars}
        accessible
        accessibilityRole='image'
        accessibilityLabel={label}
      >
        {visible.map((item, index) => {
          const height =
            max > 0 && item.total > 0
              ? Math.max(2, Math.round((item.total / max) * BAR_HEIGHT))
              : 0;
          return (
            <VStack key={item.month} spacing={4} style={styles.column}>
              <ThemedView
                backgroundColor={
                  index === visible.length - 1 ? 'greenBrand' : 'greenSoft2'
                }
                style={[styles.bar, { height }]}
              />
              <ThemedText
                color='muted'
                font='labelStrong'
                style={styles.label}
                numberOfLines={1}
              >
                {formatMonthShort(item.month)}
              </ThemedText>
            </VStack>
          );
        })}
      </HStack>
      {months.length > MAX_BARS && (
        <ThemedText color='muted' font='label'>
          Останні 12 місяців
        </ThemedText>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  bars: {
    height: 64,
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    alignSelf: 'stretch',
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
  },
});
