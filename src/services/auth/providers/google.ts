import {
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  type User,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { AuthError } from '../types';

// Вебклієнт (тип 3) з google-services.json: Google видає idToken саме для
// нього, а Firebase перевіряє токен за цим клієнтом
const WEB_CLIENT_ID =
  '776268107209-1h1v9f12hj34j4ha1p4v6crsvvsva1ne.apps.googleusercontent.com';

let isConfigured = false;

function configure() {
  if (isConfigured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  isConfigured = true;
}

// Вибір акаунта Google → облікові дані Firebase
async function pickGoogleCredential() {
  configure();
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) throw new AuthError('cancelled');
    const { idToken } = response.data;
    if (!idToken) throw new AuthError('failed', 'Google не повернув idToken');
    return GoogleAuthProvider.credential(idToken);
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === statusCodes.SIGN_IN_CANCELLED
    ) {
      throw new AuthError('cancelled');
    }
    throw error;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await pickGoogleCredential();
  const result = await signInWithCredential(getAuth(), credential);
  return result.user;
}

// Свіжий вхід перед видаленням; інший акаунт дає auth/user-mismatch
export async function reauthenticateGoogle(user: User): Promise<void> {
  const credential = await pickGoogleCredential();
  await reauthenticateWithCredential(user, credential);
}

// Наступний вхід знову покаже вибір акаунта
export async function signOutGoogle(): Promise<void> {
  configure();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Сесія Google могла й не існувати (вхід через Apple)
  }
}

// Після видалення акаунта застосунок більше не має доступу до акаунта Google
export async function revokeGoogle(): Promise<void> {
  configure();
  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // Доступ уже відкликано або сесії Google немає
  }
}
