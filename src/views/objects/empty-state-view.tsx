import {
  ActionButton,
  AppImage,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import { StyleSheet } from 'react-native';

type EmptyStateViewProps = {
  icon: AppIcon;
  title: string;
  message: string;
  actionTitle?: string;
  // testID кнопки дії
  actionTestID?: string;
  onAction?: () => void;
};

export function EmptyStateView({
  icon,
  title,
  message,
  actionTitle,
  actionTestID,
  onAction,
}: EmptyStateViewProps) {
  return (
    <VStack spacing={24} align='center' style={styles.container}>
      <ThemedView backgroundColor='blueSoft' style={styles.outerCircle}>
        <ThemedView backgroundColor='blueSoft2' style={styles.innerCircle}>
          <ThemedView backgroundColor='surface' style={styles.tile}>
            <AppImage icon={icon} role='hero' />
          </ThemedView>
        </ThemedView>
        <ThemedView backgroundColor='coral' style={styles.badge}>
          <AppImage icon='plus' role='inline' />
        </ThemedView>
      </ThemedView>

      <VStack spacing={10} align='center'>
        <ThemedText font='emptyStateTitle' align='center'>
          {title}
        </ThemedText>
        <ThemedText color='muted' align='center'>
          {message}
        </ThemedText>
      </VStack>

      {actionTitle && (
        <ActionButton
          title={`+  ${actionTitle}`}
          testID={actionTestID}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  outerCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 22,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 14,
    bottom: 28,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
