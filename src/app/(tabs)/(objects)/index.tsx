import { ActionButton, NavigationView, ThemedView, VStack } from '@/components';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Index() {
  return (
    <NavigationView contentInsets={{ top: 16, horizontal: 16, bottom: 16 }}>
      <VStack spacing={20}>
        <ActionButton
          title='Превʼю'
          onPress={() => {
            router.push('/preview');
          }}
        />

        <ThemedView backgroundColor='ink' style={styles.rectangle} />
        <ThemedView backgroundColor='muted' style={styles.rectangle} />
        <ThemedView backgroundColor='coral' style={styles.rectangle} />
        <ThemedView backgroundColor='coral' style={styles.rectangle} />
        <ThemedView backgroundColor='coral' style={styles.rectangle} />
        <ThemedView backgroundColor='coral' style={styles.rectangle} />
      </VStack>
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  rectangle: {
    width: '100%',
    height: 100,
  },
});
