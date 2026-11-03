import {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SHORT_TITLE_ROW_HEIGHT } from './constants';

// Large title + subtitle slide up under the top row while content scrolls,
// and the short title fades in next to the back button
export const useTitleCollapse = ({
  scrollY,
  maxScrollY,
  shrink,
  collapseScroll,
  collapseDistance,
  hasBackButton,
}: {
  scrollY: SharedValue<number>;
  maxScrollY: SharedValue<number>;
  // How much the header is currently shorter than expanded
  shrink: SharedValue<number>;
  // Scroll range (with the header expanded) the content needs to collapse fully
  collapseScroll: SharedValue<number>;
  // Scroll over which the large title collapses, for snapping in NavigationView
  collapseDistance: SharedValue<number>;
  hasBackButton: boolean;
}) => {
  const largeHeight = useSharedValue(0);

  // Content barely taller than the screen collapses over its whole scroll range
  const progress = useDerivedValue(() => {
    const distance = Math.min(largeHeight.value, maxScrollY.value);
    return distance > 0
      ? interpolate(scrollY.value, [0, distance], [0, 1], Extrapolation.CLAMP)
      : 0;
  });

  useAnimatedReaction(
    () => largeHeight.value,
    (value) => collapseDistance.set(value),
  );

  const fullShrink = useDerivedValue(
    () => largeHeight.value - (hasBackButton ? 0 : SHORT_TITLE_ROW_HEIGHT),
  );

  useAnimatedReaction(
    () => progress.value * fullShrink.value,
    (value) => shrink.set(value),
  );

  // Collapsing takes largeHeight of scroll, and the header shrinks by fullShrink
  useAnimatedReaction(
    () => largeHeight.value + fullShrink.value,
    (value) => collapseScroll.set(value),
  );

  // Without a back button the top row is empty until the short title appears
  const rowStyle = useAnimatedStyle(() => ({
    height: hasBackButton
      ? SHORT_TITLE_ROW_HEIGHT
      : interpolate(progress.value, [0, 1], [0, SHORT_TITLE_ROW_HEIGHT]),
  }));

  const shortTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0.6, 1],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Not measured yet: let the block take its natural height
  const largeAreaStyle = useAnimatedStyle(() => ({
    height:
      largeHeight.value > 0
        ? interpolate(progress.value, [0, 1], [largeHeight.value, 0])
        : undefined,
  }));

  const largeContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: -progress.value * largeHeight.value }],
  }));

  return {
    rowStyle,
    shortTitleStyle,
    largeAreaStyle,
    largeContentStyle,
    // The block is re-measured while it is being clipped; keep its natural height
    onLargeHeightChange: (height: number) =>
      largeHeight.set((current) => Math.max(current, height)),
  };
};
