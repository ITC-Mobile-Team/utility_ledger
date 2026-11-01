import { NavigationView, ThemedText, ThemedView, VStack } from '@/components';

export default function SignIn() {
  return (
    <NavigationView
      type='short'
      title='Вхід і реєстрація'
      barType='blue'
      contentInsets={{ horizontal: 20 }}
      cornerRadius={28}
    >
      <VStack>
        <ThemedText>Test</ThemedText>

        <ThemedView backgroundColor='blue' size={{ width: 1000 }} />
      </VStack>
    </NavigationView>
  );
}
