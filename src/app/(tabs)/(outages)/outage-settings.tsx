import {
  ActionButton,
  AppImage,
  HStack,
  KeyboardDismissView,
  NavigationView,
  Pressable,
  Segment,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useLedgerState } from '@/providers/ledger-provider';
import {
  useOutageRepository,
  useOutageSettings,
} from '@/providers/outage-provider';
import {
  normalizeNotificationSettings,
  ensureNotificationPermission,
  formatDuration,
  getProviderForCity,
  NOTIFICATION_LEADS,
  type NotificationLead,
  pluralizeQueues,
  showNotificationPermissionAlert,
  syncOutageNotifications,
} from '@/services/outages';
import {
  FormFooter,
  ListCard,
  ListRow,
  OutageCitySheet,
  SectionHeader,
  StartQueueRow,
  useFormFooterKeyboardInsets,
} from '@/views';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Switch,
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
  const switchOn = useThemeColor('green');

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
  // Черга, вибрана при холодному запуску «Світла» (з-поміж обраних)
  const [startQueue, setStartQueue] = useState(settings.startQueue);
  const [isCitySheetVisible, setCitySheetVisible] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(() =>
    normalizeNotificationSettings(settings.notifications),
  );
  // Черги, для яких попереджати; спершу — усі обрані
  const [notifyQueues, setNotifyQueues] = useState<string[]>(
    () =>
      settings.notifications?.queues ??
      settings.queues.map((queue) => queue.id),
  );

  // Увімкнення попереджень спершу просить дозвіл на сповіщення
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && !(await ensureNotificationPermission())) {
      showNotificationPermissionAlert();
      return;
    }
    setNotifications((current) => ({ ...current, enabled }));
  };

  const provider = getProviderForCity(city);
  const pickedQueues = provider
    ? provider.queues.filter((id) => picked.includes(id))
    : [];
  const canSave = Boolean(city) && (!provider || pickedQueues.length > 0);
  // Прибрана з обраних стартова черга не зберігається — відкриється перша
  const validStartQueue =
    startQueue && pickedQueues.includes(startQueue) ? startQueue : undefined;

  // Нова черга одразу потрапляє і в попередження, прибрана — зникає з них
  const toggle = (id: string) => {
    const isPicked = picked.includes(id);
    setPicked((current) =>
      isPicked ? current.filter((item) => item !== id) : [...current, id],
    );
    setNotifyQueues((current) =>
      isPicked
        ? current.filter((item) => item !== id)
        : [...new Set([...current, id])],
    );
  };

  const toggleNotifyQueue = (id: string) =>
    setNotifyQueues((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const notifyPicked = pickedQueues.filter((id) => notifyQueues.includes(id));
  const notifySubtitle =
    notifyPicked.length === 0
      ? 'Оберіть хоча б одну чергу'
      : notifyPicked.length === pickedQueues.length
        ? 'Для всіх обраних черг'
        : `Для ${notifyPicked.length} з ${pickedQueues.length} черг`;

  const save = async () => {
    setSaving(true);
    try {
      const next = {
        city,
        queues: pickedQueues.map((id) => ({
          id,
          name: names[id]?.trim() || undefined,
        })),
        notifications: { ...notifications, queues: notifyPicked },
        startQueue: validStartQueue,
      };
      await repository.save(next);
      // Попередження переплановуються за збереженим графіком; свіжий
      // графік вкладка підтягне сама і переплановує їх ще раз
      const cached = provider
        ? await repository.loadCachedSchedule(provider.id)
        : undefined;
      await syncOutageNotifications(next, cached).catch(() => {});
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
        barType='power'
        title='Налаштування'
        testID='outageSettings.screen'
        contentInsets={{ bottom: 24 }}
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
                    <AppImage icon='pin' container={iconTiles.menu} />
                  </ThemedView>
                }
                testID='outageSettings.city'
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
                <AppImage icon='clock' container={iconTiles.large} />
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
              {pickedQueues.length >= 2 && (
                <ListCard>
                  <StartQueueRow
                    queues={pickedQueues.map((id) => ({
                      id,
                      name: names[id],
                    }))}
                    value={validStartQueue ?? pickedQueues[0] ?? ''}
                    onChange={setStartQueue}
                  />
                </ListCard>
              )}
              {provider.lookupUrl && (
                <ListCard>
                  <ListRow
                    showsChevron={false}
                    compact
                    trailing={<AppImage icon='arrowUpRight' role='inline' />}
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

          {provider && (
            <VStack spacing={8}>
              <SectionHeader title='Сповіщення' variant='overline' />
              <ThemedView backgroundColor='surface' style={styles.notifyCard}>
                <HStack align='center' spacing={12}>
                  <VStack spacing={2} style={styles.flex}>
                    <ThemedText font='rowTitle'>
                      Попереджати перед вимкненням
                    </ThemedText>
                    {notifications.enabled && (
                      <ThemedText
                        font='caption'
                        color={notifyPicked.length ? 'muted' : 'coralInk'}
                      >
                        {notifySubtitle}
                      </ThemedText>
                    )}
                  </VStack>
                  <Switch
                    value={notifications.enabled}
                    onValueChange={toggleNotifications}
                    trackColor={{ true: switchOn }}
                    accessibilityLabel='Попереджати перед вимкненням'
                    testID='outageSettings.notify'
                  />
                </HStack>
                {notifications.enabled && pickedQueues.length > 0 && (
                  <VStack spacing={8}>
                    <ThemedText font='caption' color='muted'>
                      Для яких черг
                    </ThemedText>
                    <View
                      style={styles.notifyChips}
                      accessibilityLabel='Черги для сповіщень'
                    >
                      {pickedQueues.map((id) => (
                        <NotifyQueueChip
                          key={id}
                          id={id}
                          name={names[id]?.trim()}
                          isOn={notifyQueues.includes(id)}
                          onPress={() => toggleNotifyQueue(id)}
                        />
                      ))}
                    </View>
                  </VStack>
                )}
                {notifications.enabled && (
                  <Segment<`${NotificationLead}`>
                    testID='outageSettings.lead'
                    items={NOTIFICATION_LEADS.map((lead) => ({
                      value: `${lead}`,
                      label: `За ${formatDuration(lead)}`,
                    }))}
                    value={`${notifications.leadMinutes}`}
                    onChange={(value) =>
                      setNotifications((current) => ({
                        ...current,
                        leadMinutes: Number(value) as NotificationLead,
                      }))
                    }
                  />
                )}
              </ThemedView>
              {notifications.enabled && (
                <ThemedText font='footnote' color='muted' style={styles.help}>
                  Нагадування ставляться за останнім завантаженим графіком — щоб
                  вони не відставали від змін, час від часу відкривайте вкладку
                  «Світло».
                </ThemedText>
              )}
            </VStack>
          )}
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title={footerTitle}
          disabled={!canSave}
          loading={isSaving}
          testID='outageSettings.save'
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
        testID={`outageSettings.queue.${id}`}
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

function NotifyQueueChip({
  id,
  name,
  isOn,
  onPress,
}: {
  id: string;
  name?: string;
  isOn: boolean;
  onPress: () => void;
}) {
  const powerOn = useThemeColor('powerOn');
  const powerOnSoft = useThemeColor('powerOnSoft');
  const line = useThemeColor('line');
  const surface = useThemeColor('surface');
  return (
    <Pressable
      guarded={false}
      accessibilityRole='button'
      accessibilityLabel={`Сповіщення для черги ${id}`}
      testID={`outageSettings.notifyQueue.${id}`}
      accessibilityState={{ selected: isOn }}
      onPress={onPress}
      style={(state) => [
        styles.notifyChip,
        {
          backgroundColor: isOn ? powerOnSoft : surface,
          borderColor: isOn ? powerOn : line,
          paddingLeft: isOn ? 10 : 14,
        },
        state.pressed && styles.pressed,
      ]}
    >
      {isOn && <AppImage icon='check' role='inline' />}
      <ThemedText font='rowTitleCompact' color={isOn ? 'ink' : 'muted'}>
        {id}
      </ThemedText>
      {name && (
        <ThemedText font='labelMedium' color={isOn ? 'ink' : 'muted'}>
          {name}
        </ThemedText>
      )}
    </Pressable>
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
          testID={`outageSettings.queueName.${id}`}
          style={[typography.rowTitle, styles.nameInput, { color: ink }]}
        />
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: iconTiles.menu,
    height: iconTiles.menu,
    borderRadius: iconTiles.menu / 2,
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
    width: iconTiles.large,
    height: iconTiles.large,
    borderRadius: iconTiles.large / 2,
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
  notifyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notifyChip: {
    height: 38,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifyCard: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    gap: 14,
  },
  flex: {
    flex: 1,
  },
  help: {
    paddingHorizontal: 4,
  },
});
