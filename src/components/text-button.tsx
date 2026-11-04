import { type AppColor } from '@/constants/colors';
import { Pressable, type PressableProps, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

type TextButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  color?: AppColor;
};

// Кнопка-текст без фону, напр. другорядна дія під основною кнопкою форми
export function TextButton({
  title,
  color = 'coral',
  disabled,
  style,
  ...rest
}: TextButtonProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <ThemedText color={color} font='rowTitle' align='center'>
        {title}
      </ThemedText>
    </Pressable>
  );
}

export const TEXT_BUTTON_HEIGHT = 44;

const styles = StyleSheet.create({
  button: {
    height: TEXT_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
