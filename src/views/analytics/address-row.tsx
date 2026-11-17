import {
  Chevron,
  HStack,
  Pressable,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import type { AddressOption } from '@/services/analytics';
import { StyleSheet, View } from 'react-native';
import { AddressIcon } from './address-icon';

type AddressRowProps = {
  option: AddressOption;
  onPress: () => void;
};

// Рядок обраної адреси над карткою «Витрати»; відкриває шторку «Адреса»
export function AddressRow({ option, onPress }: AddressRowProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`Обрати адресу, зараз: ${option.title}`}
      testID='analytics.address'
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView backgroundColor='surface' style={styles.card}>
        <HStack spacing={12} align='center'>
          <AddressIcon selection={option.selection} size={iconTiles.menu} />
          <VStack spacing={2} style={styles.copy}>
            <ThemedText font='rowTitle' numberOfLines={1}>
              {option.title}
            </ThemedText>
            <ThemedText color='muted' font='caption' numberOfLines={1}>
              {option.subtitle}
            </ThemedText>
          </VStack>
          <ThemedView backgroundColor='surface2' style={styles.chevron}>
            <View style={styles.down}>
              <Chevron direction='right' color='muted' />
            </View>
          </ThemedView>
        </HStack>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  card: {
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  copy: {
    flex: 1,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  down: {
    transform: [{ rotate: '90deg' }],
  },
});
