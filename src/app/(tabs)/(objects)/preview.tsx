import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText, AppFont, ThemedView } from '@/components';
import { typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-colors';

const fonts = Object.keys(typography) as AppFont[];
const weights = ['400', '500', '600', '700'] as const;
const previewText = 'Їжак Йод 12 803,00 ₴';

export default function Preview() {
  const bgColor = useThemeColor('bg');
  return (
    <ScrollView
      style={{ backgroundColor: bgColor }}
      contentContainerStyle={[styles.content]}
    >
      {fonts.map((font) => {
        const { fontSize, fontWeight, lineHeight } = typography[font];
        return (
          <ThemedView key={font} style={styles.item}>
            <ThemedText color='muted' font='overline'>
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
  },
});
