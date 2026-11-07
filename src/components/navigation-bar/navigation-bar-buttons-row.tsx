import { ScrollView, View } from 'react-native';
import { HStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';
import {
  NavigationBarButton,
  type NavigationBarButtonItem,
} from './navigation-bar-button';

type NavigationBarButtonsRowProps = {
  buttons: NavigationBarButtonItem[];
  onButtonPress: (id: string) => void;
  onHeightChange: (height: number) => void;
};

export const NavigationBarButtonsRow = ({
  buttons,
  onButtonPress,
  onHeightChange,
}: NavigationBarButtonsRowProps) => {
  return (
    <View onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}>
      {/* Кнопки завжди в один ряд і гортаються горизонтально */}
      <ScrollView
        horizontal
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        showsHorizontalScrollIndicator={false}
      >
        <HStack spacing={12} style={{ flex: 1 }}>
          {buttons.map((button) => (
            <NavigationBarButton
              key={button.id}
              {...button}
              onPress={() => onButtonPress(button.id)}
            />
          ))}
        </HStack>
      </ScrollView>
    </View>
  );
};
