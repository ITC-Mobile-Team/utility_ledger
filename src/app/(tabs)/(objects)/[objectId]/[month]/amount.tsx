import {
  ActionButton,
  HStack,
  KeyboardDismissView,
  NavigationView,
  TextButton,
  ThemedBadge,
  ThemedText,
  ThemedTextInput,
  ThemedView,
  VStack,
} from '@/components';
import { useLedger, useLedgerState } from '@/providers/ledger-provider';
import {
  formatMoneyInput,
  formatMonthTitle,
  getAmount,
  isMonthKey,
  parseMoney,
} from '@/services/ledger';
import {
  confirmResetEntry,
  FormFooter,
  ServiceIcon,
  useFormFooterKeyboardInsets,
} from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

// Сума з рахунку за місяць для послуги з режимом 'invoice'
export default function Amount() {
  const { month, serviceId } = useLocalSearchParams<{
    objectId: string;
    month: string;
    serviceId: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
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
  const keyboardInsets = useFormFooterKeyboardInsets(
    false,
    saved !== undefined,
  );

  if (!service || !validMonth) return null;

  const isEditing = saved !== undefined;
  const amount = parseMoney(value);
  const isInvalid = value.trim().length > 0 && amount === null;
  const canSave = amount !== null && amount !== saved;

  const save = async () => {
    if (amount === null) return;
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
    <KeyboardDismissView>
      <NavigationView
        title={isEditing ? 'Змінити суму' : 'Внести суму'}
        subtitle={`${formatMonthTitle(validMonth)} · ${service.name}`}
        contentInsets={{ top: 16, horizontal: 20, bottom: 24 }}
        {...keyboardInsets}
      >
        <VStack spacing={20}>
          <ThemedView backgroundColor='surface' style={styles.serviceCard}>
            <HStack spacing={12} align='center'>
              <ServiceIcon icon={service.icon} />
              <VStack spacing={2} style={styles.flex}>
                <ThemedText font='rowTitle'>{service.name}</ThemedText>
                <ThemedText color='muted' font='caption'>
                  Сума з рахунку · щомісяця нова
                </ThemedText>
              </VStack>
              {isEditing && <ThemedBadge text='Внесено' type='green' />}
            </HStack>
          </ThemedView>

          <VStack spacing={10}>
            <ThemedTextInput
              title='Сума до сплати, ₴'
              value={value}
              onChangeText={setValue}
              placeholder='0,00'
              keyboardType='decimal-pad'
            />
            <ThemedText color={isInvalid ? 'coral' : 'muted'} font='caption'>
              {isInvalid
                ? 'Введіть суму, наприклад 245,50'
                : isEditing
                  ? 'Розрахунок місяця оновиться з новою сумою.'
                  : 'Сума збережеться лише для цієї послуги та місяця.'}
            </ThemedText>
          </VStack>
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title={isEditing ? 'Зберегти зміни' : 'Записати суму'}
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
      </FormFooter>
    </KeyboardDismissView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  serviceCard: {
    padding: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
  },
});
