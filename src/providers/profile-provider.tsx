import { useAccountDataStatus } from '@/providers/account-data-provider';
import { useAuth } from '@/providers/auth-provider';
import {
  type ProfileRepository,
  profileRepository,
  type UserProfile,
} from '@/services/profile';
import {
  createContext,
  use,
  useEffect,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

const ProfileContext = createContext<ProfileRepository | null>(null);

type Props = PropsWithChildren<{ repository?: ProfileRepository }>;

export function ProfileProvider({
  repository = profileRepository,
  children,
}: Props) {
  const { user } = useAuth();
  const { status } = useAccountDataStatus();

  // Після входу профіль заповнюється з даних провайдера; змінене
  // користувачем імʼя лишається. Лише коли дані акаунта отримані: до
  // серверного читання порожня локальна копія нового пристрою виглядає як
  // «профілю немає», і новий профіль затер би хмарний
  useEffect(() => {
    if (status !== 'ready' || !user) return;
    repository.syncFromAuth(user).catch(() => {});
  }, [status, repository, user]);

  return <ProfileContext value={repository}>{children}</ProfileContext>;
}

export function useProfileRepository() {
  const repository = use(ProfileContext);
  if (!repository)
    throw new Error('useProfileRepository must be used inside ProfileProvider');
  return repository;
}

export function useProfile(): UserProfile | null {
  const repository = useProfileRepository();
  return useSyncExternalStore(repository.subscribe, repository.getSnapshot);
}
