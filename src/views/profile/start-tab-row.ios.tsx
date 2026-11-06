import { Host, Label, Menu, Picker, RNHostView } from '@expo/ui/swift-ui';
import {
  accessibilityIdentifier,
  accessibilityLabel,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import {
  getStartTabLabel,
  START_TABS,
  type StartTab,
} from '@/services/preferences';
import {
  StartTabRowContent,
  startTabRowStyles,
  type StartTabRowProps,
} from './start-tab-row-content';

// SF-символи тих самих табів, що в таб-барі (src/app/(tabs)/_layout.tsx)
const symbols: Record<
  StartTab,
  'building' | 'lightbulb' | 'chart.xyaxis.line'
> = {
  objects: 'building',
  outages: 'lightbulb',
  analytics: 'chart.xyaxis.line',
};

// Нативне меню iOS від рядка: `Picker` з inline-стилем сам ставить галочку
// біля вибраного варіанта й закриває меню після вибору
export function StartTabRow({ value, onChange }: StartTabRowProps) {
  return (
    <Host matchContents={{ vertical: true }} style={startTabRowStyles.host}>
      <Menu
        label={
          <RNHostView matchContents={{ vertical: true }}>
            <StartTabRowContent value={value} />
          </RNHostView>
        }
        modifiers={[
          accessibilityIdentifier('profile.startTab'),
          accessibilityLabel(`Стартова вкладка, ${getStartTabLabel(value)}`),
        ]}
      >
        <Picker
          selection={value}
          onSelectionChange={(next: StartTab) => onChange(next)}
          modifiers={[pickerStyle('inline')]}
        >
          {START_TABS.map((tab) => (
            <Label
              key={tab}
              title={getStartTabLabel(tab)}
              systemImage={symbols[tab]}
              modifiers={[tag(tab)]}
            />
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}
