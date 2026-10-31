import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { View, ViewProps } from 'react-native';
import { toSize, type Size } from './size';

type ThemedViewProps = ViewProps & {
  backgroundColor?: AppColor;
  borderColor?: AppColor;
  size?: Size;
};

export function ThemedView({
  backgroundColor = 'bg',
  borderColor,
  size,
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
        size && toSize(size),
        style,
      ]}
      {...rest}
    />
  );
}
