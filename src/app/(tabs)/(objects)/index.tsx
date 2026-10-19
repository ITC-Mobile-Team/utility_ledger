import { ActionButton, ThemedText, ThemedView } from '@/components';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Index() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText>Objects screen</ThemedText>
      <ActionButton
        title='Превʼю'
        onPress={() => {
          router.push('/preview');
        }}
      />
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
});
