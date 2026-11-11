import type { KeyValueStorage } from '@/storage';
import {
  type ProfileRepository,
  type UserProfile,
  validateName,
} from './types';

export const PROFILE_KEY = 'userProfile';

// Ідентифікатори користувачів імітованого входу до Firebase
export const MOCK_USER_PREFIX = 'preview-id-';

export function createLocalProfileRepository(
  storage: KeyValueStorage,
): ProfileRepository {
  // Знімок незмінний: кожна зміна створює новий обʼєкт для useSyncExternalStore
  let profile: UserProfile | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const write = async (next: UserProfile) => {
    const previous = profile;
    profile = next;
    emit();
    try {
      await storage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch (error) {
      profile = previous;
      emit();
      throw error;
    }
  };

  return {
    async setUser(uid) {
      profile = null;
      if (uid) {
        try {
          const raw = await storage.getItem(PROFILE_KEY);
          profile = raw ? (JSON.parse(raw) as UserProfile) : null;
        } catch {
          profile = null;
        }
      }
      emit();
    },
    getSnapshot: () => profile,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async syncFromAuth(user) {
      const method = user.method ?? null;
      if (!profile || profile.userId !== user.id) {
        // Імʼя, змінене за часів імітації входу, переходить у справжній акаунт
        const keepsMockName =
          profile?.userId.startsWith(MOCK_USER_PREFIX) &&
          profile.nameSource === 'user';
        await write({
          userId: user.id,
          name: keepsMockName ? profile!.name : user.name,
          nameSource: keepsMockName ? 'user' : 'provider',
          email: user.email,
          method,
        });
        return;
      }
      // Провайдер може не повернути імʼя (повторний вхід Apple): лишаємо наявне
      const name =
        profile.nameSource === 'provider'
          ? (user.name ?? profile.name)
          : profile.name;
      if (
        profile.email === user.email &&
        profile.method === method &&
        profile.name === name
      ) {
        return;
      }
      await write({ ...profile, email: user.email, method, name });
    },
    async setName(value) {
      if (!profile) throw new Error('Профіль ще не створено');
      const name = validateName(value);
      await write({ ...profile, name, nameSource: 'user' });
    },
  };
}
