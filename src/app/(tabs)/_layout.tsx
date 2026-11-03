import { NativeTabs } from 'expo-router/native-tabs';
import { useState } from 'react';
import { TabBarContext } from '@/hooks/use-hide-tab-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';

export default function TabsLayout() {
  const [isTabBarHidden, setTabBarHidden] = useState(false);
  const tabInk = useThemeColor('tabInk');
  const objectsColor = useThemeColor('blue');
  const analyticsColor = useThemeColor('greenInk');
  const moreColor = useThemeColor('purpleInk');

  return (
    <TabBarContext value={{ setTabBarHidden }}>
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
    </TabBarContext>
  );
}
