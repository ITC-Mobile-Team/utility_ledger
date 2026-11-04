import type { PropsWithChildren } from 'react';
import { Keyboard, StyleSheet, type ViewStyle } from 'react-native';
import { Pressable } from './pressable';

type KeyboardDismissViewProps = PropsWithChildren<{ style?: ViewStyle }>;

// Корінь екрана з полями: тап поза полями й кнопками закриває клавіатуру.
// Тапи по інпутах і кнопках обробляють вони самі, тому сюди не доходять
export function KeyboardDismissView({
  style,
  children,
}: KeyboardDismissViewProps) {
  return (
    <Pressable
      guarded={false}
      style={[styles.container, style]}
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
