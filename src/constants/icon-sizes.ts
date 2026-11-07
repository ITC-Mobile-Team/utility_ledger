// Розміри гліфів іконок за ролями. Кожне місце в застосунку бере роль, а не
// число, щоб іконки одного призначення мали один розмір
export const iconSizes = {
  badge: 12,
  inline: 16,
  button: 20,
  feature: 28,
  hero: 40,
  heroLarge: 64,
} as const;

export type IconRole = keyof typeof iconSizes;
