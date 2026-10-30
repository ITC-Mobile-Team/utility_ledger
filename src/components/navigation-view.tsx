import { ScrollView, StyleSheet, ViewProps } from 'react-native';
import { VStack } from './stack';
import { ThemedNavigationBar } from './themed-navigation-bar';
import { useThemeColor } from '@/hooks/use-theme-colors';

type NavigationContentInsets = {
  top?: number;
  horizontal?: number;
  bottom?: number;
};

type NavigationViewProps = ViewProps & {
  contentInsets?: NavigationContentInsets;
};

export const NavigationView = ({
  contentInsets,
  ...rest
}: NavigationViewProps) => {
  const bg = useThemeColor('bg');
  return (
    <VStack style={styles.container}>
      <ThemedNavigationBar type='blue' title='Обʼєкти' />
      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        style={{ backgroundColor: bg }}
        contentContainerStyle={{
          paddingTop: contentInsets?.top ?? undefined,
          paddingHorizontal: contentInsets?.horizontal ?? undefined,
          paddingBottom: contentInsets?.bottom ?? undefined,
        }}
        {...rest}
      />
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
