import {
  type NavigationBarButtonItem,
  NavigationView,
  ThemedText,
  VStack,
} from '@/components';
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import {
  calculateMonth,
  calculateService,
  formatMoney,
  formatMonthTitle,
  formatNumber,
  formatShortAddress,
  getDaysInMonth,
  getMonthName,
  getPreviousMonth,
  getReading,
  isMonthKey,
  type LedgerService,
  type LedgerState,
  type MonthKey,
  pluralForms,
  pluralize,
  type ServiceBill,
} from '@/services/ledger';
import {
  confirmResetEntry,
  DaysSheet,
  EmptyStateView,
  ListCard,
  ListRow,
  SectionHeader,
  ServiceIcon,
  StatusLine,
  SwipeableRow,
  UndoToast,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const monthButtons: NavigationBarButtonItem[] = [
  { id: 'bill', title: 'Розрахунок', icon: 'document', iconBackground: 'blue' },
  {
    id: 'services',
    title: 'Послуги обʼєкта',
    icon: 'gauge',
    iconBackground: 'inkTile',
  },
];

const rowIconSize = 38;
const compactIconSize = 32;

// Внесений показник — спожите за місяць; невнесений — підказка з минулого місяця
const meterSubtitle = (
  state: LedgerState,
  month: MonthKey,
  { service, previous = 0, current, consumption, night }: ServiceBill,
) => {
  if (current !== undefined) {
    return night
      ? `☀️ +${formatNumber(consumption ?? 0)} · 🌙 +${formatNumber(night.consumption ?? 0)} ${service.unit}`
      : `+${formatNumber(consumption ?? 0)} ${service.unit}`;
  }
  const last = calculateService(state, service, getPreviousMonth(month));
  if (last.consumption !== undefined) {
    const total = last.consumption + (last.night?.consumption ?? 0);
    return `Минулого місяця ${formatNumber(total)} ${service.unit}`;
  }
  return night
    ? `Попередній: ☀️ ${formatNumber(previous)} · 🌙 ${formatNumber(night.previous)} ${service.unit}`
    : `Попередній: ${formatNumber(previous)} ${service.unit}`;
};

// Чи внесено за місяць значення, яке можна скинути. Дні без ручного
// значення рахуються як весь місяць, тож скидати там нічого
const hasEntry = (state: LedgerState, serviceId: string, month: MonthKey) =>
  getReading(state, serviceId, month) !== undefined ||
  state.dayCounts.some((d) => d.serviceId === serviceId && d.month === month) ||
  state.amounts.some((a) => a.serviceId === serviceId && a.month === month);

type ResetUndo = {
  id: number;
  text: string;
  restore: () => Promise<void>;
};

// «Залишилось внести 1 показник і 2 суми» або «Усе внесено»
const missingText = (readings: number, sums: number) => {
  const parts = [
    readings > 0 && `${readings} ${pluralize(readings, pluralForms.reading)}`,
    sums > 0 && `${sums} ${pluralize(sums, pluralForms.sum)}`,
  ].filter(Boolean);
  return parts.length > 0
    ? `Залишилось внести ${parts.join(' і ')}`
    : 'Усе внесено';
};

export default function MonthServices() {
  const { objectId, month } = useLocalSearchParams<{
    objectId: string;
    month: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);
  // Послуга лишається вибраною під час анімації закриття шторки
  const [daysServiceId, setDaysServiceId] = useState<string>();
  const [isDaysSheetVisible, setDaysSheetVisible] = useState(false);
  const [daysSheetKey, setDaysSheetKey] = useState(0);
  const [undo, setUndo] = useState<ResetUndo>();

  if (!object || !isMonthKey(month)) return null;

  const { items, total } = calculateMonth(state, object.id, month);
  const meters = items.filter((item) => item.service.mode === 'meter');
  const byDays = items.filter((item) => item.service.mode === 'day');
  const fixed = items.filter((item) => item.service.mode === 'fixed');
  const invoices = items.filter((item) => item.service.mode === 'invoice');
  const missingReadings = meters.filter(
    (item) => item.current === undefined,
  ).length;
  const missingSums = invoices.filter((item) => item.amount === null).length;
  const daysItem = byDays.find((item) => item.service.id === daysServiceId);
  const daysInMonth = getDaysInMonth(month);

  // onConfirm — що зробити одразу після підтвердження (напр. закрити шторку)
  const resetEntry = (service: LedgerService, onConfirm?: () => void) =>
    confirmResetEntry(service, month, async () => {
      onConfirm?.();
      // Знімок до скидання, щоб «Повернути» відновило саме його
      const snapshot = ledger.getSnapshot();
      const isEntry = (e: { serviceId: string; month: MonthKey }) =>
        e.serviceId === service.id && e.month === month;
      const reading = snapshot.readings.find(isEntry);
      const dayCount = snapshot.dayCounts.find(isEntry);
      const amount = snapshot.amounts.find(isEntry);
      await ledger.resetEntry(service.id, month);
      setUndo({
        id: Date.now(),
        text: `«${service.name}» скинуто`,
        restore: async () => {
          if (reading) await ledger.setReading(reading);
          if (dayCount) await ledger.setDayCount(dayCount);
          if (amount) await ledger.setAmount(amount);
        },
      });
    });

  // Рядок з внесеним значенням свайпом уліво відкриває «Скинути»
  const resettable = (service: LedgerService, row: ReactNode) =>
    hasEntry(state, service.id, month) ? (
      <SwipeableRow
        key={service.id}
        actions={[
          {
            title: 'Скинути',
            icon: 'reset',
            background: 'coral',
            onPress: () => resetEntry(service),
          },
        ]}
      >
        {row}
      </SwipeableRow>
    ) : (
      <View key={service.id}>{row}</View>
    );
  const canResetAny = [...meters, ...invoices, ...byDays].some((item) =>
    hasEntry(state, item.service.id, month),
  );

  const openBill = () =>
    router.push({
      pathname: '/[objectId]/[month]/bill',
      params: { objectId: object.id, month },
    });

  const openServices = () =>
    router.push({
      pathname: '/[objectId]/services',
      params: { objectId: object.id },
    });

  const openReading = (serviceId: string) =>
    router.push({
      pathname: '/[objectId]/[month]/reading',
      params: { objectId: object.id, month, serviceId },
    });

  const openAmount = (serviceId: string) =>
    router.push({
      pathname: '/[objectId]/[month]/amount',
      params: { objectId: object.id, month, serviceId },
    });

  return (
    <View style={styles.flex}>
      <NavigationView
        title={formatMonthTitle(month)}
        subtitle={formatShortAddress(object)}
        barType='blue'
        contentInsets={{ top: 20, horizontal: 20, bottom: 32 }}
        navigationBarButtons={monthButtons}
        onNavigationButtonPress={(id) => {
          if (id === 'bill') openBill();
          if (id === 'services') openServices();
        }}
      >
        {items.length === 0 ? (
          <EmptyStateView
            icon='gauge'
            title='Нічого вносити'
            message='За цей місяць немає послуг. Додайте послугу обʼєкта, щоб вносити показники й бачити суму до сплати.'
            actionTitle='Додати послугу'
            onAction={() =>
              router.push({
                pathname: '/[objectId]/service-form',
                params: { objectId: object.id },
              })
            }
          />
        ) : (
          <VStack spacing={20}>
            <Pressable
              onPress={openBill}
              style={(state) => state.pressed && styles.pressed}
            >
              <ListCard style={styles.totalCard}>
                <VStack spacing={6}>
                  <VStack style={styles.totalRow}>
                    <ThemedText color='muted' font='labelMedium'>
                      {`До сплати за ${getMonthName(month).toLocaleLowerCase('uk')}`}
                    </ThemedText>
                    <ThemedText font='monthTotal'>
                      {formatMoney(total)}
                    </ThemedText>
                  </VStack>
                  <StatusLine
                    tone={
                      missingReadings + missingSums > 0 ? 'attention' : 'done'
                    }
                    text={missingText(missingReadings, missingSums)}
                  />
                </VStack>
              </ListCard>
            </Pressable>

            {meters.length > 0 && (
              <Section title='Показники'>
                <ListCard>
                  {meters.map((item) =>
                    resettable(
                      item.service,
                      <ListRow
                        leading={
                          <ServiceIcon
                            icon={item.service.icon}
                            size={rowIconSize}
                          />
                        }
                        trailing={<RowValue amount={item.amount} />}
                        onPress={() => openReading(item.service.id)}
                      >
                        <ThemedText font='rowTitle'>
                          {item.service.name}
                        </ThemedText>
                        <ThemedText color='muted' font='caption'>
                          {meterSubtitle(state, month, item)}
                        </ThemedText>
                      </ListRow>,
                    ),
                  )}
                </ListCard>
              </Section>
            )}

            {invoices.length > 0 && (
              <Section title='Рахунки'>
                <ListCard>
                  {invoices.map((item) =>
                    resettable(
                      item.service,
                      <ListRow
                        leading={
                          <ServiceIcon
                            icon={item.service.icon}
                            size={rowIconSize}
                          />
                        }
                        trailing={<RowValue amount={item.amount} />}
                        onPress={() => openAmount(item.service.id)}
                      >
                        <ThemedText font='rowTitle'>
                          {item.service.name}
                        </ThemedText>
                        <ThemedText color='muted' font='caption'>
                          Сума з рахунку
                        </ThemedText>
                      </ListRow>,
                    ),
                  )}
                </ListCard>
              </Section>
            )}

            {byDays.length > 0 && (
              <Section title='За днями'>
                <ListCard>
                  {byDays.map((item) => {
                    const days = item.days ?? 0;
                    return resettable(
                      item.service,
                      <ListRow
                        leading={
                          <ServiceIcon
                            icon={item.service.icon}
                            size={rowIconSize}
                          />
                        }
                        trailing={<RowValue amount={item.amount ?? 0} />}
                        onPress={() => {
                          setDaysServiceId(item.service.id);
                          setDaysSheetKey((key) => key + 1);
                          setDaysSheetVisible(true);
                        }}
                      >
                        <ThemedText font='rowTitle'>
                          {item.service.name}
                        </ThemedText>
                        <ThemedText color='muted' font='caption'>
                          {days === daysInMonth
                            ? `Весь місяць · ${days} ${pluralize(days, pluralForms.day)}`
                            : `${days} з ${daysInMonth} ${pluralize(daysInMonth, pluralForms.day)}`}
                        </ThemedText>
                      </ListRow>,
                    );
                  })}
                </ListCard>
              </Section>
            )}

            {canResetAny && (
              <ThemedText color='muted' font='caption' style={styles.resetHint}>
                Помилились? Проведіть ліворуч по послузі, щоб скинути внесене
                значення.
              </ThemedText>
            )}

            {fixed.length > 0 && (
              <Section title='Автоматично'>
                <ListCard>
                  {fixed.map((item) => (
                    <ListRow
                      key={item.service.id}
                      compact
                      leading={
                        <ServiceIcon
                          icon={item.service.icon}
                          size={compactIconSize}
                        />
                      }
                      trailing={
                        <ThemedText color='muted' font='body'>
                          {formatMoney(item.amount ?? 0)}
                        </ThemedText>
                      }
                      showsChevron={false}
                    >
                      <ThemedText font='rowTitleMedium'>
                        {item.service.name}
                      </ThemedText>
                    </ListRow>
                  ))}
                </ListCard>
              </Section>
            )}
          </VStack>
        )}

        <DaysSheet
          // key скидає локальний стан шторки при кожному відкритті
          key={daysSheetKey}
          visible={isDaysSheetVisible}
          service={daysItem?.service}
          month={month}
          days={daysItem?.days ?? daysInMonth}
          onClose={() => setDaysSheetVisible(false)}
          onSave={async (days) => {
            if (daysItem) {
              await ledger.setDayCount({
                serviceId: daysItem.service.id,
                month,
                days,
              });
            }
            setDaysSheetVisible(false);
          }}
          onReset={
            daysItem && hasEntry(state, daysItem.service.id, month)
              ? // Alert поверх шторки: закривати Modal до нього на iOS ненадійно
                () =>
                  resetEntry(daysItem.service, () => setDaysSheetVisible(false))
              : undefined
          }
        />
      </NavigationView>

      {undo && (
        <UndoToast
          key={undo.id}
          text={undo.text}
          onUndo={() => {
            undo.restore();
            setUndo(undefined);
          }}
          onHide={() => setUndo(undefined)}
        />
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack spacing={8}>
      <SectionHeader title={title} variant='overline' />
      {children}
    </VStack>
  );
}

// Сума справа в рядку; без суми — заклик внести значення
function RowValue({ amount }: { amount: number | null }) {
  return amount === null ? (
    <ThemedText color='coralInk' font='rowTitle'>
      Внести
    </ThemedText>
  ) : (
    <ThemedText font='rowTitle' style={styles.amount}>
      {formatMoney(amount)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  resetHint: {
    marginTop: -14,
    marginHorizontal: 4,
  },
  totalCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
});
