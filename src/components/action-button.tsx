import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { AppColor } from '@/constants/colors';
import Animated, { CSSTransitionProperties } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { typography } from '@/constants/typography';
import { Image, ImageSource } from 'expo-image';

type ButtonType = 'primary' | 'secondary' | 'outline' | 'google' | 'apple';

type ButtonColor = {
  bg: AppColor;
  text: AppColor;
  border?: AppColor;
};

const buttonColors: Record<ButtonType, ButtonColor> = {
  primary: { bg: 'coral', text: 'onPrimary' },
  secondary: { bg: 'blueSoft', text: 'blueInk' },
  outline: { bg: 'surface', text: 'ink', border: 'line' },
  google: { bg: 'surface', text: 'ink', border: 'line' },
  apple: { bg: 'btnDarkBg', text: 'btnDarkInk' },
};

const googleIcon: ImageSource = require('@/assets/images/socials/google.svg');

const buttonIcons: Record<
  'light' | 'dark',
  Partial<Record<ButtonType, ImageSource>>
> = {
  light: {
    google: googleIcon,
    apple: require('@/assets/images/socials/apple-light.svg'),
  },
  dark: {
    google: googleIcon,
    apple: require('@/assets/images/socials/apple-dark.svg'),
  },
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
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const icon = buttonIcons[scheme][type];
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
        {icon && <Image source={icon} style={styles.icon} />}
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
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: { width: 20, height: 20 },
  pressed: { opacity: 0.75 },
});
