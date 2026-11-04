import { HStack, ThemedText, ThemedView, VStack } from '@/components';
import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { formatTime, SLOT_MINUTES, type SlotState } from '@/services/outages';
import { StyleSheet, View } from 'react-native';

type DayTimelineProps = {
  title: string;
  trailing: string;
  slots: SlotState[];
  // Хвилини від початку доби; лише для сьогоднішнього дня
  nowMinutes?: number;
};

const DAY_MINUTES = 24 * 60;
const ticks = ['00', '06', '12', '18', '24'];

// Смуга доби з 48 півгодинних клітинок і позначкою поточного часу
export function DayTimeline({
  title,
  trailing,
  slots,
  nowMinutes,
}: DayTimelineProps) {
  const onColor = useThemeColor('powerOn');
  const offColor = useThemeColor('powerOff');
  const switchColor = useThemeColor('powerSwitch');
  const slotColor = { on: onColor, off: offColor, maybe: switchColor };
  const hasNow = nowMinutes !== undefined;
  const hasSwitching = slots.includes('maybe');
  return (
    <ThemedView backgroundColor='surface' style={styles.card}>
      <VStack spacing={10}>
        <HStack align='bottom' style={styles.header}>
          <ThemedText font='rowTitle'>{title}</ThemedText>
          <ThemedText font='caption' color='muted'>
            {trailing}
          </ThemedText>
        </HStack>

        <View style={hasNow && styles.withNow}>
          {hasNow && (
            <View
              pointerEvents='none'
              style={[
                styles.now,
                { left: `${(nowMinutes / DAY_MINUTES) * 100}%` },
              ]}
            >
              <ThemedText font='labelStrong' style={styles.nowLabel}>
                {formatTime(nowMinutes)}
              </ThemedText>
              <ThemedView backgroundColor='ink' style={styles.nowLine} />
            </View>
          )}
          <HStack spacing={1} style={styles.bar}>
            {slots.map((slot, index) => {
              const isPast = hasNow && (index + 1) * SLOT_MINUTES <= nowMinutes;
              return (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    { backgroundColor: slotColor[slot] },
                    isPast && styles.past,
                  ]}
                />
              );
            })}
          </HStack>
          <HStack style={styles.ticks}>
            {ticks.map((tick) => (
              <ThemedText key={tick} font='label' color='muted'>
                {tick}
              </ThemedText>
            ))}
          </HStack>
        </View>

        <HStack spacing={16} style={styles.legend}>
          <LegendItem color='powerOn' label='Світло є' />
          <LegendItem color='powerOff' label='Вимкнення' />
          {hasSwitching && (
            <LegendItem color='powerSwitch' label='Перемикання' />
          )}
        </HStack>
      </VStack>
    </ThemedView>
  );
}

function LegendItem({ color, label }: { color: AppColor; label: string }) {
  return (
    <HStack align='center' spacing={6}>
      <ThemedView backgroundColor={color} style={styles.swatch} />
      <ThemedText font='label' color='muted'>
        {label}
      </ThemedText>
    </HStack>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
  },
  header: {
    justifyContent: 'space-between',
  },
  withNow: {
    paddingTop: 18,
  },
  now: {
    position: 'absolute',
    top: 0,
    bottom: 22,
    width: 2,
    marginLeft: -1,
    alignItems: 'center',
    zIndex: 1,
  },
  nowLabel: {
    position: 'absolute',
    top: 0,
    width: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  nowLine: {
    position: 'absolute',
    top: 16,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  bar: {
    height: 30,
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
  },
  past: {
    opacity: 0.35,
  },
  ticks: {
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legend: {
    flexWrap: 'wrap',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
});
