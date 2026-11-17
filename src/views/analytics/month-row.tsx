import { ThemedText, ThemedView } from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { monthAppearance } from '@/constants/month-emoji';
import type { AnalyticsMonth } from '@/services/analytics';
import { formatMoney, getMonthName, parseMonthKey } from '@/services/ledger';
import { StyleSheet } from 'react-native';
import { EmojiTile } from '../objects/emoji-tile';
import { ListRow } from '../objects/list-card';

type AnalyticsMonthRowProps = {
  item: AnalyticsMonth;
  variant: 'list' | 'details';
  index: number;
  onPress?: () => void;
};

// Рядок місяця: на головному екрані — смужка частки від найбільшого місяця,
// на деталях — відсоток від періоду
export function AnalyticsMonthRow({
  item,
  variant,
  index,
  onPress,
}: AnalyticsMonthRowProps) {
  const { year, monthIndex } = parseMonthKey(item.month);
  const appearance = monthAppearance[monthIndex] ?? monthAppearance[0];
  const name = getMonthName(item.month);
  const now = new Date().getFullYear();
  return (
    <ListRow
      testID={
        variant === 'list'
          ? `analytics.month.${index}`
          : `analytics.details.month.${index}`
      }
      showsChevron={false}
      leading={
        appearance && (
          <EmojiTile
            emoji={appearance.emoji}
            background={appearance.background}
            size={iconTiles.menu}
          />
        )
      }
      trailing={
        <ThemedText font='rowTitle' align='right' style={styles.amount}>
          {formatMoney(item.total)}
        </ThemedText>
      }
      onPress={onPress}
    >
      <ThemedText font='rowTitle' numberOfLines={1}>
        {year === now ? name : `${name} ${year}`}
      </ThemedText>
      {variant === 'list' ? (
        <ThemedView backgroundColor='track' style={styles.track}>
          <ThemedView
            backgroundColor='green'
            style={[styles.fill, { width: `${item.ratio * 100}%` }]}
          />
        </ThemedView>
      ) : (
        <ThemedText color='muted' font='caption'>
          {`${item.share}% від періоду`}
        </ThemedText>
      )}
    </ListRow>
  );
}

const styles = StyleSheet.create({
  amount: {
    minWidth: 96,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
