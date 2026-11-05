import {
  ActionButton,
  AppImage,
  HStack,
  TextButton,
  ThemedNavigationBar,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
import { useLedger, useLedgerState } from '@/providers/ledger-provider';
import {
  formatMoney,
  formatMoneyInput,
  formatMonthTitle,
  getAmount,
  getLastAmountBefore,
  getMonthLocative,
  getMonthName,
  getPreviousMonth,
  isMonthKey,
  type MonthKey,
  parseMoney,
} from '@/services/ledger';
import { ServiceIcon } from '@/views';
import { AmountInput } from '@/views/amount/amount-input';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Відступ кнопки від клавіатури, коли вона відкрита
const KEYBOARD_GAP = 12;

// Сума з рахунку за місяць для послуги з режимом 'invoice' (макети 10e, 10f, 10g)
export default function Amount() {
  const { month, serviceId } = useLocalSearchParams<{
    objectId: string;
    month: string;
    serviceId: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const { bottom } = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardState((s) => s.isVisible);
  const service = state.services.find((s) => s.id === serviceId);
  const validMonth = isMonthKey(month) ? month : undefined;
  const saved =
    service && validMonth
      ? getAmount(state, service.id, validMonth)
      : undefined;
  const [value, setValue] = useState(
    saved !== undefined ? formatMoneyInput(saved) : '',
  );
  const [isSaving, setSaving] = useState(false);

  if (!service || !validMonth) return null;

  const isEditing = saved !== undefined;
  const monthName = getMonthName(validMonth).toLocaleLowerCase('uk');
  const last = getLastAmountBefore(state, service.id, validMonth);
  const reference = last && toReference(last.month, validMonth);
  const amount = parseMoney(value);
  const hasAmount = amount !== null && amount > 0;
  const canSave = hasAmount && amount !== saved;
  const hint = hintFor(
    hasAmount ? amount : null,
    last && reference ? { amount: last.amount, ...reference } : undefined,
    monthName,
  );

  const save = async () => {
    if (!hasAmount) return;
    setSaving(true);
    try {
      await ledger.setAmount({
        serviceId: service.id,
        month: validMonth,
        amount,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () =>
    Alert.alert(
      `Скинути суму за ${monthName}?`,
      'Послуга знову стане «Внести», а розрахунок місяця перерахується.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Скинути',
          style: 'destructive',
          onPress: () => {
            // Спершу назад, щоб екран не встиг перемкнутись на «Додати»
            router.back();
            ledger.resetEntry(service.id, validMonth);
          },
        },
      ],
    );

  return (
    <ThemedView backgroundColor='bg' style={styles.flex}>
      {/* Лише кнопка «назад»: назва з іконкою послуги — окремим рядком нижче */}
      <ThemedNavigationBar type='short' title='' />
      <HStack spacing={14} align='center' style={styles.header}>
        <ServiceIcon icon={service.icon} size={48} />
        <VStack spacing={2} style={styles.flex}>
          <ThemedText font='titleSmall' numberOfLines={2}>
            {service.name}
          </ThemedText>
          <ThemedText color='muted' font='bodySmall'>
            {`${formatMonthTitle(validMonth)} · сума з рахунку`}
          </ThemedText>
        </VStack>
      </HStack>

      {/* Клавіатура відкрита весь час: центр з сумою стискається над нею */}
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <VStack style={styles.center} spacing={12}>
          {last && reference && (
            <Pressable
              guarded={false}
              accessibilityRole='button'
              accessibilityLabel={`Підставити суму: ${reference.label}, ${formatMoney(last.amount)}`}
              testID='amount.last'
              onPress={() => setValue(formatMoneyInput(last.amount))}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedView
                backgroundColor='surface'
                borderColor='line'
                style={styles.chip}
              >
                <HStack spacing={6} align='center'>
                  <AppImage
                    icon='reset'
                    tintColor='muted'
                    size={{ width: 16 }}
                  />
                  <ThemedText color='muted' font='bodySmall'>
                    {reference.label}
                  </ThemedText>
                  <ThemedText font='bodySmallStrong'>
                    {formatMoney(last.amount)}
                  </ThemedText>
                </HStack>
              </ThemedView>
            </Pressable>
          )}
          <AmountInput
            value={value}
            onChangeValue={setValue}
            autoFocus
            accessibilityLabel='Сума з рахунку, гривень'
            testID='amount.value'
          >
            <ThemedText
              color={hint.color}
              font={hint.font}
              align='center'
              accessibilityLiveRegion='polite'
            >
              {hint.text}
            </ThemedText>
          </AmountInput>
        </VStack>

        <VStack
          spacing={4}
          style={[
            styles.footer,
            {
              paddingBottom: isKeyboardVisible
                ? KEYBOARD_GAP
                : Math.max(bottom, KEYBOARD_GAP),
            },
          ]}
        >
          <ActionButton
            title={isEditing ? 'Зберегти зміни' : 'Зберегти суму'}
            disabled={!canSave}
            loading={isSaving}
            testID='amount.save'
            onPress={save}
          />
          {isEditing && (
            <TextButton
              title='Скинути суму'
              disabled={isSaving}
              testID='amount.reset'
              onPress={confirmReset}
            />
          )}
        </VStack>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

type Reference = {
  // Підпис чипа: «Минулого місяця» або «Вересень 2026»
  label: string;
  // «до минулого місяця» / «до суми за вересень»
  diffSuffix: string;
  // «Як минулого місяця» / «Як у вересні»
  sameText: string;
};

// З чим порівнюємо: з попереднім місяцем, а якщо за нього суми немає —
// з останньою внесеною раніше
const toReference = (lastMonth: MonthKey, month: MonthKey): Reference => {
  if (lastMonth === getPreviousMonth(month)) {
    return {
      label: 'Минулого місяця',
      diffSuffix: 'до минулого місяця',
      sameText: 'Як минулого місяця',
    };
  }
  const sameYear = lastMonth.slice(0, 4) === month.slice(0, 4);
  const name = getMonthName(lastMonth).toLocaleLowerCase('uk');
  const year = sameYear ? '' : ` ${lastMonth.slice(0, 4)}`;
  return {
    label: formatMonthTitle(lastMonth),
    diffSuffix: `до суми за ${name}${year}`,
    sameText: `Як у ${getMonthLocative(lastMonth)}${year}`,
  };
};

// Підказка під сумою: порожньо — що вводити, інакше різниця з попередньою сумою
const hintFor = (
  amount: number | null,
  last: (Reference & { amount: number }) | undefined,
  monthName: string,
) => {
  if (amount === null) {
    return {
      text: `Введіть суму з платіжки за ${monthName}`,
      color: 'muted',
      font: 'bodySmall',
    } as const;
  }
  if (!last) {
    return {
      text: `Сума з платіжки за ${monthName}`,
      color: 'muted',
      font: 'bodySmall',
    } as const;
  }
  const diff = amount - last.amount;
  if (diff === 0) {
    return { text: last.sameText, color: 'muted', font: 'bodySmall' } as const;
  }
  return {
    text: `${diff > 0 ? '+' : '−'}${formatMoney(Math.abs(diff))} ${last.diffSuffix}`,
    // Більше — червоним, менше — зеленим
    color: diff > 0 ? 'coralInk' : 'greenInk',
    font: 'bodySmallStrong',
  } as const;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  chip: {
    height: 36,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 18,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
});
