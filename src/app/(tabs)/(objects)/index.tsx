import {
  type NavigationBarButtonItem,
  NavigationView,
  VStack,
} from '@/components';
import { useLedgerState } from '@/providers/ledger-provider';
import {
  formatMonthTitle,
  getActiveObjects,
  getArchivedObjects,
  getCurrentMonth,
  getMonthStatus,
  getObjectServices,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import { useAccountDataStatus } from '@/providers/account-data-provider';
import { AccountDataGate, ObjectsSkeleton } from '@/views/account-data';
import { EmptyStateView, ObjectCard, SectionHeader } from '@/views';
import { router } from 'expo-router';

const addButton: NavigationBarButtonItem = {
  id: 'add',
  title: 'Додати адресу',
  icon: 'plus',
  iconBackground: 'plusSoft',
  testID: 'objects.nav.add',
};

const archiveButton: NavigationBarButtonItem = {
  id: 'archive',
  title: 'Архів',
  icon: 'archive',
  iconBackground: 'surface2',
  testID: 'objects.nav.archive',
};

const addObject = () => router.push('/object-form');

export default function Index() {
  const { status } = useAccountDataStatus();
  const state = useLedgerState();
  const month = getCurrentMonth();
  const objects = getActiveObjects(state);
  const hasArchived = getArchivedObjects(state).length > 0;
  const count = objects.length;
  const isReady = status === 'ready';
  const isEmpty = isReady && count === 0;
  // Коли всі адреси в архіві, лишається кнопка «Архів» — інакше до них не дійти
  const navigationButtons = !isReady
    ? []
    : !isEmpty
      ? [addButton, archiveButton]
      : hasArchived
        ? [archiveButton]
        : [];

  const subtitle = !isReady
    ? formatMonthTitle(month)
    : isEmpty
      ? 'Ще немає жодної адреси'
      : `${count} ${pluralize(count, pluralForms.address)} · ${formatMonthTitle(month).toLocaleLowerCase('uk')}`;

  return (
    <NavigationView
      title='Обʼєкти'
      subtitle={subtitle}
      testID='objects.screen'
      barType='blue'
      contentInsets={{ bottom: 32 }}
      navigationBarButtons={navigationButtons}
      onNavigationButtonPress={(id) => {
        if (id === 'add') addObject();
        if (id === 'archive') router.push('/archive');
      }}
    >
      <AccountDataGate skeleton={<ObjectsSkeleton />}>
        {isEmpty ? (
          <EmptyStateView
            icon='house'
            title='Додайте першу адресу'
            message='Квартира, будинок чи офіс — після цього можна додати послуги та вносити показники щомісяця.'
            actionTitle='Додати адресу'
            actionTestID='objects.empty.add'
            onAction={addObject}
          />
        ) : (
          <VStack spacing={12}>
            <SectionHeader title='Ваші адреси' />
            {objects.map((object, index) => (
              <ObjectCard
                key={object.id}
                testID={`objects.card.${index}`}
                object={object}
                services={getObjectServices(state, object.id)}
                month={month}
                status={getMonthStatus(state, object.id, month)}
                onPress={() =>
                  router.push({
                    pathname: '/[objectId]',
                    params: { objectId: object.id },
                  })
                }
              />
            ))}
          </VStack>
        )}
      </AccountDataGate>
    </NavigationView>
  );
}
