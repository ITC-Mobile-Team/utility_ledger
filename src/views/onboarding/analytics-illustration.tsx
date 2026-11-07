import {
  AppImage,
  HStack,
  Spacer,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { chart } from '@/constants/colors';
import { StyleSheet, View } from 'react-native';

// Висоти стовпчиків витрат за 8 місяців, останній — поточний місяць
const bars = [70, 66, 56, 45, 41, 41, 42, 44];

export function AnalyticsIllustration() {
  return (
    <ThemedView backgroundColor='surface' style={styles.card}>
      <VStack spacing={14}>
        <HStack align='center'>
          <VStack spacing={2}>
            <ThemedText color='muted' font='radioCardSubtitle'>
              Витрати · 8 місяців
            </ThemedText>
            <ThemedText font='statValue'>12 803,00 ₴</ThemedText>
          </VStack>
          <Spacer />
          <View style={styles.trend}>
            <AppImage icon='arrowUpRight' role='inline' />
          </View>
        </HStack>

        <HStack align='bottom' spacing={7} style={styles.bars}>
          {bars.map((height, index) => (
            <ThemedView
              key={index}
              backgroundColor={
                index === bars.length - 1 ? 'greenBrand' : 'greenSoft2'
              }
              style={[styles.bar, { height }]}
            />
          ))}
        </HStack>

        <HStack spacing={3} style={styles.split}>
          <View
            style={[styles.electricity, { backgroundColor: chart.electricity }]}
          />
          <View style={[styles.water, { backgroundColor: chart.water }]} />
        </HStack>
      </VStack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    padding: 18,
    borderRadius: 24,
    borderCurve: 'continuous',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
  },
  trend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: chart.trend,
  },
  bars: {
    height: 70,
  },
  bar: {
    flex: 1,
    borderRadius: 5,
  },
  split: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  electricity: {
    flex: 191,
  },
  water: {
    flex: 70,
  },
});
