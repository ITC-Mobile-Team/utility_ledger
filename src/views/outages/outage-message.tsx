import {
  ActionButton,
  AppImage,
  TextButton,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import { StyleSheet } from 'react-native';

type OutageMessageProps = {
  icon: AppIcon;
  // power — жовте коло з лампою (налаштуйте графік), muted — сіре (немає даних)
  tone?: 'power' | 'muted';
  badge?: string;
  title: string;
  message: string;
  actionTitle?: string;
  actionType?: 'primary' | 'secondary';
  onAction?: () => void;
  linkTitle?: string;
  onLink?: () => void;
};

// Повноекранний стан вкладки «Світло»: черги не обрано, місто без
// постачальника, помилка завантаження
export function OutageMessage({
  icon,
  tone = 'power',
  badge,
  title,
  message,
  actionTitle,
  actionType = 'primary',
  onAction,
  linkTitle,
  onLink,
}: OutageMessageProps) {
  const isPower = tone === 'power';
  return (
    <VStack spacing={24} align='center' style={styles.container}>
      <ThemedView
        backgroundColor={isPower ? 'powerOnSoft' : 'surface2'}
        style={styles.outer}
      >
        <ThemedView backgroundColor='surface' style={styles.tile}>
          <AppImage
            icon={icon}
            tintColor={isPower ? 'powerOnInk' : 'muted'}
            size={{ width: 40 }}
          />
        </ThemedView>
        {badge && (
          <ThemedView backgroundColor='powerOff' style={styles.badge}>
            <ThemedText font='chipLabel' color='powerOffInk'>
              {badge}
            </ThemedText>
          </ThemedView>
        )}
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
          title={actionTitle}
          type={actionType}
          onPress={onAction}
          style={styles.button}
        />
      )}
      {linkTitle && <TextButton title={linkTitle} onPress={onLink} />}
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  outer: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 88,
    height: 88,
    borderRadius: 26,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(16,32,64,0.12)',
  },
  badge: {
    position: 'absolute',
    right: 6,
    bottom: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
