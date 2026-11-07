import {
  type ColorSchemeName,
  type ColorValue,
  type StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, gradientLocations } from '@/constants/colors';
import { SHEET_RADIUS } from './constants';
import { type NavigationBarType } from './types';

const getGradientColors = ({
  type,
  scheme,
}: {
  type: Exclude<NavigationBarType, 'transparent'>;
  scheme: NonNullable<ColorSchemeName>;
}): readonly [ColorValue, ColorValue, ...ColorValue[]] => {
  switch (type) {
    case 'blue':
      return gradients[scheme].heroBlue;
    case 'green':
      return gradients[scheme].heroGreen;
    case 'purple':
      return gradients[scheme].heroPurple;
    case 'power':
      return gradients[scheme].heroPower;
  }
};

type AnimatedViewStyle = StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;

type NavigationBarBackgroundProps = {
  type: Exclude<NavigationBarType, 'transparent'>;
  style?: AnimatedViewStyle;
  // Масштаб кутів шторки (0 — без заокруглень, 1 — SHEET_RADIUS)
  sheetCornerStyle?: AnimatedViewStyle;
};

// Кут шторки: контент лежить під навбаром, тож заокруглення малюємо
// «навпаки» — кольором низу градієнта поза дугою радіуса SHEET_RADIUS
const SheetCorner = ({
  side,
  color,
  style,
}: {
  side: 'left' | 'right';
  color: ColorValue;
  style?: AnimatedViewStyle;
}) => (
  <Animated.View
    pointerEvents='none'
    style={[
      styles.corner,
      side === 'left' ? styles.cornerLeft : styles.cornerRight,
      style,
    ]}
  >
    <View
      style={[
        styles.cornerRing,
        {
          borderColor: color,
          left: side === 'left' ? -SHEET_RADIUS : -2 * SHEET_RADIUS,
        },
      ]}
    />
  </Animated.View>
);

export const NavigationBarBackground = ({
  type,
  style,
  sheetCornerStyle,
}: NavigationBarBackgroundProps) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = getGradientColors({ type, scheme });
  const bottomColor = colors[colors.length - 1] ?? colors[0];
  return (
    <Animated.View pointerEvents='none' style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        locations={gradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SheetCorner side='left' color={bottomColor} style={sheetCornerStyle} />
      <SheetCorner side='right' color={bottomColor} style={sheetCornerStyle} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    top: '100%',
    width: SHEET_RADIUS,
    height: SHEET_RADIUS,
    overflow: 'hidden',
  },
  cornerLeft: {
    left: 0,
    transformOrigin: 'top left',
  },
  cornerRight: {
    right: 0,
    transformOrigin: 'top right',
  },
  // Кільце з центром у внутрішньому куті: заповнює квадрат поза дугою
  cornerRing: {
    position: 'absolute',
    top: -SHEET_RADIUS,
    width: 4 * SHEET_RADIUS,
    height: 4 * SHEET_RADIUS,
    borderRadius: 2 * SHEET_RADIUS,
    borderWidth: SHEET_RADIUS,
  },
});
