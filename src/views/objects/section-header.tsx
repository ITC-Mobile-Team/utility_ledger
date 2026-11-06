import { HStack, ThemedText } from '@/components';
import { StyleSheet } from 'react-native';

type SectionHeaderProps = {
  title: string;
  trailing?: string;
  // overline — дрібний підпис великими літерами над карткою-групою
  variant?: 'section' | 'overline';
};

export function SectionHeader({
  title,
  trailing,
  variant = 'section',
}: SectionHeaderProps) {
  if (variant === 'overline') {
    return (
      <ThemedText
        color='muted'
        font='overline'
        accessibilityRole='header'
        style={styles.overline}
      >
        {title.toLocaleUpperCase('uk')}
      </ThemedText>
    );
  }
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
  overline: {
    paddingLeft: 4,
  },
});
