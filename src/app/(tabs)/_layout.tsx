import { Platform } from 'react-native';
import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useOpenStartTab } from '@/hooks/use-open-start-tab';

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
  // На iOS таб-бар сам підміняє contentInsetAdjustmentBehavior першого
  // скролу на 'automatic' і додає відступ під safe area. NavigationView лежить
  // під навбаром-накладкою й рахує відступи сам, тож автоматику вимикаємо.
  // На Android автоматика — це SafeAreaView над таб-баром, її лишаємо
  const ownsInsets = Platform.OS === 'ios';
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
      <NativeTabs.Trigger
        name='(objects)'
        disableAutomaticContentInsets={ownsInsets}
      >
        <NativeTabs.Trigger.Label selectedStyle={{ color: objectsColor }}>
          Обʼєкти
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf='building'
          md='apartment'
          selectedColor={objectsColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name='(outages)'
        disableAutomaticContentInsets={ownsInsets}
      >
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
      <NativeTabs.Trigger
        name='profile'
        disableAutomaticContentInsets={ownsInsets}
      >
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
