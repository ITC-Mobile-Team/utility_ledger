import { EmojiGlyph, ThemedView } from '@/components';
import type { AppColor } from '@/constants/colors';
import { glyphSizeFor, iconTiles } from '@/constants/icon-sizes';
import { StyleSheet } from 'react-native';

type EmojiTileProps = {
  emoji: string;
  background: AppColor;
  size?: number;
};

// Кругла плитка з emoji: гліф — половина сторони, центр рахує EmojiGlyph
export function EmojiTile({
  emoji,
  background,
  size = iconTiles.menu,
}: EmojiTileProps) {
  return (
    <ThemedView
      backgroundColor={background}
      size={{ width: size }}
      style={[styles.tile, { borderRadius: size / 2 }]}
    >
      <EmojiGlyph emoji={emoji} size={glyphSizeFor(size)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
