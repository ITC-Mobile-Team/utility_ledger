import {
  DropdownMenu,
  DropdownMenuItem,
  Host,
  RNHostView,
  Text,
} from '@expo/ui/jetpack-compose';
import { Pressable } from '@/components';
import type { QueueId } from '@/services/outages';
import { useState } from 'react';
import {
  getQueueLabel,
  getStartQueueLabel,
  StartQueueRowContent,
  startQueueRowStyles,
  type StartQueueRowProps,
} from './start-queue-row-content';

// Випадаюче меню Android від рядка; поточна черга позначена галочкою
export function StartQueueRow({ queues, value, onChange }: StartQueueRowProps) {
  const [expanded, setExpanded] = useState(false);

  const pick = (queue: QueueId) => {
    setExpanded(false);
    onChange(queue);
  };

  return (
    <Host matchContents={{ vertical: true }} style={startQueueRowStyles.host}>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
      >
        <DropdownMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`Стартова черга, ${getStartQueueLabel(queues, value)}`}
              testID='outageSettings.startQueue'
              onPress={() => setExpanded(true)}
            >
              <StartQueueRowContent queues={queues} value={value} />
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {queues.map((queue) => (
            <DropdownMenuItem key={queue.id} onClick={() => pick(queue.id)}>
              <DropdownMenuItem.Text>
                <Text>
                  {queue.id === value
                    ? `✓  ${getQueueLabel(queue)}`
                    : `     ${getQueueLabel(queue)}`}
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
