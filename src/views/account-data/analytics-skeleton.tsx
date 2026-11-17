import {
  HStack,
  SkeletonBone as Bone,
  ThemedView,
  useSkeletonShine,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { StyleSheet } from 'react-native';

// Перше завантаження даних акаунта на вкладці «Аналітика» (артборд 14s):
// рядок адреси, картка «Витрати», перемикач і три рядки списку
export function AnalyticsSkeleton() {
  const progress = useSkeletonShine();
  return (
    <VStack
      spacing={14}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Завантажуємо витрати'
      testID='analytics.skeleton'
    >
      <ThemedView backgroundColor='surface' style={styles.row}>
        <HStack spacing={12} align='center'>
          <Bone progress={progress} style={styles.icon} />
          <VStack spacing={8} style={styles.flex}>
            <Bone progress={progress} style={{ height: 16, width: '70%' }} />
            <Bone progress={progress} style={{ height: 13, width: '45%' }} />
          </VStack>
        </HStack>
      </ThemedView>
      <ThemedView backgroundColor='surface' style={styles.card}>
        <Bone progress={progress} style={styles.icon} />
        <Bone progress={progress} style={{ height: 16, width: 80 }} />
        <Bone progress={progress} style={{ height: 38, width: '65%' }} />
        <Bone progress={progress} style={{ height: 64 }} />
        <HStack spacing={10}>
          <Bone progress={progress} style={styles.stat} />
          <Bone progress={progress} style={styles.stat} />
        </HStack>
      </ThemedView>
      <Bone progress={progress} style={styles.segment} />
      <ThemedView backgroundColor='surface' style={styles.row}>
        <VStack spacing={18}>
          {[0, 1, 2].map((row) => (
            <HStack key={row} spacing={12} align='center'>
              <Bone progress={progress} style={styles.icon} />
              <VStack spacing={8} style={styles.flex}>
                <Bone
                  progress={progress}
                  style={{ height: 16, width: '55%' }}
                />
                <Bone
                  progress={progress}
                  style={{ height: 13, width: '35%' }}
                />
              </VStack>
            </HStack>
          ))}
        </VStack>
      </ThemedView>
    </VStack>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: 20,
    gap: 16,
  },
  icon: {
    width: iconTiles.menu,
    height: iconTiles.menu,
    borderRadius: iconTiles.menu / 2,
  },
  flex: {
    flex: 1,
  },
  stat: {
    flex: 1,
    height: 72,
    borderRadius: 16,
  },
  segment: {
    height: 44,
    borderRadius: 12,
  },
});
