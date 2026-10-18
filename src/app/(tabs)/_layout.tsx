import { NativeTabs } from 'expo-router/native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs>
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
          sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }}
          md='more'
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
