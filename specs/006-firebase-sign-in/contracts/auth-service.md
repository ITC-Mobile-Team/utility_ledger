# Contract: `AuthService` і `useAuth()`

Внутрішній інтерфейс між екранами й сервісом входу. Екрани знають лише `useAuth()`; Firebase, Apple і Google — деталі реалізації сервісу.

## `AuthService` (`src/services/auth/types.ts`)

```ts
export type SignInMethod = 'apple' | 'google';

export type AuthErrorKind = 'cancelled' | 'failed';
export class AuthError extends Error {
  kind: AuthErrorKind;
}

export interface AuthService {
  // Перший виклик слухача — після відновлення сесії (null або користувач)
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  // Резолвиться користувачем; відхиляється лише AuthError
  signIn(method: SignInMethod): Promise<AuthUser>;
  // Завершує сесію Firebase і Google; не кидає через провайдера (помилку Google ігнорує)
  signOut(): Promise<void>;
  // Повторне підтвердження за потреби, відкликання Apple (iOS), видалення акаунта, вихід.
  // Відхиляється лише AuthError; при відхиленні акаунт і сесія без змін
  deleteAccount(): Promise<void>;
}
```

### `signIn(method)`

| Платформа | `apple` | `google` |
|---|---|---|
| iOS | системне вікно Apple (nonce) → credential → Firebase | вибір акаунта Google → `idToken` → Firebase |
| Android | сторінка Apple у Custom Tab (Firebase) | вибір акаунта Google → `idToken` → Firebase |

Скасування користувачем → `AuthError('cancelled')`; інше → `AuthError('failed')`.

### `deleteAccount()`

| Спосіб входу | Послідовність |
|---|---|
| Apple, iOS | вікно Apple → `reauthenticateWithCredential` → `revokeToken(authorizationCode)` → `deleteUser` |
| Apple, Android | Custom Tab Apple → `reauthenticateWithPopup` → `deleteUser` (відкликання недоступне, див. research R5) |
| Google | `deleteUser`; на `auth/requires-recent-login` → вибір акаунта Google → `reauthenticateWithCredential` → `deleteUser`; далі `GoogleSignin.revokeAccess()` |

Після успіху слухачі отримують `null`. Дані на пристрої не чіпаються.

## `useAuth()` (`src/providers/auth-provider.tsx`)

```ts
type AuthContextValue = {
  user: AuthUser | null;
  isSignedIn: boolean;
  signIn: (method: SignInMethod) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};
```

## Використання на екранах

| Екран | Виклик | `cancelled` | `failed` |
|---|---|---|---|
| `(auth)/sign-in.tsx` | `signIn(method)` | лишитися, кнопки доступні | `router.push('/auth-error', { method })` |
| `(auth)/auth-error.tsx` | `signIn(method)` | лишитися | лишитися (як зараз) |
| `(tabs)/profile/index.tsx` «Вийти» | `signOut()` після `confirmDestructive` | — | — |
| `(tabs)/profile/index.tsx` «Видалити акаунт» | `deleteAccount()` після `confirmDestructive` з текстом FR-017 | лишитися в профілі | `Alert`: «Не вдалося видалити акаунт», «Перевірте інтернет і спробуйте ще раз.», кнопки «Скасувати» / «Спробувати ще» |

Повторний запуск виходу чи видалення блокує прапорець на екрані (як `isSigningOut` зараз), FR-023.
