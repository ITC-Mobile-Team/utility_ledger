import {
  ActionButton,
  AppImage,
  NavigationView,
  RadioCircle,
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

// Найраніший рік у барабані
const FIRST_YEAR = 1900;

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
  const [year, setYear] = useState(currentYear);
  // Поточний місяць одразу обраний, якщо його ще не додано
  const [selected, setSelected] = useState<Set<MonthKey>>(() =>
    added.has(currentMonth) ? new Set() : new Set([currentMonth]),
  );
  const [isSaving, setSaving] = useState(false);

  if (!object) return null;

  const years = Array.from(
    { length: currentYear - FIRST_YEAR + 1 },
    (_, index) => FIRST_YEAR + index,
  );

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
                const isAdded = added.has(month);
                const isSelected = selected.has(month);
                return (
                  <ListRow
                    key={month}
                    leading={
                      <EmojiTile
                        emoji={appearance.emoji}
                        background={appearance.background}
                      />
                    }
                    trailing={
                      isAdded ? (
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
                      ) : (
                        <RadioCircle isSelected={isSelected} />
                      )
                    }
                    showsChevron={false}
                    highlightsOnPress={false}
                    onPress={isAdded ? undefined : () => toggle(month)}
                  >
                    <ThemedText font='rowTitle'>
                      {getMonthName(month)}
                    </ThemedText>
                    {isAdded && (
                      <ThemedText color='muted' font='caption'>
                        Вже додано
                      </ThemedText>
                    )}
                  </ListRow>
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
  mark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
