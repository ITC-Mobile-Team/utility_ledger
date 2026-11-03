import { ThemedView } from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  style?: ViewStyle;
}>;

// Шторка знизу поверх затемнення; закривається тапом по фону
export function BottomSheet({
  visible,
  onClose,
  style,
  children,
}: BottomSheetProps) {
  const scrim = useThemeColor('scrim');
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior='padding' style={styles.container}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]}
          onPress={onClose}
          accessibilityLabel='Закрити'
        />
        <ThemedView
          backgroundColor='surface'
          style={[styles.sheet, { paddingBottom: bottom + 16 }, style]}
        >
          <ThemedView backgroundColor='line' style={styles.grabber} />
          {children}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
});
