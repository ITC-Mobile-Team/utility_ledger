import { StyleSheet } from 'react-native';
import Animated, {
  type CSSTransitionProperties,
} from 'react-native-reanimated';
import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';

export const radioColorTransition: CSSTransitionProperties = {
  transitionProperty: ['backgroundColor', 'borderColor', 'borderWidth'],
  transitionDuration: 200,
  transitionTimingFunction: 'ease-out',
};

type RadioCircleStyle = {
  bg: AppColor;
  lineColor: AppColor;
  lineWidth: number;
};

const radioCircles: Record<'normal' | 'selected', RadioCircleStyle> = {
  normal: { bg: 'surface', lineColor: 'faint', lineWidth: 2 },
  selected: { bg: 'blueSoft', lineColor: 'blue', lineWidth: 7 },
};

// Кружечок вибору: тонка сіра рамка → товста синя.
// Reanimated CSS transitions плавно інтерполюють кольори й товщину рамки
export function RadioCircle({ isSelected }: { isSelected: boolean }) {
  const circle = isSelected ? radioCircles.selected : radioCircles.normal;
  const bg = useThemeColor(circle.bg);
  const border = useThemeColor(circle.lineColor);
  return (
    <Animated.View
      style={[
        styles.circle,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: circle.lineWidth,
        },
        radioColorTransition,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
