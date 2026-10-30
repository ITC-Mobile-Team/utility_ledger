import { useState } from 'react';
import {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  COLLAPSE_DISTANCE,
  FULL_ROW_OFFSET,
  GRADIENT_TAIL,
  SHORT_ROW_BOTTOM,
  SHORT_ROW_OFFSET,
} from './constants';

export const useNavigationBarCollapse = ({
  scrollY,
  hasButtons,
}: {
  scrollY?: SharedValue<number>;
  hasButtons: boolean;
}) => {
  const fallbackScrollY = useSharedValue(0);
  const scroll = scrollY ?? fallbackScrollY;
  const fullRowHeight = useSharedValue(76);
  const shortRowHeight = useSharedValue(40);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const progress = useDerivedValue(() =>
    interpolate(
      scroll.value,
      [0, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  // Only the visible row should receive touches
  useAnimatedReaction(
    () => progress.value > 0.5,
    (collapsed, previous) => {
      if (collapsed !== previous) {
        scheduleOnRN(setIsCollapsed, collapsed);
      }
    },
  );

  const buttonsAreaStyle = useAnimatedStyle(() => {
    const expanded = FULL_ROW_OFFSET + fullRowHeight.value;
    const collapsed =
      SHORT_ROW_OFFSET + shortRowHeight.value + SHORT_ROW_BOTTOM;
    return {
      height: interpolate(progress.value, [0, 1], [expanded, collapsed]),
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const expandedInset = FULL_ROW_OFFSET + fullRowHeight.value - GRADIENT_TAIL;
    return {
      bottom: hasButtons
        ? interpolate(progress.value, [0, 1], [expandedInset, 0])
        : 0,
    };
  });

  const fullRowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -12]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.92]) },
    ],
  }));

  const shortRowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [8, 0]) }],
  }));

  return {
    isCollapsed,
    gradientStyle,
    buttonsAreaStyle,
    fullRowStyle,
    shortRowStyle,
    onFullRowHeightChange: (height: number) => fullRowHeight.set(height),
    onShortRowHeightChange: (height: number) => shortRowHeight.set(height),
  };
};

export type NavigationBarCollapse = ReturnType<typeof useNavigationBarCollapse>;
