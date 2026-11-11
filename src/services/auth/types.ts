export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  // Спосіб входу; невідомий провайдер дає undefined
  method?: SignInMethod;
};

export type SignInMethod = 'apple' | 'google';

// cancelled — користувач закрив вікно провайдера, показувати нічого не треба;
// failed — будь-яка інша невдача
export type AuthErrorKind = 'cancelled' | 'failed';

export class AuthError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'AuthError';
    this.kind = kind;
  }
}

export interface AuthService {
  // Перший виклик слухача — після відновлення сесії (null або користувач)
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  // Відхиляється лише AuthError
  signIn(method: SignInMethod): Promise<AuthUser>;
  // Завершує сесію Firebase і Google; помилку Google не прокидає
  signOut(): Promise<void>;
  // Повторне підтвердження за потреби, відкликання Apple (iOS), видалення
  // акаунта. Відхиляється лише AuthError; тоді акаунт і сесія без змін
  deleteAccount(): Promise<void>;
}
