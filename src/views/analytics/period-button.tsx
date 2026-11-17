import { AppImage, HStack, Pressable, ThemedText, VStack } from '@/components';
import { formatShortDate, type CalendarDate } from '@/services/analytics';
import { StyleSheet } from 'react-native';

type AnalyticsPeriodButtonProps = {
  label: 'Від' | 'До';
  date: CalendarDate;
  // Відкрита шторка саме цієї дати
  active: boolean;
  disabled?: boolean;
  testID: string;
  onPress: () => void;
};

// Кнопка дати періоду на зеленому навбарі (артборд 14): напівпрозора біла
// підкладка, активна — щільніша з білою обвідкою
export function AnalyticsPeriodButton({
  label,
  date,
  active,
  disabled,
  testID,
  onPress,
}: AnalyticsPeriodButtonProps) {
  const text = formatShortDate(date);
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`${label === 'Від' ? 'Початкова дата' : 'Кінцева дата'}, ${text}`}
      accessibilityState={{ disabled: !!disabled, expanded: active }}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
      style={(state) => [
        styles.button,
        active && styles.active,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <HStack align='center' style={styles.content}>
        <VStack spacing={1}>
          <ThemedText color='heroSubGreen' font='label'>
            {label}
          </ThemedText>
          <ThemedText
            color='onPrimary'
            font='bodySmallStrong'
            style={styles.date}
          >
            {text}
          </ThemedText>
        </VStack>
        <AppImage icon='calendar' role='inline' />
      </HStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  active: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderColor: '#FFFFFF',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
  },
});
