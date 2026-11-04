import {
  ActionButton,
  HStack,
  KeyboardDismissView,
  NavigationView,
  TextButton,
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
  getPreviousNightReading,
  getPreviousReading,
  getReading,
  isDayNight,
  isMonthKey,
} from '@/services/ledger';
import {
  confirmResetEntry,
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
  const [value, setValue] = useState(
    saved !== undefined ? String(saved.value) : '',
  );
  const [nightValue, setNightValue] = useState(
    saved?.night !== undefined ? String(saved.night) : '',
  );
  const [isSaving, setSaving] = useState(false);
  const keyboardInsets = useFormFooterKeyboardInsets(
    false,
    saved !== undefined,
  );

  if (!service || !validMonth) return null;

  const dayNight = isDayNight(service);
  const isEditing = saved !== undefined;
  const day = toZone(value, getPreviousReading(state, service, validMonth));
  const night = toZone(
    nightValue,
    getPreviousNightReading(state, service, validMonth),
  );
  const isValid = (zone: Zone) =>
    zone.current !== undefined && !zone.isTooSmall;
  const isChanged =
    day.current !== saved?.value ||
    (dayNight && night.current !== saved?.night);
  const canSave = isValid(day) && (!dayNight || isValid(night)) && isChanged;

  const save = async () => {
    if (day.current === undefined) return;
    setSaving(true);
    try {
      await ledger.setReading({
        serviceId: service.id,
        month: validMonth,
        value: day.current,
        ...(dayNight &&
          night.current !== undefined && {
            night: night.current,
          }),
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

          {dayNight ? (
            <>
              <ZoneSection
                title='☀️ ДЕНЬ'
                unit={service.unit}
                value={value}
                onChangeValue={setValue}
                zone={day}
              />
              <ZoneSection
                title='🌙 НІЧ'
                unit={service.unit}
                value={nightValue}
                onChangeValue={setNightValue}
                zone={night}
              />
            </>
          ) : (
            <ZoneSection
              title='ПОКАЗНИК ЛІЧИЛЬНИКА'
              unit={service.unit}
              value={value}
              onChangeValue={setValue}
              zone={day}
            />
          )}

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
        {isEditing && (
          <TextButton
            title='Скинути показник'
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

type Zone = {
  previous: number;
  current?: number;
  consumption?: number;
  isTooSmall: boolean;
};

const toZone = (value: string, previous: number): Zone => {
  if (value.length === 0) return { previous, isTooSmall: false };
  const current = Number(value);
  const consumption = current - previous;
  return { previous, current, consumption, isTooSmall: consumption < 0 };
};

type ZoneSectionProps = {
  title: string;
  unit: string;
  value: string;
  onChangeValue: (value: string) => void;
  zone: Zone;
};

// Барабан лічильника з попереднім показником і споживанням для однієї зони
function ZoneSection({
  title,
  unit,
  value,
  onChangeValue,
  zone,
}: ZoneSectionProps) {
  const hasConsumption = zone.consumption !== undefined && !zone.isTooSmall;
  return (
    <VStack spacing={10}>
      <HStack>
        <ThemedText color='muted' font='overline'>
          {title}
        </ThemedText>
        <Spacer />
        <ThemedText color='muted' font='caption'>
          {unit}
        </ThemedText>
      </HStack>
      <MeterReadingInput
        value={value}
        onChangeValue={(text) => onChangeValue(text.replace(/\D/g, ''))}
        integerDigits={METER_LENGTH - 1}
        fractionDigits={1}
      />
      <ThemedText
        color={zone.isTooSmall ? 'coral' : 'muted'}
        font='caption'
        align='center'
      >
        {zone.isTooSmall
          ? 'Показник не може бути меншим за попередній'
          : `Введіть цифри як на лічильнику — до ${METER_LENGTH} знаків`}
      </ThemedText>
      <HStack spacing={10}>
        <StatTile title='Попередній' value={formatNumber(zone.previous)} />
        <StatTile
          title='Спожито'
          value={
            hasConsumption
              ? `+${formatNumber(zone.consumption ?? 0)} ${unit}`
              : '—'
          }
          highlighted={hasConsumption}
        />
      </HStack>
    </VStack>
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
