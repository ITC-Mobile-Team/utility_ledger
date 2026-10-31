import { ImageSource } from 'expo-image';

export type AppIcon = 'plus' | 'house';

export const appIcons: Record<AppIcon, ImageSource> = {
  plus: require('@/images/button/plus.svg'),
  house: require('@/images/house.svg'),
};
