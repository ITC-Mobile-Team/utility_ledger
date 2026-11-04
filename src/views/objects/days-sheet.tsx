import {
  ActionButton,
  AppImage,
  HStack,
  TextButton,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
import {
  formatMoney,
  getDaysInMonth,
  getMonthName,
  type LedgerService,
  type MonthKey,
  pluralForms,
  pluralize,
} from '@/services/ledger';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheet } from './bottom-sheet';
import { ServiceIcon } from './service-icon';

type DaysSheetProps = {
  visible: boolean;
  service: LedgerService | undefined;
  month: MonthKey;
  days: number;
  onClose: () => void;
  onSave: (days: number) => void;
  // Є лише тоді, коли кількість днів внесено вручну
  onReset?: () => void;
};

const quickDays = [21, 14, 7];

export function DaysSheet({
  visible,
  service,
  month,
  days,
  onClose,
  onSave,
  onReset,
}: DaysSheetProps) {
  const daysInMonth = getDaysInMonth(month);
  const [value, setValue] = useState(days);

  if (!service) return <BottomSheet visible={false} onClose={onClose} />;

  // Кількість днів не обмежена місяцем — можна виставити і 56
  const change = (next: number) => setValue(Math.max(next, 1));

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <HStack spacing={12} align='center'>
        <ServiceIcon icon={service.icon} />
        <VStack spacing={2} style={styles.flex}>
          <ThemedText font='dialogTitle'>
            {`${service.name} · ${getMonthName(month).toLocaleLowerCase('uk')}`}
          </ThemedText>
          <ThemedText color='muted' font='caption'>
            {`Ставка ${formatMoney(service.tariff)} / день · у місяці ${daysInMonth} ${pluralize(daysInMonth, pluralForms.day)}`}
          </ThemedText>
        </VStack>
      </HStack>

      <ThemedView backgroundColor='surface2' style={styles.stepper}>
        <StepperButton
          icon='minus'
          disabled={value <= 1}
          onPress={() => change(value - 1)}
        />
        <VStack align='center' style={styles.flex}>
          <ThemedText font='stepperValue'>{value}</ThemedText>
          <ThemedText color='muted' font='caption'>
            {pluralize(value, pluralForms.day)}
          </ThemedText>
        </VStack>
        <StepperButton icon='plus' onPress={() => change(value + 1)} />
      </ThemedView>

      <HStack spacing={8}>
        {[daysInMonth, ...quickDays].map((option, index) => {
          const isSelected = option === value;
          return (
            <Pressable
              guarded={false}
              key={index}
              style={styles.flex}
              onPress={() => setValue(option)}
            >
              <ThemedView
                backgroundColor={isSelected ? 'blueSoft' : 'surface'}
                borderColor={isSelected ? 'blue' : 'line'}
                style={styles.chip}
              >
                <ThemedText
                  font='segment'
                  color={isSelected ? 'blueInk' : 'ink'}
                >
                  {index === 0 ? 'Весь' : option}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </HStack>

      <HStack align='center' style={styles.total}>
        <ThemedText color='muted' font='caption'>
          {`${value} × ${formatMoney(service.tariff)}`}
        </ThemedText>
        <ThemedText font='titleSmall'>
          {formatMoney(value * service.tariff)}
        </ThemedText>
      </HStack>

      <ActionButton title='Зберегти' onPress={() => onSave(value)} />
      {onReset && (
        <TextButton
          title='Скинути значення'
          onPress={onReset}
          style={styles.reset}
        />
      )}
    </BottomSheet>
  );
}

type StepperButtonProps = {
  icon: 'plus' | 'minus';
  disabled?: boolean;
  onPress: () => void;
};

function StepperButton({
  icon,
  disabled = false,
  onPress,
}: StepperButtonProps) {
  return (
    <Pressable
      guarded={false}
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={icon === 'plus' ? 'Додати день' : 'Відняти день'}
      style={(state) => [
        styles.stepperButton,
        disabled && styles.disabled,
        state.pressed && styles.pressed,
      ]}
    >
      <ThemedView backgroundColor='surface' style={styles.stepperCircle}>
        <AppImage icon={icon} tintColor='ink' size={{ width: 22 }} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    borderCurve: 'continuous',
  },
  stepperButton: {
    borderRadius: 26,
  },
  stepperCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: 40,
    justifyContent: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  total: {
    justifyContent: 'space-between',
  },
  reset: {
    marginTop: -6,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
