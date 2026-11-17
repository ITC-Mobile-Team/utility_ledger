import {
  NavigationView,
  Segment,
  type SegmentItem,
  ThemedText,
  VStack,
} from '@/components';
import { useAnalyticsSelection } from '@/providers/analytics-selection-provider';
import { useLedgerState } from '@/providers/ledger-provider';
import { formatPeriodMonths, summarizeAnalytics } from '@/services/analytics';
import { formatMoney } from '@/services/ledger';
import { ListCard } from '@/views';
import {
  AnalyticsMonthRow,
  AnalyticsServiceRow,
  ServiceShareBar,
} from '@/views/analytics';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

type Tab = 'services' | 'months';

const tabs: readonly SegmentItem<Tab>[] = [
  { value: 'services', label: 'Послуги' },
  { value: 'months', label: 'Місяці' },
];

// «Витрати — деталі» (артборд 15): ті самі адреса й період, що на головному
// екрані; з рядка місяця відкривається одразу на «Місяцях»
export default function AnalyticsDetailsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(
    params.tab === 'months' ? 'months' : 'services',
  );
  const state = useLedgerState();
  const { period, selection } = useAnalyticsSelection();
  const summary = selection
    ? summarizeAnalytics(state, selection, period)
    : null;

  return (
    <NavigationView
      title={`Витрати ${formatMoney(summary?.total ?? 0)}`}
      subtitle={formatPeriodMonths(period)}
      barType='green'
      testID='analytics.details.screen'
      contentInsets={{ bottom: 32 }}
    >
      <VStack spacing={14}>
        <Segment
          items={tabs}
          value={tab}
          onChange={setTab}
          testID='analytics.details.tabs'
        />
        {summary && !summary.isEmpty ? (
          tab === 'services' ? (
            <>
              <ServiceShareBar services={summary.services} />
              <ListCard>
                {summary.services.map((item, index) => (
                  <AnalyticsServiceRow
                    key={item.key}
                    item={item}
                    variant='details'
                    index={index}
                  />
                ))}
              </ListCard>
            </>
          ) : (
            <ListCard>
              {summary.months
                .filter((item) => item.total > 0)
                .reverse()
                .map((item, index) => (
                  <AnalyticsMonthRow
                    key={item.month}
                    item={item}
                    variant='details'
                    index={index}
                  />
                ))}
            </ListCard>
          )
        ) : (
          <ListCard style={styles.noRecords}>
            <ThemedText color='muted' font='bodySmall' align='center'>
              За цей період ще немає записів
            </ThemedText>
          </ListCard>
        )}
      </VStack>
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  noRecords: {
    padding: 20,
  },
});
