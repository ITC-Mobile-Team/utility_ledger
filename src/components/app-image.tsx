import { type AppIcon, appIcons } from '@/constants/app-icons';
import { type IconRole, iconSizes } from '@/constants/icon-sizes';
import { EmojiGlyph } from './emoji-glyph';

type AppImageProps = {
  icon: AppIcon;
  role: IconRole;
};

// Іконка застосунку як emoji розміру своєї ролі
export const AppImage = ({ icon, role }: AppImageProps) => (
  <EmojiGlyph emoji={appIcons[icon]} size={iconSizes[role]} />
);
