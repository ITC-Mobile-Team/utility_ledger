import { Host, Menu, Picker, RNHostView, Text } from '@expo/ui/swift-ui';
import {
  accessibilityIdentifier,
  accessibilityLabel,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import type { QueueId } from '@/services/outages';
import {
  getQueueLabel,
  getStartQueueLabel,
  StartQueueRowContent,
  startQueueRowStyles,
  type StartQueueRowProps,
} from './start-queue-row-content';

// Нативне меню iOS від рядка: `Picker` з inline-стилем сам ставить галочку
// біля вибраної черги й закриває меню після вибору
export function StartQueueRow({ queues, value, onChange }: StartQueueRowProps) {
  return (
    <Host matchContents={{ vertical: true }} style={startQueueRowStyles.host}>
      <Menu
        label={
          <RNHostView matchContents={{ vertical: true }}>
            <StartQueueRowContent queues={queues} value={value} />
          </RNHostView>
        }
        modifiers={[
          accessibilityIdentifier('outageSettings.startQueue'),
          accessibilityLabel(
            `Стартова черга, ${getStartQueueLabel(queues, value)}`,
          ),
        ]}
      >
        <Picker
          selection={value}
          onSelectionChange={(next: QueueId) => onChange(next)}
          modifiers={[pickerStyle('inline')]}
        >
          {queues.map((queue) => (
            <Text key={queue.id} modifiers={[tag(queue.id)]}>
              {getQueueLabel(queue)}
            </Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}
