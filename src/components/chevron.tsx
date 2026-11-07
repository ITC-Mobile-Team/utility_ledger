import { Image } from 'expo-image';
import { View } from 'react-native';
import { type AppColor } from '@/constants/colors';
import { iconSizes } from '@/constants/icon-sizes';
import { useThemeColor } from '@/hooks/use-theme-colors';

const sources = {
  right: require('@/assets/images/icons/chevron-right.svg'),
  upDown: require('@/assets/images/icons/chevron-up-down.svg'),
};

type ChevronProps = {
  direction: keyof typeof sources;
  color?: AppColor;
};

// Векторний шеврон: лишається векторним за рішенням користувача, але має ту
// саму шкалу розмірів, що й emoji-іконки (роль inline)
export function Chevron({ direction, color = 'chev' }: ChevronProps) {
  const tint = useThemeColor(color);
  const size = iconSizes.inline;
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={sources[direction]}
        tintColor={tint}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
