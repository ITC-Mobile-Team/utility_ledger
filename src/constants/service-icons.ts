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
