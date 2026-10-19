import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { AppColor } from '@/constants/colors';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

type ButtonType = 'primary' | 'secondary' | 'outline';

type ButtonColor = {
  bg: AppColor;
  text: AppColor;
  border?: AppColor;
};

const buttonColors: Record<ButtonType, ButtonColor> = {
  primary: { bg: 'coral', text: 'onPrimary' },
  secondary: { bg: 'blueSoft', text: 'blueInk' },
  outline: { bg: 'surface', text: 'ink', border: 'line' },
};

const disabledButtonColors: ButtonColor = {
  bg: 'disabledBg',
  text: 'disabledInk',
};

type ActionButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  type?: ButtonType;
};

export function ActionButton({
  title,
  type = 'primary',
  disabled,
  style,
  ...rest
}: ActionButtonProps) {
  const colors = disabled ? disabledButtonColors : buttonColors[type];
  return (
    <Pressable
      accessibilityRole='button'
      disabled={disabled}
      style={(state) => [
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <ThemedView
        backgroundColor={colors.bg}
        borderColor={colors.border}
        style={styles.container}
      >
        <ThemedText color={colors.text} font='button'>
          {title}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
