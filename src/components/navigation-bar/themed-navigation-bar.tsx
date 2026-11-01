import { View } from 'react-native';
import { EMPTY_BOTTOM } from './constants';
import { NavigationBarBackground } from './navigation-bar-background';
import { NavigationBarButtons } from './navigation-bar-buttons';
import { NavigationBarHeader } from './navigation-bar-header';
import { ThemedNavigationBarProps } from './types';
import { useNavigationBarCollapse } from './use-navigation-bar-collapse';
import { ThemedView } from '../themed-view';

export function ThemedNavigationBar({
  type,
  barType = 'transparent',
  title,
  subtitle,
  navigationBarButtons = [],
  onNavigationButtonPress = (id) => {},
  scrollY,
  cornerRadius = 0,
}: ThemedNavigationBarProps) {
  const hasButtons = navigationBarButtons.length > 0;
  const collapse = useNavigationBarCollapse({ scrollY, hasButtons });

  return (
    <ThemedView>
      {barType !== 'transparent' && (
        <NavigationBarBackground
          type={barType}
          style={collapse.gradientStyle}
        />
      )}
      <NavigationBarHeader
        type={type}
        title={title}
        subtitle={subtitle}
        isTransparent={barType === 'transparent'}
        paddingBottom={hasButtons ? 0 : EMPTY_BOTTOM + cornerRadius}
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
