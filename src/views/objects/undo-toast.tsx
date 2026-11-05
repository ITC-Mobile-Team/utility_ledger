import { ThemedText, ThemedView, Pressable } from '@/components';
import { useEffect, useEffectEvent } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIDE_AFTER = 5000;

type UndoToastProps = {
  text: string;
  onUndo: () => void;
  // Тост сам ховається через 5 секунд
  onHide: () => void;
};

// Плашка знизу екрана з кнопкою «Повернути» після дії, яку можна скасувати
export function UndoToast({ text, onUndo, onHide }: UndoToastProps) {
  const { bottom } = useSafeAreaInsets();

  const hide = useEffectEvent(onHide);

  // Таймер запускається раз на показ; новий тост монтуйте з новим key
  useEffect(() => {
    const timer = setTimeout(hide, HIDE_AFTER);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.container, { bottom: Math.max(bottom, 16) }]}
    >
      <ThemedView
        backgroundColor='ink'
        accessibilityRole='alert'
        style={styles.toast}
      >
        <ThemedText color='surface' font='rowTitleMedium' style={styles.text}>
          {text}
        </ThemedText>
        <Pressable
          accessibilityRole='button'
          testID='undoToast.undo'
          onPress={onUndo}
          style={(state) => [styles.undo, state.pressed && styles.pressed]}
        >
          <ThemedText color='surface' font='rowTitleCompact'>
            Повернути
          </ThemedText>
        </Pressable>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 18,
    borderRadius: 18,
    borderCurve: 'continuous',
    boxShadow: '0 10px 30px rgba(15, 27, 45, 0.25)',
  },
  text: {
    flex: 1,
  },
  undo: {
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(127, 127, 127, 0.22)',
  },
  pressed: {
    opacity: 0.6,
  },
});
