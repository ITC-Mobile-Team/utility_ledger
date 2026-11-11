import {
  getAuth,
  OAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  updateProfile,
  type User,
} from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { AuthError } from '../types';
import type { AppleSignInResult } from './apple';

// Системне вікно Apple з nonce: Apple отримує SHA-256, Firebase — сирий
// nonce і сам порівнює
async function requestAppleCredential() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  const apple = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!apple.identityToken) {
    throw new AuthError('failed', 'Apple не повернув identityToken');
  }
  const fullName = apple.fullName ?? undefined;
  const credential = new OAuthProvider('apple.com').credential({
    idToken: apple.identityToken,
    rawNonce,
    fullName,
  });
  return {
    credential,
    authorizationCode: apple.authorizationCode,
    displayName: formatName(fullName),
  };
}

function formatName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | undefined,
): string | null {
  const name = [fullName?.givenName, fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || null;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  const { credential, authorizationCode, displayName } =
    await requestAppleCredential();
  const { user } = await signInWithCredential(getAuth(), credential);
  // Імʼя Apple дає лише при першому вході: зберігаємо його в акаунті, щоб
  // наступні входи його не втрачали
  if (displayName && !user.displayName) {
    await updateProfile(user, { displayName }).catch(() => {});
  }
  return { user, authorizationCode };
}

// Свіжий вхід Apple перед видаленням; код потрібен для відкликання токена
export async function reauthenticateApple(user: User): Promise<string | null> {
  const { credential, authorizationCode } = await requestAppleCredential();
  await reauthenticateWithCredential(user, credential);
  return authorizationCode;
}
