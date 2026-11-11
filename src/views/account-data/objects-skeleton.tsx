import {
  HStack,
  SkeletonBone as Bone,
  ThemedView,
  useSkeletonShine,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { StyleSheet } from 'react-native';

// Перше завантаження даних акаунта на вкладці «Обʼєкти» (артборд 05s):
// заголовок секції й три картки у формі ObjectCard
export function ObjectsSkeleton() {
  const progress = useSkeletonShine();
  return (
    <VStack
      spacing={12}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Завантажуємо ваші адреси'
      testID='objects.skeleton'
    >
      <Bone progress={progress} style={styles.sectionTitle} />
      {[0, 1, 2].map((card) => (
        <ThemedView key={card} backgroundColor='surface' style={styles.card}>
          <HStack spacing={14} align='center'>
            <Bone progress={progress} style={styles.icon} />
            <VStack spacing={8} style={styles.flex}>
              <Bone progress={progress} style={{ height: 18, width: '80%' }} />
              <Bone progress={progress} style={{ height: 14, width: '50%' }} />
              <Bone progress={progress} style={{ height: 14, width: '65%' }} />
            </VStack>
          </HStack>
          <ThemedView backgroundColor='line' style={styles.divider} />
          <HStack spacing={6}>
            <Bone progress={progress} style={styles.chip} />
            <Bone progress={progress} style={styles.chip} />
          </HStack>
        </ThemedView>
      ))}
    </VStack>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    height: 14,
    width: 110,
    marginTop: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
    gap: 14,
  },
  icon: {
    width: iconTiles.menu,
    height: iconTiles.menu,
    borderRadius: iconTiles.menu / 2,
  },
  flex: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  chip: {
    width: iconTiles.compact,
    height: iconTiles.compact,
    borderRadius: iconTiles.compact / 2,
  },
});
