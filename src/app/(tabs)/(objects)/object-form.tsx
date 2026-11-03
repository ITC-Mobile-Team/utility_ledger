import { useHideTabBar } from '@/hooks/use-hide-tab-bar';
import {
  AppImage,
  ActionButton,
  HStack,
  NavigationView,
  ThemedText,
  ThemedTextInput,
  ThemedView,
  VStack,
} from '@/components';
import { useLedger, useLedgerObject } from '@/providers/ledger-provider';
import type { City, ObjectInput } from '@/services/ledger';
import { CityPickerSheet, FormFooter } from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Видима висота футера над клавіатурою: paddingTop 13 + кнопка 54 + 12
const FOOTER_ABOVE_KEYBOARD = 79;
const KEYBOARD_GAP = 12;

const optional = (value: string) => value.trim() || undefined;

export default function ObjectForm() {
  useHideTabBar();
  const { objectId } = useLocalSearchParams<{ objectId?: string }>();
  const ledger = useLedger();
  const existing = useLedgerObject(objectId);
  const isEditing = Boolean(existing);
  const { bottom } = useSafeAreaInsets();

  const [name, setName] = useState(existing?.name ?? '');
  const [city, setCity] = useState<City | undefined>(existing?.city);
  const [street, setStreet] = useState(existing?.street ?? '');
  const [house, setHouse] = useState(existing?.house ?? '');
  const [apartment, setApartment] = useState(existing?.apartment ?? '');
  const [building, setBuilding] = useState(existing?.building ?? '');
  const [isCityPickerVisible, setCityPickerVisible] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const save = async () => {
    const input: ObjectInput = {
      name: name.trim(),
      city,
      street: optional(street),
      house: optional(house),
      apartment: optional(apartment),
      building: optional(building),
    };
    setSaving(true);
    try {
      if (existing) {
        await ledger.updateObject(existing.id, input);
        router.back();
      } else {
        const object = await ledger.addObject(input);
        router.replace({
          pathname: '/object-added',
          params: { objectId: object.id },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <NavigationView
        title={isEditing ? 'Редагувати адресу' : 'Додати нову адресу'}
        subtitle={
          isEditing
            ? 'Змініть назву або адресу обʼєкта.'
            : 'Щоб вести комунальні платежі для ще одного обʼєкта.'
        }
        contentInsets={{ top: 0, horizontal: 20, bottom: 24 }}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='interactive'
        bottomOffset={FOOTER_ABOVE_KEYBOARD + 16}
        // футер перекриває контент, а його safe area ховається під клавіатуру
        extraKeyboardSpace={-Math.max(bottom - KEYBOARD_GAP, 0)}
      >
        <VStack spacing={24}>
          <VStack spacing={10}>
            <ThemedTextInput
              title='Назва *'
              value={name}
              onChangeText={setName}
              placeholder='Квартира в Полтаві'
              returnKeyType='done'
            />
            <ThemedText color='muted' font='caption'>
              Так обʼєкт називатиметься у списку та аналітиці.
            </ThemedText>
          </VStack>

          <VStack spacing={12}>
            <ThemedText color='muted' font='overline'>
              АДРЕСА · НЕОБОВʼЯЗКОВО
            </ThemedText>

            <Pressable
              onPress={() => setCityPickerVisible(true)}
              style={(state) => state.pressed && styles.pressed}
            >
              <ThemedView backgroundColor='surface' style={styles.field}>
                <HStack align='center'>
                  <VStack spacing={2} style={styles.fieldContent}>
                    <ThemedText color='muted' font='label'>
                      Населений пункт
                    </ThemedText>
                    <ThemedText
                      color={city ? 'ink' : 'placeholder'}
                      font='textInput'
                    >
                      {city ? `${city.name}, ${city.region}` : 'Не вказано'}
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

            <ThemedTextInput
              title='Вулиця'
              value={street}
              onChangeText={setStreet}
              placeholder='Наприклад, Соборності'
            />

            <HStack spacing={10}>
              <View style={styles.flex}>
                <ThemedTextInput
                  title='Будинок'
                  value={house}
                  onChangeText={setHouse}
                  placeholder='—'
                />
              </View>
              <View style={styles.flex}>
                <ThemedTextInput
                  title='Квартира'
                  value={apartment}
                  onChangeText={setApartment}
                  placeholder='—'
                />
              </View>
              <View style={styles.flex}>
                <ThemedTextInput
                  title='Корпус'
                  value={building}
                  onChangeText={setBuilding}
                  placeholder='—'
                />
              </View>
            </HStack>

            <ThemedText color='muted' font='caption'>
              Адресу можна заповнити пізніше — обовʼязкова лише назва.
            </ThemedText>
          </VStack>
        </VStack>
      </NavigationView>

      {/* Над клавіатурою кнопка стоїть з відступом 12, safe area ховається під клавіатуру */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: Math.max(bottom - KEYBOARD_GAP, 0) }}
      >
        <FormFooter>
          <ActionButton
            title={isEditing ? 'Зберегти' : 'Далі'}
            disabled={!canSave}
            loading={isSaving}
            onPress={save}
          />
        </FormFooter>
      </KeyboardStickyView>

      <CityPickerSheet
        visible={isCityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        onSelect={(selected) => {
          setCity(selected);
          setCityPickerVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  field: {
    paddingVertical: 11.5, // висота як у ThemedTextInput (63pt)
    paddingHorizontal: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  fieldContent: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
