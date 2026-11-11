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

// Шар між екранами й сховищем профілю. Зараз — локальне сховище на пристрої,
// пізніше — Firestore (`users/{uid}`) з тим самим інтерфейсом
export interface ProfileRepository {
  load(): Promise<void>;
  getSnapshot(): UserProfile | null;
  subscribe(listener: () => void): () => void;
  // Створити або оновити профіль з даних входу; імʼя від користувача не чіпає,
  // порожнє імʼя від провайдера не затирає наявне, змінене за часів імітації
  // імʼя переходить у профіль справжнього акаунта
  syncFromAuth(user: AuthUser): Promise<void>;
  // trim, 1–NAME_MAX_LENGTH символів; при помилці знімок не змінюється
  setName(name: string): Promise<void>;
  clear(): Promise<void>;
}
