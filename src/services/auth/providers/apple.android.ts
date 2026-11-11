import {
  getAuth,
  OAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  type AuthProvider,
  type User,
} from '@react-native-firebase/auth';
import type { AppleSignInResult } from './apple';

// На Android нативного входу Apple немає: Firebase відкриває сторінку Apple у
// Custom Tab і сам повертає користувача в застосунок
function appleProvider(): AuthProvider {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  // У типах RNFirebase 27 `providerId` в OAuthProvider приватний, хоча
  // signInWithPopup приймає саме його
  return provider as unknown as AuthProvider;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  const { user } = await signInWithPopup(getAuth(), appleProvider());
  return { user, authorizationCode: null };
}

// Відкликати токен Apple на Android React Native Firebase не вміє, тож код
// не потрібен (FR-018: відкликання лише на iOS)
export async function reauthenticateApple(user: User): Promise<string | null> {
  await reauthenticateWithPopup(user, appleProvider());
  return null;
}
