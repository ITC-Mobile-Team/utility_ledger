export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type SignInMethod = 'apple' | 'google';

export interface AuthService {
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  signIn(method: SignInMethod): Promise<AuthUser>;
  signOut(): Promise<void>;
}
