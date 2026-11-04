import { useSharedValue } from 'react-native-reanimated';
import { EMPTY_BOTTOM } from './constants';
import { NavigationBarBackground } from './navigation-bar-background';
import { NavigationBarButtons } from './navigation-bar-buttons';
import { NavigationBarHeader } from './navigation-bar-header';
import { type ThemedNavigationBarProps } from './types';
import { useNavigationBarCollapse } from './use-navigation-bar-collapse';
import { ThemedView } from '../themed-view';

export function ThemedNavigationBar({
  type,
  barType = 'transparent',
  title,
  subtitle,
  headerAccessory,
  headerContent,
  navigationBarButtons = [],
  onNavigationButtonPress = () => {},
  scrollY,
  maxScrollY,
  titleShrink,
  collapseScroll,
  titleCollapseDistance,
  cornerRadius = 0,
}: ThemedNavigationBarProps) {
  const hasButtons = navigationBarButtons.length > 0;
  const fallbackMaxScrollY = useSharedValue(Number.MAX_VALUE);
  const collapse = useNavigationBarCollapse({
    scrollY,
    maxScrollY: maxScrollY ?? fallbackMaxScrollY,
    hasButtons,
  });
  const fallbackTitleShrink = useSharedValue(0);
  const fallbackCollapseScroll = useSharedValue(0);
  const fallbackTitleCollapseDistance = useSharedValue(0);

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
        accessory={headerAccessory}
        content={headerContent}
        isTransparent={barType === 'transparent'}
        heroSubtitleColor={barType === 'power' ? 'heroSubPower' : 'heroSub'}
        paddingBottom={hasButtons ? 0 : EMPTY_BOTTOM + cornerRadius}
        scrollY={collapse.scrollY}
        maxScrollY={maxScrollY ?? fallbackMaxScrollY}
        titleShrink={titleShrink ?? fallbackTitleShrink}
        collapseScroll={collapseScroll ?? fallbackCollapseScroll}
        titleCollapseDistance={
          titleCollapseDistance ?? fallbackTitleCollapseDistance
        }
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
