import {
  ActionButton,
  NavigationBarButtonItem,
  NavigationView,
  ThemedView,
  VStack,
} from '@/components';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

const objectsNavigationButtons: NavigationBarButtonItem[] = [
  {
    id: 'add',
    title: 'Додати адресу',
    icon: 'plus',
    iconBackground: 'coral',
  },
];

export default function Index() {
  const [navigationButtons, setNavigationButtons] = useState<
    NavigationBarButtonItem[]
  >(objectsNavigationButtons);
  return (
    <NavigationView
      title='Обʼєкти'
      type='blue'
      contentInsets={{ top: 16, horizontal: 16, bottom: 16 }}
      navigationBarButtons={navigationButtons}
      onNavigationButtonPress={(id) => {
        console.log('tap on button with id: ', id);
      }}
    >
      <VStack spacing={20}>
        <ActionButton
          title='Превʼю'
          onPress={() => {
            router.push('/preview');
          }}
        />

        <ActionButton
          title='Add new navigation button'
          onPress={() => {
            const newButton: NavigationBarButtonItem = {
              id: `button-${Date.now()}`,
              title: `Button ${navigationButtons.length + 1}`,
              icon: 'plus',
              iconBackground: 'amber',
            };
            setNavigationButtons((prev) => [...prev, newButton]);
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
