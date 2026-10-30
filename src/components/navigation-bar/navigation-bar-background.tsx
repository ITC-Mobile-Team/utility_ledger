import {
  ColorSchemeName,
  ColorValue,
  StyleProp,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, gradientLocations } from '@/constants/colors';
import { NavigationBarType } from './types';

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
  }
};

type NavigationBarBackgroundProps = {
  type: Exclude<NavigationBarType, 'transparent'>;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

export const NavigationBarBackground = ({
  type,
  style,
}: NavigationBarBackgroundProps) => {
  const scheme = useColorScheme() ?? 'light';
  return (
    <Animated.View style={[styles.container, style]}>
      <LinearGradient
        colors={getGradientColors({ type, scheme })}
        locations={gradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
