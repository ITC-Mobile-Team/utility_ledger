import { NavigationView, ThemedText, VStack } from '@/components';
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import {
  billingModeShortTitle,
  formatAddress,
  formatTariff,
  getObjectServices,
  type LedgerService,
} from '@/services/ledger';
import {
  EmptyStateView,
  ListCard,
  ListRow,
  SectionHeader,
  ServiceIcon,
  SwipeableRow,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

export default function ObjectServices() {
  const { objectId } = useLocalSearchParams<{ objectId: string }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);

  if (!object) return null;

  const services = getObjectServices(state, object.id);

  const openForm = (serviceId?: string) =>
    router.push({
      pathname: '/[objectId]/service-form',
      params: serviceId
        ? { objectId: object.id, serviceId }
        : { objectId: object.id },
    });

  const confirmDelete = (service: LedgerService) =>
    Alert.alert(
      `Видалити «${service.name}»?`,
      'Показники та розрахунки цієї послуги буде видалено.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => ledger.deleteService(service.id),
        },
      ],
    );

  return (
    <NavigationView
      type='short'
      title='Послуги'
      barType='blue'
      testID='services.screen'
      contentInsets={{ bottom: 32 }}
      navigationBarButtons={[
        {
          id: 'add',
          title: 'Додати послугу',
          icon: 'plus',
          iconBackground: 'plusSoft',
          testID: 'services.nav.add',
        },
      ]}
      onNavigationButtonPress={() => openForm()}
    >
      {services.length === 0 ? (
        <EmptyStateView
          icon='electricity'
          title='Послуг ще немає'
          message='Обліковуйте за показником лічильника, фіксованою сумою або ставкою за день. Тариф вказується одразу при створенні.'
          actionTitle='Додати послугу'
          actionTestID='services.empty.add'
          onAction={() => openForm()}
        />
      ) : (
        <VStack spacing={12}>
          <VStack spacing={2}>
            <SectionHeader title='Послуги обʼєкта' />
            <ThemedText color='muted' font='caption'>
              {formatAddress(object)}
            </ThemedText>
          </VStack>

          <ListCard>
            {services.map((service, index) => (
              <SwipeableRow
                key={service.id}
                actions={[
                  {
                    title: 'Редагувати',
                    icon: 'pencil',
                    background: 'blue',
                    testID: `services.row.${index}.edit`,
                    onPress: () => openForm(service.id),
                  },
                  {
                    title: 'Видалити',
                    icon: 'trash',
                    background: 'coral',
                    testID: `services.row.${index}.delete`,
                    onPress: () => confirmDelete(service),
                  },
                ]}
              >
                <ListRow
                  leading={<ServiceIcon icon={service.icon} />}
                  testID={`services.row.${index}`}
                  onPress={() => openForm(service.id)}
                >
                  <ThemedText font='rowTitle'>{service.name}</ThemedText>
                  <ThemedText color='muted' font='caption'>
                    {`${billingModeShortTitle[service.mode]} · ${formatTariff(service)}`}
                  </ThemedText>
                </ListRow>
              </SwipeableRow>
            ))}
          </ListCard>

          <ThemedText color='muted' font='caption'>
            Проведіть пальцем ліворуч по послузі, щоб редагувати або видалити
            її.
          </ThemedText>
        </VStack>
      )}
    </NavigationView>
  );
}
