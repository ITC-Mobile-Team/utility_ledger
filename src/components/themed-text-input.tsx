import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { typography } from '@/constants/typography';
import { type ComponentRef, useRef, useState } from 'react';

type ThemedTextinputProps = TextInputProps & {
  title: string;
};

export function ThemedTextInput({
  title,
  onFocus,
  onBlur,
  returnKeyType = 'done',
  ...rest
}: ThemedTextinputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
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
          returnKeyType={returnKeyType}
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
