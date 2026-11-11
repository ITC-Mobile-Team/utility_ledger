import { useAuth } from '@/providers/auth-provider';
import {
  type AccountDataStatus,
  fetchFromServer,
  isSynced,
  isUnavailable,
  markSynced,
  migrateLegacyData,
} from '@/services/account-data';
import { ledgerRepository } from '@/services/ledger';
import { outageSettingsRepository } from '@/services/outages';
import { profileRepository } from '@/services/profile';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

type AccountDataContextValue = {
  status: AccountDataStatus;
  retry: () => void;
};

const AccountDataContext = createContext<AccountDataContextValue | null>(null);

const repositories = [
  ledgerRepository,
  outageSettingsRepository,
  profileRepository,
];

// Привʼязує репозиторії даних до акаунта, що увійшов, і веде перше
// завантаження: на пристрої, що ще не отримував дані акаунта, — серверне
// читання (скелетони, без звʼязку — «Немає інтернету»), перенесення даних
// попередньої версії; далі дані беруться з локальної копії одразу
export function AccountDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  // undefined — репозиторії ще не привʼязані до поточного акаунта
  const [boundUid, setBoundUid] = useState<string | null | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<AccountDataStatus>('loading');
  const currentUid = useRef(uid);

  const loadFromServer = useCallback(async (target: string) => {
    setStatus('loading');
    try {
      const result = await fetchFromServer(target);
      if (currentUid.current !== target) return;
      await migrateLegacyData(target, result);
      await markSynced(target);
      if (currentUid.current === target) setStatus('ready');
    } catch (error) {
      if (currentUid.current !== target) return;
      if (__DEV__ && !isUnavailable(error)) {
        // Напр. permission-denied, коли правила не опубліковані
        console.warn('[firestore]', error);
      }
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    currentUid.current = uid;
    let isActive = true;
    void (async () => {
      await Promise.all(
        repositories.map((repository) =>
          repository.setUser(uid).catch(() => {}),
        ),
      );
      const synced = uid ? await isSynced(uid) : true;
      if (!isActive) return;
      setStatus(synced ? 'ready' : 'loading');
      setBoundUid(uid);
      if (uid && !synced) void loadFromServer(uid);
    })();
    return () => {
      isActive = false;
    };
  }, [uid, loadFromServer]);

  const retry = useCallback(() => {
    if (currentUid.current) void loadFromServer(currentUid.current);
  }, [loadFromServer]);

  // Поки репозиторії не дали перший знімок для цього акаунта, нічого не
  // показуємо (мілісекунди: знімок з локальної копії)
  if (boundUid !== uid) return null;

  return (
    <AccountDataContext value={{ status, retry }}>
      {children}
    </AccountDataContext>
  );
}

export function useAccountDataStatus() {
  const ctx = use(AccountDataContext);
  if (!ctx)
    throw new Error(
      'useAccountDataStatus must be used inside AccountDataProvider',
    );
  return ctx;
}
