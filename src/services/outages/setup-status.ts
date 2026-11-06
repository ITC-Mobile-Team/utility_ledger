import { getProviderForCity } from './registry';
import type { OutageSettings } from './types';

// Чому «Світло» не показує графік: місто не вибране, для міста немає
// постачальника, або серед черг немає жодної, яку обслуговує постачальник
export type OutageSetupStatus = 'ready' | 'noCity' | 'noProvider' | 'noQueues';

// Умови перевіряються згори донизу; перше збіжне значення — результат
export function getOutageSetupStatus(
  settings: OutageSettings,
): OutageSetupStatus {
  if (!settings.city) return 'noCity';
  const provider = getProviderForCity(settings.city);
  if (!provider) return 'noProvider';
  const hasQueues = settings.queues.some((queue) =>
    provider.queues.includes(queue.id),
  );
  return hasQueues ? 'ready' : 'noQueues';
}

const messages: Record<Exclude<OutageSetupStatus, 'ready'>, string> = {
  noCity: 'Місто й черги не налаштовані',
  noProvider: 'Постачальник для вашого міста ще не доданий',
  noQueues: 'Черги не вибрані',
};

export function getOutageSetupMessage(
  status: Exclude<OutageSetupStatus, 'ready'>,
) {
  return messages[status];
}
