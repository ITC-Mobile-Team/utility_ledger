import { type AppIcon, appIcons } from '@/constants/app-icons';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { Pressable } from '../pressable';
import { ThemedText } from '../themed-text';

type NavigationBarChipProps = {
  title: string;
  icon: AppIcon;
  accessibilityLabel?: string;
  testID?: string;
  onPress: () => void;
};

// Скляна кнопка-чип праворуч у рядку «Назад» кольорового навбару
export function NavigationBarChip({
  title,
  icon,
  accessibilityLabel,
  testID,
  onPress,
}: NavigationBarChipProps) {
  const tint = useThemeColor('onPrimary');
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel ?? title}
      hitSlop={4}
      testID={testID}
      onPress={onPress}
      style={(state) => [styles.chip, state.pressed && styles.pressed]}
    >
      <Image source={appIcons[icon]} tintColor={tint} style={styles.icon} />
      <ThemedText color='onPrimary' font='segment'>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingStart: 10,
    paddingEnd: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  icon: {
    width: 18,
    height: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
