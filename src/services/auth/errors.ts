import { AuthError } from './types';

// Коди, якими провайдери повідомляють, що користувач закрив вікно входу:
// expo-apple-authentication і Custom Tab Firebase на Android. Скасування
// Google розпізнає сам провайдер (src/services/auth/providers/google.ts)
const CANCEL_CODES = new Set([
  'ERR_REQUEST_CANCELED',
  'auth/web-context-canceled',
  'auth/web-context-cancelled',
]);

export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' || typeof code === 'number'
      ? String(code)
      : undefined;
  }
  return undefined;
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const code = errorCode(error);
  if (code && CANCEL_CODES.has(code)) return new AuthError('cancelled');
  // Код скасування Custom Tab на Android не підтверджений документацією:
  // у dev-збірці видно справжній код кожної невдачі
  if (__DEV__) console.warn('[auth]', code ?? error);
  return new AuthError(
    'failed',
    error instanceof Error ? error.message : undefined,
  );
}
