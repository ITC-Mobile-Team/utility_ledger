import {
  AppImage,
  HStack,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
import { cities } from '@/constants/cities';
import { typography } from '@/constants/typography';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useThemeColor } from '@/hooks/use-theme-colors';
import type { City } from '@/services/ledger';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from './bottom-sheet';

type CityPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
};

export function CityPickerSheet({
  visible,
  onClose,
  onSelect,
}: CityPickerSheetProps) {
  const [query, setQuery] = useState('');
  const ink = useThemeColor('ink');
  const placeholder = useThemeColor('placeholder');
  const { bottom } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const normalized = query.trim().toLocaleLowerCase('uk');
  const filtered = cities.filter((city) =>
    city.name.toLocaleLowerCase('uk').includes(normalized),
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      dragByGrabberOnly
      style={styles.sheet}
    >
      <VStack spacing={2}>
        <ThemedText font='dialogTitle'>Населений пункт</ThemedText>
        <ThemedText color='muted' font='caption'>
          Можна пропустити й додати пізніше
        </ThemedText>
      </VStack>

      <ThemedView backgroundColor='surface2' style={styles.search}>
        <HStack align='center' spacing={8}>
          <AppImage icon='search' tintColor='muted' size={{ width: 18 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Пошук міста'
            placeholderTextColor={placeholder}
            autoCorrect={false}
            style={[typography.bodyLarge, styles.input, { color: ink }]}
          />
        </HStack>
      </ThemedView>

      <ThemedView backgroundColor='surface2' style={styles.list}>
        <FlatList
          data={filtered}
          keyExtractor={(city) => `${city.name}-${city.region}`}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          // список доходить до низу шторки, а останній рядок
          // прокручується до safe area або до верху клавіатури
          contentContainerStyle={{
            paddingBottom: keyboardHeight > 0 ? keyboardHeight : bottom,
          }}
          ItemSeparatorComponent={() => (
            <ThemedView backgroundColor='line' style={styles.divider} />
          )}
          ListEmptyComponent={
            <ThemedText color='muted' style={styles.row}>
              Нічого не знайдено
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                setQuery('');
              }}
              style={(state) => [styles.row, state.pressed && styles.pressed]}
            >
              <ThemedText font='rowTitle'>{item.name}</ThemedText>
              <ThemedText color='muted' font='caption'>
                {item.region}
              </ThemedText>
            </Pressable>
          )}
        />
      </ThemedView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    height: '75%',
    paddingBottom: 0,
  },
  search: {
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  list: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
