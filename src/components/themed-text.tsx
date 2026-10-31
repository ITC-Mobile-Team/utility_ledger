import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { typography } from '@/constants/typography';
import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';

export type AppFont = keyof typeof typography;

type ThemedTextProps = TextProps & {
  color?: AppColor;
  font?: AppFont;
  align?: TextStyle['textAlign'];
};

export function ThemedText({
  color = 'ink',
  font = 'body',
  align,
  style,
  ...rest
}: ThemedTextProps) {
  const themedColor = useThemeColor(color);
  return (
    <Text
      textBreakStrategy='simple'
      style={[
        { color: themedColor },
        typography[font],
        styles.text,
        { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    paddingHorizontal: 2,
    marginHorizontal: -2,
  },
});
