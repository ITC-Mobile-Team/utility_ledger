import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import type { AppFont } from '@/components/themed-text';
import { typography } from '@/constants/typography';

const fonts = Object.keys(typography) as AppFont[];
const weights = ['400', '500', '600', '700'] as const;
const previewText = 'Їжак Йод 12 803,00 ₴';

export default function Preview() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {fonts.map((font) => {
        const { fontSize, fontWeight, lineHeight } = typography[font];
        return (
          <View key={font} style={styles.item}>
            <ThemedText font='overline'>
              {`${font} ${fontSize}/${fontWeight} lh: ${lineHeight}`}
            </ThemedText>
            <ThemedText font={font}>{previewText}</ThemedText>
          </View>
        );
      })}

      <ThemedText font='section'>Ваги</ThemedText>
      {weights.map((weight) => {
        return (
          <ThemedText
            key={weight}
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
