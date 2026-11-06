import { HStack, ThemedText, ThemedView, VStack } from '@/components';
import { StyleSheet } from 'react-native';
import { Avatar } from './avatar';

type ProfileCardProps = {
  name: string;
  email: string;
  initial: string;
};

// Картка зі сторінки профілю лише інформує: імʼя змінюється рядком «Імʼя» в
// розділі «Акаунт», тож дотику й стрілки тут немає
export function ProfileCard({ name, email, initial }: ProfileCardProps) {
  return (
    <ThemedView
      backgroundColor='surface'
      style={styles.card}
      testID='profile.card'
      accessible
      accessibilityLabel={`${name}, ${email}`}
    >
      <HStack align='center' spacing={14}>
        <Avatar initial={initial} size={56} />
        <VStack spacing={2} style={styles.copy}>
          <ThemedText font='rowTitle' numberOfLines={1} style={styles.name}>
            {name}
          </ThemedText>
          <ThemedText font='caption' color='muted' numberOfLines={1}>
            {email}
          </ThemedText>
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
  copy: {
    flex: 1,
  },
  // `row-title` 18 на артборді 16
  name: {
    fontSize: 18,
    lineHeight: 24,
  },
});
