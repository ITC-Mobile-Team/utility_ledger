import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '@/components';

export default function Analytics() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>Analytics screen</ThemedText>
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
