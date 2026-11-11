import type { KeyValueStorage } from '@/storage';
import { AuthError, type AuthService } from './types';

// Вебверсія поза обсягом: входу немає, нативні модулі Firebase не тягнемо
export function createFirebaseAuthService(
  _storage: KeyValueStorage,
): AuthService {
  return {
    onAuthStateChanged(listener) {
      listener(null);
      return () => {};
    },
    async signIn() {
      throw new AuthError('failed', 'Вхід недоступний у вебверсії');
    },
    async signOut() {},
    async deleteAccount() {
      throw new AuthError('failed', 'Вхід недоступний у вебверсії');
    },
  };
}
