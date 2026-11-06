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
  useState,
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
  const [loaded, setLoaded] = useState<ProfileRepository | null>(null);

  useEffect(() => {
    repository.load().then(() => setLoaded(repository));
  }, [repository]);

  // Після входу профіль заповнюється з даних провайдера; змінене
  // користувачем імʼя лишається
  useEffect(() => {
    if (loaded !== repository || !user) return;
    repository.syncFromAuth(user).catch(() => {});
  }, [loaded, repository, user]);

  if (loaded !== repository) return null;

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
