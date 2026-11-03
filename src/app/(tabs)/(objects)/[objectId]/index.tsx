import {
  AppImage,
  type NavigationBarButtonItem,
  NavigationView,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { monthAppearance } from '@/constants/month-emoji';
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import {
  formatShortAddress,
  getMonthName,
  getMonthStatus,
  getObjectMonths,
  type MonthKey,
  parseMonthKey,
} from '@/services/ledger';
import {
  EmojiTile,
  EmptyStateView,
  ListCard,
  ListRow,
  SectionHeader,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';

const addServiceButton: NavigationBarButtonItem = {
  id: 'add-service',
  title: 'Додати послугу',
  icon: 'plus',
  iconBackground: 'coral',
};

const servicesButton: NavigationBarButtonItem = {
  id: 'services',
  title: 'Послуги',
  icon: 'gauge',
  iconBackground: 'inkTile',
};

const objectButtons: NavigationBarButtonItem[] = [
  addServiceButton,
  servicesButton,
  { id: 'edit', title: 'Редагувати', icon: 'pencil', iconBackground: 'blue' },
  {
    id: 'delete',
    title: 'Видалити',
    icon: 'trash',
    iconBackground: 'coralSoft',
    iconColor: 'coral',
  },
];

// Групує місяці за роками зі збереженням порядку (найновіші першими)
const groupByYear = (months: MonthKey[]) => {
  const groups = new Map<number, MonthKey[]>();
  months.forEach((month) => {
    const { year } = parseMonthKey(month);
    groups.set(year, [...(groups.get(year) ?? []), month]);
  });
  return [...groups.entries()];
};

export default function ObjectMonths() {
  const { objectId } = useLocalSearchParams<{ objectId: string }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);

  if (!object) return null;

  const months = getObjectMonths(state, object.id);
  const isEmpty = months.length === 0;

  const addService = () =>
    router.push({
      pathname: '/[objectId]/service-form',
      params: { objectId: object.id },
    });

  const confirmDelete = () =>
    Alert.alert(
      'Видалити адресу?',
      'Усі послуги, показники та розрахунки цієї адреси буде видалено назавжди.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            router.back();
            await ledger.deleteObject(object.id);
          },
        },
      ],
    );

  const onButtonPress = (id: string) => {
    switch (id) {
      case 'add-service':
        addService();
        break;
      case 'services':
        router.push({
          pathname: '/[objectId]/services',
          params: { objectId: object.id },
        });
        break;
      case 'edit':
        router.push({
          pathname: '/object-form',
          params: { objectId: object.id },
        });
        break;
      case 'delete':
        confirmDelete();
        break;
    }
  };

  return (
    <NavigationView
      type='short'
      title={formatShortAddress(object)}
      barType='blue'
      contentInsets={{ top: 20, horizontal: 20, bottom: 32 }}
      navigationBarButtons={
        isEmpty ? [addServiceButton, servicesButton] : objectButtons
      }
      onNavigationButtonPress={onButtonPress}
    >
      {isEmpty ? (
        <EmptyStateView
          icon='calendar'
          title='Ще немає місяців'
          message='Додайте першу послугу — світло, воду чи інтернет. Після цього тут зʼявляться місяці для показників і розрахунків.'
          actionTitle='Додати послугу'
          onAction={addService}
        />
      ) : (
        <VStack spacing={24}>
          {groupByYear(months).map(([year, yearMonths], index) => (
            <VStack key={year} spacing={12}>
              <SectionHeader
                title={String(year)}
                trailing={index === 0 ? 'Оберіть місяць' : undefined}
              />
              {yearMonths.map((month) => {
                const status = getMonthStatus(state, object.id, month);
                const appearance =
                  monthAppearance[parseMonthKey(month).monthIndex];
                return (
                  <ListCard key={month}>
                    <ListRow
                      leading={
                        appearance && (
                          <EmojiTile
                            emoji={appearance.emoji}
                            background={appearance.background}
                          />
                        )
                      }
                      trailing={
                        status === 'new' ? (
                          <ThemedBadge text='Новий' type='red' />
                        ) : (
                          <ThemedView
                            backgroundColor='greenSoft'
                            style={styles.check}
                          >
                            <AppImage
                              icon='check'
                              tintColor='green'
                              size={{ width: 16 }}
                            />
                          </ThemedView>
                        )
                      }
                      onPress={() =>
                        router.push({
                          pathname: '/[objectId]/[month]',
                          params: { objectId: object.id, month },
                        })
                      }
                    >
                      <ThemedText font='rowTitle'>
                        {getMonthName(month)}
                      </ThemedText>
                      <ThemedText color='muted' font='caption'>
                        {status === 'new'
                          ? 'Потрібно внести показники'
                          : 'Заповнено'}
                      </ThemedText>
                    </ListRow>
                  </ListCard>
                );
              })}
            </VStack>
          ))}
        </VStack>
      )}
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
