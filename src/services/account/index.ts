import { authService } from '@/services/auth';
import { ledgerRepository } from '@/services/ledger';
import {
  cancelOutageNotifications,
  outageSettingsRepository,
} from '@/services/outages';
import { profileRepository } from '@/services/profile';
import { storage } from '@/storage';
import { createLocalDataWiper } from './wipe-local-data';
export { ONBOARDING_KEY, PENDING_WIPE_KEY } from './wipe-local-data';

export const { wipeLocalData, finishPendingWipe } = createLocalDataWiper({
  storage,
  auth: authService,
  ledger: ledgerRepository,
  outages: outageSettingsRepository,
  profile: profileRepository,
  cancelNotifications: cancelOutageNotifications,
});
