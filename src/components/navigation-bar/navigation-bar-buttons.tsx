import Animated from 'react-native-reanimated';
import { FULL_ROW_OFFSET, SHORT_ROW_OFFSET } from './constants';
import { NavigationBarButtonItem } from './navigation-bar-button';
import { NavigationBarButtonsRow } from './navigation-bar-buttons-row';
import { NavigationBarCollapse } from './use-navigation-bar-collapse';

type NavigationBarButtonsProps = {
  buttons: NavigationBarButtonItem[];
  onButtonPress: (id: string) => void;
  collapse: NavigationBarCollapse;
};

// Full and short rows are stacked and cross-faded by scroll progress
export const NavigationBarButtons = ({
  buttons,
  onButtonPress,
  collapse,
}: NavigationBarButtonsProps) => {
  return (
    <Animated.View style={collapse.buttonsAreaStyle}>
      <NavigationBarButtonsRow
        variant='full'
        buttons={buttons}
        onButtonPress={onButtonPress}
        top={FULL_ROW_OFFSET}
        isInteractive={!collapse.isCollapsed}
        onHeightChange={collapse.onFullRowHeightChange}
        style={collapse.fullRowStyle}
      />
      <NavigationBarButtonsRow
        variant='short'
        buttons={buttons}
        onButtonPress={onButtonPress}
        top={SHORT_ROW_OFFSET}
        isInteractive={collapse.isCollapsed}
        onHeightChange={collapse.onShortRowHeightChange}
        style={collapse.shortRowStyle}
      />
    </Animated.View>
  );
};
