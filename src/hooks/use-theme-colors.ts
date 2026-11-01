import { useColorScheme } from 'react-native';
import { type AppColor, colors } from '@/constants/colors';

export function useThemeColor(color: AppColor) {
  const scheme = useColorScheme() ?? 'light';
  return colors[scheme][color];
}
