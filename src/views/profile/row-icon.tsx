import { IconView } from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import type { AppColor } from '@/constants/colors';

type RowIconProps = {
  icon: AppIcon;
  background?: AppColor;
};

// Кругла іконка 42 pt зліва в рядку списку (`.ic` у макеті)
export function RowIcon({ icon, background = 'blueSoft' }: RowIconProps) {
  return <IconView icon={icon} background={background} size={{ width: 42 }} />;
}
