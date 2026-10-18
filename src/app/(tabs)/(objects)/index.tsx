import { ThemedText, ThemedView } from '@/components';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Index() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>Objects screen</ThemedText>
      <Link href='/preview' style={styles.preview}>
        Open preview
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  preview: {
    padding: 16,
    backgroundColor: 'red',
    borderRadius: 30,
  },
});
