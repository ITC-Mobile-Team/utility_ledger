import {
  ActionButton,
  AppImage,
  HStack,
  KeyboardDismissView,
  NavigationView,
  RadioGroup,
  Segment,
  ThemedText,
  ThemedTextInput,
  ThemedView,
  VStack,
} from '@/components';
import { type BillingMode, billingModes } from '@/constants/billing-mode';
import { defaultServiceIcon } from '@/constants/service-icons';
import {
  useLedger,
  useLedgerObject,
  useLedgerState,
} from '@/providers/ledger-provider';
import {
  formatAddress,
  formatMoneyInput,
  type MeterZones,
  parseMoney,
  type ServiceInput,
} from '@/services/ledger';
import { FormFooter, useFormFooterKeyboardInsets, ServiceIcon } from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const zoneItems = [
  { value: 'single', label: 'Однозонний' },
  { value: 'dayNight', label: 'День / Ніч' },
  { value: 'water', label: 'Вода' },
  { value: 'gas', label: 'Газ' },
] as const;

// Вода й газ рахуються в м³
const cubicMeterZones: MeterZones[] = ['water', 'gas'];

const optionalMoneyInput = (kopecks: number | undefined) =>
  kopecks !== undefined ? formatMoneyInput(kopecks) : '';

// Порожнє поле абонплати — 0 ₴
const parseOptionalMoney = (text: string) =>
  text.trim().length === 0 ? 0 : parseMoney(text);

const tariffTitles: Record<BillingMode, string> = {
  meter: 'Тариф, ₴ за одиницю',
  fixed: 'Сума на місяць, ₴',
  day: 'Ставка за день, ₴',
  invoice: '',
};

