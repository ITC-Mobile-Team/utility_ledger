import { TEXT_BUTTON_HEIGHT, ThemedText, ThemedView } from '@/components';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormFooterProps = PropsWithChildren<{ hint?: string }>;

const PADDING_TOP = 13;
const BUTTON_HEIGHT = 54;
const HINT_HEIGHT = 27; // gap 10 + рядок caption 17
const GAP = 10;
// Відступ кнопки від клавіатури, коли вона відкрита
const KEYBOARD_GAP = 12;
// Відступ між полем у фокусі та футером
const FIELD_GAP = 16;

// Закріплена знизу панель з основною кнопкою форми.
// Над відкритою клавіатурою стоїть з відступом 12, safe area ховається під клавіатуру
export function FormFooter({ hint, children }: FormFooterProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <KeyboardStickyView
      offset={{ closed: 0, opened: Math.max(bottom - KEYBOARD_GAP, 0) }}
    >
      <ThemedView
        backgroundColor='bg'
        style={[
          styles.container,
          { paddingBottom: Math.max(bottom, KEYBOARD_GAP) },
        ]}
      >
        {children}
        {hint && (
          <ThemedText color='muted' font='caption' align='center'>
            {hint}
          </ThemedText>
        )}
      </ThemedView>
    </KeyboardStickyView>
  );
}

// Пропси для NavigationView над FormFooter: поле у фокусі прокручується над футером,
// а контент можна догорнути до кінця при відкритій клавіатурі.
// hasTextButton — під основною кнопкою ще TextButton (напр. «Скинути показник»)
export function useFormFooterKeyboardInsets(
  hasHint = false,
  hasTextButton = false,
) {
  const { bottom } = useSafeAreaInsets();
  const footerAboveKeyboard =
    PADDING_TOP +
    BUTTON_HEIGHT +
    (hasHint ? HINT_HEIGHT : 0) +
    (hasTextButton ? GAP + TEXT_BUTTON_HEIGHT : 0) +
    KEYBOARD_GAP;
  return {
    bottomOffset: footerAboveKeyboard + FIELD_GAP,
    // футер перекриває контент, а його safe area ховається під клавіатуру
    extraKeyboardSpace: -Math.max(bottom - KEYBOARD_GAP, 0),
  };
}

const styles = StyleSheet.create({
  container: {
    gap: GAP,
    paddingTop: PADDING_TOP,
    paddingHorizontal: 20,
  },
});
