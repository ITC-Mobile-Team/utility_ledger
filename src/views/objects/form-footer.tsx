import { ThemedText, ThemedView } from '@/components';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormFooterProps = PropsWithChildren<{ hint?: string }>;

// Закріплена знизу панель з основною кнопкою форми
export function FormFooter({ hint, children }: FormFooterProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <ThemedView
      backgroundColor='bg'
      borderColor='line'
      style={[styles.container, { paddingBottom: bottom + 12 }]}
    >
      {children}
      {hint && (
        <ThemedText color='muted' font='caption' align='center'>
          {hint}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
