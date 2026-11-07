import { getServiceIconBackground } from '@/constants/service-icons';
import { iconTiles } from '@/constants/icon-sizes';
import { EmojiTile } from './emoji-tile';

type ServiceIconProps = {
  icon: string;
  size?: number;
};

export function ServiceIcon({ icon, size = iconTiles.menu }: ServiceIconProps) {
  return (
    <EmojiTile
      emoji={icon}
      background={getServiceIconBackground(icon)}
      size={size}
    />
  );
}
