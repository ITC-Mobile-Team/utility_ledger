import type { AuthService, AuthUser } from './types';

export function createInMemoryAuthService(): AuthService {
  let user: AuthUser | null = null;
  const listeners = new Set<(user: AuthUser | null) => void>();

  const emit = () => listeners.forEach((listener) => listener(user));

  return {
    onAuthStateChanged(listener) {
      listeners.add(listener);
      listener(user);
      return () => listeners.delete(listener);
    },
    async signIn(method) {
      user = {
        id: `preview-id-${method}`,
        name: 'Preview user',
        email: 'preview@example.com',
      };
      emit();
      return user;
    },
    async signOut() {
      user = null;
      emit();
    },
  };
}
