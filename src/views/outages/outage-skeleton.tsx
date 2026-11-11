import {
  HStack,
  SkeletonBone as Bone,
  ThemedText,
  ThemedView,
  useSkeletonShine,
  VStack,
} from '@/components';
import { StyleSheet } from 'react-native';

type OutageSkeletonProps = {
  // Без постачальника — перше завантаження даних акаунта
  providerName?: string;
};

// Заглушка на час першого завантаження графіка: повторює форму картки
// статусу, смуги доби й списку вимкнень; блоками пробігає відблиск (1,3 с)
export function OutageSkeleton({ providerName }: OutageSkeletonProps) {
  const progress = useSkeletonShine();

  return (
    <VStack
      spacing={14}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={
        providerName ? 'Завантажуємо графік' : 'Завантажуємо дані'
      }
      testID='outages.skeleton'
    >
      <VStack spacing={14}>
        <ThemedView backgroundColor='surface' style={styles.card}>
          <HStack align='center' spacing={14}>
            <Bone progress={progress} style={styles.circle} />
            <VStack spacing={8} style={styles.flex}>
              <Bone progress={progress} style={{ height: 20, width: '60%' }} />
              <Bone progress={progress} style={{ height: 14, width: '85%' }} />
            </VStack>
          </HStack>
        </ThemedView>

        <ThemedView backgroundColor='surface' style={styles.timeline}>
          <HStack style={styles.between}>
            <Bone progress={progress} style={{ height: 16, width: 90 }} />
            <Bone progress={progress} style={{ height: 14, width: 120 }} />
          </HStack>
          <Bone progress={progress} style={styles.bar} />
          <HStack style={styles.between}>
            {[0, 1, 2, 3, 4].map((tick) => (
              <Bone
                key={tick}
                progress={progress}
                style={{ height: 10, width: 18 }}
              />
            ))}
          </HStack>
        </ThemedView>

        <Bone progress={progress} style={styles.sectionTitle} />
        <ThemedView backgroundColor='surface' style={styles.list}>
          {[0, 1, 2].map((row) => (
            <VStack key={row}>
              {row > 0 && (
                <ThemedView backgroundColor='line' style={styles.divider} />
              )}
              <HStack align='center' spacing={12} style={styles.row}>
                <Bone progress={progress} style={styles.dot} />
                <VStack spacing={6} style={styles.flex}>
                  <Bone
                    progress={progress}
                    style={{ height: 16, width: '55%' }}
                  />
                  <Bone
                    progress={progress}
                    style={{ height: 12, width: '40%' }}
                  />
                </VStack>
                <Bone progress={progress} style={{ height: 14, width: 70 }} />
              </HStack>
            </VStack>
          ))}
        </ThemedView>
      </VStack>
      <ThemedText font='footnote' color='muted' align='center'>
        {providerName
          ? `Завантажуємо графік ${providerName}…`
          : 'Завантажуємо дані…'}
      </ThemedText>
    </VStack>
  );
}

const styles = StyleSheet.create({
  // У дизайні margin: 4px 0 -4px 4px — ближче до списку під ним
  sectionTitle: {
    height: 12,
    width: 90,
    marginTop: 4,
    marginBottom: -4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  flex: {
    flex: 1,
  },
  timeline: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
  },
  between: {
    justifyContent: 'space-between',
  },
  bar: {
    height: 30,
    borderRadius: 8,
    marginTop: 8,
  },
  list: {
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
