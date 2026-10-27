import type { RadioItem } from '@/components/radio-group';

export type BillingMode = 'meter' | 'fixed' | 'day';

export const billingModes = [
  {
    value: 'meter',
    title: 'За показником',
    subtitle: 'Різниця показників × тариф',
  },
  {
    value: 'fixed',
    title: 'Фіксована сума',
    subtitle: 'Однакова сума щомісяця',
  },
  {
    value: 'day',
    title: 'За днями',
    subtitle: 'Ставка × кількість днів',
  },
] as const satisfies readonly RadioItem<BillingMode>[];
