import { Platform, StyleSheet, Text, View } from 'react-native';

type EmojiGlyphProps = {
  emoji: string;
  // Сторона квадрата, у якому стоїть гліф
  size: number;
  testID?: string;
};

// Поправки підбираються вимірюванням (specs/004-emoji-icons-signout, T031):
// k — частка сторони, яку займає кегль, shift — вертикальний зсув у частках
// сторони, що вирівнює оптичний центр emoji за метриками системного шрифту
const metrics = Platform.select({
  ios: { k: 0.8, shift: 0 },
  default: { k: 0.78, shift: 0 },
});

// Emoji фіксованого розміру по центру квадрата. Звичайний Text без шрифту
// Onest: його метрики зсувають emoji з центру. Масштабування шрифту системи
// вимкнене, тож розмір іконки від нього не залежить
export function EmojiGlyph({ emoji, size, testID }: EmojiGlyphProps) {
  return (
    <View
      accessible={false}
      importantForAccessibility='no-hide-descendants'
      testID={testID}
      style={[styles.box, { width: size, height: size }]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.glyph,
          {
            fontSize: size * metrics.k,
            lineHeight: size,
            width: size,
            height: size,
            transform: [{ translateY: size * metrics.shift }],
          },
        ]}
      >
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
