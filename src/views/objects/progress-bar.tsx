import { ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

export function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <ThemedView backgroundColor='track' style={styles.track}>
      <ThemedView
        backgroundColor='blue'
        style={[styles.fill, { width: `${clamped * 100}%` }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