export default function ServiceForm() {
  const {
    objectId,
    serviceId,
    icon: pickedIcon,
  } = useLocalSearchParams<{
    objectId: string;
    serviceId?: string;
    // Приходить з екрана вибору іконки
    icon?: string;
  }>();
  const ledger = useLedger();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);
  const existing = state.services.find((service) => service.id === serviceId);

  const icon = pickedIcon ?? existing?.icon ?? defaultServiceIcon;
  const [mode, setMode] = useState<BillingMode>(existing?.mode ?? 'meter');
  const [name, setName] = useState(existing?.name ?? '');
  const [unit, setUnit] = useState(existing?.unit ?? 'кВт·год');
  const [zones, setZones] = useState<MeterZones>(existing?.zones ?? 'single');
  const [initialReading, setInitialReading] = useState(
    existing?.initialReading !== undefined
      ? String(existing.initialReading)
      : '',
  );
  const [initialNightReading, setInitialNightReading] = useState(
    existing?.initialNightReading !== undefined
      ? String(existing.initialNightReading)
      : '',
  );
  const [tariff, setTariff] = useState(
    existing ? formatMoneyInput(existing.tariff) : '',
  );
  const [nightTariff, setNightTariff] = useState(
    optionalMoneyInput(existing?.nightTariff),
  );
  const [sewageTariff, setSewageTariff] = useState(
    optionalMoneyInput(existing?.sewageTariff),
  );
  const [waterFee, setWaterFee] = useState(
    optionalMoneyInput(existing?.waterFee),
  );
  const [sewageFee, setSewageFee] = useState(
    optionalMoneyInput(existing?.sewageFee),
  );
  const [isSaving, setSaving] = useState(false);

  const isDayNight = mode === 'meter' && zones === 'dayNight';
  const isWater = mode === 'meter' && zones === 'water';
  const isGas = mode === 'meter' && zones === 'gas';
  // Сума з рахунку вноситься щомісяця, тарифу немає
  const isInvoice = mode === 'invoice';
  const tariffValue = parseMoney(tariff);
  const nightTariffValue = parseMoney(nightTariff);
  const sewageTariffValue = parseMoney(sewageTariff);
  const waterFeeValue = parseOptionalMoney(waterFee);
  const sewageFeeValue = parseOptionalMoney(sewageFee);
  const hasTariff =
    isInvoice ||
    (tariffValue !== null &&
      tariffValue > 0 &&
      (!isDayNight || (nightTariffValue !== null && nightTariffValue > 0)) &&
      (!isWater ||
        (sewageTariffValue !== null &&
          sewageTariffValue > 0 &&
          waterFeeValue !== null &&
          sewageFeeValue !== null)));
  const keyboardInsets = useFormFooterKeyboardInsets(!hasTariff);

  if (!object) return null;

  const canSave = name.trim().length > 0 && hasTariff;

  // Підставляємо одиницю під тип лічильника, якщо її не змінювали
  const changeZones = (value: MeterZones) => {
    setZones(value);
    const isCubic = cubicMeterZones.includes(value);
    if (isCubic && unit === 'кВт·год') setUnit('м³');
    if (!isCubic && unit === 'м³') setUnit('кВт·год');
  };

  const save = async () => {
    if (tariffValue === null && !isInvoice) return;
    const input: ServiceInput = {
      objectId: object.id,
      icon,
      name: name.trim(),
      mode,
      unit: mode === 'meter' ? unit.trim() : '',
      tariff: isInvoice ? 0 : (tariffValue ?? 0),
      initialReading:
        mode === 'meter' ? Number(initialReading) || 0 : undefined,
      zones,
      nightTariff: isDayNight ? (nightTariffValue ?? 0) : undefined,
      initialNightReading: isDayNight
        ? Number(initialNightReading) || 0
        : undefined,
      sewageTariff: isWater ? (sewageTariffValue ?? 0) : undefined,
      waterFee: isWater ? (waterFeeValue ?? 0) : undefined,
      sewageFee: isWater ? (sewageFeeValue ?? 0) : undefined,
    };
    setSaving(true);
    try {
      if (existing) {
        await ledger.updateService(existing.id, input);
      } else {
        await ledger.addService(input);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardDismissView>
      <NavigationView
        title={existing ? 'Редагувати послугу' : 'Додати послугу'}
        subtitle={`Для обʼєкта: ${formatAddress(object)}`}
        contentInsets={{ top: 16, horizontal: 20, bottom: 24 }}
        {...keyboardInsets}
      >
        <VStack spacing={20}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/[objectId]/icon-picker',
                params: {
                  objectId: object.id,
                  ...(serviceId && { serviceId }),
                  icon,
                  serviceName: name,
                },
              })
            }
            style={(state) => state.pressed && styles.pressed}
          >
            <ThemedView backgroundColor='surface' style={styles.iconRow}>
              <HStack align='center' spacing={14}>
                <ServiceIcon icon={icon} size={48} />
                <VStack spacing={2} style={styles.flex}>
                  <ThemedText font='rowTitle'>Іконка послуги</ThemedText>
                  <ThemedText color='muted' font='caption'>
                    Торкніться, щоб обрати емодзі
                  </ThemedText>
                </VStack>
                <AppImage
                  icon='chevronRight'
                  tintColor='chev'
                  size={{ width: 18 }}
                />
              </HStack>
            </ThemedView>
          </Pressable>

          <VStack spacing={10}>
            <ThemedText color='muted' font='overline'>
              ЯК ОБЛІКОВУВАТИ
            </ThemedText>
            <RadioGroup items={billingModes} value={mode} onChange={setMode} />
          </VStack>

          <ThemedTextInput
            title='Назва послуги'
            value={name}
            onChangeText={setName}
            placeholder='Світло'
          />

          {mode === 'meter' && (
            <ThemedTextInput
              title='Одиниця'
              value={unit}
              onChangeText={setUnit}
              placeholder='кВт·год'
            />
          )}

          {mode === 'meter' && (
            <VStack spacing={10}>
              <ThemedText color='muted' font='overline'>
                ТИП ЛІЧИЛЬНИКА
              </ThemedText>
              <Segment items={zoneItems} value={zones} onChange={changeZones} />
              {!isDayNight && (
                <ThemedTextInput
                  title='Початковий показник'
                  value={initialReading}
                  onChangeText={(text) =>
                    setInitialReading(text.replace(/\D/g, ''))
                  }
                  placeholder='0'
                  keyboardType='number-pad'
                  maxLength={5}
                />
              )}
            </VStack>
          )}

          {isDayNight ? (
            <>
              <VStack spacing={10}>
                <ThemedText color='muted' font='overline'>
                  ПОЧАТКОВИЙ ПОКАЗНИК
                </ThemedText>
                <HStack spacing={10}>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='☀️ День'
                      value={initialReading}
                      onChangeText={(text) =>
                        setInitialReading(text.replace(/\D/g, ''))
                      }
                      placeholder='0'
                      keyboardType='number-pad'
                      maxLength={5}
                    />
                  </View>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='🌙 Ніч'
                      value={initialNightReading}
                      onChangeText={(text) =>
                        setInitialNightReading(text.replace(/\D/g, ''))
                      }
                      placeholder='0'
                      keyboardType='number-pad'
                      maxLength={5}
                    />
                  </View>
                </HStack>
              </VStack>

              <VStack spacing={10}>
                <ThemedText color='muted' font='overline'>
                  {`ТАРИФ ЗА ${(unit.trim() || 'одиницю').toLocaleUpperCase('uk')}`}
                </ThemedText>
                <HStack spacing={10}>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='☀️ День, ₴'
                      value={tariff}
                      onChangeText={setTariff}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='🌙 Ніч, ₴'
                      value={nightTariff}
                      onChangeText={setNightTariff}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                </HStack>
                <ThemedText color='muted' font='caption'>
                  Сума = спожито вдень × денний тариф + спожито вночі × нічний
                  тариф.
                </ThemedText>
              </VStack>
            </>
          ) : isWater ? (
            <>
              <VStack spacing={10}>
                <ThemedText color='muted' font='overline'>
                  {`ТАРИФ ЗА ${(unit.trim() || 'одиницю').toLocaleUpperCase('uk')}`}
                </ThemedText>
                <HStack spacing={10}>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='💧 Водопостач., ₴'
                      value={tariff}
                      onChangeText={setTariff}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='🚽 Стоки, ₴'
                      value={sewageTariff}
                      onChangeText={setSewageTariff}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                </HStack>
              </VStack>

              <VStack spacing={10}>
                <ThemedText color='muted' font='overline'>
                  АБОНПЛАТА НА МІСЯЦЬ
                </ThemedText>
                <HStack spacing={10}>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='💧 Вода, ₴'
                      value={waterFee}
                      onChangeText={setWaterFee}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                  <View style={styles.flex}>
                    <ThemedTextInput
                      title='🚽 Стоки, ₴'
                      value={sewageFee}
                      onChangeText={setSewageFee}
                      placeholder='0,00'
                      keyboardType='decimal-pad'
                    />
                  </View>
                </HStack>
                <ThemedText color='muted' font='caption'>
                  Сума = спожито × водопостачання + спожито × стоки + абонплата
                  за воду + абонплата за стоки.
                </ThemedText>
              </VStack>
            </>
          ) : isInvoice ? (
            <ThemedText color='muted' font='caption'>
              Тариф не потрібен: щомісяця ви вносите суму з рахунку, і вона
              входить у розрахунок місяця.
            </ThemedText>
          ) : (
            <ThemedTextInput
              title={
                isGas
                  ? `Ціна за 1 ${unit.trim() || 'м³'}, ₴`
                  : tariffTitles[mode]
              }
              value={tariff}
              onChangeText={setTariff}
              placeholder='0,00'
              keyboardType='decimal-pad'
            />
          )}
        </VStack>
      </NavigationView>

      <FormFooter
        hint={
          hasTariff
            ? undefined
            : isDayNight
              ? 'Вкажіть денний і нічний тарифи, щоб рахувати суму'
              : isWater
                ? 'Вкажіть тарифи на воду і стоки, щоб рахувати суму'
                : isGas
                  ? 'Вкажіть ціну за 1 м³, щоб рахувати суму'
                  : 'Вкажіть тариф, щоб рахувати суму'
        }
      >
        <ActionButton
          title='Зберегти'
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
  iconRow: {
    padding: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.7,
  },
});
