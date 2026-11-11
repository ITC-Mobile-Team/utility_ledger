import { useAccountDataStatus } from '@/providers/account-data-provider';
import { useAuth } from '@/providers/auth-provider';
import { useEffect, useState } from 'react';

// Мінімальний час показу анімованого splash, щоб анімацію було видно (FR-009)
const MIN_VISIBLE_MS = 1000;
// Скільки splash чекає першого завантаження даних акаунта (FR-009a)
const DATA_WAIT_MS = 3000;

// null — накладку ще не показано, відлік не почався
function useElapsed(shownAt: number | null, ms: number) {
  const [elapsedFor, setElapsedFor] = useState<number | null>(null);
  useEffect(() => {
    if (shownAt === null) return;
    const timer = setTimeout(
      () => setElapsedFor(shownAt),
      Math.max(0, ms - (Date.now() - shownAt)),
    );
    return () => clearTimeout(timer);
  }, [shownAt, ms]);
  return shownAt !== null && elapsedFor === shownAt;
}

// Чи можна згасати. shownAt — коли накладку показано (системний splash
// сховано). Мінімальна секунда минула і перший екран готовий: користувач не
// увійшов, дані акаунта отримано (або «Немає інтернету»), або чекання даних
// вичерпало 3 с (далі скелетони)
export function useSplashGate(shownAt: number | null): boolean {
  const { isSignedIn } = useAuth();
  const { status } = useAccountDataStatus();
  const minElapsed = useElapsed(shownAt, MIN_VISIBLE_MS);
  const timedOut = useElapsed(shownAt, DATA_WAIT_MS);
  return minElapsed && (!isSignedIn || status !== 'loading' || timedOut);
}
