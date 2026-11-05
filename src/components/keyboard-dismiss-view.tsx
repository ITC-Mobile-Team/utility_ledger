import type { PropsWithChildren } from 'react';
import { Keyboard, StyleSheet, type ViewStyle } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { Pressable } from './pressable';

type KeyboardDismissViewProps = PropsWithChildren<{ style?: ViewStyle }>;

// Корінь екрана з полями: тап поза полями й кнопками закриває клавіатуру.
// Тапи по інпутах і кнопках обробляють вони самі, тому сюди не доходять.
// Без клавіатури Pressable вимкнений і не стає JS-респондером: iOS-скрол
// (Fabric) не стартує, поки респондер — будь-який його предок, і екран
// під цим коренем то не скролився, то «замерзав» назовсім
export function KeyboardDismissView({
  style,
  children,
}: KeyboardDismissViewProps) {
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  return (
    <Pressable
      guarded={false}
      disabled={!isKeyboardVisible}
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
