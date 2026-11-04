import { HStack } from '@/components';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputInstance,
} from 'react-native';
import { MeterDigit, type MeterDigitState } from './meter-digit';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useRef, useState } from 'react';

type MeterReadingInputProps = {
  value: string;
  onChangeValue: (value: string) => void;
  length: number;
  // Статичний барабан без введення (ілюстрації)
  readOnly?: boolean;
  // Усі цифри введено, але значення некоректне — підсвічуємо заповнені клітинки
  isError?: boolean;
  accessibilityLabel?: string;
};

// Барабан лічильника: цифри вводяться по одній зліва направо,
// активна клітинка з курсором — наступна для введення
export function MeterReadingInput({
  value,
  onChangeValue,
  length,
  readOnly = false,
  isError = false,
  accessibilityLabel,
}: MeterReadingInputProps) {
  const bg = useThemeColor('meterBg');
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);

  const stateAt = (index: number): MeterDigitState => {
    if (readOnly) return 'display';
    if (index < value.length) return 'filled';
    if (index === value.length && isFocused) return 'active';
    return 'blank';
  };

  return (
    <Pressable
      disabled={readOnly}
      onPress={() => inputRef.current?.focus()}
      accessible={false}
    >
      <HStack
        spacing={readOnly ? 4 : 8}
        style={[
          { backgroundColor: bg },
          styles.container,
          !readOnly && styles.entry,
        ]}
      >
        {Array.from({ length }, (_, index) => (
          <MeterDigit
            key={index}
            digit={value[index] ?? ''}
            state={stateAt(index)}
            isLast={index === length - 1}
            isError={isError}
          />
        ))}
      </HStack>

      {!readOnly && (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) =>
            onChangeValue(text.replace(/\D/g, '').slice(0, length))
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType='number-pad'
          maxLength={length}
          caretHidden
          contextMenuHidden
          autoComplete='off'
          accessibilityLabel={accessibilityLabel}
          style={styles.input}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  entry: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  input: {
    padding: 0, // прибирає дефолтні відступи Android
    includeFontPadding: false, // Android: прибирає зайвий простір над/під текстом
    textAlignVertical: 'center',
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
