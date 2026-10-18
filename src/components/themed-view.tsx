import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { View, ViewProps } from 'react-native';

type ThemedViewProps = ViewProps & {
  backgroundColor?: AppColor;
};

export function ThemedView({
  backgroundColor = 'bg',
  style,
  ...rest
}: ThemedViewProps) {
  const themedBackgroundColor = useThemeColor(backgroundColor);
  return (
    <View
      style={[{ backgroundColor: themedBackgroundColor }, style]}
      {...rest}
    />
  );
}
