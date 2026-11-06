import type { StartTab } from './types';

export const START_TAB_KEY = 'startTab';

// Порядок варіантів у меню; «Профіль» стартовою бути не може
export const START_TABS: readonly StartTab[] = [
  'objects',
  'outages',
  'analytics',
];

export const DEFAULT_START_TAB: StartTab = 'objects';

const labels: Record<StartTab, string> = {
  objects: 'Обʼєкти',
  outages: 'Світло',
  analytics: 'Аналітика',
};

// Імена тригерів у `src/app/(tabs)/_layout.tsx`
const routeNames: Record<StartTab, '(objects)' | '(outages)' | 'analytics'> = {
  objects: '(objects)',
  outages: '(outages)',
  analytics: 'analytics',
};

// Невідоме, пошкоджене чи відсутнє значення читається як «Обʼєкти»
export function parseStartTab(value: string | null): StartTab {
  return START_TABS.find((tab) => tab === value) ?? DEFAULT_START_TAB;
}

export function toTabRouteName(tab: StartTab) {
  return routeNames[tab];
}

export function getStartTabLabel(tab: StartTab) {
  return labels[tab];
}
