import { type AppIcon, appIcons } from '@/constants/app-icons';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { Pressable } from '../pressable';

type NavigationBarIconButtonProps = {
  icon: AppIcon;
  accessibilityLabel: string;
  onPress: () => void;
};

// Кругла скляна кнопка з іконкою на кольоровому навбарі, напр. «Налаштування»
// праворуч від великого заголовка (headerTrailing)
export function NavigationBarIconButton({
  icon,
  accessibilityLabel,
  onPress,
}: NavigationBarIconButtonProps) {
  const tint = useThemeColor('onPrimary');
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={(state) => [styles.button, state.pressed && styles.pressed]}
    >
      <Image source={appIcons[icon]} tintColor={tint} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  icon: {
    width: 20,
    height: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
