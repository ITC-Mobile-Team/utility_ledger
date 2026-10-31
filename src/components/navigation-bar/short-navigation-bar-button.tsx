import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedView } from '../themed-view';
import { HStack } from '../stack';
import { NavigationBarButtonProps } from './navigation-bar-button';
import { Image } from 'expo-image';
import { ThemedText } from '../themed-text';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { appIcons } from '@/constants/app-icons';

export const ShortNavigationBarButton = ({
  title,
  icon,
  iconBackground,
  onPress,
}: NavigationBarButtonProps) => {
  const navigationBarIcon = appIcons[icon];
  const onPrimary = useThemeColor('onPrimary');
  return (
    <Pressable onPress={onPress}>
      <View style={styles.container}>
        <HStack align='center' spacing={8}>
          <ThemedView backgroundColor={iconBackground} style={styles.circle}>
            <Image
              source={navigationBarIcon}
              tintColor={onPrimary}
              style={styles.icon}
            />
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
  icon: {
    width: 15,
    height: 15,
  },
  title: {
    flexShrink: 1,
  },
});
