import type { AppColor } from './colors';

type ServiceIconSection = {
  title: string;
  background: AppColor;
  icons: readonly string[];
};

export const serviceIconSections: readonly ServiceIconSection[] = [
  {
    title: 'Енергія',
    background: 'amberSoft',
    icons: ['⚡', '💡', '🔌', '🔋', '☀️', '🌙', '🕯️', '🔦'],
  },
  {
    title: 'Вода й тепло',
    background: 'waterSoft',
    icons: ['💧', '🚿', '🛁', '🚰', '🫧', '♨️', '🌡️', '❄️'],
  },
  {
    title: 'Газ',
    background: 'gasSoft',
    icons: ['🔥', '⛽', '🛢️', '🍳', '🫕', '🧯', '🏭', '💨'],
  },
  {
    title: 'Дім',
    background: 'greenSoft',
    icons: ['🏠', '🏢', '🧹', '🗑️', '♻️', '🛗', '🔑', '🧺'],
  },
  {
    title: 'Звʼязок',
    background: 'blueSoft',
    icons: ['🌐', '📶', '📺', '📱', '☎️', '📡', '💻', '📦'],
  },
];

export const defaultServiceIcon = '⚡';

// Фон іконки береться з розділу, до якого вона належить
export const getServiceIconBackground = (icon: string): AppColor =>
  serviceIconSections.find((section) => section.icons.includes(icon))
    ?.background ?? 'surface2';

// Насичений колір розділу іконки — частка послуги в смузі розподілу
const accentBySoft: Partial<Record<AppColor, AppColor>> = {
  amberSoft: 'amber',
  waterSoft: 'water',
  gasSoft: 'gas',
  greenSoft: 'green',
  blueSoft: 'blue',
};

const accentOrder: readonly AppColor[] = [
  'amber',
  'water',
  'gas',
  'green',
  'blue',
  'purple',
  'coral',
];

export const getServiceAccent = (icon: string): AppColor =>
  accentBySoft[getServiceIconBackground(icon)] ?? 'purple';

// Кольори для кількох послуг поспіль: повтор замінюється наступним вільним
export const pickServiceAccents = (icons: readonly string[]): AppColor[] => {
  const used = new Set<AppColor>();
  return icons.map((icon) => {
    const preferred = getServiceAccent(icon);
    const color = used.has(preferred)
      ? (accentOrder.find((c) => !used.has(c)) ?? preferred)
      : preferred;
    used.add(color);
    return color;
  });
};
