import { ActionButton, ThemedNavigationBar, VStack } from '@/components';
import { router } from 'expo-router';

export default function Index() {
  return (
    <VStack spacing={8}>
      <ThemedNavigationBar
        type='blue'
        title='Обʼєкти'
        subtitle='2 адреси · жовтень 2026'
      />
      <ActionButton
        title='Превʼю'
        onPress={() => {
          router.push('/preview');
        }}
      />
    </VStack>
  );
}
