import { HStack, ThemedText, ThemedView, VStack } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import type { AnalyticsServiceTotal } from '@/services/analytics';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type ServiceShareBarProps = {
  services: readonly AnalyticsServiceTotal[];
};

// Смуга розподілу витрат між послугами з легендою (артборд 15)
export function ServiceShareBar({ services }: ServiceShareBarProps) {
  const label = services
    .map(
      (s, i) =>
        `${i === 0 ? s.name : s.name.toLocaleLowerCase('uk')} ${s.percent}%`,
    )
    .join(', ');
  return (
    <ThemedView backgroundColor='surface' style={styles.card}>
      <HStack
        spacing={3}
        style={styles.bar}
        accessible
        accessibilityRole='image'
        accessibilityLabel={label}
      >
        {services.map((service) => (
          <Segment key={service.key} service={service} />
        ))}
      </HStack>
      <HStack spacing={16} style={styles.legend}>
        {services.map((service) => (
          <LegendItem key={service.key} service={service}>
            {service.name}
          </LegendItem>
        ))}
      </HStack>
    </ThemedView>
  );
}

function Segment({ service }: { service: AnalyticsServiceTotal }) {
  const color = useThemeColor(service.accent);
  return (
    <View
      style={{
        flex: Math.max(service.percent, 1),
        backgroundColor: color,
      }}
    />
  );
}

function LegendItem({
  service,
  children,
}: {
  service: AnalyticsServiceTotal;
  children: ReactNode;
}) {
  const color = useThemeColor(service.accent);
  return (
    <HStack spacing={6} align='center'>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <VStack>
        <ThemedText color='muted' font='caption'>
          {children}
        </ThemedText>
      </VStack>
    </HStack>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 18,
    gap: 14,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  legend: {
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
