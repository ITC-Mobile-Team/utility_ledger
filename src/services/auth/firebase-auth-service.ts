import {
  deleteUser,
  getAuth,
  onAuthStateChanged,
  revokeToken,
  signOut,
  type User,
} from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import type { KeyValueStorage } from '@/storage';
import { errorCode, toAuthError } from './errors';
import { reauthenticateApple, signInWithApple } from './providers/apple';
import {
  reauthenticateGoogle,
  revokeGoogle,
  signInWithGoogle,
  signOutGoogle,
} from './providers/google';
import {
  AuthError,
  type AuthService,
  type AuthUser,
  type SignInMethod,
} from './types';

// Ключ сесії з часів імітації входу; така сесія більше не дійсна
const LEGACY_SESSION_KEY = 'authUser';

const methodByProvider: Record<string, SignInMethod> = {
  'apple.com': 'apple',
  'google.com': 'google',
};

function methodOf(user: User): SignInMethod | undefined {
  for (const { providerId } of user.providerData) {
    const method = methodByProvider[providerId];
    if (method) return method;
  }
  return undefined;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    name: user.displayName || null,
    email: user.email || null,
    method: methodOf(user),
  };
}

export function createFirebaseAuthService(
  storage: KeyValueStorage,
): AuthService {
  const auth = getAuth();
  storage.removeItem(LEGACY_SESSION_KEY).catch(() => {});

  let user: AuthUser | null = null;
  let isLoaded = false;
  const listeners = new Set<(user: AuthUser | null) => void>();

  const emit = (next: User | null) => {
    user = next ? toAuthUser(next) : null;
    isLoaded = true;
    listeners.forEach((listener) => listener(user));
  };

  // Firebase сам відновлює сесію з нативного сховища (і без інтернету) і
  // повідомляє null, якщо акаунт видалено чи вимкнено деінде
  onAuthStateChanged(auth, emit);

  const currentUser = () => {
    const current = auth.currentUser;
    if (!current) throw new AuthError('failed', 'Користувач не ввійшов');
    return current;
  };

  return {
    onAuthStateChanged(listener) {
      listeners.add(listener);
      if (isLoaded) listener(user);
      return () => listeners.delete(listener);
    },

    async signIn(method) {
      try {
        const signedIn =
          method === 'apple'
            ? (await signInWithApple()).user
            : await signInWithGoogle();
        // Імʼя Apple зберігається вже після входу: повідомляємо слухачам
        // актуальний стан ще раз
        const latest = auth.currentUser ?? signedIn;
        emit(latest);
        return toAuthUser(latest);
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async signOut() {
      await signOutGoogle();
      await signOut(auth);
    },

    async deleteAccount(deleteData) {
      try {
        const current = currentUser();
        const method = methodOf(current);
        if (method === 'apple') {
          // Apple завжди просить свіже підтвердження; дані видаляються до
          // відкликання доступу, щоб невдача не лишала акаунт з відкликаним
          // Apple ID. На iOS відкликаємо доступ застосунку до Apple ID (на
          // Android RNFirebase не вміє)
          const authorizationCode = await reauthenticateApple(current);
          await deleteData();
          if (Platform.OS === 'ios' && authorizationCode) {
            await revokeToken(auth, authorizationCode);
          }
          await deleteUser(current);
          return;
        }
        // Правила Firestore пускають лише власника, тож дані — до акаунта
        await deleteData();
        try {
          await deleteUser(current);
        } catch (error) {
          if (errorCode(error) !== 'auth/requires-recent-login') throw error;
          await reauthenticateGoogle(current);
          await deleteUser(current);
        }
        if (method === 'google') await revokeGoogle();
      } catch (error) {
        throw toAuthError(error);
      }
    },
  };
}
