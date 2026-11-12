import { iconTiles } from '@/constants/icon-sizes';
import {
  ActionButton,
  AppImage,
  PulseCore,
  PulseRings,
  TextButton,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import type { AppIcon } from '@/constants/app-icons';
import { StyleSheet, View } from 'react-native';

const ART_SIZE = 176;

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
  // Пульсація ілюстрації — лише для порожніх станів з канвасу (20, 20c), не
  // для помилок (docs/patterns/empty-state-pulse.md)
  pulse?: boolean;
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
  pulse = false,
}: OutageMessageProps) {
  const isPower = tone === 'power';
  return (
    <VStack spacing={24} align='center' style={styles.container}>
      <View style={styles.art}>
        {pulse && (
          <PulseRings
            color={isPower ? 'powerOnSoft' : 'line'}
            size={ART_SIZE}
          />
        )}
        <ThemedView
          backgroundColor={isPower ? 'powerOnSoft' : 'surface2'}
          style={styles.outer}
        >
          {pulse ? (
            <PulseCore>
              <ThemedView backgroundColor='surface' style={styles.tile}>
                <AppImage icon={icon} container={iconTiles.xlarge} />
              </ThemedView>
            </PulseCore>
          ) : (
            <ThemedView backgroundColor='surface' style={styles.tile}>
              <AppImage icon={icon} container={iconTiles.xlarge} />
            </ThemedView>
          )}
        </ThemedView>
        {badge && (
          <ThemedView backgroundColor='powerOff' style={styles.badge}>
            <ThemedText font='chipLabel' color='powerOffInk'>
              {badge}
            </ThemedText>
          </ThemedView>
        )}
      </View>

      <VStack spacing={10} align='stretch'>
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
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
  },
  outer: {
    ...StyleSheet.absoluteFill,
    borderRadius: ART_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: iconTiles.xlarge,
    height: iconTiles.xlarge,
    borderRadius: iconTiles.xlarge / 2,
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
