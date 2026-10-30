import { View } from 'react-native';
import { EMPTY_BOTTOM } from './constants';
import { NavigationBarBackground } from './navigation-bar-background';
import { NavigationBarButtons } from './navigation-bar-buttons';
import { NavigationBarHeader } from './navigation-bar-header';
import { ThemedNavigationBarProps } from './types';
import { useNavigationBarCollapse } from './use-navigation-bar-collapse';
import { ThemedView } from '../themed-view';

export function ThemedNavigationBar({
  type = 'transparent',
  title,
  subtitle,
  navigationBarButtons = [],
  onNavigationButtonPress = (id) => {},
  scrollY,
}: ThemedNavigationBarProps) {
  const hasButtons = navigationBarButtons.length > 0;
  const collapse = useNavigationBarCollapse({ scrollY, hasButtons });

  return (
    <ThemedView>
      {type !== 'transparent' && (
        <NavigationBarBackground type={type} style={collapse.gradientStyle} />
      )}
      <NavigationBarHeader
        title={title}
        subtitle={subtitle}
        isTransparent={type === 'transparent'}
        paddingBottom={hasButtons ? 0 : EMPTY_BOTTOM}
      />
      {hasButtons && (
        <NavigationBarButtons
          buttons={navigationBarButtons}
          onButtonPress={onNavigationButtonPress}
          collapse={collapse}
        />
      )}
    </ThemedView>
  );
}
