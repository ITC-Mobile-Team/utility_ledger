import type { AuthUser, SignInMethod } from '@/services/auth';

export const NAME_MAX_LENGTH = 40;

export type UserProfile = {
  userId: string;
  name: string | null;
  // 'user' — імʼя змінене в застосунку, вхід його більше не перезаписує
  nameSource: 'provider' | 'user';
  email: string | null;
  method: SignInMethod | null;
};

// Шар між екранами й сховищем профілю: Firestore (`users/{uid}`) на iOS і
// Android, локальне сховище на web
export interface ProfileRepository {
  // Привʼязка до акаунта: null — вийшли (знімок null); uid — профіль цього
  // акаунта, проміс завершується після першого знімка з локальної копії
  setUser(uid: string | null): Promise<void>;
  getSnapshot(): UserProfile | null;
  subscribe(listener: () => void): () => void;
  // Створити або оновити профіль з даних входу; імʼя від користувача не чіпає,
  // порожнє імʼя від провайдера не затирає наявне, змінене за часів імітації
  // імʼя переходить у профіль справжнього акаунта
  syncFromAuth(user: AuthUser): Promise<void>;
  // trim, 1–NAME_MAX_LENGTH символів; при помилці знімок не змінюється
  setName(name: string): Promise<void>;
}

// trim, 1–NAME_MAX_LENGTH символів за кодовими точками
export function validateName(value: string): string {
  const name = value.trim();
  if (!name || Array.from(name).length > NAME_MAX_LENGTH) {
    throw new Error('Некоректне імʼя');
  }
  return name;
}
