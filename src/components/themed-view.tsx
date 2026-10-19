import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { View, ViewProps } from 'react-native';

type ThemedViewProps = ViewProps & {
  backgroundColor?: AppColor;
  borderColor?: AppColor;
};

export function ThemedView({
  backgroundColor = 'bg',
  borderColor,
  style,
  ...rest
}: ThemedViewProps) {
  const themedBackgroundColor = useThemeColor(backgroundColor);
  const themedBorderColor = useThemeColor(borderColor ?? backgroundColor);
  return (
    <View
      style={[
        { backgroundColor: themedBackgroundColor },
        borderColor && { borderColor: themedBorderColor, borderWidth: 1 },
        style,
      ]}
      {...rest}
    />
  );
}
