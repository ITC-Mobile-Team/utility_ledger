import {
  type AuthUser,
  type SignInMethod,
  type AuthService,
  authService,
} from '@/services/auth';
import {
  createContext,
  use,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

type AuthContextValue = {
  user: AuthUser | null;
  isSignedIn: boolean;
  signIn: (method: SignInMethod) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = PropsWithChildren<{ service?: AuthService }>;

export function AuthProvider({ service = authService, children }: Props) {
  // undefined означає, що сервіс ще не повідомив стан (Firebase відновлює сесію асинхронно)
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    return service.onAuthStateChanged(setUser);
  }, [service]);

  if (user === undefined) return null;

  return (
    <AuthContext
      value={{
        user,
        isSignedIn: user !== null,
        signIn: (method) => service.signIn(method),
        signOut: () => service.signOut(),
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
