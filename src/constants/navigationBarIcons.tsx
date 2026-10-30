import { ImageSource } from 'expo-image';

export type NavigationBarIcon = 'plus';

export const navigationBarIcons: Record<NavigationBarIcon, ImageSource> = {
  plus: require('@/images/button/plus.svg'),
};
