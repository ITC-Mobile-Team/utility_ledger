import {
  HStack,
  SkeletonBone as Bone,
  ThemedView,
  useSkeletonShine,
  VStack,
} from '@/components';
import { StyleSheet } from 'react-native';

// Перше завантаження даних акаунта у «Профілі» (артборд 16s): картка
// з аватаром, імʼям і email у формі ProfileCard; решта рядків звичайні
export function ProfileHeaderSkeleton() {
  const progress = useSkeletonShine();
  return (
    <ThemedView
      backgroundColor='surface'
      style={styles.card}
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Завантажуємо профіль'
      testID='profile.skeleton'
    >
      <HStack spacing={14} align='center'>
        <Bone progress={progress} style={styles.avatar} />
        <VStack spacing={8} style={styles.flex}>
          <Bone progress={progress} style={{ height: 20, width: '45%' }} />
          <Bone progress={progress} style={{ height: 14, width: '70%' }} />
        </VStack>
      </HStack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  flex: {
    flex: 1,
  },
});
