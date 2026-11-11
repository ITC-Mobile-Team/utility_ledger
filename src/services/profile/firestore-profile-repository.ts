import { onSnapshot } from '@react-native-firebase/firestore';
import { userDoc } from '@/services/firestore';
import {
  applyWrites,
  logWriteError,
  withoutUndefined,
} from '@/services/firestore/batch';
import type { KeyValueStorage } from '@/storage';
import { PROFILE_KEY } from './local-profile-repository';
import {
  type ProfileRepository,
  type UserProfile,
  validateName,
} from './types';

type StoredProfile = Omit<UserProfile, 'userId'>;

// Профіль попередньої версії (або часів імітації входу) на пристрої
async function readLegacyProfile(
  storage: KeyValueStorage,
): Promise<UserProfile | null> {
  try {
    const raw = await storage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function createFirestoreProfileRepository(
  storage: KeyValueStorage,
): ProfileRepository {
  let uid: string | null = null;
  // Знімок незмінний: кожна зміна створює новий обʼєкт для useSyncExternalStore
  let profile: UserProfile | null = null;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  // Одразу в знімок, у хмару — без очікування сервера
  const write = (next: UserProfile) => {
    profile = next;
    emit();
    const { userId, ...data } = next;
    applyWrites([
      {
        kind: 'set',
        ref: userDoc(userId),
        data: withoutUndefined<StoredProfile>(data),
      },
    ]);
  };

  return {
    setUser(next) {
      unsubscribe?.();
      unsubscribe = null;
      uid = next;
      profile = null;
      emit();
      if (!next) return Promise.resolve();

      return new Promise<void>((resolve) => {
        unsubscribe = onSnapshot(
          userDoc(next),
          (snapshot) => {
            if (uid !== next) return;
            profile = snapshot.exists()
              ? { userId: next, ...(snapshot.data() as StoredProfile) }
              : null;
            emit();
            resolve();
          },
          (error) => {
            logWriteError(error);
            resolve();
          },
        );
      });
    },
    getSnapshot: () => profile,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Викликається, коли дані акаунта вже отримані з сервера, тож «профілю
    // немає» означає новий акаунт, а не порожню локальну копію
    async syncFromAuth(user) {
      if (uid !== user.id) return;
      const method = user.method ?? null;
      if (!profile) {
        // Імʼя, змінене в застосунку до хмари (у т.ч. за часів імітації
        // входу), переходить у профіль акаунта
        const legacy = await readLegacyProfile(storage);
        const keepsName = legacy?.nameSource === 'user';
        if (uid !== user.id) return;
        write({
          userId: user.id,
          name: keepsName ? legacy.name : user.name,
          nameSource: keepsName ? 'user' : 'provider',
          email: user.email,
          method,
        });
        await storage.removeItem(PROFILE_KEY).catch(() => {});
        return;
      }
      await storage.removeItem(PROFILE_KEY).catch(() => {});
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
      write({ ...profile, email: user.email, method, name });
    },
    async setName(value) {
      if (!profile) throw new Error('Профіль ще не створено');
      const name = validateName(value);
      write({ ...profile, name, nameSource: 'user' });
    },
  };
}
