import { type ReactNode } from 'react';
import { type SharedValue } from 'react-native-reanimated';
import { type NavigationBarButtonItem } from './navigation-bar-button';

export type NavigationBarType =
  'blue' | 'green' | 'purple' | 'power' | 'transparent';

export type NavigationBarVariant = 'full' | 'short';

export type ThemedNavigationBarProps = {
  type: NavigationBarVariant;
  barType?: NavigationBarType;
  title: string;
  subtitle?: string;
  // Елемент праворуч у рядку з кнопкою «Назад», напр. NavigationBarChip
  headerAccessory?: ReactNode;
  // Довільний вміст під великим заголовком і підзаголовком (напр. чипи);
  // згортається разом із ними. Лише для type='full'
  headerContent?: ReactNode;
  navigationBarButtons?: NavigationBarButtonItem[];
  onNavigationButtonPress?: (id: string) => void;
  scrollY?: SharedValue<number>;
  maxScrollY?: SharedValue<number>;
  titleShrink?: SharedValue<number>;
  collapseScroll?: SharedValue<number>;
  // Скрол, за який згортається великий заголовок (0, якщо його немає)
  titleCollapseDistance?: SharedValue<number>;
  cornerRadius?: number;
};
