import {
  getZonedNow,
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
import { AppState } from 'react-native';

const OutageContext = createContext<OutageSettingsRepository | null>(null);

type Props = PropsWithChildren<{ repository?: OutageSettingsRepository }>;

export function OutageProvider({
  repository = outageSettingsRepository,
  children,
}: Props) {
  const [loaded, setLoaded] = useState<OutageSettingsRepository | null>(null);

  useEffect(() => {
    repository.load().then(() => setLoaded(repository));
  }, [repository]);

  if (loaded !== repository) return null;

  return <OutageContext value={repository}>{children}</OutageContext>;
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

// Графік оновлюємо не частіше, ніж раз на цей час, і при поверненні в застосунок
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export type ScheduleState = {
  schedule?: OutageSchedule;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: Error;
  refresh: () => void;
};

// Графік постачальника: спершу збережений, потім свіжий з мережі.
// Стан не скидається при зміні постачальника — монтуйте з key={provider.id}
export function useOutageSchedule(
  provider: ScheduleProvider | undefined,
): ScheduleState {
  const repository = useOutageRepository();
  const [schedule, setSchedule] = useState<OutageSchedule>();
  const [isLoading, setLoading] = useState(Boolean(provider));
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error>();
  const lastFetch = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!provider) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const next = await provider.fetchSchedule(current.signal);
      if (current.signal.aborted) return;
      lastFetch.current = Date.now();
      setSchedule(next);
      setError(undefined);
      await repository.cacheSchedule(next);
    } catch (e) {
      if (current.signal.aborted) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!current.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [provider, repository]);

  useEffect(() => {
    if (!provider) return;
    let isActive = true;
    // Спершу показуємо збережений графік, потім ідемо в мережу
    void repository.loadCachedSchedule(provider.id).then((cached) => {
      if (!isActive) return;
      if (cached) setSchedule((fresh) => fresh ?? cached);
      return fetchSchedule();
    });

    const refreshIfStale = () => {
      if (Date.now() - lastFetch.current >= REFRESH_INTERVAL_MS) {
        void fetchSchedule();
      }
    };
    const timer = setInterval(refreshIfStale, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshIfStale();
    });
    return () => {
      isActive = false;
      clearInterval(timer);
      subscription.remove();
      controller.current?.abort();
    };
  }, [provider, repository, fetchSchedule]);

  return {
    schedule,
    isLoading: isLoading && !schedule,
    isRefreshing,
    error,
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
