import {
  AppImage,
  HStack,
  Pressable,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { getIconTone, iconTiles } from '@/constants/icon-sizes';
import type { AnalyticsSummary } from '@/services/analytics';
import { formatMoney } from '@/services/ledger';
import { StyleSheet } from 'react-native';
import { MonthBars } from './month-bars';

type ExpensesCardProps = {
  summary: AnalyticsSummary;
  onPress: () => void;
};

const tile = iconTiles.touch;

// Картка «Витрати» (артборд 14): сума за період, графік по місяцях, середнє
// й плитки «Послуги» та «Місяців заповнено»; тап відкриває деталі
export function ExpensesCard({ summary, onPress }: ExpensesCardProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityHint='Відкриває деталі витрат'
      testID='analytics.total'
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView backgroundColor='surface' style={styles.card}>
        <HStack align='center' style={styles.top}>
          {/* Синя мʼяка підкладка під синьо-сірим ↗️, гліф центрує EmojiGlyph */}
          <ThemedView
            backgroundColor={getIconTone('arrowUpRight')}
            style={styles.tile}
          >
            <AppImage icon='arrowUpRight' container={tile} />
          </ThemedView>
          <ThemedBadge text='UAH' type='blue' />
        </HStack>

        <VStack spacing={2}>
          <ThemedText color='muted' font='rowTitle'>
            Витрати
          </ThemedText>
          <ThemedText font='amount' adjustsFontSizeToFit numberOfLines={1}>
            {formatMoney(summary.total)}
          </ThemedText>
        </VStack>

        <MonthBars months={summary.months} />

        {summary.average !== null && (
          <ThemedView backgroundColor='surface2' style={styles.average}>
            <ThemedText font='bodySmallStrong'>
              {`У середньому ${formatMoney(Math.round(summary.average))} на місяць`}
            </ThemedText>
          </ThemedView>
        )}

        <HStack spacing={10}>
          <Stat value={String(summary.serviceCount)} title='Послуги' />
          <Stat
            value={String(summary.filledMonthCount)}
            title='Місяців заповнено'
          />
        </HStack>
      </ThemedView>
    </Pressable>
  );
}

function Stat({ value, title }: { value: string; title: string }) {
  return (
    <ThemedView backgroundColor='surface2' style={styles.stat}>
      <ThemedText font='statValue'>{value}</ThemedText>
      <ThemedText color='muted' font='caption'>
        {title}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 20,
    gap: 16,
  },
  top: {
    justifyContent: 'space-between',
  },
  tile: {
    width: tile,
    height: tile,
    borderRadius: tile / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  average: {
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  stat: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
});
