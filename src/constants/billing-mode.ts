import type { RadioItem } from '@/components/radio-group';

export type BillingMode = 'meter' | 'fixed' | 'day' | 'invoice';

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
  {
    value: 'invoice',
    title: 'Сума з рахунку',
    subtitle: 'Нова сума щомісяця, вносите вручну',
  },
] as const satisfies readonly RadioItem<BillingMode>[];
