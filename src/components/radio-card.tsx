import { StyleSheet, View } from 'react-native';
import { ThemedView } from './themed-view';
import { AppColor } from '@/constants/colors';
import { ThemedText } from './themed-text';

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
  return (
    <ThemedView
      backgroundColor={state.bg}
      borderColor={state.borderColor}
      style={styles.container}
    >
      <ThemedView
        backgroundColor={circle.bg}
        borderColor={circle.lineColor}
        style={[styles.circle, { borderWidth: circle.lineWidth }]}
      />

      <View style={styles.textContainer}>
        <ThemedText color='ink' font='radioCardTitle'>
          {title}
        </ThemedText>
        <ThemedText color='muted' font='radioCardSubtitle'>
          {subtitle}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
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
