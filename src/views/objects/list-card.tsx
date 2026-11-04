import {
  AppImage,
  GesturePressable,
  HStack,
  ThemedView,
  VStack,
} from '@/components';
import { Children, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

// Біла картка-група з тонкими роздільниками між рядками
export function ListCard({
  children,
  style,
  ...rest
}: PropsWithChildren<ViewProps>) {
  const rows = Children.toArray(children);
  return (
    <ThemedView
      backgroundColor='surface'
      style={[styles.card, style]}
      {...rest}
    >
      {rows.map((row, index) => (
        <VStack key={index}>
          {index > 0 && (
            <ThemedView backgroundColor='line' style={styles.divider} />
          )}
          {row}
        </VStack>
      ))}
    </ThemedView>
  );
}

type ListRowProps = {
  leading?: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  showsChevron?: boolean;
  // false — рядок не тьмяніє при натисканні (стан показує сам контент)
  highlightsOnPress?: boolean;
  // Нижчий рядок для другорядних пунктів
  compact?: boolean;
  onPress?: () => void;
};

export function ListRow({
  leading,
  children,
  trailing,
  showsChevron = true,
  highlightsOnPress = true,
  compact = false,
  onPress,
}: ListRowProps) {
  return (
    // Pressable з gesture-handler скасовує натискання, коли рядок свайпають
    <GesturePressable
      disabled={!onPress}
      onPress={onPress}
      style={(state) => highlightsOnPress && state.pressed && styles.pressed}
    >
      <HStack
        align='center'
        spacing={12}
        style={[styles.row, compact && styles.compactRow]}
      >
        {leading}
        <VStack spacing={2} style={styles.content}>
          {children}
        </VStack>
        {trailing}
        {showsChevron && (
          <AppImage icon='chevronRight' tintColor='chev' size={{ width: 18 }} />
        )}
      </HStack>
    </GesturePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  compactRow: {
    paddingVertical: 10,
  },
  content: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
