import { StyleSheet } from 'react-native';
import { iconTiles } from '@/constants/icon-sizes';
import { AppImage } from '../components/app-image';
import { HStack } from '../components/stack';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

export const AppHeader = () => {
  return (
    <HStack align='center' spacing={10}>
      <ThemedView
        backgroundColor='blueSoft'
        size={{ width: iconTiles.menu }}
        style={styles.logo}
      >
        <AppImage icon='house' container={iconTiles.menu} />
      </ThemedView>
      <ThemedText color='blueInk' font='onboardingAppName'>
        Utility Ledger
      </ThemedText>
    </HStack>
  );
};

const styles = StyleSheet.create({
  logo: {
    borderRadius: iconTiles.menu / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
