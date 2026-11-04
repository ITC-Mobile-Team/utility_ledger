import { AppImage, Pressable, ThemedText, VStack } from '@/components';
import { cities } from '@/constants/cities';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { getProviderForCity } from '@/services/outages';
import { BottomSheet, ListCard, SectionHeader } from '@/views/objects';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OutageCitySheetProps = {
  visible: boolean;
  selected?: string;
  onClose: () => void;
  onSelect: (city: string) => void;
};

// Унікальні назви міст: «Доступно» — є постачальник графіків,
// «Незабаром» — ще ні
const cityNames = [...new Set(cities.map((city) => city.name))];
const groups = [
  {
    title: 'Доступно',
    items: cityNames.filter((name) => getProviderForCity(name)),
  },
  {
    title: 'Незабаром',
    items: cityNames.filter((name) => !getProviderForCity(name)),
  },
].filter((group) => group.items.length > 0);

export function OutageCitySheet({
  visible,
  selected,
  onClose,
  onSelect,
}: OutageCitySheetProps) {
  const { bottom } = useSafeAreaInsets();
  // Шторка біла, тож картки-групи на ній сірі, як у CityPickerSheet
  const groupBackground = useThemeColor('surface2');
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      dragByGrabberOnly
      style={styles.sheet}
    >
      <ThemedText font='dialogTitle'>Ваше місто</ThemedText>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group) => (
          <VStack key={group.title} spacing={8}>
            <SectionHeader title={group.title} variant='overline' />
            <ListCard style={{ backgroundColor: groupBackground }}>
              {group.items.map((name) => {
                const provider = getProviderForCity(name);
                return (
                  <Pressable
                    key={name}
                    accessibilityRole='button'
                    accessibilityState={{ selected: name === selected }}
                    onPress={() => onSelect(name)}
                    style={(state) => [
                      styles.row,
                      state.pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.rowCopy}>
                      <ThemedText font='rowTitle'>{name}</ThemedText>
                      <ThemedText font='caption' color='muted'>
                        {provider?.name ?? 'Постачальник ще не доданий'}
                      </ThemedText>
                    </View>
                    {name === selected && (
                      <AppImage
                        icon='check'
                        tintColor='blue'
                        size={{ width: 20 }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ListCard>
          </VStack>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    height: '82%',
    paddingBottom: 0,
  },
  list: {
    flex: 1,
  },
  content: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 58,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
