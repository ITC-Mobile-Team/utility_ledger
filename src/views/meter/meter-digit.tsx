import { ThemedText, ThemedView } from '@/components';
import { StyleSheet, type TextInputProps } from 'react-native';

type MeterDigitType = 'integer' | 'fraction';

type MeterDigitProps = TextInputProps & {
  digit: string;
  type: MeterDigitType;
};

export function MeterDigit({ digit, type }: MeterDigitProps) {
  return (
    <ThemedView
      backgroundColor={type === 'integer' ? 'meterDigit' : 'coral'}
      style={[!digit && styles.empty, styles.cell]}
    >
      <ThemedText color='onPrimary' font='meterDigit'>
        {digit}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 36,
    height: 52,
    padding: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  empty: {
    opacity: 0.35,
  },
});
