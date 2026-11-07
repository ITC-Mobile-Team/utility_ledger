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
  // Кнопка праворуч від великого заголовка (напр. NavigationBarIconButton);
  // згортається разом із ним. Лише для type='full'
  headerTrailing?: ReactNode;
  // Великі кнопки; ховаються разом із великим заголовком
  navigationBarButtons?: NavigationBarButtonItem[];
  onNavigationButtonPress?: (id: string) => void;
  // Нормалізований зсув контенту (0 — верх), з урахуванням клавіатури
  scrollY?: SharedValue<number>;
  // Скрол, за який навбар згортається повністю (0, якщо згортатися нічому)
  collapseDistance?: SharedValue<number>;
  // Висота розгорнутої накладки — з неї рахується верхній відступ контенту
  onHeightChange?: (height: number) => void;
};
