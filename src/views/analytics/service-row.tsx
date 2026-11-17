import { ThemedText, VStack } from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import type { AnalyticsServiceTotal } from '@/services/analytics';
import {
  formatMoney,
  formatReading,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import { StyleSheet } from 'react-native';
import { ListRow } from '../objects/list-card';
import { ServiceIcon } from '../objects/service-icon';

type AnalyticsServiceRowProps = {
  item: AnalyticsServiceTotal;
  variant: 'list' | 'details';
  index: number;
  onPress?: () => void;
};

const records = (count: number) =>
  `${count} ${pluralize(count, pluralForms.record)}`;

const subtitle = (item: AnalyticsServiceTotal, variant: 'list' | 'details') => {
  const parts: string[] = [];
  if (item.addressCount > 1) {
    parts.push(
      `${item.addressCount} ${pluralize(item.addressCount, pluralForms.address)}`,
    );
  }
  if (variant === 'details' && item.consumption) {
    const { value, unit, fractionDigits } = item.consumption;
    // Без хвостових нулів: «38 м³», «1 520 кВт·год», «12,5 м³»
    const raw = formatReading(value, fractionDigits);
    const text = raw.includes(',')
      ? raw.replace(/0+$/, '').replace(/,$/, '')
      : raw;
    parts.push(`${text} ${unit}`);
  }
  parts.push(records(item.recordCount));
  return parts.join(' · ');
};

// Рядок послуги: сума за період і частка від загальної
export function AnalyticsServiceRow({
  item,
  variant,
  index,
  onPress,
}: AnalyticsServiceRowProps) {
  return (
    <ListRow
      testID={
        variant === 'list'
          ? `analytics.service.${index}`
          : `analytics.details.service.${index}`
      }
      showsChevron={false}
      leading={<ServiceIcon icon={item.icon} size={iconTiles.menu} />}
      trailing={
        <VStack spacing={2} style={styles.trailing}>
          <ThemedText font='rowTitle'>{formatMoney(item.amount)}</ThemedText>
          <ThemedText color='muted' font='caption'>
            {`${item.percent}%`}
          </ThemedText>
        </VStack>
      }
      onPress={onPress}
    >
      <ThemedText font='rowTitle' numberOfLines={1}>
        {item.name}
      </ThemedText>
      <ThemedText color='muted' font='caption' numberOfLines={1}>
        {subtitle(item, variant)}
      </ThemedText>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  trailing: {
    alignItems: 'flex-end',
  },
});
