import type { AppColor } from './colors';

type MonthAppearance = {
  emoji: string;
  background: AppColor;
};

// Індекс — номер місяця з нуля
export const monthAppearance: readonly MonthAppearance[] = [
  { emoji: '❄️', background: 'blueSoft' },
  { emoji: '⛄', background: 'blueSoft' },
  { emoji: '🌱', background: 'greenSoft' },
  { emoji: '🌷', background: 'coralSoft' },
  { emoji: '🌼', background: 'amberSoft' },
  { emoji: '☀️', background: 'amberSoft' },
  { emoji: '🏖️', background: 'waterSoft' },
  { emoji: '🌻', background: 'amberSoft' },
  { emoji: '🍂', background: 'gasSoft' },
  { emoji: '🎃', background: 'gasSoft' },
  { emoji: '🍁', background: 'coralSoft' },
  { emoji: '🎄', background: 'greenSoft' },
];
