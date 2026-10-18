import { StyleSheet } from 'react-native';
import { ThemedView, ThemedText } from '@/components';

export default function More() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>More screen</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
