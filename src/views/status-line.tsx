import { HStack, ThemedText, ThemedView } from '@/components';
import { StyleSheet } from 'react-native';

type StatusLineProps = {
  // attention — ще треба щось внести, done — усе заповнено
  tone: 'attention' | 'done';
  text: string;
};

// Кольорова крапка з текстом статусу під заголовком картки
export function StatusLine({ tone, text }: StatusLineProps) {
  const isAttention = tone === 'attention';
  return (
    <HStack spacing={6} align='center'>
      <ThemedView
        backgroundColor={isAttention ? 'coral' : 'green'}
        style={styles.dot}
      />
      <ThemedText
        color={isAttention ? 'coralInk' : 'greenInk'}
        font='status'
        style={styles.text}
      >
        {text}
      </ThemedText>
    </HStack>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    flexShrink: 1,
  },
});
