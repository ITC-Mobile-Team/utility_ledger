import {
  ActionButton,
  AppImage,
  HStack,
  ThemedText,
  ThemedView,
} from '@/components';
import { monthAppearance } from '@/constants/month-emoji';
import {
  getCurrentMonth,
  getMonthName,
  type MonthKey,
  parseMonthKey,
} from '@/services/ledger';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from './bottom-sheet';

// Найраніший рік, до якого можна погортати
const FIRST_YEAR = 1900;

const toKey = (year: number, monthIndex: number): MonthKey =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

type MonthPickerSheetProps = {
  visible: boolean;
  // Місяці, які вже є в обʼєкта: їх обрати не можна
  addedMonths: readonly MonthKey[];
  // Місяць, який редагуємо; без нього шторка додає новий місяць
  editingMonth?: MonthKey;
  saveTitle: string;
  onClose: () => void;
  onSave: (month: MonthKey) => void;
};

// Шторка «Оберіть місяць»: рік перемикачем, місяці сіткою 3×4.
// Майбутні місяці недоступні, вже додані позначені галочкою
export function MonthPickerSheet({
  visible,
  addedMonths,
  editingMonth,
  saveTitle,
  onClose,
  onSave,
}: MonthPickerSheetProps) {
  const currentMonth = getCurrentMonth();
  const current = parseMonthKey(currentMonth);
  const added = new Set(addedMonths);
  // При додаванні одразу обраний поточний місяць, якщо його ще немає
  const [selected, setSelected] = useState(
    editingMonth ?? (added.has(currentMonth) ? undefined : currentMonth),
  );
  const [year, setYear] = useState(
    editingMonth ? parseMonthKey(editingMonth).year : current.year,
  );

  const isFuture = (monthIndex: number) =>
    year > current.year ||
    (year === current.year && monthIndex > current.monthIndex);

  const canSave = selected !== undefined && selected !== editingMonth;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <HStack align='center' style={styles.header}>
        <ThemedText font='titleSmall'>Оберіть місяць</ThemedText>
        <ThemedView backgroundColor='surface2' style={styles.yearSwitch}>
          <YearButton
            direction='previous'
            disabled={year <= FIRST_YEAR}
            onPress={() => setYear(year - 1)}
          />
          <ThemedText
            font='rowTitle'
            align='center'
            accessibilityLiveRegion='polite'
            style={styles.year}
          >
            {year}
          </ThemedText>
          <YearButton
            direction='next'
            disabled={year >= current.year}
            onPress={() => setYear(year + 1)}
          />
        </ThemedView>
      </HStack>

      <View style={styles.grid} accessibilityRole='radiogroup'>
        {monthAppearance.map((appearance, monthIndex) => {
          const month = toKey(year, monthIndex);
          const isSelected = month === selected;
          // Свій місяць при редагуванні лишається доступним
          const isAdded = added.has(month) && month !== editingMonth;
          const disabled = isFuture(monthIndex) || isAdded;
          return (
            <Pressable
              key={month}
              accessibilityRole='radio'
              accessibilityState={{ checked: isSelected, disabled }}
              accessibilityHint={isAdded ? 'Вже додано' : undefined}
              disabled={disabled}
              onPress={() => setSelected(month)}
              style={styles.cell}
            >
              {(state) => (
                <ThemedView
                  backgroundColor={isSelected ? 'blueSoft' : 'surface2'}
                  borderColor={isSelected ? 'blue' : undefined}
                  style={[
                    styles.cellBody,
                    !isSelected && styles.cellBorderless,
                    disabled && styles.disabled,
                    state.pressed && styles.pressed,
                  ]}
                >
                  {/* Звичайний Text: метрики Onest зсувають емодзі */}
                  <Text allowFontScaling={false} style={styles.emoji}>
                    {appearance.emoji}
                  </Text>
                  <ThemedText font='segment'>{getMonthName(month)}</ThemedText>
                  {isAdded && (
                    <ThemedView
                      backgroundColor='greenSoft'
                      style={styles.addedMark}
                    >
                      <AppImage
                        icon='check'
                        tintColor='green'
                        size={{ width: 10 }}
                      />
                    </ThemedView>
                  )}
                </ThemedView>
              )}
            </Pressable>
          );
        })}
      </View>

      <ThemedText
        color='muted'
        font='caption'
        align='center'
        style={styles.hint}
      >
        Майбутні місяці стануть доступні з їх початком.
      </ThemedText>

      <ActionButton
        title={saveTitle}
        disabled={!canSave}
        onPress={() => selected && onSave(selected)}
      />
    </BottomSheet>
  );
}

type YearButtonProps = {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
};

function YearButton({ direction, disabled, onPress }: YearButtonProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={
        direction === 'previous' ? 'Попередній рік' : 'Наступний рік'
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      {/* Недоступна кнопка без підкладки, як у дизайні */}
      <ThemedView
        backgroundColor='surface'
        style={[styles.yearButton, disabled && styles.yearButtonFlat]}
      >
        <View style={direction === 'previous' && styles.flipped}>
          <AppImage
            icon='chevronRight'
            tintColor={disabled ? 'faint' : 'ink'}
            size={{ width: 18 }}
          />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
  },
  yearSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  year: {
    minWidth: 56,
    fontVariant: ['tabular-nums'],
  },
  yearButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  yearButtonFlat: {
    backgroundColor: 'transparent',
    boxShadow: [],
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Три колонки з двома проміжками по 8
  cell: {
    width: '31.5%',
    flexGrow: 1,
  },
  cellBody: {
    height: 72,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cellBorderless: {
    borderColor: 'transparent',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  addedMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: -4,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
