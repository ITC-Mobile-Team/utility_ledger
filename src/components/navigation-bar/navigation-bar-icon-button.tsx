import { type AppIcon } from '@/constants/app-icons';
import { iconTiles } from '@/constants/icon-sizes';
import { StyleSheet } from 'react-native';
import { AppImage } from '../app-image';
import { Pressable } from '../pressable';

type NavigationBarIconButtonProps = {
  icon: AppIcon;
  accessibilityLabel: string;
  testID?: string;
  onPress: () => void;
};

// Кругла скляна кнопка з іконкою на кольоровому навбарі, напр. «Налаштування»
// праворуч від великого заголовка (headerTrailing)
export function NavigationBarIconButton({
  icon,
  accessibilityLabel,
  testID,
  onPress,
}: NavigationBarIconButtonProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={(state) => [styles.button, state.pressed && styles.pressed]}
    >
      <AppImage icon={icon} container={iconTiles.touch} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: iconTiles.touch,
    height: iconTiles.touch,
    borderRadius: iconTiles.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  pressed: {
    opacity: 0.7,
  },
});
