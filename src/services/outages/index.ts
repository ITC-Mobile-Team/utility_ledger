import { storage } from '@/storage';
import { createFirestoreOutageSettingsRepository } from './firestore-settings-repository';
export * from './types';
export * from './schedule';
export * from './registry';
export * from './setup-status';
export type { OutageSettingsRepository } from './settings-repository';

// Місто й черги — в акаунті (Firestore), сповіщення й кеш графіків — на
// пристрої; на web усе локально (index.web.ts)
export const outageSettingsRepository =
  createFirestoreOutageSettingsRepository(storage);
export {
  cancelOutageNotifications,
  configureOutageNotifications,
  ensureNotificationPermission,
  showNotificationPermissionAlert,
  syncOutageNotifications,
} from './notifications';
