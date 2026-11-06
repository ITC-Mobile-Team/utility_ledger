import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  getStartTabLabel,
  START_TABS,
  type StartTab,
} from '@/services/preferences';
import { useState } from 'react';
import { Pressable } from '@/components';
import {
  StartTabRowContent,
  startTabRowStyles,
  type StartTabRowProps,
} from './start-tab-row-content';

// Випадаюче меню Android від рядка; поточний варіант позначений галочкою
export function StartTabRow({ value, onChange }: StartTabRowProps) {
  const [expanded, setExpanded] = useState(false);

  const pick = (tab: StartTab) => {
    setExpanded(false);
    onChange(tab);
  };

  return (
    <Host matchContents={{ vertical: true }} style={startTabRowStyles.host}>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
      >
        <DropdownMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`Стартова вкладка, ${getStartTabLabel(value)}`}
              testID='profile.startTab'
              onPress={() => setExpanded(true)}
            >
              <StartTabRowContent value={value} />
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {START_TABS.map((tab) => (
            <DropdownMenuItem key={tab} onClick={() => pick(tab)}>
              <DropdownMenuItem.Text>
                <Text>
                  {tab === value
                    ? `✓  ${getStartTabLabel(tab)}`
                    : `     ${getStartTabLabel(tab)}`}
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
