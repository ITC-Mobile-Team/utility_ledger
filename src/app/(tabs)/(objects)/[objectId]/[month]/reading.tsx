import { useHideTabBar } from '@/hooks/use-hide-tab-bar';
import {
  ActionButton,
  HStack,
  KeyboardDismissView,
  NavigationView,
  Spacer,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useLedger, useLedgerState } from '@/providers/ledger-provider';
import {
  formatMonthTitle,
  formatNumber,
  formatTariff,
  getPreviousReading,
  getReading,
  isMonthKey,
} from '@/services/ledger';
import {
  FormFooter,
  useFormFooterKeyboardInsets,
  ServiceIcon,
  StatTile,
} from '@/views';
import { MeterReadingInput } from '@/views/meter/meter-reading-input';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

const METER_LENGTH = 5;

export default function Reading() {
  useHideTabBar();
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
      ? getReading(state, service.id, validMonth)
      : undefined;
  const [value, setValue] = useState(saved !== undefined ? String(saved) : '');
  const [isSaving, setSaving] = useState(false);
  const keyboardInsets = useFormFooterKeyboardInsets();

  if (!service || !validMonth) return null;

  const isEditing = saved !== undefined;
  const previous = getPreviousReading(state, service, validMonth);
  const current = value.length > 0 ? Number(value) : undefined;
  const consumption = current !== undefined ? current - previous : undefined;
  const isTooSmall = consumption !== undefined && consumption < 0;
  const canSave = current !== undefined && !isTooSmall && current !== saved;

  const save = async () => {
    if (current === undefined) return;
    setSaving(true);
    try {
      await ledger.setReading({
        serviceId: service.id,
        month: validMonth,
        value: current,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardDismissView>
      <NavigationView
        title={isEditing ? 'Змінити показник' : 'Додати показник'}
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
                  {`Показник · тариф ${formatTariff(service)}`}
                </ThemedText>
              </VStack>
              {isEditing && <ThemedBadge text='Внесено' type='green' />}
            </HStack>
          </ThemedView>

          <VStack spacing={10}>
            <HStack>
              <ThemedText color='muted' font='overline'>
                ПОКАЗНИК ЛІЧИЛЬНИКА
              </ThemedText>
              <Spacer />
              <ThemedText color='muted' font='caption'>
                {service.unit}
              </ThemedText>
            </HStack>
            <MeterReadingInput
              value={value}
              onChangeValue={(text) => setValue(text.replace(/\D/g, ''))}
              integerDigits={METER_LENGTH - 1}
              fractionDigits={1}
            />
            <ThemedText
              color={isTooSmall ? 'coral' : 'muted'}
              font='caption'
              align='center'
            >
              {isTooSmall
                ? 'Показник не може бути меншим за попередній'
                : `Введіть цифри як на лічильнику — до ${METER_LENGTH} знаків`}
            </ThemedText>
          </VStack>

          <HStack spacing={10}>
            <StatTile title='Попередній' value={formatNumber(previous)} />
            <StatTile
              title='Спожито'
              value={
                consumption !== undefined && !isTooSmall
                  ? `+${formatNumber(consumption)} ${service.unit}`
                  : '—'
              }
              highlighted={consumption !== undefined && !isTooSmall}
            />
          </HStack>

          <ThemedText color='muted' font='caption'>
            {isEditing
              ? 'Розрахунок місяця оновиться з новим значенням.'
              : 'Запис збережеться лише для цієї послуги та місяця.'}
          </ThemedText>
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title={isEditing ? 'Зберегти зміни' : 'Записати показник'}
          disabled={!canSave}
          loading={isSaving}
          onPress={save}
        />
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
