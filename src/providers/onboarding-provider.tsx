import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { storage as defaultStorage, type KeyValueStorage } from '@/storage';

const KEY = 'hasSeenOnboarding';

type OnboardingContextValue = {
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type Props = PropsWithChildren<{ storage?: KeyValueStorage }>;

export function OnboardingProvider({
  storage = defaultStorage,
  children,
}: Props) {
  // null означає, що значення ще читається зі сховища
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    storage
      .getItem(KEY)
      .then((value) => setHasSeenOnboarding(value === 'true'));
  }, [storage]);

  const completeOnboarding = useCallback(async () => {
    await storage.setItem(KEY, 'true');
    setHasSeenOnboarding(true);
  }, [storage]);

  // Поки значення не прочитане, нічого не рендеримо, щоб не мигав неправильний екран
  if (hasSeenOnboarding === null) return null;

  return (
    <OnboardingContext value={{ hasSeenOnboarding, completeOnboarding }}>
      {children}
    </OnboardingContext>
  );
}

export function useOnboarding() {
  const ctx = use(OnboardingContext);
  if (!ctx)
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
