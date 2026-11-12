import { Platform, ScrollView, View } from 'react-native';
import { ScrollViewMarker } from 'react-native-screens/experimental';
import { HStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';
import {
  NavigationBarButton,
  type NavigationBarButtonItem,
} from './navigation-bar-button';

const HIDDEN_EDGE_EFFECTS = {
  top: 'hidden',
  bottom: 'hidden',
  left: 'hidden',
  right: 'hidden',
} as const;

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
  // Кнопки завжди в один ряд і гортаються горизонтально
  const row = (
    <ScrollView
      horizontal
      testID='navigationBar.buttons'
      // Ряд лежить у навбарі, а не під системними барами: автоматичні інсети
      // iOS тут зайві
      contentInsetAdjustmentBehavior='never'
      automaticallyAdjustContentInsets={false}
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
  );

  return (
    <View onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}>
      {/* iOS 26+ чіпляє на цей скрол верхній ефект краю (після екрана з
          клавіатурою — світла смуга над кнопками); маркер його вимикає.
          На Android маркера немає: нативний ScrollViewMarker шукає серед прямих
          дочірніх лише вертикальний ScrollView, горизонтальний не знаходить і
          падає («Failed to find supported type of ScrollView»), а ефектів краю
          на Android і так немає */}
      {Platform.OS === 'ios' ? (
        <ScrollViewMarker scrollEdgeEffects={HIDDEN_EDGE_EFFECTS}>
          {row}
        </ScrollViewMarker>
      ) : (
        row
      )}
    </View>
  );
};
