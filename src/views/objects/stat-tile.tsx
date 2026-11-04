import { ThemedText, ThemedView } from '@/components';
import { type AppColor } from '@/constants/colors';
import { StyleSheet } from 'react-native';

export type StatTileTone = 'default' | 'success' | 'error';

type StatTileProps = {
  title: string;
  value: string;
  tone?: StatTileTone;
};

const TONES: Record<
  StatTileTone,
  { bg: AppColor; title: AppColor; value: AppColor }
> = {
  default: { bg: 'surface', title: 'muted', value: 'ink' },
  success: { bg: 'greenSoft', title: 'greenInk', value: 'greenInk' },
  error: { bg: 'coralSoft', title: 'coralInk', value: 'coralInk' },
};

export function StatTile({ title, value, tone = 'default' }: StatTileProps) {
  const colors = TONES[tone];
  return (
    <ThemedView backgroundColor={colors.bg} style={styles.tile}>
      <ThemedText color={colors.title} font='caption'>
        {title}
      </ThemedText>
      <ThemedText color={colors.value} font='heading'>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
});
