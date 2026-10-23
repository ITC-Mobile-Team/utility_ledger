import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { typography } from '@/constants/typography';
import { useState } from 'react';

type ThemedTextinputProps = TextInputProps & {
  title: string;
};

export function ThemedTextInput({
  title,
  onFocus,
  onBlur,
  ...rest
}: ThemedTextinputProps) {
  const [isFocused, setFocus] = useState(false);
  const borderColor = useThemeColor('blue');
  const textColor = useThemeColor('ink');
  return (
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
        style={[{ color: textColor }, typography.textInput]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 2,
    borderRadius: 16,
    borderWidth: 1,
  },
});
