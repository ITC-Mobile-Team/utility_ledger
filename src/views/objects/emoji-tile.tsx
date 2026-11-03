import { ThemedView } from '@/components';
import type { AppColor } from '@/constants/colors';
import { StyleSheet, Text } from 'react-native';

type EmojiTileProps = {
  emoji: string;
  background: AppColor;
  size?: number;
  rounded?: boolean;
};

export function EmojiTile({
  emoji,
  background,
  size = 42,
  rounded = false,
}: EmojiTileProps) {
  return (
    <ThemedView
      backgroundColor={background}
      size={{ width: size }}
      style={[styles.tile, { borderRadius: rounded ? size / 2 : size * 0.3 }]}
    >
      {/* Звичайний Text без шрифту Onest: його метрики зсувають емодзі
          з центру плитки */}
      <Text
        allowFontScaling={false}
        style={[styles.emoji, { fontSize: size * 0.5 }]}
      >
        {emoji}
      </Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
