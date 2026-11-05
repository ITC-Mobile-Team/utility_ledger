import {
  NavigationBarIconButton,
  NavigationView,
  Segment,
  ThemedText,
  VStack,
} from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import {
  useOutageSchedule,
  useOutageSettings,
  useZonedNow,
} from '@/providers/outage-provider';
import {
  addDays,
  findDay,
  formatDuration,
  formatShortDate,
  getOffMinutes,
  getOutageIntervals,
  getPowerStatus,
  getProviderForCity,
  type OutageProvider,
  type OutageSchedule,
  type QueueSettings,
  type ZonedNow,
} from '@/services/outages';
import {
  DayTimeline,
  OutageList,
  OutageMessage,
  OutageSkeleton,
  PowerStatusCard,
  QueueChips,
  SectionHeader,
} from '@/views';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';

type Day = 'today' | 'tomorrow';

const openSettings = () => router.push('/outage-settings');

// Шестерня праворуч від заголовка — налаштування графіка
const settingsButton = (
  <NavigationBarIconButton
    icon='gear'
    accessibilityLabel='Налаштування графіка'
    testID='outages.settings'
    onPress={openSettings}
  />
);

export default function Outages() {
  const settings = useOutageSettings();
  const provider = getProviderForCity(settings.city);
  const queues = provider
    ? settings.queues.filter((queue) => provider.queues.includes(queue.id))
    : [];
  const isConfigured = Boolean(provider) && queues.length > 0;

  const subtitle = provider
    ? provider.name
    : settings.city
      ? `${settings.city} · графік погодинних відключень`
      : 'Графік погодинних відключень';

  if (settings.city && !provider) {
    return (
      <NavigationView
        title='Відсутність світла'
        subtitle={subtitle}
        barType='power'
        cornerRadius={28}
        contentInsets={{ horizontal: 20, bottom: 32 }}
        headerTrailing={settingsButton}
      >
        <OutageMessage
          icon='pin'
          tone='muted'
          title='Постачальник для вашого міста поки що не доданий'
          message='Графік зʼявиться тут автоматично, щойно ми підключимо обленерго вашого міста.'
          actionTitle='Змінити місто'
          actionType='secondary'
          onAction={openSettings}
        />
      </NavigationView>
    );
  }

  if (!provider || !isConfigured) {
    return (
      <NavigationView
        title='Відсутність світла'
        subtitle={subtitle}
        barType='power'
        cornerRadius={28}
        contentInsets={{ horizontal: 20, bottom: 32 }}
        headerTrailing={settingsButton}
      >
        <OutageMessage
          icon='bulb'
          badge='1.1'
          title='Оберіть свою чергу'
          message='Вкажіть місто й одну або кілька черг — і тут буде видно, коли світло є, а коли вимкнення.'
          actionTitle='Обрати чергу'
          onAction={openSettings}
          linkTitle='Як дізнатися свою чергу?'
          onLink={openSettings}
        />
      </NavigationView>
    );
  }

  return (
    <ScheduleScreen key={provider.id} provider={provider} queues={queues} />
  );
}

function ScheduleScreen({
  provider,
  queues,
}: {
  provider: OutageProvider;
  queues: QueueSettings[];
}) {
  const { schedule, isLoading, isRefreshing, error, refresh } =
    useOutageSchedule(provider);
  const now = useZonedNow(provider.timeZone);
  const firstQueue = queues[0]?.id ?? '';
  const [selectedQueue, setSelectedQueue] = useState(firstQueue);
  const [day, setDay] = useState<Day>('today');
  const tint = useThemeColor('powerOnInk');
  const queue = queues.some((item) => item.id === selectedQueue)
    ? selectedQueue
    : firstQueue;

  // POE пише «4 листопада 2026 19:35» — у навбарі досить часу
  const updatedTime = schedule?.updatedLabel?.match(/\d{1,2}:\d{2}$/)?.[0];
  const updated =
    isLoading || isRefreshing
      ? ' · оновлюємо…'
      : updatedTime
        ? ` · оновлено о ${updatedTime}`
        : '';

  return (
    <NavigationView
      title='Відсутність світла'
      subtitle={`${provider.name}${updated}`}
      barType='power'
      cornerRadius={28}
      contentInsets={{ horizontal: 20, bottom: 32 }}
      headerTrailing={settingsButton}
      headerContent={
        <QueueChips
          queues={queues}
          selected={queue}
          onSelect={setSelectedQueue}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={tint}
        />
      }
    >
      <VStack spacing={14}>
        <Segment<Day>
          testID='outages.day'
          items={[
            { value: 'today', label: `Сьогодні, ${formatShortDate(now.date)}` },
            {
              value: 'tomorrow',
              label: `Завтра, ${formatShortDate(addDays(now.date, 1))}`,
            },
          ]}
          value={day}
          onChange={setDay}
        />

        {isLoading ? (
          <OutageSkeleton providerName={provider.name} />
        ) : !schedule ? (
          <OutageMessage
            icon='clock'
            tone='muted'
            title='Не вдалося завантажити графік'
            message={`Перевірте інтернет і спробуйте ще раз. ${error?.message ?? ''}`.trim()}
            actionTitle='Спробувати ще раз'
            actionType='secondary'
            onAction={refresh}
          />
        ) : (
          <DayContent
            provider={provider}
            schedule={schedule}
            queue={queue}
            day={day}
            now={now}
            hasError={Boolean(error)}
          />
        )}
      </VStack>
    </NavigationView>
  );
}

function DayContent({
  provider,
  schedule,
  queue,
  day,
  now,
  hasError,
}: {
  provider: OutageProvider;
  schedule: OutageSchedule;
  queue: string;
  day: Day;
  now: ZonedNow;
  hasError: boolean;
}) {
  const isToday = day === 'today';
  const date = isToday ? now.date : addDays(now.date, 1);
  const slots = findDay(schedule.days, date)?.queues[queue];

  if (!slots) {
    return (
      <OutageMessage
        icon='clock'
        title={
          isToday
            ? 'Графік на сьогодні не опубліковано'
            : 'Графік на завтра ще не опубліковано'
        }
        message={`Щойно ${provider.name} його оприлюднить, він зʼявиться тут — для всіх ваших черг.`}
      />
    );
  }

  const status = isToday
    ? getPowerStatus(schedule.days, queue, now)
    : undefined;
  const intervals = getOutageIntervals(slots);
  const nowMinutes = isToday ? now.minutes : undefined;
  const offMinutes = getOffMinutes(slots);

  return (
    <VStack spacing={14}>
      {status && <PowerStatusCard status={status} now={now} />}
      <DayTimeline
        title={isToday ? 'Сьогодні' : 'Завтра'}
        trailing={
          offMinutes > 0
            ? `Без світла ${formatDuration(offMinutes)}`
            : 'Без вимкнень'
        }
        slots={slots}
        nowMinutes={nowMinutes}
      />
      {intervals.length > 0 && (
        <VStack spacing={8}>
          <SectionHeader title='Вимкнення' variant='overline' />
          <OutageList intervals={intervals} nowMinutes={nowMinutes} />
        </VStack>
      )}
      <ThemedText font='footnote' color='muted' style={styles.help}>
        {hasError
          ? 'Не вдалося оновити графік — показано збережений. Потягніть униз, щоб спробувати ще раз.'
          : `Графік ${provider.name} для черги ${queue}. Можливі аварійні вимкнення поза графіком.`}
      </ThemedText>
    </VStack>
  );
}

const styles = StyleSheet.create({
  help: {
    paddingHorizontal: 4,
  },
});
