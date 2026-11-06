import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { getProviderForCity } from './registry';
import { formatDuration, formatTime, getOutageIntervals } from './schedule';
import {
  type DateKey,
  normalizeNotificationSettings,
  type OutageSchedule,
  type OutageSettings,
} from './types';

const ID_PREFIX = 'outage:';
const CHANNEL_ID = 'outages';
// iOS тримає не більше 64 запланованих сповіщень на застосунок
const MAX_SCHEDULED = 60;

// Показувати сповіщення й тоді, коли застосунок відкритий
export function configureOutageNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Дозвіл на сповіщення; просить його, якщо ще не питали
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Відключення світла',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Момент часу для «дата + хвилини доби» в поясі постачальника
function zonedToDate(date: DateKey, minutes: number, timeZone: string) {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, 0, minutes);
  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(new Date(instant));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const wall = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
    );
    return wall - instant;
  };
  // Друга ітерація виправляє дні переходу на літній/зимовий час
  const first = asUtc - offsetAt(asUtc);
  return new Date(asUtc - offsetAt(first));
}

const leadLabel = (minutes: number) => formatDuration(minutes);

// Дозвіл відхилено в системі — пояснюємо, де його дати
export function showNotificationPermissionAlert() {
  Alert.alert(
    'Сповіщення вимкнені',
    'Дозвольте сповіщення для застосунку в Параметрах, щоб отримувати попередження про вимкнення.',
    [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Параметри', onPress: () => Linking.openSettings() },
    ],
  );
}

// Зняти всі заплановані попередження «Світла»
export async function cancelOutageNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(ID_PREFIX))
      .map((request) =>
        Notifications.cancelScheduledNotificationAsync(request.identifier),
      ),
  );
}

// Перепланувати попередження за останнім графіком. Старі сповіщення
// «Світла» знімаються завжди; нові ставляться, лише якщо попередження
// увімкнені, місто має постачальника і графік від нього
export async function syncOutageNotifications(
  settings: OutageSettings,
  schedule: OutageSchedule | undefined,
) {
  await cancelOutageNotifications();

  const {
    enabled,
    leadMinutes,
    queues: notifyQueues,
  } = normalizeNotificationSettings(settings.notifications);
  const provider = getProviderForCity(settings.city);
  if (!enabled || !provider || schedule?.providerId !== provider.id) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const now = Date.now();
  const requests = settings.queues
    .filter((queue) => provider.queues.includes(queue.id))
    .filter((queue) => !notifyQueues || notifyQueues.includes(queue.id))
    .flatMap((queue) =>
      schedule.days.flatMap((day) => {
        const slots = day.queues[queue.id];
        if (!slots) return [];
        return getOutageIntervals(slots).map((interval) => {
          const start = zonedToDate(
            day.date,
            interval.start,
            provider.timeZone,
          );
          const label = queue.name
            ? `${queue.name} · черга ${queue.id}`
            : `Черга ${queue.id}`;
          return {
            identifier: `${ID_PREFIX}${queue.id}:${day.date}:${interval.start}`,
            fireAt: start.getTime() - leadMinutes * 60_000,
            content: {
              title: `Через ${leadLabel(leadMinutes)} вимкнення світла`,
              body: `${label}: ${formatTime(interval.start)} – ${formatTime(interval.end)}`,
              data: { queue: queue.id },
            },
          };
        });
      }),
    )
    // Мінімальний запас: перепланування за кілька секунд до спрацювання
    // не повинно губити сповіщення (тригер у минулому iOS не прийме)
    .filter((request) => request.fireAt > now + 1_000)
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_SCHEDULED);

  await Promise.all(
    requests.map(({ identifier, fireAt, content }) =>
      Notifications.scheduleNotificationAsync({
        identifier,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
}
