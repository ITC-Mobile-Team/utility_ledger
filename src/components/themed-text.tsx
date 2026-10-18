import { Text, TextProps } from 'react-native';
import { typography } from '@/constants/typography';

export type AppFont = keyof typeof typography;

type ThemedTextProps = TextProps & {
  font: AppFont;
};

export function ThemedText({ font, style, ...rest }: ThemedTextProps) {
  return <Text style={[typography[font], style]} {...rest} />;
}
