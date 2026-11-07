import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { EMPTY_BOTTOM, SHORT_TITLE_ROW_HEIGHT } from './constants';
import { NavigationBarBackground } from './navigation-bar-background';
import { NavigationBarButtonsRow } from './navigation-bar-buttons-row';
import { NavigationBarHeader } from './navigation-bar-header';
import { type ThemedNavigationBarProps } from './types';
import { useNavigationBarProgress } from './use-navigation-bar-progress';

// Навбар — накладка над скролом: контент іде під нього, а згортання робиться
// трансформаціями (use-navigation-bar-progress), без зміни висоти
export function ThemedNavigationBar({
  type,
  barType = 'transparent',
  title,
  subtitle,
  headerAccessory,
  headerContent,
  headerTrailing,
  navigationBarButtons = [],
  onNavigationButtonPress = () => {},
  scrollY,
  collapseDistance,
  onHeightChange,
}: ThemedNavigationBarProps) {
  const bg = useThemeColor('bg');
  const { top: safeAreaTop } = useSafeAreaInsets();
  const hasButtons = navigationBarButtons.length > 0;
  const fallbackScrollY = useSharedValue(0);
  const fallbackCollapseDistance = useSharedValue(0);
  const progress = useNavigationBarProgress({
    scrollY: scrollY ?? fallbackScrollY,
    collapsedHeight: safeAreaTop + SHORT_TITLE_ROW_HEIGHT + EMPTY_BOTTOM,
    collapseDistance: collapseDistance ?? fallbackCollapseDistance,
  });
  const lastHeight = useRef(0);

  // Великий блок натискається, лише поки його видно більше ніж наполовину
  const [isCollapsed, setIsCollapsed] = useState(false);
  useAnimatedReaction(
    () => progress.progress.get() >= 0.5,
    (collapsed, previous) => {
      if (collapsed !== previous) scheduleOnRN(setIsCollapsed, collapsed);
    },
  );

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor: bg }, progress.overlayStyle]}
      onLayout={(e) => {
        const height = progress.onExpandedHeightChange(
          e.nativeEvent.layout.height,
        );
        if (height !== lastHeight.current) {
          lastHeight.current = height;
          onHeightChange?.(height);
        }
      }}
    >
      {barType !== 'transparent' && (
        <NavigationBarBackground
          type={barType}
          style={progress.gradientStyle}
          sheetCornerStyle={progress.sheetCornerStyle}
        />
      )}
      <NavigationBarHeader
        type={type}
        title={title}
        subtitle={subtitle}
        accessory={headerAccessory}
        content={headerContent}
        trailing={headerTrailing}
        buttons={
          hasButtons ? (
            <NavigationBarButtonsRow
              buttons={navigationBarButtons}
              onButtonPress={onNavigationButtonPress}
              onHeightChange={progress.onButtonsHeightChange}
            />
          ) : undefined
        }
        isTransparent={barType === 'transparent'}
        heroSubtitleColor={barType === 'power' ? 'heroSubPower' : 'heroSub'}
        safeAreaTop={safeAreaTop}
        isCollapsed={isCollapsed}
        progress={progress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
