export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  // Спосіб входу; у сесіях, збережених до появи поля, відсутній
  method?: SignInMethod;
};

export type SignInMethod = 'apple' | 'google';

export interface AuthService {
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  signIn(method: SignInMethod): Promise<AuthUser>;
  signOut(): Promise<void>;
}
