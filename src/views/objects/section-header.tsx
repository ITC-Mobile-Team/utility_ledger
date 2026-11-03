import { HStack, ThemedText } from '@/components';
import { StyleSheet } from 'react-native';

type SectionHeaderProps = {
  title: string;
  trailing?: string;
};

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <HStack align='bottom' style={styles.container}>
      <ThemedText font='section' style={styles.title}>
        {title}
      </ThemedText>
      {trailing && (
        <ThemedText color='muted' font='caption'>
          {trailing}
        </ThemedText>
      )}
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flexShrink: 1,
  },
});
