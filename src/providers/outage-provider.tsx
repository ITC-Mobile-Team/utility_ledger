import {
  ensureNotificationPermission,
  getProviderForCity,
  getZonedNow,
  normalizeNotificationSettings,
  showNotificationPermissionAlert,
  syncOutageNotifications,
  type OutageProvider as ScheduleProvider,
  type OutageSchedule,
  type OutageSettingsRepository,
  outageSettingsRepository,
  type ZonedNow,
} from '@/services/outages';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { useAccountDataStatus } from '@/providers/account-data-provider';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';

const OutageContext = createContext<OutageSettingsRepository | null>(null);

type Props = PropsWithChildren<{ repository?: OutageSettingsRepository }>;

export function OutageProvider({
  repository = outageSettingsRepository,
  children,
}: Props) {
  // Привʼязку до акаунта й готовність знімка забезпечує AccountDataProvider
  useAccountNotificationSync(repository);
  return <OutageContext value={repository}>{children}</OutageContext>;
}

// Попередження плануються на пристрої, а місто й черги належать акаунту: коли
// вони змінюються не кнопкою на цьому екрані (вхід іншим акаунтом, вихід,
// зміна з іншого пристрою), попередження переплановуються за кешованим
// графіком; черги з фільтра сповіщень, яких немає в акаунті, відкидаються
function useAccountNotificationSync(repository: OutageSettingsRepository) {
  const { status } = useAccountDataStatus();
  const settings = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
  );
  const lastKey = useRef<string | null>(null);
  const key = `${settings.city ?? ''}|${settings.queues
    .map((queue) => queue.id)
    .join(',')}`;

  useEffect(() => {
    // Під час першого завантаження знімок порожній — не чіпаємо
    if (status !== 'ready') return;
    const previous = lastKey.current;
    lastKey.current = key;
    if (previous === null || previous === key) return;
    const current = repository.getSnapshot();
    const ids = new Set(current.queues.map((queue) => queue.id));
    const notifications = current.notifications && {
      ...current.notifications,
      queues: current.notifications.queues?.filter((id) => ids.has(id)),
    };
    const next = { ...current, notifications };
    const provider = getProviderForCity(next.city);
    void (async () => {
      const cached = provider
        ? await repository.loadCachedSchedule(provider.id)
        : undefined;
      await syncOutageNotifications(next, cached);
    })().catch(() => {});
  }, [status, key, repository]);
}

export function useOutageRepository() {
  const repository = use(OutageContext);
  if (!repository)
    throw new Error('useOutageRepository must be used inside OutageProvider');
  return repository;
}

export function useOutageSettings() {
  const repository = useOutageRepository();
  return useSyncExternalStore(repository.subscribe, repository.getSnapshot);
}

// Скільки графік з кешу вважається свіжим. Схема: запит → кеш → протягом TTL
// показуємо кеш без запитів. Повторне відкриття екрана або повернення в
// застосунок після TTL, як і pull-to-refresh, запускають ланцюг знову
export const SCHEDULE_TTL_MS = 2 * 60 * 1000;

const isFresh = (schedule: OutageSchedule | undefined) =>
  Boolean(schedule) &&
  Date.now() - Date.parse(schedule?.fetchedAt ?? '') < SCHEDULE_TTL_MS;

export type ScheduleState = {
  schedule?: OutageSchedule;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: Error;
  refresh: () => void;
};

// Графік постачальника з кешем на SCHEDULE_TTL_MS (вік рахується від
// fetchedAt, тож переживає й перезапуск застосунку).
// Стан не скидається при зміні постачальника — монтуйте з key={provider.id}
export function useOutageSchedule(
  provider: ScheduleProvider | undefined,
): ScheduleState {
  const repository = useOutageRepository();
  const [schedule, setSchedule] = useState<OutageSchedule>();
  const [isLoading, setLoading] = useState(Boolean(provider));
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error>();
  // Останній графік (з кешу чи мережі) для перевірки TTL поза рендером
  const latest = useRef<OutageSchedule | undefined>(undefined);
  // Кеш уже прочитано зі сховища: до цього TTL перевіряти нема з чим
  const isCacheRead = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!provider) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const next = await provider.fetchSchedule(current.signal);
      if (current.signal.aborted) return;
      latest.current = next;
      setSchedule(next);
      setError(undefined);
      await repository.cacheSchedule(next);
      // Попередження ставляться за найсвіжішим графіком
      void syncOutageNotifications(repository.getSnapshot(), next).catch(
        () => {},
      );
    } catch (e) {
      if (current.signal.aborted) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (controller.current === current) controller.current = null;
      if (!current.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [provider, repository]);

  // Запит лише коли кеш застарів і запит ще не йде
  const refreshIfStale = useCallback(() => {
    if (!isCacheRead.current || controller.current) return;
    if (!isFresh(latest.current)) void fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (!provider) return;
    let isActive = true;
    void repository.loadCachedSchedule(provider.id).then((cached) => {
      if (!isActive) return;
      isCacheRead.current = true;
      if (cached && !latest.current) {
        latest.current = cached;
        setSchedule(cached);
        setLoading(false);
      }
      refreshIfStale();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfStale();
    });
    return () => {
      isActive = false;
      subscription.remove();
      controller.current?.abort();
      controller.current = null;
    };
  }, [provider, repository, refreshIfStale]);

  // Повернення на екран (з іншої вкладки чи вкладеного екрана)
  useFocusEffect(refreshIfStale);

  return {
    schedule,
    isLoading: isLoading && !schedule,
    isRefreshing,
    error,
    // pull-to-refresh іде в мережу незалежно від TTL
    refresh: () => {
      setRefreshing(true);
      void fetchSchedule();
    },
  };
}

// Поточний час у поясі постачальника; оновлюється двічі на хвилину
export function useZonedNow(timeZone: string): ZonedNow {
  const [now, setNow] = useState(() => getZonedNow(timeZone));
  useEffect(() => {
    const timer = setInterval(() => setNow(getZonedNow(timeZone)), 30_000);
    return () => clearInterval(timer);
  }, [timeZone]);
  return now;
}

// Перемикач попереджень про вимкнення поза екраном налаштувань (профіль).
// Працює з тими самими налаштуваннями, що й «Світло» → налаштування
export function useOutageNotificationToggle() {
  const repository = useOutageRepository();
  const settings = useOutageSettings();
  const notifications = normalizeNotificationSettings(settings.notifications);

  const setEnabled = async (enabled: boolean) => {
    if (enabled && !(await ensureNotificationPermission())) {
      showNotificationPermissionAlert();
      return;
    }
    const current = repository.getSnapshot();
    const next = {
      ...current,
      notifications: {
        ...normalizeNotificationSettings(current.notifications),
        enabled,
      },
    };
    await repository.save(next);
    const provider = getProviderForCity(next.city);
    const cached = provider
      ? await repository.loadCachedSchedule(provider.id)
      : undefined;
    await syncOutageNotifications(next, cached).catch(() => {});
  };

  return { enabled: notifications.enabled, setEnabled };
}
