import {
  HStack,
  Pressable,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { useThemeColor } from '@/hooks/use-theme-colors';
import {
  type AddressOption,
  type AnalyticsPeriod,
  type AnalyticsSelection,
  formatShortDate,
} from '@/services/analytics';
import { formatMoney } from '@/services/ledger';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '../objects/bottom-sheet';
import { AddressIcon } from './address-icon';

type AddressSheetProps = {
  visible: boolean;
  options: readonly AddressOption[];
  period: AnalyticsPeriod;
  selection: AnalyticsSelection;
  onClose: () => void;
  onSelect: (selection: AnalyticsSelection) => void;
};

const isSame = (a: AnalyticsSelection, b: AnalyticsSelection) =>
  a.kind === 'all'
    ? b.kind === 'all'
    : b.kind === 'object' && a.objectId === b.objectId;

// Шторка «Адреса» (артборд 14d): адреси й «Усі адреси» з сумою за період і
// часткою від усіх; вибір одразу закриває шторку
export function AddressSheet({
  visible,
  options,
  period,
  selection,
  onClose,
  onSelect,
}: AddressSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <VStack spacing={2}>
        <ThemedText font='titleSmall' accessibilityRole='header'>
          Адреса
        </ThemedText>
        <ThemedText color='muted' font='caption'>
          {`Витрати за ${formatShortDate(period.start)} – ${formatShortDate(period.end)}`}
        </ThemedText>
      </VStack>
      <VStack spacing={8} accessibilityRole='radiogroup'>
        {options.map((option, index) => (
          <AddressOptionRow
            key={
              option.selection.kind === 'all'
                ? 'all'
                : option.selection.objectId
            }
            option={option}
            index={index}
            selected={isSame(option.selection, selection)}
            onPress={() => onSelect(option.selection)}
          />
        ))}
      </VStack>
    </BottomSheet>
  );
}

type AddressOptionRowProps = {
  option: AddressOption;
  index: number;
  selected: boolean;
  onPress: () => void;
};

function AddressOptionRow({
  option,
  index,
  selected,
  onPress,
}: AddressOptionRowProps) {
  const green = useThemeColor('green');
  const line = useThemeColor('line');
  return (
    <Pressable
      accessibilityRole='radio'
      accessibilityState={{ checked: selected }}
      testID={`analytics.sheet.address.${index}`}
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView
        backgroundColor={selected ? 'greenSoft' : 'surface'}
        style={[styles.option, { borderColor: selected ? green : line }]}
      >
        <HStack spacing={12} align='center'>
          <AddressIcon selection={option.selection} size={iconTiles.menu} />
          <VStack spacing={2} style={styles.copy}>
            <ThemedText font='rowTitleMedium' numberOfLines={1}>
              {option.title}
            </ThemedText>
            <ThemedText color='muted' font='caption' numberOfLines={1}>
              {option.subtitle}
            </ThemedText>
          </VStack>
          <VStack spacing={4} style={styles.trailing}>
            <ThemedText font='rowTitleMedium'>
              {formatMoney(option.total)}
            </ThemedText>
            <ThemedView backgroundColor='track' style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${option.ratio * 100}%`, backgroundColor: green },
                ]}
              />
            </ThemedView>
          </VStack>
        </HStack>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  option: {
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  copy: {
    flex: 1,
  },
  trailing: {
    alignItems: 'flex-end',
  },
  track: {
    width: 72,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
