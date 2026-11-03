import {
  ActionButton,
  HStack,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { serviceIconSections } from '@/constants/service-icons';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormFooter } from './form-footer';
import { ServiceIcon } from './service-icon';

type IconPickerModalProps = {
  visible: boolean;
  value: string;
  serviceName: string;
  onClose: () => void;
  onSelect: (icon: string) => void;
};

export function IconPickerModal({
  visible,
  value,
  serviceName,
  onClose,
  onSelect,
}: IconPickerModalProps) {
  // Вибір тримаємо локально, щоб «назад» не змінював іконку у формі
  const [selected, setSelected] = useState(value);
  const bg = useThemeColor('bg');
  const coral = useThemeColor('coral');
  const { top } = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType='slide'
      onRequestClose={onClose}
      onShow={() => setSelected(value)}
    >
      <ThemedView
        style={[styles.screen, { paddingTop: top, backgroundColor: bg }]}
      >
        <Pressable
          onPress={onClose}
          style={styles.back}
          accessibilityLabel='Назад'
        >
          <Image
            source={require('@/assets/images/icons/arrow-back.svg')}
            tintColor={coral}
            style={styles.backIcon}
          />
        </Pressable>

        <ScrollView contentContainerStyle={styles.content}>
          <HStack spacing={16} align='center'>
            <ServiceIcon icon={selected} size={64} />
            <VStack spacing={4} style={styles.flex}>
              <ThemedText font='title'>Іконка послуги</ThemedText>
              <ThemedText color='muted' font='caption'>
                {`${serviceName || 'Послуга'} · так вона виглядатиме в списках`}
              </ThemedText>
            </VStack>
          </HStack>

          {serviceIconSections.map((section) => (
            <VStack key={section.title} spacing={10}>
              <ThemedText color='muted' font='overline'>
                {section.title.toLocaleUpperCase('uk')}
              </ThemedText>
              <HStack spacing={10} style={styles.grid}>
                {section.icons.map((icon) => {
                  const isSelected = icon === selected;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => setSelected(icon)}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <ThemedView
                        backgroundColor={isSelected ? 'blueSoft' : 'surface'}
                        borderColor={isSelected ? 'blue' : 'surface'}
                        style={styles.cell}
                      >
                        <ThemedText font='emojiLarge'>{icon}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </HStack>
            </VStack>
          ))}
        </ScrollView>

        <FormFooter>
          <ActionButton
            title={`Обрати ${selected}`}
            onPress={() => onSelect(selected)}
          />
        </FormFooter>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    paddingStart: 10,
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
  },
  flex: {
    flex: 1,
  },
  grid: {
    flexWrap: 'wrap',
  },
  cell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
