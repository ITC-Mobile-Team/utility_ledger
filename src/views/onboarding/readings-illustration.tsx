import { AppImage, HStack, ThemedText, ThemedView, VStack } from '@/components';
import { MeterReadingInput } from '@/views/meter/meter-reading-input';
import { StyleSheet, View } from 'react-native';

export function ReadingsIllustration() {
  return (
    <VStack align='center' spacing={14} style={styles.container}>
      <View style={styles.meter}>
        <MeterReadingInput
          value='12660'
          onChangeValue={() => {}}
          length={5}
          readOnly
        />
      </View>

      <HStack spacing={10} style={styles.stats}>
        <VStack spacing={2} style={[styles.stat, styles.glassStat]}>
          <ThemedText color='onPrimary' font='label' style={styles.muted}>
            Спожито
          </ThemedText>
          <ThemedText color='onPrimary' font='section' style={styles.bold}>
            +125 кВт·год
          </ThemedText>
        </VStack>

        <ThemedView
          backgroundColor='surface'
          style={[styles.stat, styles.surfaceStat]}
        >
          <VStack spacing={2}>
            <ThemedText color='muted' font='label'>
              До сплати
            </ThemedText>
            <ThemedText font='section' style={styles.bold}>
              540,00 ₴
            </ThemedText>
          </VStack>
        </ThemedView>
      </HStack>

      <HStack align='center' spacing={8} style={styles.tariff}>
        <AppImage icon='document' role='inline' />
        <ThemedText color='onPrimary' font='chipLabel'>
          125 × 4,32 ₴ за тарифом
        </ThemedText>
      </HStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
  },
  meter: {
    alignSelf: 'stretch',
    borderRadius: 16,
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.30)',
  },
  stats: {
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  glassStat: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  surfaceStat: {
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.20)',
  },
  muted: {
    opacity: 0.8,
  },
  bold: {
    fontWeight: '700',
  },
  tariff: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
