import { type AppIcon, appIcons } from '@/constants/app-icons';
import { type AppColor } from '@/constants/colors';
import { Image } from 'expo-image';
import { toSize, type Size } from './size';
import { useThemeColor } from '@/hooks/use-theme-colors';

type AppImageProps = {
  icon: AppIcon;
  tintColor?: AppColor;
  size: Size;
};

export const AppImage = ({
  icon,
  tintColor = 'onPrimary',
  size,
}: AppImageProps) => {
  const tint = useThemeColor(tintColor);
  return (
    <Image source={appIcons[icon]} tintColor={tint} style={toSize(size)} />
  );
};
