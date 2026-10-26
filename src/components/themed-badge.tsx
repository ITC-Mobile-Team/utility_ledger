import { typography } from '@/constants/typography';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { AppColor } from '@/constants/colors';
import { StyleSheet } from 'react-native';

type BadgeType = 'red' | 'green' | 'blue';

type BadgeColor = {
  text: AppColor;
  bg: AppColor;
};

const badgeColors: Record<BadgeType, BadgeColor> = {
  red: { text: 'coralInk', bg: 'coralSoft' },
  green: { text: 'greenInk', bg: 'greenSoft' },
  blue: { text: 'blueInk', bg: 'blueSoft' },
};

type ThemedBadgeProps = {
  text: string;
  type: BadgeType;
};

export function ThemedBadge({ text, type }: ThemedBadgeProps) {
  const badgeColor = badgeColors[type];
  return (
    <ThemedView backgroundColor={badgeColor.bg} style={[styles.container]}>
      <ThemedText
        color={badgeColor.text}
        style={[typography.overline, styles.text]}
      >
        {text}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  text: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
