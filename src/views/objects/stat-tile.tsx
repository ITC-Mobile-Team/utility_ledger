import { ThemedText, ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

type StatTileProps = {
  title: string;
  value: string;
  highlighted?: boolean;
};

export function StatTile({ title, value, highlighted = false }: StatTileProps) {
  return (
    <ThemedView
      backgroundColor={highlighted ? 'greenSoft' : 'surface'}
      style={styles.tile}
    >
      <ThemedText color={highlighted ? 'greenInk' : 'muted'} font='caption'>
        {title}
      </ThemedText>
      <ThemedText color={highlighted ? 'greenInk' : 'ink'} font='heading'>
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
