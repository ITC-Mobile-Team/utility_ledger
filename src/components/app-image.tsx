import { AppIcon, appIcons } from '@/constants/app-icons';
import { AppColor } from '@/constants/colors';
import { Image } from 'expo-image';
import { ViewProps } from 'react-native';
import { toSize, type Size } from './size';
import { useThemeColor } from '@/hooks/use-theme-colors';

type AppImageProps = ViewProps & {
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
