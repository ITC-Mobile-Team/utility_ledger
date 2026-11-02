import { HStack, VStack } from '@/components';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  type ViewProps,
} from 'react-native';
import { MeterDigit } from './meter-digit';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useRef, useState } from 'react';

type MeterReadingInputProps = ViewProps & {
  value: string;
  onChangeValue: (value: string) => void;
  integerDigits: number;
  fractionDigits: number;
  readOnly?: boolean;
};

export function MeterReadingInput({
  value,
  onChangeValue,
  integerDigits,
  fractionDigits,
  readOnly = false,
}: MeterReadingInputProps) {
  const bg = useThemeColor('meterBg');

  const length = integerDigits + fractionDigits;
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <HStack spacing={4} style={[{ backgroundColor: bg }, styles.container]}>
        {Array.from({ length }, (_, index) => {
          const digit = value[index] ?? '';
          const isFraction = index >= length - fractionDigits;
          const isActive = isFocused && index === value.length;
          return (
            <MeterDigit
              key={index}
              digit={digit}
              type={isFraction ? 'fraction' : 'integer'}
            />
          );
        })}
      </HStack>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeValue(text)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType='number-pad'
        maxLength={length}
        caretHidden
        autoComplete='off'
        readOnly={readOnly}
        style={styles.input}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    justifyContent: 'center',
    borderRadius: 16,
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
