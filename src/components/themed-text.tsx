import { Text, TextProps } from 'react-native';
import { typography } from '@/constants/typography';
import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';

export type AppFont = keyof typeof typography;

type ThemedTextProps = TextProps & {
  color?: AppColor;
  font?: AppFont;
};

export function ThemedText({
  color = 'ink',
  font = 'body',
  style,
  ...rest
}: ThemedTextProps) {
  const themedColor = useThemeColor(color);
  return (
    <Text style={[{ color: themedColor }, typography[font], style]} {...rest} />
  );
}
