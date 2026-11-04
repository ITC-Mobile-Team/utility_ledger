import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useThemeColor } from '@/hooks/use-theme-colors';

export default function TabsLayout() {
  const segments = useSegments();
  // Таб-бар видно лише на кореневих екранах табів: усе, що відкрито
  // всередині «Обʼєктів», показується без нього
  const isTabBarHidden = segments[1] === '(objects)' && segments.length > 2;
  const tabInk = useThemeColor('tabInk');
  const objectsColor = useThemeColor('blue');
  const analyticsColor = useThemeColor('greenInk');
  const moreColor = useThemeColor('purpleInk');

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
      <NativeTabs.Trigger name='more'>
        <NativeTabs.Trigger.Label selectedStyle={{ color: moreColor }}>
          Ще
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='ellipsis'
          md='more_horiz'
          selectedColor={moreColor}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
