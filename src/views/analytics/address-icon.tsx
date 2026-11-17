import { AppImage, ThemedView } from '@/components';
import type { AnalyticsSelection } from '@/services/analytics';
import { StyleSheet } from 'react-native';

type AddressIconProps = {
  selection: AnalyticsSelection;
  size: number;
};

// 🏢 — одна адреса, 🏠 на зеленому — «Усі адреси»
export function AddressIcon({ selection, size }: AddressIconProps) {
  const isAll = selection.kind === 'all';
  return (
    <ThemedView
      backgroundColor={isAll ? 'greenSoft' : 'blueSoft'}
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <AppImage icon={isAll ? 'house' : 'apartment'} container={size} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
