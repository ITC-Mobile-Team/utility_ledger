import { ThemedText } from '@/components';
import { gradientLocations, gradients } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useColorScheme } from 'react-native';

type AvatarProps = {
  initial: string;
  // 56 — картка профілю, 88 — екран імені
  size: 56 | 88;
  testID?: string;
};

export function Avatar({ initial, size, testID }: AvatarProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <LinearGradient
      colors={gradients[scheme].heroPurple}
      locations={gradientLocations}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <ThemedText
        color='onPrimary'
        font={size === 88 ? 'avatarInitial' : 'emoji'}
      >
        {initial}
      </ThemedText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
