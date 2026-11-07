import { StyleSheet, View } from 'react-native';
import { Pressable } from '../pressable';
import { ThemedView } from '../themed-view';
import { HStack } from '../stack';
import { type NavigationBarButtonProps } from './navigation-bar-button';
import { ThemedText } from '../themed-text';
import { AppImage } from '../app-image';

export const ShortNavigationBarButton = ({
  title,
  icon,
  iconBackground,
  testID,
  onPress,
}: NavigationBarButtonProps) => {
  return (
    <Pressable accessibilityRole='button' testID={testID} onPress={onPress}>
      <View style={styles.container}>
        <HStack align='center' spacing={8}>
          <ThemedView backgroundColor={iconBackground} style={styles.circle}>
            <AppImage icon={icon} role='inline' />
          </ThemedView>

          <ThemedText color='onPrimary' font='segment' style={styles.title}>
            {title}
          </ThemedText>
        </HStack>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    paddingStart: 6,
    paddingEnd: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
  },
});
