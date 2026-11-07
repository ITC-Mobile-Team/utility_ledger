import { IconView } from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';
import { getIconTone, iconTiles } from '@/constants/icon-sizes';

type RowIconProps = {
  icon: AppIcon;
  background?: AppColor;
};

// Кругла іконка пункту меню зліва в рядку списку (`.ic` у макеті): еталон
// розміру — коло 42 pt з гліфом 21 pt, тон підкладки за іконкою
export function RowIcon({
  icon,
  background = getIconTone(icon),
}: RowIconProps) {
  return (
    <IconView
      icon={icon}
      background={background}
      size={{ width: iconTiles.menu }}
    />
  );
}
