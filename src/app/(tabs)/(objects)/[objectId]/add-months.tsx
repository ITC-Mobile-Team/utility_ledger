import {
  ActionButton,
  AppImage,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { monthAppearance } from '@/constants/month-emoji';
import { useHideTabBar } from '@/hooks/use-hide-tab-bar';
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import {
  formatAddress,
  getCurrentMonth,
  getFirstServiceMonth,
  getMonthName,
  getObjectMonths,
  type MonthKey,
  parseMonthKey,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import {
  EmojiTile,
  FormFooter,
  ListCard,
  ListRow,
  SectionHeader,
  YearPicker,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type MonthAvailability = 'available' | 'added' | 'future' | 'beforeServices';

const unavailableCaption: Record<
  Exclude<MonthAvailability, 'available'>,
  string
> = {
  added: 'Вже додано',
  future: 'Місяць ще не настав',
  beforeServices: 'Тоді ще не було послуг',
};

const toKey = (year: number, monthIndex: number): MonthKey =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

export default function AddMonths() {
  useHideTabBar();
  const { objectId } = useLocalSearchParams<{ objectId: string }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);
  const currentMonth = getCurrentMonth();
  const currentYear = parseMonthKey(currentMonth).year;
  const added = new Set(object ? getObjectMonths(state, object.id) : []);
  const firstMonth =
    (object && getFirstServiceMonth(state, object.id)) ?? currentMonth;
  const [year, setYear] = useState(currentYear);
  // Поточний місяць одразу обраний, якщо його ще не додано
  const [selected, setSelected] = useState<Set<MonthKey>>(() =>
    added.has(currentMonth) ? new Set() : new Set([currentMonth]),
  );
  const [isSaving, setSaving] = useState(false);

  if (!object) return null;

  const firstYear = parseMonthKey(firstMonth).year;
  const years = Array.from(
    { length: currentYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );

  const availability = (month: MonthKey): MonthAvailability => {
    if (added.has(month)) return 'added';
    if (month > currentMonth) return 'future';
    if (month < firstMonth) return 'beforeServices';
    return 'available';
  };

  const toggle = (month: MonthKey) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (!next.delete(month)) next.add(month);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await ledger.addMonths(object.id, [...selected]);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const count = selected.size;

  return (
    <View style={styles.screen}>
      <NavigationView
        title='Додати місяці'
        subtitle={`Для обʼєкта: ${formatAddress(object)}`}
        contentInsets={{ top: 16, horizontal: 20, bottom: 24 }}
      >
        <VStack spacing={24}>
          <VStack spacing={12}>
            <SectionHeader title='Рік' />
            <YearPicker years={years} selection={year} onChange={setYear} />
          </VStack>

          <VStack spacing={12}>
            <SectionHeader title='Місяці' trailing='Оберіть один або кілька' />
            <ListCard>
              {monthAppearance.map((appearance, monthIndex) => {
                const month = toKey(year, monthIndex);
                const status = availability(month);
                const isSelected = selected.has(month);
                return (
                  <View
                    key={month}
                    style={
                      (status === 'future' || status === 'beforeServices') &&
                      styles.unavailable
                    }
                  >
                    <ListRow
                      leading={
                        <EmojiTile
                          emoji={appearance.emoji}
                          background={appearance.background}
                        />
                      }
                      trailing={
                        status === 'added' ? (
                          <ThemedView
                            backgroundColor='greenSoft'
                            style={styles.mark}
                          >
                            <AppImage
                              icon='check'
                              tintColor='green'
                              size={{ width: 16 }}
                            />
                          </ThemedView>
                        ) : status === 'available' ? (
                          <ThemedView
                            backgroundColor={isSelected ? 'blue' : 'surface'}
                            borderColor={isSelected ? 'blue' : 'line'}
                            style={[styles.mark, styles.checkbox]}
                          >
                            {isSelected && (
                              <AppImage
                                icon='check'
                                tintColor='onPrimary'
                                size={{ width: 16 }}
                              />
                            )}
                          </ThemedView>
                        ) : undefined
                      }
                      showsChevron={false}
                      onPress={
                        status === 'available' ? () => toggle(month) : undefined
                      }
                    >
                      <ThemedText font='rowTitle'>
                        {getMonthName(month)}
                      </ThemedText>
                      {status !== 'available' && (
                        <ThemedText color='muted' font='caption'>
                          {unavailableCaption[status]}
                        </ThemedText>
                      )}
                    </ListRow>
                  </View>
                );
              })}
            </ListCard>
          </VStack>
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title={
            count === 0
              ? 'Оберіть місяці'
              : `Додати ${count} ${pluralize(count, pluralForms.month)}`
          }
          disabled={count === 0}
          loading={isSaving}
          onPress={save}
        />
      </FormFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  unavailable: {
    opacity: 0.45,
  },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    borderWidth: 2,
  },
});
