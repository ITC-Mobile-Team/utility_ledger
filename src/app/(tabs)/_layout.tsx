import { type Href, usePathname, useRouter, useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { usePreferences } from '@/providers/preferences-provider';
import type { StartTab } from '@/services/preferences';
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

function useOpenStartTab() {
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

export default function TabsLayout() {
  useOpenStartTab();
  const segments = useSegments();
  // Таб-бар видно лише на кореневих екранах табів: усе, що відкрито
  // всередині «Обʼєктів», «Світла» і «Профілю», показується без нього
  const isTabBarHidden =
    (segments[1] === '(objects)' ||
      segments[1] === '(outages)' ||
      segments[1] === 'profile') &&
    segments.length > 2;
  const tabInk = useThemeColor('tabInk');
  const objectsColor = useThemeColor('blue');
  const outagesColor = useThemeColor('powerOnInk');
  const analyticsColor = useThemeColor('greenInk');
  const profileColor = useThemeColor('purpleInk');

  return (
    <NativeTabs
      hidden={isTabBarHidden}
      iconColor={tabInk}
      labelStyle={{ color: tabInk }}
    >
      <NativeTabs.Trigger name='(objects)'>
        <NativeTabs.Trigger.Label selectedStyle={{ color: objectsColor }}>
          Обʼєкти
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='building'
          md='apartment'
          selectedColor={objectsColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='(outages)'>
        <NativeTabs.Trigger.Label selectedStyle={{ color: outagesColor }}>
          Світло
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='lightbulb'
          md='lightbulb'
          selectedColor={outagesColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='analytics'>
        <NativeTabs.Trigger.Label selectedStyle={{ color: analyticsColor }}>
          Аналітика
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='chart.xyaxis.line'
          md='show_chart'
          selectedColor={analyticsColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='profile'>
        <NativeTabs.Trigger.Label selectedStyle={{ color: profileColor }}>
          Профіль
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='person.crop.circle'
          md='person'
          selectedColor={profileColor}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
