import { AppImage, Pressable, ThemedText, VStack } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import type { ThemePreference } from '@/services/preferences';
import { getThemeLabel } from '@/services/preferences';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type CSSTransitionProperties,
} from 'react-native-reanimated';
import { ThemePreview } from './theme-preview';

const descriptions: Record<ThemePreference, string> = {
  system: 'Іде за темою телефону',
  light: 'Завжди світла',
  dark: 'Завжди темна, береже очі ввечері',
};

// Рамка й фон картки та позначки перетікають, натиснута картка стискається
const transition: CSSTransitionProperties = {
  transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
  transitionDuration: 200,
  transitionTimingFunction: 'ease-out',
};

type ThemeOptionCardProps = {
  value: ThemePreference;
  selected: boolean;
  onSelect: (value: ThemePreference) => void;
};

export function ThemeOptionCard({
  value,
  selected,
  onSelect,
}: ThemeOptionCardProps) {
  const [isPressed, setPressed] = useState(false);
  const surface = useThemeColor('surface');
  const blue = useThemeColor('blue');
  const line = useThemeColor('line');
  const label = getThemeLabel(value);

  return (
    <Pressable
      // Локальний вибір, який нормально тапати часто (docs/patterns/buttons.md)
      guarded={false}
      accessibilityRole='radio'
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={descriptions[value]}
      onPress={() => onSelect(value)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      testID={`theme.option.${value}`}
    >
      <Animated.View
        style={[
          styles.card,
          // Без вибору рамка кольору фону: інакше перехід з transparent
          // темнить її
          { backgroundColor: surface, borderColor: selected ? blue : surface },
          { transform: [{ scale: isPressed ? 0.97 : 1 }] },
          transition,
        ]}
      >
        <ThemePreview preference={value} />
        <View style={styles.footer}>
          <VStack spacing={2} style={styles.copy}>
            <ThemedText font='rowTitle'>{label}</ThemedText>
            <ThemedText font='caption' color='muted'>
              {descriptions[value]}
            </ThemedText>
          </VStack>
          <Animated.View
            style={[
              styles.mark,
              selected ? { backgroundColor: blue } : { borderColor: line },
              !selected && styles.markEmpty,
              transition,
            ]}
          >
            {selected && <AppImage icon='check' role='badge' />}
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    borderWidth: 2,
    padding: 10,
    paddingBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  copy: {
    flex: 1,
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markEmpty: {
    borderWidth: 2,
  },
});
