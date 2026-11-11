import {
  ActionButton,
  AppImage,
  PulseCore,
  PulseRings,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { StyleSheet, View } from 'react-native';

const ART_SIZE = 120;

type Props = {
  onRetry: () => void;
  // Компактна картка (профіль) замість повноекранного стану
  compact?: boolean;
};

// Дані акаунта ще не отримані з хмари, а звʼязку немає (артборд 05o)
export function AccountDataOffline({ onRetry, compact }: Props) {
  return (
    <VStack
      spacing={compact ? 14 : 24}
      align='center'
      style={compact ? styles.compact : styles.container}
      testID='accountData.offline'
    >
      {/* Нейтральні кільця пульсації під колом (артборд 05o) */}
      <View style={styles.art}>
        <PulseRings color='line' size={ART_SIZE} />
        <PulseCore>
          <ThemedView backgroundColor='surface2' style={styles.circle}>
            <AppImage
              icon='offline'
              container={compact ? iconTiles.large : iconTiles.empty}
            />
          </ThemedView>
        </PulseCore>
      </View>
      <VStack spacing={10} align='center'>
        <ThemedText font='emptyStateTitle' align='center'>
          Немає інтернету
        </ThemedText>
        <ThemedText color='muted' align='center'>
          Дані акаунта ще не завантажено. Підключіться до інтернету й спробуйте
          ще раз.
        </ThemedText>
      </VStack>
      <ActionButton
        title='Спробувати ще'
        type='secondary'
        testID='accountData.offline.retry'
        onPress={onRetry}
        style={styles.button}
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  compact: {
    paddingVertical: 16,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
  },
  circle: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
