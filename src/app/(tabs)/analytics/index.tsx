import {
  HStack,
  NavigationView,
  Segment,
  type SegmentItem,
  ThemedText,
  VStack,
} from '@/components';
import { useLedgerState } from '@/providers/ledger-provider';
import { useAnalyticsSelection } from '@/providers/analytics-selection-provider';
import {
  getAddressOptions,
  summarizeAnalytics,
  type AnalyticsSelection,
} from '@/services/analytics';
import { EmptyStateView, ListCard } from '@/views';
import { AccountDataGate, AnalyticsSkeleton } from '@/views/account-data';
import {
  AddressRow,
  AddressSheet,
  AnalyticsMonthRow,
  AnalyticsPeriodButton,
  AnalyticsServiceRow,
  DateRangeSheet,
  ExpensesCard,
} from '@/views/analytics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

type Tab = 'services' | 'months';

const tabs: readonly SegmentItem<Tab>[] = [
  { value: 'services', label: 'Послуги' },
  { value: 'months', label: 'Місяці' },
];

const isSame = (a: AnalyticsSelection, b: AnalyticsSelection) =>
  a.kind === 'all'
    ? b.kind === 'all'
    : b.kind === 'object' && a.objectId === b.objectId;

// Вкладка «Аналітика» (артборди 14, 14a–14d): витрати обраної адреси за період
export default function AnalyticsScreen() {
  const state = useLedgerState();
  const { period, setPeriod, selection, setSelection } =
    useAnalyticsSelection();
  const [tab, setTab] = useState<Tab>('services');
  // Шторка лишається з тим самим краєм під час анімації закриття
  const [dateEdge, setDateEdge] = useState<'start' | 'end'>('start');
  const [isDateSheetVisible, setDateSheetVisible] = useState(false);
  const [dateSheetKey, setDateSheetKey] = useState(0);
  const [isAddressSheetVisible, setAddressSheetVisible] = useState(false);

  const openDate = (edge: 'start' | 'end') => {
    setDateEdge(edge);
    setDateSheetKey((key) => key + 1);
    setDateSheetVisible(true);
  };

  const isEmpty = selection === null;
  const summary = selection
    ? summarizeAnalytics(state, selection, period)
    : null;
  const options = getAddressOptions(state, period);
  const current = selection
    ? options.find((option) => isSame(option.selection, selection))
    : undefined;

  const openDetails = (detailsTab: Tab) =>
    router.push({
      pathname: '/analytics/details',
      params: { tab: detailsTab },
    });

  return (
    <>
      <NavigationView
        title='Аналітика'
        barType='green'
        testID='analytics.screen'
        contentInsets={{ bottom: 32 }}
        headerContent={
          <HStack spacing={10} style={styles.period}>
            <AnalyticsPeriodButton
              label='Від'
              date={period.start}
              active={isDateSheetVisible && dateEdge === 'start'}
              disabled={isEmpty}
              testID='analytics.period.start'
              onPress={() => openDate('start')}
            />
            <AnalyticsPeriodButton
              label='До'
              date={period.end}
              active={isDateSheetVisible && dateEdge === 'end'}
              disabled={isEmpty}
              testID='analytics.period.end'
              onPress={() => openDate('end')}
            />
          </HStack>
        }
      >
        <AccountDataGate skeleton={<AnalyticsSkeleton />}>
          {!summary || !current ? (
            <EmptyStateView
              icon='chart'
              title='Тут будуть витрати'
              message='Додайте адресу й внесіть показники — і тут зʼявиться, скільки ви платите щомісяця.'
              testID='analytics.empty'
            />
          ) : (
            <VStack spacing={14}>
              <AddressRow
                option={current}
                onPress={() => setAddressSheetVisible(true)}
              />
              <ExpensesCard
                summary={summary}
                onPress={() => openDetails('services')}
              />
              <Segment
                items={tabs}
                value={tab}
                onChange={setTab}
                testID='analytics.tabs'
              />
              {tab === 'services' &&
                (summary.services.length > 0 ? (
                  <ListCard>
                    {summary.services.map((item, index) => (
                      <AnalyticsServiceRow
                        key={item.key}
                        item={item}
                        variant='list'
                        index={index}
                        onPress={() => openDetails('services')}
                      />
                    ))}
                  </ListCard>
                ) : (
                  <NoRecords />
                ))}
              {tab === 'months' &&
                (summary.isEmpty ? (
                  <NoRecords />
                ) : (
                  <ListCard>
                    {summary.months
                      .filter((item) => item.total > 0)
                      .reverse()
                      .map((item, index) => (
                        <AnalyticsMonthRow
                          key={item.month}
                          item={item}
                          variant='list'
                          index={index}
                          onPress={() => openDetails('months')}
                        />
                      ))}
                  </ListCard>
                ))}
            </VStack>
          )}
        </AccountDataGate>
      </NavigationView>

      <DateRangeSheet
        key={dateSheetKey}
        visible={isDateSheetVisible}
        edge={dateEdge}
        period={period}
        onClose={() => setDateSheetVisible(false)}
        onSave={(date) => {
          setPeriod(
            dateEdge === 'start'
              ? { ...period, start: date }
              : { ...period, end: date },
          );
          setDateSheetVisible(false);
        }}
      />
      {selection && (
        <AddressSheet
          visible={isAddressSheetVisible}
          options={options}
          period={period}
          selection={selection}
          onClose={() => setAddressSheetVisible(false)}
          onSelect={(next) => {
            setSelection(next);
            setAddressSheetVisible(false);
          }}
        />
      )}
    </>
  );
}

function NoRecords() {
  return (
    <ListCard style={styles.noRecords}>
      <ThemedText color='muted' font='bodySmall' align='center'>
        За цей період ще немає записів
      </ThemedText>
    </ListCard>
  );
}

const styles = StyleSheet.create({
  period: {
    marginTop: 8,
  },
  noRecords: {
    padding: 20,
  },
});
