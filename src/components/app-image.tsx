import { type AppIcon, appIcons } from '@/constants/app-icons';
import { glyphSizeFor, type IconRole, iconSizes } from '@/constants/icon-sizes';
import { EmojiGlyph } from './emoji-glyph';

// Без контейнера розмір задає роль, у колі чи плитці — її сторона (`container`),
// а гліф рахується за правилом «половина сторони»
type AppImageProps = { icon: AppIcon } & (
  { role: IconRole; container?: never } | { container: number; role?: never }
);

export const AppImage = ({ icon, role, container }: AppImageProps) => (
  <EmojiGlyph
    emoji={appIcons[icon]}
    size={container != null ? glyphSizeFor(container) : iconSizes[role]}
  />
);
