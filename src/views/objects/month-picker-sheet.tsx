import {
  ActionButton,
  AppImage,
  HStack,
  ThemedText,
  ThemedView,
  Pressable,
} from '@/components';
import { monthAppearance } from '@/constants/month-emoji';
import {
  getCurrentMonth,
  getMonthName,
  type MonthKey,
  parseMonthKey,
} from '@/services/ledger';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  css,
  type CSSTransitionProperties,
} from 'react-native-reanimated';
import { BottomSheet } from './bottom-sheet';

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

// Шторка «Оберіть місяць»: рік перемикачем без меж в обидва боки, місяці
// сіткою 3×4. Можна обрати будь-який місяць, крім уже доданих (з галочкою)
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

  const canSave = selected !== undefined && selected !== editingMonth;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <HStack align='center' style={styles.header}>
        <ThemedText font='titleSmall'>Оберіть місяць</ThemedText>
        <ThemedView backgroundColor='surface2' style={styles.yearSwitch}>
          <YearButton direction='previous' onPress={() => setYear(year - 1)} />
          <ThemedText
            font='rowTitle'
            align='center'
            accessibilityLiveRegion='polite'
            style={styles.year}
          >
            {year}
          </ThemedText>
          <YearButton direction='next' onPress={() => setYear(year + 1)} />
        </ThemedView>
      </HStack>

      <View style={styles.grid} accessibilityRole='radiogroup'>
        {monthAppearance.map((appearance, monthIndex) => {
          const month = toKey(year, monthIndex);
          const isSelected = month === selected;
          // Свій місяць при редагуванні лишається доступним
          const isAdded = added.has(month) && month !== editingMonth;
          return (
            <MonthCell
              key={month}
              emoji={appearance.emoji}
              name={getMonthName(month)}
              isSelected={isSelected}
              isAdded={isAdded}
              onPress={() => setSelected(month)}
            />
          );
        })}
      </View>

      <ActionButton
        title={saveTitle}
        disabled={!canSave}
        onPress={() => selected && onSave(selected)}
      />
    </BottomSheet>
  );
}

// Колір і рамка перетікають, натиснута клітинка трохи стискається
const cellTransition: CSSTransitionProperties = {
  transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
  transitionDuration: 200,
  transitionTimingFunction: 'ease-out',
};

// Щойно обрана клітинка «підстрибує». Емодзі не масштабуємо: збільшений
// гліф растеризований і стає піксельним
const cellPop = css.keyframes({
  from: { transform: [{ scale: 0.94 }] },
  '55%': { transform: [{ scale: 1.04 }] },
  to: { transform: [{ scale: 1 }] },
});

type MonthCellProps = {
  emoji: string;
  name: string;
  isSelected: boolean;
  isAdded: boolean;
  onPress: () => void;
};

function MonthCell({
  emoji,
  name,
  isSelected,
  isAdded,
  onPress,
}: MonthCellProps) {
  const [isPressed, setPressed] = useState(false);
  const selectedBg = useThemeColor('blueSoft');
  const idleBg = useThemeColor('surface2');
  const blue = useThemeColor('blue');
  // Без вибору рамка кольору фону: інакше перехід з transparent темнить її
  const background = isSelected ? selectedBg : idleBg;
  const border = isSelected ? blue : idleBg;

  return (
    <Pressable
      guarded={false}
      accessibilityRole='radio'
      accessibilityState={{ checked: isSelected, disabled: isAdded }}
      accessibilityHint={isAdded ? 'Вже додано' : undefined}
      disabled={isAdded}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.cell}
    >
      <Animated.View
        style={[
          styles.cellBody,
          { backgroundColor: background, borderColor: border },
          { transform: [{ scale: isPressed ? 0.95 : 1 }] },
          cellTransition,
          isSelected && !isPressed && styles.cellPop,
          isAdded && styles.disabled,
        ]}
      >
        {/* Звичайний Text: метрики Onest зсувають емодзі */}
        <Text allowFontScaling={false} style={styles.emoji}>
          {emoji}
        </Text>
        <ThemedText font='segment'>{name}</ThemedText>
        {isAdded && (
          <ThemedView backgroundColor='greenSoft' style={styles.addedMark}>
            <AppImage icon='check' tintColor='green' size={{ width: 10 }} />
          </ThemedView>
        )}
      </Animated.View>
    </Pressable>
  );
}

type YearButtonProps = {
  direction: 'previous' | 'next';
  onPress: () => void;
};

function YearButton({ direction, onPress }: YearButtonProps) {
  return (
    <Pressable
      guarded={false}
      accessibilityRole='button'
      accessibilityLabel={
        direction === 'previous' ? 'Попередній рік' : 'Наступний рік'
      }
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView backgroundColor='surface' style={styles.yearButton}>
        <View style={direction === 'previous' && styles.flipped}>
          <AppImage icon='chevronRight' tintColor='ink' size={{ width: 18 }} />
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
  cellPop: {
    animationName: cellPop,
    animationDuration: 320,
    animationTimingFunction: 'ease-out',
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
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
