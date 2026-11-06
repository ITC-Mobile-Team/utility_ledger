import {
  AppImage,
  HStack,
  Pressable,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { StyleSheet } from 'react-native';
import { Avatar } from './avatar';

type ProfileCardProps = {
  name: string;
  email: string;
  initial: string;
  onPress: () => void;
};

export function ProfileCard({
  name,
  email,
  initial,
  onPress,
}: ProfileCardProps) {
  return (
    <Pressable
      testID='profile.card'
      accessibilityRole='button'
      accessibilityLabel={`Профіль: ${name}. Змінити імʼя`}
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView backgroundColor='surface' style={styles.card}>
        <HStack align='center' spacing={14}>
          <Avatar initial={initial} size={56} />
          <VStack spacing={2} style={styles.copy}>
            <ThemedText font='headline' numberOfLines={1}>
              {name}
            </ThemedText>
            <ThemedText font='caption' color='muted' numberOfLines={1}>
              {email}
            </ThemedText>
          </VStack>
          <AppImage icon='chevronRight' tintColor='chev' size={{ width: 18 }} />
        </HStack>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 16,
  },
  copy: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
