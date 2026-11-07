// Іконки інтерфейсу як emoji: карта затверджена в specs/004-emoji-icons-signout
// (research.md R4). Шеврони, логотипи Google/Apple, стрілка «Назад» і таб-бар
// лишаються векторними й сюди не входять
export const appIcons = {
  plus: '➕',
  minus: '➖',
  house: '🏠',
  apartment: '🏢',
  lock: '🔒',
  danger: '⚠️',
  document: '📄',
  receipt: '🧾',
  arrowUpRight: '↗️',
  archive: '🗄️',
  calendar: '📅',
  gauge: '🧮',
  pencil: '✏️',
  trash: '🗑️',
  reset: '🔄',
  search: '🔍',
  check: '✅',
  contrast: '🌓',
  bulb: '💡',
  bulbOff: '🕯️',
  pin: '📍',
  clock: '🕒',
  gear: '⚙️',
  person: '👤',
  bell: '🔔',
  shield: '🛡️',
  signOut: '🚪',
  electricity: '⚡',
  water: '💧',
  network: '🌐',
  gas: '🔥',
  heating: '🌡️',
} as const;

export type AppIcon = keyof typeof appIcons;
