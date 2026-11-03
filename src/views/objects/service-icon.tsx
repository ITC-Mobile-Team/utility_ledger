import { getServiceIconBackground } from '@/constants/service-icons';
import { EmojiTile } from './emoji-tile';

type ServiceIconProps = {
  icon: string;
  size?: number;
};

export function ServiceIcon({ icon, size = 42 }: ServiceIconProps) {
  return (
    <EmojiTile
      emoji={icon}
      background={getServiceIconBackground(icon)}
      size={size}
      rounded
    />
  );
}
