import { StyleSheet, View } from 'react-native';
import Animated, { CSSTransitionProperties } from 'react-native-reanimated';
import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { ThemedText } from './themed-text';

const colorTransition: CSSTransitionProperties = {
  transitionProperty: ['backgroundColor', 'borderColor', 'borderWidth'],
  transitionDuration: 200,
  transitionTimingFunction: 'ease-out',
};

type RadioCardState = 'normal' | 'selected';

type RadioCardColor = {
  bg: AppColor;
  borderColor: AppColor;
};

const radioCardStates: Record<RadioCardState, RadioCardColor> = {
  normal: { bg: 'surface', borderColor: 'line' },
  selected: { bg: 'blueSoft', borderColor: 'blue' },
};

type RadioCircle = {
  bg: AppColor;
  lineColor: AppColor;
  lineWidth: number;
};

const radioCircles: Record<RadioCardState, RadioCircle> = {
  normal: { bg: 'surface', lineColor: 'faint', lineWidth: 2 },
  selected: { bg: 'blueSoft', lineColor: 'blue', lineWidth: 7 },
};

type RadioCardProps = {
  title: string;
  subtitle: string;
  isSelected: boolean;
};

export function RadioCard({ title, subtitle, isSelected }: RadioCardProps) {
  const state = isSelected ? radioCardStates.selected : radioCardStates.normal;
  const circle = isSelected ? radioCircles.selected : radioCircles.normal;
  const cardBg = useThemeColor(state.bg);
  const cardBorder = useThemeColor(state.borderColor);
  const circleBg = useThemeColor(circle.bg);
  const circleBorder = useThemeColor(circle.lineColor);

  // Reanimated CSS transitions: при зміні isSelected кольори й товщина рамки
  // плавно інтерполюються до нових значень
  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cardBg, borderColor: cardBorder },
        colorTransition,
      ]}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: circleBg,
            borderColor: circleBorder,
            borderWidth: circle.lineWidth,
          },
          colorTransition,
        ]}
      />

      <View style={styles.textContainer}>
        <ThemedText color='ink' font='radioCardTitle'>
          {title}
        </ThemedText>
        <ThemedText color='muted' font='radioCardSubtitle'>
          {subtitle}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: 'continuous',
    gap: 12,
    alignItems: 'center',
  },
  textContainer: {
    gap: 2,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
