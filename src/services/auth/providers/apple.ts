import type { User } from '@react-native-firebase/auth';
import { AuthError } from '../types';

export type AppleSignInResult = {
  user: User;
  // Код для відкликання токена Apple; є лише на iOS
  authorizationCode: string | null;
};

// Платформи без входу Apple; на iOS і Android працюють .ios.ts і .android.ts
export async function signInWithApple(): Promise<AppleSignInResult> {
  throw new AuthError('failed', 'Вхід через Apple недоступний');
}

export async function reauthenticateApple(_user: User): Promise<string | null> {
  throw new AuthError('failed', 'Вхід через Apple недоступний');
}
