import { HStack, IconView, ThemedText, VStack } from '@/components';
import { ObjectCard } from '@/views/object-card';
import {
  getCurrentMonth,
  type LedgerObject,
  type LedgerService,
} from '@/services/ledger';
import { StyleSheet, View } from 'react-native';

const demoObject: LedgerObject = {
  id: 'demo',
  name: 'Квартира',
  city: { name: 'Полтава', region: 'Полтавська обл.' },
  street: 'Соборності',
  house: '24',
  apartment: '12',
  createdAt: 0,
};

const demoService = (id: string, icon: string): LedgerService => ({
  id,
  objectId: demoObject.id,
  icon,
  name: id,
  kind: id,
  mode: 'fixed',
  unit: '',
  tariff: 0,
  zones: 'single',
  createdAt: 0,
});

const demoServices = [
  demoService('electricity', '⚡'),
  demoService('water', '💧'),
  demoService('internet', '🌐'),
];

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
          <ObjectCard
            object={demoObject}
            services={demoServices}
            month={getCurrentMonth()}
            status='filled'
          />
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
