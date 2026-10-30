import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { HStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';
import {
  NavigationBarButton,
  NavigationBarButtonItem,
} from './navigation-bar-button';
import { ShortNavigationBarButton } from './short-navigation-bar-button';
import { NavigationBarButtonVariant } from './types';

type NavigationBarButtonsRowProps = {
  variant: NavigationBarButtonVariant;
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
      onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
      style={[styles.container, { top }, style]}
    >
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        showsHorizontalScrollIndicator={false}
      >
        <HStack spacing={12} style={{ flex: 1 }}>
          {buttons.map((button) => {
            return (
              <Button
                key={button.id}
                id={button.id}
                title={button.title}
                icon={button.icon}
                iconBackground={button.iconBackground}
                onPress={() => onButtonPress(button.id)}
              />
            );
          })}
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
