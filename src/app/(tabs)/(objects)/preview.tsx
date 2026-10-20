import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText, AppFont, ThemedView, ActionButton } from '@/components';
import { typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useState } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

const fonts = Object.keys(typography) as AppFont[];
const weights = ['400', '500', '600', '700'] as const;
const previewText = 'Їжак Йод 12 803,00 ₴';

export default function Preview() {
  const bgColor = useThemeColor('bg');
  const [disabled, setDisabled] = useState(true);
  const [displayText, setDisplayText] = useState<string | null>(null);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      style={{ backgroundColor: bgColor }}
      contentContainerStyle={[styles.content]}
    >
      <ActionButton
        title='Основна дія'
        onPress={() => {
          setDisabled((prev) => !prev);
          setDisplayText('Стан кнопки змінено');
        }}
      />

      <ActionButton
        title='Вторинна дія'
        type='secondary'
        onPress={() => {
          setDisplayText('Дія вторинної кнопки');
        }}
      />

      <ActionButton
        title='Кнопка з контуром'
        type='outline'
        onPress={() => {
          setDisplayText('Дія кнопки з контуром');
        }}
      />

      <ActionButton
        title={disabled ? 'Неактивна' : 'Активна'}
        disabled={disabled}
        onPress={() => {
          setDisplayText(null);
        }}
      />

      {displayText && (
        <Animated.View
          key={displayText}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <ThemedText>{displayText}</ThemedText>
        </Animated.View>
      )}

      <Animated.View
        style={styles.content}
        layout={LinearTransition.duration(300)}
      >
        {fonts.map((font) => {
          const { fontSize, fontWeight, lineHeight } = typography[font];
          return (
            <ThemedView key={font} style={styles.item}>
              <ThemedText color='coral' font='headline'>
                {`${font} ${fontSize}/${fontWeight} lh: ${lineHeight}`}
              </ThemedText>
              <ThemedText color='ink' font={font}>
                {previewText}
              </ThemedText>
            </ThemedView>
          );
        })}

        <ThemedText color='ink' font='section'>
          Ваги
        </ThemedText>
        {weights.map((weight) => {
          return (
            <ThemedText
              key={weight}
              color='ink'
              font='body'
              style={{ fontWeight: weight }}
            >{`${weight} ${previewText}`}</ThemedText>
          );
        })}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  item: {
    gap: 4,
    // borderColor: 'white',
    // borderWidth: 1,
  },
});
