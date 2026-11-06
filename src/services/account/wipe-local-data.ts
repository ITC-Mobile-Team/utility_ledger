import type { AuthService } from '@/services/auth';
import type { LedgerRepository } from '@/services/ledger';
import type { OutageSettingsRepository } from '@/services/outages';
import type { ProfileRepository } from '@/services/profile';
import { START_TAB_KEY, THEME_KEY } from '@/services/preferences';
import type { KeyValueStorage } from '@/storage';

export const PENDING_WIPE_KEY = 'pendingWipe';
export const ONBOARDING_KEY = 'hasSeenOnboarding';

type Dependencies = {
  storage: KeyValueStorage;
  auth: AuthService;
  ledger: LedgerRepository;
  outages: OutageSettingsRepository;
  profile: ProfileRepository;
  cancelNotifications: () => Promise<void>;
};

// Вихід і видалення акаунта поки стирають лише дані на пристрої. З Firebase
// «Видалити акаунт» ще видалятиме дані й користувача на сервері, а «Вийти»
// лишатиме їх у хмарі
export function createLocalDataWiper(deps: Dependencies) {
  const { storage, auth, ledger, outages, profile, cancelNotifications } = deps;

  // Кроки після виходу. Кожен незалежний: збій одного не лишає решту даних
  const eraseData = async () => {
    await Promise.allSettled([
      cancelNotifications(),
      ledger.clear(),
      outages.clear(),
      profile.clear(),
      storage.removeItem(ONBOARDING_KEY),
      storage.removeItem(THEME_KEY),
      storage.removeItem(START_TAB_KEY),
    ]);
    await storage.removeItem(PENDING_WIPE_KEY);
  };

  return {
    // Маркер ставиться першим, сесія знімається одразу після нього: перерване
    // стирання лишає користувача на першому екрані, а не в напівпорожньому
    // акаунті, і finishPendingWipe доводить його до кінця при запуску
    async wipeLocalData() {
      await storage.setItem(PENDING_WIPE_KEY, 'true');
      await auth.signOut();
      await eraseData();
    },
    async finishPendingWipe() {
      if ((await storage.getItem(PENDING_WIPE_KEY)) !== 'true') return;
      await auth.signOut();
      await eraseData();
    },
  };
}
