import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { HStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';
import {
  NavigationBarButton,
  type NavigationBarButtonItem,
} from './navigation-bar-button';
import { ShortNavigationBarButton } from './short-navigation-bar-button';
import { type NavigationBarVariant } from './types';

type NavigationBarButtonsRowProps = {
  variant: NavigationBarVariant;
  buttons: NavigationBarButtonItem[];
  onButtonPress: (id: string) => void;
  top: number;
  isInteractive: boolean;
  onHeightChange: (height: number) => void;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

export const NavigationBarButtonsRow = ({
  variant,
  buttons,
  onButtonPress,
  top,
  isInteractive,
  onHeightChange,
  style,
}: NavigationBarButtonsRowProps) => {
  const Button =
    variant === 'full' ? NavigationBarButton : ShortNavigationBarButton;
  return (
    <Animated.View
      pointerEvents={isInteractive ? 'auto' : 'none'}
      // Обидва ряди (повний і короткий) змонтовані одночасно: прихований не
      // має потрапляти до VoiceOver і в дерево UI-перевірок з тими самими testID
      accessibilityElementsHidden={!isInteractive}
      importantForAccessibility={isInteractive ? 'auto' : 'no-hide-descendants'}
      onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
      style={[styles.container, { top }, style]}
    >
      {/* Кнопки завжди в один ряд і гортаються горизонтально */}
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        showsHorizontalScrollIndicator={false}
      >
        <HStack spacing={12} style={{ flex: 1 }}>
          {buttons.map((button) => (
            <Button
              key={button.id}
              {...button}
              onPress={() => onButtonPress(button.id)}
            />
          ))}
        </HStack>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
