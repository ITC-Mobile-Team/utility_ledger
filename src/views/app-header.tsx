import { StyleSheet } from 'react-native';
import { AppImage } from '../components/app-image';
import { HStack } from '../components/stack';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

export const AppHeader = () => {
  return (
    <HStack align='center' spacing={10}>
      <ThemedView
        backgroundColor='blue'
        size={{ width: 36, height: 36 }}
        style={styles.logo}
      >
        <AppImage icon='house' size={{ width: 18 }} />
      </ThemedView>
      <ThemedText color='blueInk' font='onboardingAppName'>
        Utility Ledger
      </ThemedText>
    </HStack>
  );
};

const styles = StyleSheet.create({
  logo: {
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
