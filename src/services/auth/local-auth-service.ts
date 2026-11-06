import type { KeyValueStorage } from '@/storage';
import type { AuthService, AuthUser } from './types';

const KEY = 'authUser';

export function createLocalAuthService(storage: KeyValueStorage): AuthService {
  let user: AuthUser | null = null;
  let isLoaded = false;
  const listeners = new Set<(user: AuthUser | null) => void>();

  const emit = () => listeners.forEach((listener) => listener(user));

  // Відновлюємо сесію зі сховища; слухачі отримають стан лише після читання
  storage
    .getItem(KEY)
    .then((value) => {
      user = value ? (JSON.parse(value) as AuthUser) : null;
    })
    .catch(() => {
      user = null;
    })
    .finally(() => {
      isLoaded = true;
      emit();
    });

  return {
    onAuthStateChanged(listener) {
      listeners.add(listener);
      if (isLoaded) listener(user);
      return () => listeners.delete(listener);
    },
    async signIn(method) {
      const next: AuthUser = {
        id: `preview-id-${method}`,
        name: 'Preview user',
        email: 'preview@example.com',
        method,
      };
      await storage.setItem(KEY, JSON.stringify(next));
      user = next;
      emit();
      return next;
    },
    async signOut() {
      await storage.removeItem(KEY);
      user = null;
      emit();
    },
  };
}
