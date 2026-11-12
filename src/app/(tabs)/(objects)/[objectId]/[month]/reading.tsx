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
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import { useReadOnlyGuard } from '@/hooks/use-read-only-guard';
import {
  formatMonthTitle,
  digitsToReading,
  formatReading,
  getMeterFormat,
  type MeterFormat,
  readingToDigits,
  subtractReadings,
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

export default function Reading() {
  const { objectId, month, serviceId } = useLocalSearchParams<{
    objectId: string;
    month: string;
    serviceId: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const isReadOnly = useReadOnlyGuard(useLedgerObject(objectId));
  const service = state.services.find((s) => s.id === serviceId);
  const validMonth = isMonthKey(month) ? month : undefined;
  const saved =
    service && validMonth
      ? getReading(state, service.id, validMonth)
      : undefined;
  // Формат барабана послуги: світло 7/2, вода 8/3, газ 8/3
  const format = getMeterFormat(service ?? { zones: 'single' });
  const [value, setValue] = useState(readingToDigits(saved?.value, format));
  const [nightValue, setNightValue] = useState(
    readingToDigits(saved?.night, format),
  );
  const [isSaving, setSaving] = useState(false);
  const keyboardInsets = useFormFooterKeyboardInsets(
    false,
    saved !== undefined,
  );

  if (!service || !validMonth || isReadOnly) return null;

  const dayNight = isDayNight(service);
  const isEditing = saved !== undefined;
  const day = toZone(
    value,
    getPreviousReading(state, service, validMonth),
    format,
  );
  const night = toZone(
    nightValue,
    getPreviousNightReading(state, service, validMonth),
    format,
  );
  const isValid = (zone: Zone) => zone.isComplete && !zone.isTooSmall;
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
        testID='reading.screen'
        subtitle={`${formatMonthTitle(validMonth)} · ${service.name}`}
        contentInsets={{ bottom: 24 }}
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
                testID='reading.day'
                unit={service.unit}
                value={value}
                onChangeValue={setValue}
                zone={day}
                format={format}
              />
              <ZoneSection
                title='🌙 НІЧ'
                testID='reading.night'
                unit={service.unit}
                value={nightValue}
                onChangeValue={setNightValue}
                zone={night}
                format={format}
              />
            </>
          ) : (
            <ZoneSection
              title='ПОКАЗНИК ЛІЧИЛЬНИКА'
              testID='reading.value'
              unit={service.unit}
              value={value}
              onChangeValue={setValue}
              zone={day}
              format={format}
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
          testID='reading.save'
          onPress={save}
        />
        {isEditing && (
          <TextButton
            title='Скинути показник'
            disabled={isSaving}
            testID='reading.reset'
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
  isComplete: boolean;
  isTooSmall: boolean;
};

// Показник рахується лише коли введено всі цифри барабана
// Червоні клітинки — дробова частина: значення зберігається в одиницях
const toZone = (value: string, previous: number, format: MeterFormat): Zone => {
  if (value.length < format.length) {
    return { previous, isComplete: false, isTooSmall: false };
  }
  const current = digitsToReading(value, format);
  const consumption = subtractReadings(current, previous, format);
  return {
    previous,
    current,
    consumption,
    isComplete: true,
    isTooSmall: consumption < 0,
  };
};

const hintFor = (value: string, zone: Zone, { length }: MeterFormat) => {
  if (value.length === 0) {
    return {
      text: `Введіть ${length} цифр зліва направо, як на лічильнику`,
      color: 'muted',
      font: 'caption',
    } as const;
  }
  if (zone.isTooSmall) {
    return {
      text: 'Менше за попередній показник — перевірте цифри',
      color: 'coralInk',
      font: 'status',
    } as const;
  }
  if (zone.isComplete) {
    return {
      text: `Усі ${length} цифр введено`,
      color: 'greenInk',
      font: 'status',
    } as const;
  }
  return {
    text: `Цифра ${value.length + 1} з ${length}`,
    color: 'muted',
    font: 'status',
  } as const;
};

type ZoneSectionProps = {
  title: string;
  unit: string;
  value: string;
  onChangeValue: (value: string) => void;
  zone: Zone;
  format: MeterFormat;
  testID: string;
};

// Барабан лічильника (введення по цифрі) з попереднім показником і споживанням для однієї зони
function ZoneSection({
  title,
  unit,
  value,
  onChangeValue,
  zone,
  format,
  testID,
}: ZoneSectionProps) {
  const hint = hintFor(value, zone, format);
  const consumption = !zone.isComplete
    ? '—'
    : zone.isTooSmall
      ? 'Менше попереднього'
      : `+${formatReading(zone.consumption ?? 0, format.fractionDigits)} ${unit}`;
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
        onChangeValue={onChangeValue}
        length={format.length}
        fractionDigits={format.fractionDigits}
        isError={zone.isTooSmall}
        accessibilityLabel={`${title}, ${unit}`}
        testID={testID}
      >
        <ThemedText
          color={hint.color}
          font={hint.font}
          align='center'
          accessibilityLiveRegion='polite'
        >
          {hint.text}
        </ThemedText>
        <HStack spacing={10}>
          <StatTile
            title='Попередній'
            value={formatReading(zone.previous, format.fractionDigits)}
          />
          <StatTile
            title='Спожито'
            value={consumption}
            tone={
              !zone.isComplete
                ? 'default'
                : zone.isTooSmall
                  ? 'error'
                  : 'success'
            }
          />
        </HStack>
      </MeterReadingInput>
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
