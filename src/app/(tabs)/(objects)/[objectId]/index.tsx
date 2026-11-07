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
  formatMonthTitle,
  formatShortAddress,
  getMonthName,
  getMonthStatus,
  getObjectMonths,
  getObjectServices,
  type MonthKey,
  parseMonthKey,
} from '@/services/ledger';
import {
  EmojiTile,
  EmptyStateView,
  ListCard,
  ListRow,
  MonthPickerSheet,
  SectionHeader,
  SwipeableRow,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

// Набір кнопок однаковий для нового й заповненого обʼєкта
const objectButtons: NavigationBarButtonItem[] = [
  {
    id: 'add-month',
    title: 'Додати місяць',
    icon: 'calendar',
    iconBackground: 'greenSoft',
    testID: 'object.nav.addMonth',
  },
  {
    id: 'add-service',
    title: 'Додати послугу',
    icon: 'plus',
    iconBackground: 'plusSoft',
    testID: 'object.nav.addService',
  },
  {
    id: 'services',
    title: 'Послуги',
    icon: 'gauge',
    iconBackground: 'surface2',
    testID: 'object.nav.services',
  },
  {
    id: 'edit',
    title: 'Редагувати',
    icon: 'pencil',
    iconBackground: 'blueSoft',
    testID: 'object.nav.edit',
  },
  {
    id: 'delete',
    title: 'Видалити',
    icon: 'trash',
    iconBackground: 'coralSoft',
    testID: 'object.nav.delete',
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
  const [isMonthSheetVisible, setMonthSheetVisible] = useState(false);
  const [monthSheetKey, setMonthSheetKey] = useState(0);

  if (!object) return null;

  const months = getObjectMonths(state, object.id);
  const hasServices = getObjectServices(state, object.id).length > 0;

  const addService = () =>
    router.push({
      pathname: '/[objectId]/service-form',
      params: { objectId: object.id },
    });

  const addMonth = () => {
    // key скидає вибір шторки при кожному відкритті
    setMonthSheetKey((key) => key + 1);
    setMonthSheetVisible(true);
  };

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

  const confirmDeleteMonth = (month: MonthKey) =>
    Alert.alert(
      `Видалити «${formatMonthTitle(month)}»?`,
      'Показники та розрахунки за цей місяць буде видалено.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => ledger.deleteMonth(object.id, month),
        },
      ],
    );

  const onButtonPress = (id: string) => {
    switch (id) {
      case 'add-month':
        addMonth();
        break;
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
      testID='object.screen'
      contentInsets={{ bottom: 32 }}
      navigationBarButtons={objectButtons}
      onNavigationButtonPress={onButtonPress}
    >
      {months.length === 0 && !hasServices ? (
        <EmptyStateView
          icon='calendar'
          title='Ще немає місяців'
          message='Додайте послугу — світло, воду чи інтернет, — щоб вносити показники й рахувати суму. Місяць можна додати й одразу.'
          actionTitle='Додати послугу'
          actionTestID='object.empty.addService'
          onAction={addService}
        />
      ) : months.length === 0 ? (
        <EmptyStateView
          icon='calendar'
          title='Ще немає місяців'
          message='Додайте місяць, щоб вносити показники й рахувати суму.'
          actionTitle='Додати місяць'
          actionTestID='object.empty.addMonth'
          onAction={addMonth}
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
                    <SwipeableRow
                      actions={[
                        {
                          title: 'Видалити',
                          icon: 'trash',
                          background: 'coral',
                          testID: `object.month.${month}.delete`,
                          onPress: () => confirmDeleteMonth(month),
                        },
                      ]}
                    >
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
                              <AppImage icon='check' role='badge' />
                            </ThemedView>
                          )
                        }
                        testID={`object.month.${month}`}
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
                    </SwipeableRow>
                  </ListCard>
                );
              })}
            </VStack>
          ))}
        </VStack>
      )}

      <MonthPickerSheet
        key={`month-${monthSheetKey}`}
        visible={isMonthSheetVisible}
        addedMonths={months}
        saveTitle='Додати місяць'
        onClose={() => setMonthSheetVisible(false)}
        onSave={async (month) => {
          setMonthSheetVisible(false);
          await ledger.addMonths(object.id, [month]);
        }}
      />
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
