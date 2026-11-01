import { type SharedValue } from 'react-native-reanimated';
import { type NavigationBarButtonItem } from './navigation-bar-button';

export type NavigationBarType = 'blue' | 'green' | 'purple' | 'transparent';

export type NavigationBarVariant = 'full' | 'short';

export type ThemedNavigationBarProps = {
  type: NavigationBarVariant;
  barType?: NavigationBarType;
  title: string;
  subtitle?: string;
  navigationBarButtons?: NavigationBarButtonItem[];
  onNavigationButtonPress?: (id: string) => void;
  scrollY?: SharedValue<number>;
  cornerRadius?: number;
};
