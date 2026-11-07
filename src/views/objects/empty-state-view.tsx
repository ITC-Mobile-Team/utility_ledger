import { iconTiles } from '@/constants/icon-sizes';
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
            <AppImage icon={icon} container={iconTiles.empty} />
          </ThemedView>
        </ThemedView>
        <ThemedView backgroundColor='plusSoft' style={styles.badge}>
          <AppImage icon='plus' container={iconTiles.menu} />
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
    width: iconTiles.empty,
    height: iconTiles.empty,
    borderRadius: iconTiles.empty / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 14,
    bottom: 28,
    width: iconTiles.menu,
    height: iconTiles.menu,
    borderRadius: iconTiles.menu / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
