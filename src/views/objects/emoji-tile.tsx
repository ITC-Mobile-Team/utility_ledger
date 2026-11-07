import { EmojiGlyph, ThemedView } from '@/components';
import type { AppColor } from '@/constants/colors';
import { StyleSheet } from 'react-native';

type EmojiTileProps = {
  emoji: string;
  background: AppColor;
  size?: number;
  rounded?: boolean;
};

// Плитка з emoji: гліф займає половину сторони, центр рахує EmojiGlyph
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
      <EmojiGlyph emoji={emoji} size={size * 0.5} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
});
