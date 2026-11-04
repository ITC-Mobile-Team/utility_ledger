import {
  ActionButton,
  AppImage,
  HStack,
  KeyboardDismissView,
  NavigationView,
  Pressable,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useLedgerState } from '@/providers/ledger-provider';
import {
  useOutageRepository,
  useOutageSettings,
} from '@/providers/outage-provider';
import { getProviderForCity, pluralizeQueues } from '@/services/outages';
import {
  FormFooter,
  ListCard,
  ListRow,
  OutageCitySheet,
  SectionHeader,
  useFormFooterKeyboardInsets,
} from '@/views';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';

const GRID_COLUMNS = 4;
const NAME_ROW_HEIGHT = 58;
// KeyboardAwareScrollView догортає над футером низ курсора, а не рядка.
// Під текстом поля назви лишається ще пів рядка — додаємо їх до відступу,
// щоб рядок у фокусі був видний повністю
const NAME_ROW_BELOW_TEXT =
  (NAME_ROW_HEIGHT - typography.rowTitle.lineHeight) / 2;

export default function OutageSettingsScreen() {
  const repository = useOutageRepository();
  const settings = useOutageSettings();
  const ledger = useLedgerState();
  const keyboardInsets = useFormFooterKeyboardInsets();

  // Без збереженого міста пропонуємо місто з адрес користувача
  const objectCities = ledger.objects.flatMap((object) =>
    object.city ? [object.city.name] : [],
  );
  const suggestedCity =
    objectCities.find((name) => getProviderForCity(name)) ?? objectCities[0];

  const [city, setCity] = useState(settings.city ?? suggestedCity);
  const [picked, setPicked] = useState(() =>
    settings.queues.map((queue) => queue.id),
  );
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      settings.queues.map((queue) => [queue.id, queue.name ?? '']),
    ),
  );
  const [isCitySheetVisible, setCitySheetVisible] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const provider = getProviderForCity(city);
  const pickedQueues = provider
    ? provider.queues.filter((id) => picked.includes(id))
    : [];
  const canSave = Boolean(city) && (!provider || pickedQueues.length > 0);

  const toggle = (id: string) =>
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const save = async () => {
    setSaving(true);
    try {
      await repository.save({
        city,
        queues: pickedQueues.map((id) => ({
          id,
          name: names[id]?.trim() || undefined,
        })),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const footerTitle = !city
    ? 'Оберіть місто'
    : provider && pickedQueues.length === 0
      ? 'Оберіть хоча б одну чергу'
      : 'Зберегти';

  return (
    <KeyboardDismissView>
      <NavigationView
        type='short'
        barType='purple'
        title='Графік відключень'
        contentInsets={{ top: 20, horizontal: 20, bottom: 24 }}
        {...keyboardInsets}
        bottomOffset={keyboardInsets.bottomOffset + NAME_ROW_BELOW_TEXT}
      >
        <VStack spacing={20}>
          <VStack spacing={8}>
            <SectionHeader title='Місто' variant='overline' />
            <ListCard>
              <ListRow
                leading={
                  <ThemedView backgroundColor='powerOnSoft' style={styles.icon}>
                    <AppImage
                      icon='pin'
                      tintColor='powerOnInk'
                      size={{ width: 18 }}
                    />
                  </ThemedView>
                }
                onPress={() => {
                  Keyboard.dismiss();
                  setCitySheetVisible(true);
                }}
              >
                <ThemedText
                  font='rowTitle'
                  color={city ? 'ink' : 'placeholder'}
                >
                  {city ?? 'Не вказано'}
                </ThemedText>
                {city && (
                  <ThemedText
                    font='caption'
                    color={provider ? 'muted' : 'coralInk'}
                  >
                    {provider?.name ?? 'Постачальник ще не доданий'}
                  </ThemedText>
                )}
              </ListRow>
            </ListCard>
          </VStack>

          {city && !provider && (
            <ThemedView backgroundColor='surface' style={styles.notice}>
              <ThemedView backgroundColor='surface2' style={styles.noticeIcon}>
                <AppImage icon='clock' tintColor='muted' size={{ width: 24 }} />
              </ThemedView>
              <ThemedText font='heading' align='center'>
                Постачальник для вашого міста поки що не доданий
              </ThemedText>
              <ThemedText font='bodySmall' color='muted' align='center'>
                Ми вже працюємо над цим. Щойно графік для міста {city}{' '}
                зʼявиться, вкладка «Світло» покаже його автоматично.
              </ThemedText>
            </ThemedView>
          )}

          {provider && (
            <VStack spacing={8}>
              <HStack align='bottom' style={styles.sectionRow}>
                <SectionHeader title='Мої черги' variant='overline' />
                <ThemedText font='caption' color='muted'>
                  {pickedQueues.length > 0
                    ? `Обрано ${pickedQueues.length} ${pluralizeQueues(pickedQueues.length)}`
                    : 'Нічого не обрано'}
                </ThemedText>
              </HStack>
              <ThemedView backgroundColor='surface' style={styles.gridCard}>
                <View style={styles.grid} accessibilityLabel='Черги'>
                  {provider.queues.map((id) => (
                    <QueueToggle
                      key={id}
                      id={id}
                      isOn={picked.includes(id)}
                      onPress={() => toggle(id)}
                    />
                  ))}
                </View>
              </ThemedView>
              {provider.lookupUrl && (
                <ListCard>
                  <ListRow
                    showsChevron={false}
                    compact
                    trailing={
                      <AppImage
                        icon='arrowUpRight'
                        tintColor='blueInk'
                        size={{ width: 18 }}
                      />
                    }
                    onPress={() =>
                      provider.lookupUrl &&
                      WebBrowser.openBrowserAsync(provider.lookupUrl)
                    }
                  >
                    <ThemedText font='rowTitleCompact' color='blueInk'>
                      Не знаєте свою чергу?
                    </ThemedText>
                    <ThemedText font='caption' color='muted'>
                      Перевірте адресу на сайті {provider.name}
                    </ThemedText>
                  </ListRow>
                </ListCard>
              )}
            </VStack>
          )}

          {pickedQueues.length > 0 && (
            <VStack spacing={8}>
              <SectionHeader title='Назви черг' variant='overline' />
              <ListCard>
                {pickedQueues.map((id) => (
                  <QueueNameRow
                    key={id}
                    id={id}
                    value={names[id] ?? ''}
                    onChange={(name) =>
                      setNames((current) => ({ ...current, [id]: name }))
                    }
                  />
                ))}
              </ListCard>
              <ThemedText font='footnote' color='muted' style={styles.help}>
                Назва зʼявиться поруч із номером черги на вкладці «Світло» —
                наприклад «Дім» чи «Офіс».
              </ThemedText>
            </VStack>
          )}
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title={footerTitle}
          disabled={!canSave}
          loading={isSaving}
          onPress={save}
        />
      </FormFooter>

      <OutageCitySheet
        visible={isCitySheetVisible}
        selected={city}
        onClose={() => setCitySheetVisible(false)}
        onSelect={(name) => {
          if (name !== city) setPicked([]);
          setCity(name);
          setCitySheetVisible(false);
        }}
      />
    </KeyboardDismissView>
  );
}

function QueueToggle({
  id,
  isOn,
  onPress,
}: {
  id: string;
  isOn: boolean;
  onPress: () => void;
}) {
  const powerOn = useThemeColor('powerOn');
  const line = useThemeColor('line');
  const surface = useThemeColor('surface');
  return (
    <View style={styles.cell}>
      <Pressable
        guarded={false}
        accessibilityRole='button'
        accessibilityLabel={`Черга ${id}`}
        accessibilityState={{ selected: isOn }}
        onPress={onPress}
        style={(state) => [
          styles.toggle,
          {
            backgroundColor: isOn ? powerOn : surface,
            borderColor: isOn ? powerOn : line,
          },
          state.pressed && styles.pressed,
        ]}
      >
        <ThemedText font='rowTitle' color={isOn ? 'powerOnText' : 'ink'}>
          {id}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function QueueNameRow({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ink = useThemeColor('ink');
  const placeholder = useThemeColor('placeholder');
  const inputRef = useRef<TextInputInstance>(null);
  return (
    // Тап по всьому рядку (номер черги, відступи) ставить фокус в інпут
    <Pressable
      guarded={false}
      accessible={false}
      onPress={() => inputRef.current?.focus()}
    >
      <HStack align='center' spacing={12} style={styles.nameRow}>
        <ThemedView backgroundColor='powerOff' style={styles.queueBadge}>
          <ThemedText font='rowTitleCompact' color='powerOffInk'>
            {id}
          </ThemedText>
        </ThemedView>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder='Додати назву'
          placeholderTextColor={placeholder}
          returnKeyType='done'
          maxLength={24}
          accessibilityLabel={`Назва черги ${id}`}
          style={[typography.rowTitle, styles.nameInput, { color: ink }]}
        />
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 10,
  },
  noticeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  gridCard: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / GRID_COLUMNS}%`,
    padding: 4,
  },
  toggle: {
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  nameRow: {
    minHeight: NAME_ROW_HEIGHT,
    paddingHorizontal: 16,
  },
  queueBadge: {
    minWidth: 44,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    padding: 0, // прибирає дефолтні відступи Android
    includeFontPadding: false,
  },
  help: {
    paddingHorizontal: 4,
  },
});
