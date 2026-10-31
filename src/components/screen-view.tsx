import { AppColor } from '@/constants/colors';
import { ScrollView, StyleSheet, ViewProps, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { type ContentInsets, toPadding } from './content-insets';
import { useThemeColor } from '@/hooks/use-theme-colors';

type ScrollViewProps = ViewProps & {
  scrollable?: boolean;
  edges?: Edge[];
  backgroundColor: AppColor;
  contentInsets?: ContentInsets;
};

export function ScreenView({
  scrollable = false,
  edges,
  backgroundColor,
  contentInsets,
  style,
  children,
  ...rest
}: ScrollViewProps) {
  const bg = useThemeColor(backgroundColor);
  const padding = toPadding(contentInsets);
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.fill, { backgroundColor: bg }, style]}
      {...rest}
    >
      {scrollable ? (
        <ScrollView contentContainerStyle={padding}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
