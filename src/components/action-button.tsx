import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AppColor } from '@/constants/colors';
import Animated, { CSSTransitionProperties } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { typography } from '@/constants/typography';

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
  const bg = useThemeColor(colors.bg);
  const text = useThemeColor(colors.text);
  const borderColor = useThemeColor(colors.border ?? colors.bg);
  const border = colors.border ? borderColor : 'transparent';
  return (
    <Pressable
      accessibilityRole='button'
      disabled={disabled}
      style={(state) => [
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
        styles.button,
      ]}
      {...rest}
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bg, borderColor: border, borderWidth: 1 },
          viewTransition,
        ]}
      >
        <Animated.Text
          style={[typography.button, { color: text }, textTransition]}
        >
          {title}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const viewTransition: CSSTransitionProperties<ViewStyle> = {
  transitionProperty: ['backgroundColor', 'borderColor'],
  transitionDuration: 250,
  transitionTimingFunction: 'ease-out',
};

const textTransition: CSSTransitionProperties<TextStyle> = {
  transitionProperty: 'color',
  transitionDuration: 250,
  transitionTimingFunction: 'ease-out',
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  container: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
