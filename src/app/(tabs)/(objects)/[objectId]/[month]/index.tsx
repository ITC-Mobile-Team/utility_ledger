import {
  type NavigationBarButtonItem,
  NavigationView,
  ThemedBadge,
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
  formatMoney,
  formatMonthTitle,
  formatNumber,
  formatShortAddress,
  getDaysInMonth,
  isMonthKey,
  pluralForms,
  pluralize,
  type ServiceBill,
} from '@/services/ledger';
import {
  DaysSheet,
  EmptyStateView,
  ListCard,
  ListRow,
  ProgressBar,
  SectionHeader,
  ServiceIcon,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

const monthButtons: NavigationBarButtonItem[] = [
  { id: 'bill', title: 'Розрахунок', icon: 'document', iconBackground: 'blue' },
  {
    id: 'services',
    title: 'Послуги обʼєкта',
    icon: 'gauge',
    iconBackground: 'inkTile',
  },
];

const meterSubtitle = ({
  service,
  previous = 0,
  current,
  consumption,
}: ServiceBill) =>
  current === undefined
    ? `Попередній: ${formatNumber(previous)} ${service.unit}`
    : `${formatNumber(previous)} → ${formatNumber(current)} · +${formatNumber(consumption ?? 0)} ${service.unit}`;

export default function MonthServices() {
  const { objectId, month } = useLocalSearchParams<{
    objectId: string;
    month: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);
  const [daysServiceId, setDaysServiceId] = useState<string>();

  if (!object || !isMonthKey(month)) return null;

  const { items } = calculateMonth(state, object.id, month);
  const meters = items.filter((item) => item.service.mode === 'meter');
  const byDays = items.filter((item) => item.service.mode === 'day');
  const fixed = items.filter((item) => item.service.mode === 'fixed');
  const filledMeters = meters.filter(
    (item) => item.current !== undefined,
  ).length;
  const daysItem = byDays.find((item) => item.service.id === daysServiceId);

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

  return (
    <NavigationView
      title={formatMonthTitle(month)}
      subtitle={formatShortAddress(object)}
      barType='blue'
      contentInsets={{ top: 20, horizontal: 20, bottom: 32 }}
      navigationBarButtons={monthButtons}
      onNavigationButtonPress={(id) => {
        if (id === 'bill') {
          router.push({
            pathname: '/[objectId]/[month]/bill',
            params: { objectId: object.id, month },
          });
        }
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
        <VStack spacing={24}>
          {meters.length > 0 && (
            <VStack spacing={12}>
              <SectionHeader
                title='Показники'
                trailing={`${filledMeters} з ${meters.length} внесено`}
              />
              <ProgressBar progress={filledMeters / meters.length} />
              <ListCard>
                {meters.map((item) => (
                  <ListRow
                    key={item.service.id}
                    leading={<ServiceIcon icon={item.service.icon} />}
                    trailing={
                      item.current === undefined ? (
                        <ThemedBadge text='Не внесено' type='red' />
                      ) : (
                        <ThemedBadge text='Внесено' type='green' />
                      )
                    }
                    onPress={() => openReading(item.service.id)}
                  >
                    <ThemedText font='rowTitle'>{item.service.name}</ThemedText>
                    <ThemedText color='muted' font='caption'>
                      {meterSubtitle(item)}
                    </ThemedText>
                  </ListRow>
                ))}
              </ListCard>
            </VStack>
          )}

          {byDays.length > 0 && (
            <VStack spacing={12}>
              <SectionHeader
                title='За днями'
                trailing='Можна змінити кількість днів'
              />
              <ListCard>
                {byDays.map((item) => {
                  const days = item.days ?? 0;
                  const isFullMonth = days === getDaysInMonth(month);
                  return (
                    <ListRow
                      key={item.service.id}
                      leading={<ServiceIcon icon={item.service.icon} />}
                      trailing={
                        <VStack spacing={4} align='bottom'>
                          <ThemedText font='rowTitle'>
                            {formatMoney(item.amount ?? 0)}
                          </ThemedText>
                          <ThemedBadge
                            text={
                              isFullMonth
                                ? 'Весь місяць'
                                : `${days} ${pluralize(days, pluralForms.day)}`
                            }
                            type='blue'
                          />
                        </VStack>
                      }
                      onPress={() => setDaysServiceId(item.service.id)}
                    >
                      <ThemedText font='rowTitle'>
                        {item.service.name}
                      </ThemedText>
                      <ThemedText color='muted' font='caption'>
                        {`${days} ${pluralize(days, pluralForms.day)} × ${formatMoney(item.service.tariff)}`}
                      </ThemedText>
                    </ListRow>
                  );
                })}
              </ListCard>
            </VStack>
          )}

          {fixed.length > 0 && (
            <VStack spacing={12}>
              <SectionHeader title='Нараховуються автоматично' />
              <ListCard>
                {fixed.map((item) => (
                  <ListRow
                    key={item.service.id}
                    leading={<ServiceIcon icon={item.service.icon} />}
                    trailing={
                      <ThemedText font='rowTitle'>
                        {formatMoney(item.amount ?? 0)}
                      </ThemedText>
                    }
                    showsChevron={false}
                  >
                    <ThemedText font='rowTitle'>{item.service.name}</ThemedText>
                    <ThemedText color='muted' font='caption'>
                      Фіксована сума
                    </ThemedText>
                  </ListRow>
                ))}
              </ListCard>
            </VStack>
          )}
        </VStack>
      )}

      <DaysSheet
        // key скидає локальний стан шторки для кожної послуги
        key={daysServiceId}
        service={daysItem?.service}
        month={month}
        days={daysItem?.days ?? getDaysInMonth(month)}
        onClose={() => setDaysServiceId(undefined)}
        onSave={async (days) => {
          if (daysItem) {
            await ledger.setDayCount({
              serviceId: daysItem.service.id,
              month,
              days,
            });
          }
          setDaysServiceId(undefined);
        }}
      />
    </NavigationView>
  );
}
