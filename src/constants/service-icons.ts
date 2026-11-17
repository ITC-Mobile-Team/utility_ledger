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

// Запасні кольори, коли родина кольору розділу вже зайнята
const accentOrder: readonly AppColor[] = [
  'amber',
  'water',
  'gas',
  'green',
  'purple',
  'blue',
  'coral',
];

// Схожі на смузі кольори — одна родина: дві частки поруч одним відтінком
// не розрізнити (синій «Звʼязку» і блакитний води; бурштиновий світла,
// теракотовий газу й червоний)
const accentFamily: Partial<Record<AppColor, string>> = {
  blue: 'blue',
  water: 'blue',
  amber: 'warm',
  gas: 'warm',
  coral: 'warm',
};

const familyOf = (color: AppColor) => accentFamily[color] ?? color;

export const getServiceAccent = (icon: string): AppColor =>
  accentBySoft[getServiceIconBackground(icon)] ?? 'purple';

// Кольори для кількох послуг поспіль (від найбільшої частки): колір, родина
// якого вже зайнята, замінюється вільним — спершу з родин, яких не хоче жодна
// інша послуга, щоб не забрати колір у наступної
export const pickServiceAccents = (icons: readonly string[]): AppColor[] => {
  const preferred = icons.map(getServiceAccent);
  const wanted = new Set(preferred.map(familyOf));
  const used = new Set<string>();
  return preferred.map((color) => {
    const isFree = (c: AppColor) => !used.has(familyOf(c));
    const picked = isFree(color)
      ? color
      : (accentOrder.find((c) => isFree(c) && !wanted.has(familyOf(c))) ??
        accentOrder.find(isFree) ??
        color);
    used.add(familyOf(picked));
    return picked;
  });
};
