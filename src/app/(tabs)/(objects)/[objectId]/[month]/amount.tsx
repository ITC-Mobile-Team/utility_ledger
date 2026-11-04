import {
  ActionButton,
  AppImage,
  HStack,
  TextButton,
  ThemedNavigationBar,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useLedger, useLedgerState } from '@/providers/ledger-provider';
import {
  formatMoney,
  formatMoneyInput,
  formatMonthTitle,
  getAmount,
  getMonthName,
  getPreviousMonth,
  isMonthKey,
  parseMoney,
} from '@/services/ledger';
import { confirmResetEntry } from '@/views';
import { AmountInput } from '@/views/amount/amount-input';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
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
  const previous = getAmount(state, service.id, getPreviousMonth(validMonth));
  const amount = parseMoney(value);
  const hasAmount = amount !== null && amount > 0;
  const canSave = hasAmount && amount !== saved;
  const hint = hintFor(
    hasAmount ? amount : null,
    previous,
    getMonthName(validMonth).toLocaleLowerCase('uk'),
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

  return (
    <ThemedView backgroundColor='bg' style={styles.flex}>
      <ThemedNavigationBar
        type='full'
        title={service.name}
        subtitle={`${formatMonthTitle(validMonth)} · сума з рахунку`}
      />
      {/* Клавіатура відкрита весь час: центр з сумою стискається над нею */}
      <KeyboardAvoidingView behavior='padding' style={styles.flex}>
        <VStack style={styles.center} spacing={12}>
          {previous !== undefined && (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`Підставити суму минулого місяця, ${formatMoney(previous)}`}
              onPress={() => setValue(formatMoneyInput(previous))}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedView backgroundColor='surface' style={styles.chip}>
                <HStack spacing={6} align='center'>
                  <AppImage
                    icon='reset'
                    tintColor='muted'
                    size={{ width: 16 }}
                  />
                  <ThemedText color='muted' font='body'>
                    Минулого місяця
                  </ThemedText>
                  <ThemedText font='rowTitleCompact'>
                    {formatMoney(previous)}
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
            onPress={save}
          />
          {isEditing && (
            <TextButton
              title='Скинути суму'
              disabled={isSaving}
              onPress={() =>
                confirmResetEntry(service, validMonth, () => {
                  // Спершу назад, щоб екран не встиг перемкнутись на «Додати»
                  router.back();
                  ledger.resetEntry(service.id, validMonth);
                })
              }
            />
          )}
        </VStack>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// Підказка під сумою: порожньо — що вводити, інакше різниця з минулим місяцем
const hintFor = (
  amount: number | null,
  previous: number | undefined,
  monthName: string,
) => {
  if (amount === null) {
    return {
      text: `Введіть суму з платіжки за ${monthName}`,
      color: 'muted',
      font: 'caption',
    } as const;
  }
  if (previous === undefined) {
    return { text: ' ', color: 'muted', font: 'caption' } as const;
  }
  const diff = amount - previous;
  if (diff === 0) {
    return {
      text: 'Як минулого місяця',
      color: 'muted',
      font: 'caption',
    } as const;
  }
  return {
    text: `${diff > 0 ? '+' : '−'}${formatMoney(Math.abs(diff))} до минулого місяця`,
    // Більше — червоним, менше — зеленим
    color: diff > 0 ? 'coralInk' : 'greenInk',
    font: 'status',
  } as const;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
