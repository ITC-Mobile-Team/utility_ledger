import { Platform, StyleSheet, Text, View } from 'react-native';

type EmojiGlyphProps = {
  emoji: string;
  // Сторона квадрата, у якому стоїть гліф
  size: number;
  testID?: string;
};

// Поправки підбираються вимірюванням (specs/004-emoji-icons-signout, T031):
// k — частка сторони, яку займає кегль, shiftX і shiftY — зсув у частках
// сторони, що вирівнює оптичний центр emoji за метриками системного шрифту.
// iOS: Apple Color Emoji малюється на ~0,8 pt правіше й на ~0,5 pt нижче
// центру кола 42 pt (гліф 21 pt)
const metrics = Platform.select({
  ios: { k: 0.8, shiftX: -0.04, shiftY: -0.025 },
  default: { k: 0.78, shiftX: 0, shiftY: 0 },
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
            transform: [
              { translateX: size * metrics.shiftX },
              { translateY: size * metrics.shiftY },
            ],
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
