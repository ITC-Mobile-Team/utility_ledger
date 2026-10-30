import { ViewProps } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { NavigationBarButtonItem } from './navigation-bar-button';

export type NavigationBarType = 'blue' | 'green' | 'purple' | 'transparent';

export type NavigationBarButtonVariant = 'full' | 'short';

export type ThemedNavigationBarProps = ViewProps & {
  type?: NavigationBarType;
  title: string;
  subtitle?: string;
  navigationBarButtons?: NavigationBarButtonItem[];
  onNavigationButtonPress?: (id: string) => void;
  scrollY?: SharedValue<number>;
};
