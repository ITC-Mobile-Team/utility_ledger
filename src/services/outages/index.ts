import { storage } from '@/storage';
import { createOutageSettingsRepository } from './settings-repository';
export * from './types';
export * from './schedule';
export * from './registry';
export * from './setup-status';
export type { OutageSettingsRepository } from './settings-repository';

export const outageSettingsRepository = createOutageSettingsRepository(storage);
export {
  cancelOutageNotifications,
  configureOutageNotifications,
  ensureNotificationPermission,
  showNotificationPermissionAlert,
  syncOutageNotifications,
} from './notifications';
