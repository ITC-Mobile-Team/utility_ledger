import type { SignInMethod } from '@/services/auth';
import type { UserProfile } from './types';

const APPLE_RELAY_DOMAIN = 'privaterelay.appleid.com';

// Перший символ за кодовими точками, щоб не розрізати емодзі навпіл
export const getInitial = (name: string | null | undefined) =>
  Array.from(name?.trim() ?? '')[0]?.toLocaleUpperCase('uk') ?? '?';

export const getDisplayName = (profile: UserProfile | null) =>
  profile?.name ?? 'Без імені';

const maskEmail = (email: string) => {
  const [local = '', domain] = email.split('@');
  if (!domain) return email;
  return `${Array.from(local)[0] ?? ''}••••@${domain}`;
};

export const formatProfileEmail = (email: string | null | undefined) => {
  if (!email) return 'Email не вказано';
  if (email.toLowerCase().endsWith(`@${APPLE_RELAY_DOMAIN}`)) {
    return `Прихована пошта Apple · ${maskEmail(email)}`;
  }
  return maskEmail(email);
};

export const getProviderName = (method: SignInMethod) =>
  method === 'apple' ? 'Apple' : 'Google';

export const getProviderSubtitle = (method: SignInMethod | null) => {
  if (method === 'apple') return 'Apple ID · вхід без пароля';
  if (method === 'google') return 'Google-акаунт · вхід без пароля';
  return null;
};
