import { storage } from '@/storage';
import { createLocalOutageSettingsRepository } from './settings-repository';
export * from './types';
export * from './schedule';
export * from './registry';
export * from './setup-status';
export type { OutageSettingsRepository } from './settings-repository';

// Web поза обсягом хмарного зберігання: усе локально
export const outageSettingsRepository =
  createLocalOutageSettingsRepository(storage);
export {
  cancelOutageNotifications,
  configureOutageNotifications,
  ensureNotificationPermission,
  showNotificationPermissionAlert,
  syncOutageNotifications,
} from './notifications';
