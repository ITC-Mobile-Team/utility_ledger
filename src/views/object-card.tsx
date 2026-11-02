import {
  HStack,
  IconView,
  Spacer,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

type ObjectCardProps = PressableProps & {};

export function ObjectCard({}: ObjectCardProps) {
  return (
    <Pressable>
      <ThemedView backgroundColor='surface' style={styles.container}>
        <VStack spacing={12} style={styles.content}>
          <HStack align='center' spacing={12}>
            <IconView
              icon='apartment'
              background='blue'
              iconSize={{ width: 18 }}
              size={{ width: 42 }}
            />

            <VStack spacing={2}>
              <ThemedText font='rowTitle'>
                вул. Соборності, 24, кв. 12
              </ThemedText>
              <ThemedText>м. Полтава · Квартира</ThemedText>
            </VStack>
          </HStack>

          <ThemedView backgroundColor='line' style={{ height: 1 }}></ThemedView>

          <HStack spacing={6}>
            <IconView
              icon={'electricity'}
              background='amberSoft'
              iconColor='amber'
              iconSize={{ width: 15 }}
              size={{ width: 28 }}
            />

            <IconView
              icon={'water'}
              background='waterSoft'
              iconColor='water'
              iconSize={{ width: 15 }}
              size={{ width: 28 }}
            />

            <IconView
              icon={'network'}
              background='blueSoft'
              iconColor='blue'
              iconSize={{ width: 15 }}
              size={{ width: 28 }}
            />

            <Spacer />

            <ThemedBadge text='4 послуги' type='green' />
          </HStack>
        </VStack>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
  },
  content: {
    padding: 16,
  },
});
