import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { typography } from '@/constants/typography';
import { useRef, useState } from 'react';

type ThemedTextinputProps = TextInputProps & {
  title: string;
};

// У цифрових клавіатур iOS немає Enter: з returnKeyType RN додає над ними
// панель з кнопкою «Done», тож для них returnKeyType не передаємо
const numericKeyboards = new Set<TextInputProps['keyboardType']>([
  'number-pad',
  'decimal-pad',
  'numeric',
  'phone-pad',
  'ascii-capable-number-pad',
]);

export function ThemedTextInput({
  title,
  onFocus,
  onBlur,
  keyboardType,
  returnKeyType = 'done',
  ...rest
}: ThemedTextinputProps) {
  const isNumeric = numericKeyboards.has(keyboardType);
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setFocus] = useState(false);
  const borderColor = useThemeColor('blue');
  const textColor = useThemeColor('ink');
  return (
    // Тап по будь-якій частині поля (заголовок, відступи) ставить фокус в інпут
    <Pressable onPress={() => inputRef.current?.focus()} accessible={false}>
      <ThemedView
        backgroundColor='surface'
        style={[
          styles.container,
          { borderColor: isFocused ? borderColor : 'transparent' },
        ]}
      >
        <ThemedText color='muted' font='label'>
          {title}
        </ThemedText>
        <TextInput
          ref={inputRef}
          {...rest}
          keyboardType={keyboardType}
          returnKeyType={isNumeric ? undefined : returnKeyType}
          style={[{ color: textColor }, typography.textInput, styles.input]}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
        />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10, // разом з бордером — висота поля 63pt як у дизайні
    paddingHorizontal: 16,
    gap: 3,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  input: {
    padding: 0, // прибирає дефолтні відступи Android
    includeFontPadding: false, // Android: прибирає зайвий простір над/під текстом
    textAlignVertical: 'center',
  },
});
