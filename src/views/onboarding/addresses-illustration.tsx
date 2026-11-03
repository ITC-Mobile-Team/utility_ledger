import { HStack, IconView, ThemedText, VStack } from '@/components';
import { ObjectCard } from '@/views/object-card';
import { StyleSheet, View } from 'react-native';

export function AddressesIllustration() {
  return (
    <VStack spacing={12} style={styles.container}>
      <HStack align='center' spacing={12} style={styles.glassCard}>
        <IconView icon='house' iconSize={{ width: 18 }} size={{ width: 40 }} />
        <VStack spacing={2}>
          <ThemedText color='onPrimary' font='rowTitle'>
            вул. Шевченка, 8
          </ThemedText>
          <ThemedText color='onPrimary' font='label' style={styles.subtitle}>
            Будинок батьків
          </ThemedText>
        </VStack>
      </HStack>

      <View>
        <View style={styles.cardShadow}>
          <ObjectCard />
        </View>
        <View style={styles.addButton}>
          <IconView
            icon='plus'
            background='coral'
            iconSize={{ width: 22 }}
            size={{ width: 52 }}
          />
        </View>
      </View>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
  },
  glassCard: {
    padding: 14,
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    transform: [{ rotate: '3deg' }],
  },
  subtitle: {
    opacity: 0.8,
  },
  cardShadow: {
    borderRadius: 22,
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
  },
  addButton: {
    position: 'absolute',
    right: -14,
    bottom: -22,
    borderRadius: 26,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
  },
});
