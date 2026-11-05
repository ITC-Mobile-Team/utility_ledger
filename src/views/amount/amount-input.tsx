import { HStack, ThemedText, Pressable } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputInstance } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Максимум цифр у гривнях (до 999 999 ₴) і в копійках
const MAX_INTEGER_DIGITS = 6;
const MAX_FRACTION_DIGITS = 2;

type AmountInputProps = {
  // Сума у вигляді поля вводу: «125,70», «125,», «» — без пробілів
  value: string;
  onChangeValue: (value: string) => void;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  // testID видимого блоку суми: прихований інпут (opacity 0) iOS не показує
  // в дереві доступності. UI-перевірка: `tap id=…`, потім `keys 125.70`
  testID?: string;
  // Вміст під сумою (підказка). Тап по ньому теж відкриває клавіатуру
  children?: ReactNode;
};

// Велика сума з курсором і «₴» по центру екрана. Цифри набираються з
// системної цифрової клавіатури через прихований інпут
export function AmountInput({
  value,
  onChangeValue,
  autoFocus = false,
  accessibilityLabel,
  testID,
  children,
}: AmountInputProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const isEmpty = value === '';

  return (
    <Pressable
      guarded={false}
      onPress={() => inputRef.current?.focus()}
      accessible={false}
      testID={testID}
      style={styles.container}
    >
      <HStack spacing={6} align='center'>
        <ThemedText
          font='amountInput'
          color={isEmpty ? 'faint' : 'ink'}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isEmpty ? '0' : formatAmountDisplay(value)}
        </ThemedText>
        <Caret visible={isFocused} />
        <ThemedText font='amountInput' color={isEmpty ? 'faint' : 'ink'}>
          ₴
        </ThemedText>
      </HStack>
      {children}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeValue(sanitizeAmount(text))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        keyboardType='decimal-pad'
        caretHidden
        contextMenuHidden
        autoComplete='off'
        accessibilityLabel={accessibilityLabel}
        style={styles.input}
      />
    </Pressable>
  );
}

// Миготливий курсор між сумою і «₴»; без фокусу місце лишається, щоб сума не стрибала
function Caret({ visible }: { visible: boolean }) {
  const coral = useThemeColor('coral');
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(opacity);
      opacity.set(0);
      return;
    }
    opacity.set(1);
    opacity.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: 500 }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, visible]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={[styles.caret, { backgroundColor: coral }, style]}
      aria-hidden
    />
  );
}

// «1234,5» → «1 234,5»
export const formatAmountDisplay = (value: string) => {
  const [integer = '', fraction] = value.split(',');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fraction === undefined ? grouped : `${grouped},${fraction}`;
};

// Лишає лише цифри й одну кому (крапка теж стає комою), до 6 цифр гривень
// і 2 копійок; «007» → «7», «,5» → «0,5»
export const sanitizeAmount = (text: string) => {
  const [integerRaw = '', ...rest] = text
    .replace(/\./g, ',')
    .replace(/[^\d,]/g, '')
    .split(',');
  const hasComma = rest.length > 0;
  let integer = integerRaw
    .replace(/^0+(?=\d)/, '')
    .slice(0, MAX_INTEGER_DIGITS);
  if (hasComma && integer === '') integer = '0';
  const fraction = rest.join('').slice(0, MAX_FRACTION_DIGITS);
  return hasComma ? `${integer},${fraction}` : integer;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  caret: {
    width: 3,
    height: 50,
    borderRadius: 2,
  },
  input: {
    padding: 0, // прибирає дефолтні відступи Android
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none', // тапи ловить Pressable, інпут лише тримає фокус
  },
});
