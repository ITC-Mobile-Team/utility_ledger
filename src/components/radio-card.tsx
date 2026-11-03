import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { ThemedText } from './themed-text';
import { VStack } from './stack';
import { RadioCircle, radioColorTransition } from './radio-circle';

type RadioCardState = 'normal' | 'selected';

type RadioCardColor = {
  bg: AppColor;
  borderColor: AppColor;
};

const radioCardStates: Record<RadioCardState, RadioCardColor> = {
  normal: { bg: 'surface', borderColor: 'line' },
  selected: { bg: 'blueSoft', borderColor: 'blue' },
};

type RadioCardProps = {
  title: string;
  subtitle: string;
  isSelected: boolean;
};

export function RadioCard({ title, subtitle, isSelected }: RadioCardProps) {
  const state = isSelected ? radioCardStates.selected : radioCardStates.normal;
  const cardBg = useThemeColor(state.bg);
  const cardBorder = useThemeColor(state.borderColor);

  // Reanimated CSS transitions: при зміні isSelected кольори й товщина рамки
  // плавно інтерполюються до нових значень
  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cardBg, borderColor: cardBorder },
        radioColorTransition,
      ]}
    >
      <RadioCircle isSelected={isSelected} />

      <VStack spacing={2}>
        <ThemedText font='radioCardTitle'>{title}</ThemedText>
        <ThemedText color='muted' font='radioCardSubtitle'>
          {subtitle}
        </ThemedText>
      </VStack>
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
});
