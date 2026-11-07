import {
  type NavigationBarButtonItem,
  NavigationView,
  VStack,
} from '@/components';
import { useLedgerState } from '@/providers/ledger-provider';
import {
  formatMonthTitle,
  getCurrentMonth,
  getMonthStatus,
  getObjectServices,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import { EmptyStateView, ObjectCard, SectionHeader } from '@/views';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const objectsNavigationButtons: NavigationBarButtonItem[] = [
  {
    id: 'add',
    title: 'Додати адресу',
    icon: 'plus',
    iconBackground: 'coralSoft',
    testID: 'objects.nav.add',
  },
  {
    id: 'archive',
    title: 'Архів',
    icon: 'archive',
    iconBackground: 'surface2',
    testID: 'objects.nav.archive',
  },
];

const addObject = () => router.push('/object-form');

export default function Index() {
  const state = useLedgerState();
  const month = getCurrentMonth();
  const count = state.objects.length;
  const isEmpty = count === 0;

  const subtitle = isEmpty
    ? 'Ще немає жодної адреси'
    : `${count} ${pluralize(count, pluralForms.address)} · ${formatMonthTitle(month).toLocaleLowerCase('uk')}`;

  return (
    <NavigationView
      title='Обʼєкти'
      subtitle={subtitle}
      testID='objects.screen'
      barType='blue'
      cornerRadius={isEmpty ? 28 : 0}
      contentInsets={{ top: 20, horizontal: 20, bottom: 32 }}
      navigationBarButtons={isEmpty ? [] : objectsNavigationButtons}
      onNavigationButtonPress={(id) => {
        if (id === 'add') addObject();
        if (id === 'archive') {
          Alert.alert('Архів', 'Архів адрес зʼявиться згодом.');
        }
      }}
    >
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
          {state.objects.map((object, index) => (
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
    </NavigationView>
  );
}
