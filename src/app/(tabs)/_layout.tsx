import { NativeTabs } from 'expo-router/native-tabs';
import { useState } from 'react';
import { TabBarContext } from '@/hooks/use-hide-tab-bar';

export default function TabsLayout() {
  const [isTabBarHidden, setTabBarHidden] = useState(false);
  return (
    <TabBarContext value={{ setTabBarHidden }}>
      <NativeTabs hidden={isTabBarHidden}>
        <NativeTabs.Trigger name='(objects)'>
          <NativeTabs.Trigger.Label>Objects</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            md='home'
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='analytics'>
          <NativeTabs.Trigger.Label>Analytics</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
            md='chart_data'
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='more'>
          <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: 'ellipsis.circle',
              selected: 'ellipsis.circle.fill',
            }}
            md='more'
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  );
}
