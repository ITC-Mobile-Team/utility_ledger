import type { PropsWithChildren } from 'react';
import { Keyboard, Pressable, StyleSheet, type ViewStyle } from 'react-native';

type KeyboardDismissViewProps = PropsWithChildren<{ style?: ViewStyle }>;

// Корінь екрана з полями: тап поза полями й кнопками закриває клавіатуру.
// Тапи по інпутах і кнопках обробляють вони самі, тому сюди не доходять
export function KeyboardDismissView({
  style,
  children,
}: KeyboardDismissViewProps) {
  return (
    <Pressable
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
