import { type ImageSource } from 'expo-image';

export type AppIcon = 'plus' | 'house' | 'lock';

export const appIcons: Record<AppIcon, ImageSource> = {
  plus: require('@/images/button/plus.svg'),
  house: require('@/images/house.svg'),
  lock: require('@/images/lock.svg'),
};
