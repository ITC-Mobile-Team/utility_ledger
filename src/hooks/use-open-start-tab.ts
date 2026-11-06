import { usePreferences } from '@/providers/preferences-provider';
import type { StartTab } from '@/services/preferences';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

// Корені табів. «Обʼєкти» — це `/`, тож решту адресуємо через групу
const startTabHrefs: Record<Exclude<StartTab, 'objects'>, Href> = {
  outages: '/(tabs)/(outages)',
  analytics: '/(tabs)/analytics',
};

// NativeTabs не має `initialRouteName`, тому стартову вкладку відкриваємо
// переходом при першому показі табів після холодного запуску. Прапорець на
// рівні модуля: повернення з фону й перемонтування табів його не чіпають, а
// запуск із глибокого посилання (шлях не `/`) лишає ціль посилання
let startTabHandled = false;

export function useOpenStartTab() {
  const router = useRouter();
  const pathname = usePathname();
  const { startTab } = usePreferences();

  useEffect(() => {
    if (startTabHandled) return;
    startTabHandled = true;
    if (startTab !== 'objects' && pathname === '/') {
      router.replace(startTabHrefs[startTab]);
    }
  }, [pathname, router, startTab]);
}
