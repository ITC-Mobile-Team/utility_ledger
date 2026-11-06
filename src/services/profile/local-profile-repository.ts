import type { KeyValueStorage } from '@/storage';
import {
  NAME_MAX_LENGTH,
  type ProfileRepository,
  type UserProfile,
} from './types';

export const PROFILE_KEY = 'userProfile';

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
    async load() {
      try {
        const raw = await storage.getItem(PROFILE_KEY);
        profile = raw ? (JSON.parse(raw) as UserProfile) : null;
      } catch {
        profile = null;
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
        await write({
          userId: user.id,
          name: user.name,
          nameSource: 'provider',
          email: user.email,
          method,
        });
        return;
      }
      const name = profile.nameSource === 'provider' ? user.name : profile.name;
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
      const name = value.trim();
      if (!profile) throw new Error('Профіль ще не створено');
      if (!name || Array.from(name).length > NAME_MAX_LENGTH) {
        throw new Error('Некоректне імʼя');
      }
      await write({ ...profile, name, nameSource: 'user' });
    },
    async clear() {
      profile = null;
      emit();
      await storage.removeItem(PROFILE_KEY);
    },
  };
}
